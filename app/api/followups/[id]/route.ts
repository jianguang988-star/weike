import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PatchFollowupBody = {
  status?: string;
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid followup id" }, { status: 400 });
    }

    const body = (await request.json()) as PatchFollowupBody;
    const status = body.status === "done" ? "done" : "pending";

    await prisma.followup.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ id, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Patch followup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
