import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type GuideNoteBody = {
  content?: string;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const body = (await request.json()) as GuideNoteBody;
    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const stamp = new Date().toLocaleString("zh-CN");
    const summary = [customer.summary, `${stamp} 带看人沟通：${content}`].filter(Boolean).join("\n\n").slice(-3000);

    await prisma.$transaction(async (tx) => {
      await tx.visit.create({
        data: {
          customerId: id,
          visitTime: stamp,
          visitType: "带看人沟通",
          content
        }
      });

      await tx.customer.update({
        where: { id },
        data: { summary }
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create guide note failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
