import { Readable } from "stream";
import mammoth from "mammoth";
import yauzl from "yauzl";

export interface ExtractedMaterialText {
  text: string | null;
  method: "pdf" | "docx" | "pptx" | "txt" | "unsupported" | "failed";
  error?: string;
}

const maxExtractedChars = 12000;

function normalizeText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxExtractedChars);
}

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function zipEntriesFromBuffer(buffer: Buffer, shouldRead: (fileName: string) => boolean) {
  return new Promise<Array<{ fileName: string; content: Buffer }>>((resolve, reject) => {
    const results: Array<{ fileName: string; content: Buffer }> = [];

    yauzl.fromBuffer(buffer, { lazyEntries: true }, (openError, zipFile) => {
      if (openError) {
        reject(openError);
        return;
      }

      zipFile.on("entry", (entry) => {
        if (!shouldRead(entry.fileName)) {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, async (streamError, stream) => {
          if (streamError) {
            reject(streamError);
            return;
          }

          try {
            results.push({ fileName: entry.fileName, content: await streamToBuffer(stream) });
            zipFile.readEntry();
          } catch (error) {
            reject(error);
          }
        });
      });

      zipFile.on("end", () => {
        zipFile.close();
        resolve(results);
      });
      zipFile.on("error", reject);
      zipFile.readEntry();
    });
  });
}

async function extractPptxText(buffer: Buffer) {
  const entries = await zipEntriesFromBuffer(buffer, (fileName) =>
    /^ppt\/(slides|notesSlides)\/.+\.xml$/i.test(fileName)
  );
  const ordered = entries.sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true }));
  const texts = ordered.flatMap((entry) => {
    const xml = entry.content.toString("utf8");
    return Array.from(xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)).map((match) => decodeXmlText(match[1]));
  });

  return normalizeText(texts.join("\n"));
}

export async function extractMaterialText(input: { buffer: Buffer; fileName: string; mimeType?: string | null }): Promise<ExtractedMaterialText> {
  const ext = input.fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";

  try {
    if (ext === ".txt" || ext === ".md") {
      return { method: "txt", text: normalizeText(input.buffer.toString("utf8")) };
    }

    if (ext === ".pdf" || input.mimeType === "application/pdf") {
      const pdfParse = eval("require")("pdf-parse") as typeof import("pdf-parse");
      const parsed = await pdfParse(input.buffer);
      return { method: "pdf", text: parsed.text ? normalizeText(parsed.text) : null };
    }

    if (ext === ".docx") {
      const parsed = await mammoth.extractRawText({ buffer: input.buffer });
      return { method: "docx", text: parsed.value ? normalizeText(parsed.value) : null };
    }

    if (ext === ".pptx") {
      const text = await extractPptxText(input.buffer);
      return { method: "pptx", text: text || null };
    }

    return { method: "unsupported", text: null };
  } catch (error) {
    return {
      method: "failed",
      text: null,
      error: error instanceof Error ? error.message : "extract failed"
    };
  }
}
