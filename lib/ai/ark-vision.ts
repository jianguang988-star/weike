import OpenAI from "openai";

export interface ArkVisionResult {
  text: string | null;
  summary: string | null;
}

const imageMimeByExt: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

export function isArkVisionConfigured() {
  return Boolean(process.env.ARK_API_KEY || process.env.VOLCENGINE_ARK_API_KEY);
}

export function getImageMimeType(fileName: string, fallback?: string | null) {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  return imageMimeByExt[ext] || fallback || null;
}

export function isVisionImage(fileName: string, mimeType?: string | null) {
  const mime = getImageMimeType(fileName, mimeType);
  return Boolean(mime?.startsWith("image/"));
}

export async function analyzeImageWithArkVision(input: {
  fileName: string;
  mimeType?: string | null;
  buffer: Buffer;
}): Promise<ArkVisionResult> {
  const apiKey = process.env.ARK_API_KEY || process.env.VOLCENGINE_ARK_API_KEY;
  if (!apiKey) {
    throw new Error("ARK_API_KEY is not configured.");
  }

  const mimeType = getImageMimeType(input.fileName, input.mimeType);
  if (!mimeType) {
    throw new Error("Unsupported image type.");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3"
  });
  const model = process.env.ARK_VISION_MODEL || "Doubao-1.5-vision-pro";
  const dataUrl = `data:${mimeType};base64,${input.buffer.toString("base64")}`;

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 1200,
    messages: [
      {
        role: "system",
        content:
          "你是房产销售资料视觉解析助手。只负责读取图片中的文字、表格、图示和销售信息，不负责最终分类。输出中文。"
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "请解析这张房产销售资料图片。提取：1. 图片中可读文字；2. 楼盘/区域/竞品名称；3. 核心卖点；4. 客户可能关心或抗性的点；5. 是否适合发给客户。请用简洁结构化文本输出。"
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
              detail: "high"
            }
          }
        ]
      }
    ]
  });

  const content = response.choices[0]?.message?.content?.trim() || null;
  return {
    text: content,
    summary: content ? content.slice(0, 600) : null
  };
}
