import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOnsiteVisitType } from "@/lib/reminders";

type UpdateVisitBody = {
  visitTime?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; visitId: string } }
) {
  try {
    const customerId = Number(params.id);
    const visitId = Number(params.visitId);

    if (!Number.isInteger(customerId) || !Number.isInteger(visitId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateVisitBody;
    const visitTime = body.visitTime?.trim();

    if (!visitTime) {
      return NextResponse.json({ error: "visitTime is required" }, { status: 400 });
    }

    const existing = await prisma.visit.findFirst({
      where: {
        id: visitId,
        customerId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    if (!isOnsiteVisitType(existing.visitType)) {
      return NextResponse.json({ error: "Only onsite visit time can be updated here." }, { status: 400 });
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { visitTime }
    });

    return NextResponse.json({ id: visitId, visitTime });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update visit failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
