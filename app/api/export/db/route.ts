import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveDatabasePath() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const filePath = url.replace(/^file:/, "");
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

export async function GET() {
  const dbPath = resolveDatabasePath();
  const data = await fs.readFile(dbPath);

  return new NextResponse(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="fangchan-crm-${new Date().toISOString().slice(0, 10)}.db"`
    }
  });
}
