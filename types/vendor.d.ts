declare module "pdf-parse" {
  function pdfParse(buffer: Buffer): Promise<{ text?: string }>;
  export = pdfParse;
}

declare module "mammoth" {
  export function extractRawText(input: { buffer: Buffer }): Promise<{ value: string; messages: unknown[] }>;
}

declare module "yauzl" {
  import type { Readable } from "stream";

  export interface Entry {
    fileName: string;
  }

  export interface ZipFile {
    readEntry(): void;
    openReadStream(entry: Entry, callback: (error: Error | null, stream: Readable) => void): void;
    close(): void;
    on(event: "entry", callback: (entry: Entry) => void): void;
    on(event: "end", callback: () => void): void;
    on(event: "error", callback: (error: Error) => void): void;
  }

  export function fromBuffer(buffer: Buffer, options: { lazyEntries: boolean }, callback: (error: Error | null, zipFile: ZipFile) => void): void;
}
