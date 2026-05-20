"use server";

import { randomUUID } from "crypto";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { analyzeImageWithArkVision, isVisionImage } from "@/lib/ai/ark-vision";
import { analyzeSalesMaterial } from "@/lib/ai/provider";
import type { SalesMaterialAnalysisResult } from "@/lib/ai/provider";
import { extractMaterialText } from "@/lib/material-text-extractor";
import { prisma } from "@/lib/prisma";
import { ensureSalesKnowledgeDefaults, inferMaterialMetadata, materialTypes, supportedImportExtensions } from "@/lib/sales-knowledge";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" && item.trim() ? item.trim() : null;
}

export async function createSalesMaterial(formData: FormData) {
  await ensureSalesKnowledgeDefaults();
  const file = formData.get("file");
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileType: string | null = null;
  let fileSize: number | null = null;
  let textPreview: string | null = null;
  let visionPreview: string | null = null;

  if (file instanceof File && file.size > 0) {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "sales-materials");
    await mkdir(uploadDir, { recursive: true });
    const safeName = file.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_");
    const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, storedName), fileBuffer);
    fileUrl = `/uploads/sales-materials/${storedName}`;
    fileName = file.name;
    fileType = file.type || null;
    fileSize = file.size;
    const extracted = await extractMaterialText({ buffer: fileBuffer, fileName: file.name, mimeType: file.type });
    if (extracted.text) {
      textPreview = `本地正文解析(${extracted.method})：\n${extracted.text}`;
    }
    if (isVisionImage(file.name, file.type)) {
      try {
        const vision = await analyzeImageWithArkVision({
          fileName: file.name,
          mimeType: file.type,
          buffer: fileBuffer
        });
        visionPreview = vision.text;
      } catch {
        // Visual parsing is an enhancer. Upload continues and DeepSeek falls back to filename/text.
      }
    }
  }

  if (!fileName) {
    throw new Error("请先选择一个材料文件");
  }

  const manualTagIds = formData
    .getAll("tagIds")
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));
  const localInference = inferMaterialMetadata({
    fileName,
    textPreview: textPreview ?? undefined
  });
  let aiResult: SalesMaterialAnalysisResult = {
    title: fileName.replace(/\.[^.]+$/, ""),
    material_type: localInference.materialType,
    visibility: localInference.visibility as "internal" | "customer_shareable" | "manager_only",
    project_name: null as string | null,
    region_name: null as string | null,
    competitor_name: null as string | null,
    description: null as string | null,
    summary: textPreview?.replace(/\s+/g, " ").slice(0, 240) || `上传文件：${fileName}。系统已根据文件名和关键词完成初步分类。`,
    tag_codes: localInference.tagCodes
  };

  try {
    aiResult = await analyzeSalesMaterial({
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      text_preview: [textPreview, visionPreview ? `火山方舟/豆包视觉解析：\n${visionPreview}` : null].filter(Boolean).join("\n\n") || null,
      source_path: null
    });
  } catch {
    // Keep upload reliable: when AI is unavailable, fall back to local keyword classification.
  }

  const allowedTypes = new Set(materialTypes.map((item) => item.code));
  const allTags = await prisma.materialTag.findMany();
  const tagIdByCode = new Map(allTags.map((tag) => [tag.code, tag.id]));
  const aiTagIds = aiResult.tag_codes
    .map((code) => tagIdByCode.get(code))
    .filter((id): id is number => typeof id === "number");
  const tagIds = Array.from(new Set([...aiTagIds, ...manualTagIds]));

  await prisma.salesMaterial.create({
    data: {
      title: value(formData, "title") || aiResult.title || fileName.replace(/\.[^.]+$/, ""),
      materialType: value(formData, "materialType") || (allowedTypes.has(aiResult.material_type) ? aiResult.material_type : localInference.materialType),
      description: value(formData, "description") || aiResult.description,
      summary: value(formData, "summary") || aiResult.summary,
      contentText: value(formData, "contentText") || [textPreview, visionPreview].filter(Boolean).join("\n\n") || null,
      projectName: value(formData, "projectName") || aiResult.project_name,
      regionName: value(formData, "regionName") || aiResult.region_name,
      competitorName: value(formData, "competitorName") || aiResult.competitor_name,
      visibility: value(formData, "visibility") || aiResult.visibility || "internal",
      fileUrl,
      fileName,
      fileType,
      fileSize,
      tags: {
        create: tagIds.map((tagId) => ({ tagId }))
      }
    }
  });

  revalidatePath("/knowledge");
  redirect("/knowledge");
}

async function listFiles(folderPath: string, recursive: boolean, depth = 0): Promise<string[]> {
  if (depth > 5) return [];
  const entries = await readdir(folderPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...(await listFiles(fullPath, recursive, depth + 1)));
    }
    if (entry.isFile() && supportedImportExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readTextPreview(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".txt" && ext !== ".md") return null;

  try {
    return (await readFile(filePath, "utf8")).slice(0, 1200);
  } catch {
    return null;
  }
}

function folderSegment(filePath: string, rootPath: string, indexFromEnd: number) {
  const relative = path.relative(rootPath, filePath);
  const parts = relative.split(path.sep).filter(Boolean);
  return parts.length > indexFromEnd + 1 ? parts[parts.length - 2 - indexFromEnd] : null;
}

export async function importSalesMaterialsFromFolder(formData: FormData) {
  const folderPath = value(formData, "folderPath");
  const recursive = formData.get("recursive") === "on";

  if (!folderPath) {
    throw new Error("请填写本地文件夹路径");
  }

  await ensureSalesKnowledgeDefaults();
  const rootStat = await stat(folderPath);
  if (!rootStat.isDirectory()) {
    throw new Error("本地路径不是文件夹");
  }

  const allTags = await prisma.materialTag.findMany();
  const tagIdByCode = new Map(allTags.map((tag) => [tag.code, tag.id]));
  const files = await listFiles(folderPath, recursive);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "sales-materials", "folder-imports");
  await mkdir(uploadDir, { recursive: true });

  let importedCount = 0;
  for (const filePath of files) {
    const fileInfo = await stat(filePath);
    const fileName = path.basename(filePath);
    const textPreview = await readTextPreview(filePath);
    const extracted = await extractMaterialText({
      buffer: await readFile(filePath),
      fileName,
      mimeType: null
    });
    const extractedPreview = extracted.text ? `本地正文解析(${extracted.method})：\n${extracted.text}` : textPreview;
    let visionPreview: string | null = null;
    const fileBuffer = await readFile(filePath);
    if (isVisionImage(fileName, null)) {
      try {
        const vision = await analyzeImageWithArkVision({
          fileName,
          mimeType: null,
          buffer: fileBuffer
        });
        visionPreview = vision.text;
      } catch {
        // Keep batch import reliable even when the visual model is unavailable.
      }
    }
    const combinedPreview = [extractedPreview, visionPreview ? `火山方舟/豆包视觉解析：\n${visionPreview}` : null]
      .filter(Boolean)
      .join("\n\n");
    const inferred = inferMaterialMetadata({ fileName, folderPath: path.dirname(filePath), textPreview: combinedPreview || undefined });
    let aiResult: SalesMaterialAnalysisResult = {
      title: path.basename(fileName, path.extname(fileName)),
      material_type: inferred.materialType,
      visibility: inferred.visibility as "internal" | "customer_shareable" | "manager_only",
      project_name: null,
      region_name: null,
      competitor_name: null,
      description: null,
      summary: combinedPreview
        ? combinedPreview.replace(/\s+/g, " ").slice(0, 240)
        : `从本地文件夹自动导入：${path.relative(folderPath, filePath)}`,
      tag_codes: inferred.tagCodes
    };
    try {
      aiResult = await analyzeSalesMaterial({
        file_name: fileName,
        file_type: path.extname(fileName).slice(1).toLowerCase() || null,
        file_size: fileInfo.size,
        text_preview: combinedPreview || null,
        source_path: path.relative(folderPath, filePath)
      });
    } catch {
      // Fall back to local inference.
    }
    const safeName = fileName.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_");
    const storedName = `${Date.now()}-${randomUUID()}-${safeName}`;
    const storedPath = path.join(uploadDir, storedName);
    await copyFile(filePath, storedPath);

    const tagIds = Array.from(new Set([...aiResult.tag_codes, ...inferred.tagCodes]))
      .map((code) => tagIdByCode.get(code))
      .filter((id): id is number => typeof id === "number");
    const projectName = folderSegment(filePath, folderPath, 1);
    const regionName = folderSegment(filePath, folderPath, 2);

    await prisma.salesMaterial.create({
      data: {
        title: aiResult.title || path.basename(fileName, path.extname(fileName)),
        materialType: materialTypes.some((item) => item.code === aiResult.material_type) ? aiResult.material_type : inferred.materialType,
        visibility: aiResult.visibility || inferred.visibility,
        description: aiResult.description,
        summary: aiResult.summary || `从本地文件夹自动导入：${path.relative(folderPath, filePath)}`,
        contentText: combinedPreview || null,
        projectName: aiResult.project_name || projectName,
        regionName: aiResult.region_name || regionName,
        competitorName: aiResult.competitor_name,
        fileUrl: `/uploads/sales-materials/folder-imports/${storedName}`,
        fileName,
        fileType: path.extname(fileName).slice(1).toLowerCase() || null,
        fileSize: fileInfo.size,
        tags: {
          create: tagIds.map((tagId) => ({ tagId }))
        }
      }
    });
    importedCount += 1;
  }

  revalidatePath("/knowledge");
  redirect(`/knowledge?imported=${importedCount}`);
}
