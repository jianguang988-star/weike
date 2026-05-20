import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stringifyList, textToList } from "@/lib/format";

type UpdateCustomerBody = {
  name?: string;
  phone?: string;
  wechat?: string;
  source?: string;
  agentName?: string;
  agentStore?: string;
  budget?: string;
  preferredUnits?: string;
  concerns?: string;
  focusPoints?: string;
  intentionLevel?: string;
  summary?: string;
  visitId?: number | null;
  visitTime?: string;
  visitType?: string;
  visitContent?: string;
  followupId?: number | null;
  recommendedTime?: string;
  priority?: string;
  keyPoint?: string;
  script?: string;
  status?: string;
};

function nullable(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateCustomerBody;

    const existing = await prisma.customer.findUnique({
      where: { id },
      include: {
        visits: { orderBy: { createdAt: "desc" }, take: 1 },
        followups: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const visitId = body.visitId ?? existing.visits[0]?.id;
    const followupId = body.followupId ?? existing.followups[0]?.id;

    await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id },
        data: {
          name: nullable(body.name),
          phone: nullable(body.phone),
          wechat: nullable(body.wechat),
          source: nullable(body.source),
          agentName: nullable(body.agentName),
          agentStore: nullable(body.agentStore),
          budget: nullable(body.budget),
          preferredUnits: stringifyList(textToList(body.preferredUnits)),
          concerns: stringifyList(textToList(body.concerns)),
          focusPoints: stringifyList(textToList(body.focusPoints)),
          intentionLevel: nullable(body.intentionLevel),
          summary: nullable(body.summary)
        }
      });

      const visitData = {
        visitTime: nullable(body.visitTime),
        visitType: nullable(body.visitType),
        content: nullable(body.visitContent)
      };

      if (visitId) {
        await tx.visit.update({ where: { id: visitId }, data: visitData });
      } else if (visitData.visitTime || visitData.visitType || visitData.content) {
        await tx.visit.create({ data: { customerId: id, ...visitData } });
      }

      const followupData = {
        recommendedTime: nullable(body.recommendedTime),
        priority: nullable(body.priority),
        keyPoint: nullable(body.keyPoint),
        script: nullable(body.script),
        status: nullable(body.status) ?? "pending"
      };

      if (followupId) {
        await tx.followup.update({ where: { id: followupId }, data: followupData });
      } else if (
        followupData.recommendedTime ||
        followupData.priority ||
        followupData.keyPoint ||
        followupData.script
      ) {
        await tx.followup.create({ data: { customerId: id, ...followupData } });
      }
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update customer failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const body = (await request.json()) as Partial<UpdateCustomerBody>;
    const data: Prisma.CustomerUpdateInput = {};
    const simpleFields = ["name", "phone", "wechat", "source", "agentName", "agentStore", "budget", "intentionLevel", "summary"] as const;

    for (const field of simpleFields) {
      if (field in body) {
        data[field] = nullable(body[field]);
      }
    }

    if ("preferredUnits" in body) data.preferredUnits = stringifyList(textToList(body.preferredUnits));
    if ("concerns" in body) data.concerns = stringifyList(textToList(body.concerns));
    if ("focusPoints" in body) data.focusPoints = stringifyList(textToList(body.focusPoints));

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    await prisma.customer.update({
      where: { id },
      data
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Patch customer failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete customer failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
