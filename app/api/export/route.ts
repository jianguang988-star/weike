import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      visits: { orderBy: { createdAt: "asc" } },
      followups: { orderBy: { createdAt: "asc" } },
      rawNotes: { orderBy: { createdAt: "asc" } }
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    customers
  });
}
