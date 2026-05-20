import { NextResponse } from "next/server";
import { analyzeQuickNote } from "@/lib/ai/provider";
import { parseList, stringifyList } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type QuickNoteBody = {
  note?: string;
  confirm?: boolean;
  customerId?: number;
  createNew?: boolean;
};

function mergeList(current: string | null | undefined, additions: string[]) {
  const merged = new Set([...parseList(current), ...additions.filter(Boolean)]);
  return stringifyList([...merged]);
}

function nullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function applyQuickNote(customerId: number, note: string, analysis: Awaited<ReturnType<typeof analyzeQuickNote>>) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new Error("Customer not found.");
  }

  const updates = analysis.customer_updates;
  const summaryAppend = nullable(updates.summary_append);
  const summary = summaryAppend
    ? [customer.summary, summaryAppend].filter(Boolean).join("\n")
    : customer.summary;

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: {
        name: nullable(updates.name) ?? customer.name,
        phone: nullable(updates.phone) ?? customer.phone,
        wechat: nullable(updates.wechat) ?? customer.wechat,
        source: nullable(updates.source) ?? customer.source,
        budget: nullable(updates.budget) ?? customer.budget,
        preferredUnits: mergeList(customer.preferredUnits, updates.preferred_units_add ?? []),
        concerns: mergeList(customer.concerns, updates.concerns_add ?? []),
        focusPoints: mergeList(customer.focusPoints, updates.focus_points_add ?? []),
        intentionLevel: nullable(updates.intention_level) ?? customer.intentionLevel,
        summary
      }
    });

    await tx.visit.create({
      data: {
        customerId,
        visitTime: analysis.visit.visit_time ?? new Date().toLocaleString("zh-CN"),
        visitType: analysis.visit.visit_type ?? "回访",
        content: analysis.visit.content ?? note
      }
    });

    await tx.followup.create({
      data: {
        customerId,
        recommendedTime: analysis.followup.recommended_time,
        priority: analysis.followup.priority,
        keyPoint: analysis.followup.key_point,
        script: analysis.followup.script,
        status: analysis.followup.status ?? "pending"
      }
    });
  });
}

async function createCustomerFromQuickNote(note: string, analysis: Awaited<ReturnType<typeof analyzeQuickNote>>) {
  const updates = analysis.customer_updates;
  const saved = await prisma.customer.create({
    data: {
      name: nullable(updates.name),
      phone: nullable(updates.phone),
      wechat: nullable(updates.wechat),
      source: nullable(updates.source) ?? "快速补充",
      budget: nullable(updates.budget),
      preferredUnits: stringifyList(updates.preferred_units_add ?? []),
      concerns: stringifyList(updates.concerns_add ?? []),
      focusPoints: stringifyList(updates.focus_points_add ?? []),
      intentionLevel: nullable(updates.intention_level),
      summary: nullable(updates.summary_append) ?? note,
      visits: {
        create: {
          visitTime: analysis.visit.visit_time ?? new Date().toLocaleString("zh-CN"),
          visitType: analysis.visit.visit_type ?? "回访",
          content: analysis.visit.content ?? note
        }
      },
      followups: {
        create: {
          recommendedTime: analysis.followup.recommended_time,
          priority: analysis.followup.priority,
          keyPoint: analysis.followup.key_point,
          script: analysis.followup.script,
          status: analysis.followup.status ?? "pending"
        }
      },
      rawNotes: {
        create: {
          rawText: note,
          aiResultJson: JSON.stringify(analysis)
        }
      }
    }
  });

  return saved.id;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuickNoteBody;
    const note = body.note?.trim();

    if (!note) {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { updatedAt: "desc" },
      take: 80
    });

    const analysis = await analyzeQuickNote({
      note,
      candidates: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        wechat: customer.wechat,
        budget: customer.budget,
        summary: customer.summary,
        focus_points: parseList(customer.focusPoints),
        concerns: parseList(customer.concerns)
      }))
    });

    const customerId = body.customerId ?? analysis.matched_customer_id;
    const shouldApply = body.confirm || analysis.confidence === "high";

    if (!customerId && body.createNew) {
      const newCustomerId = await createCustomerFromQuickNote(note, analysis);
      return NextResponse.json({ applied: true, customerId: newCustomerId, analysis });
    }

    if (!customerId) {
      return NextResponse.json({ applied: false, analysis, candidates: [] });
    }

    if (!shouldApply) {
      const candidate = customers.find((customer) => customer.id === customerId);
      return NextResponse.json({
        applied: false,
        analysis,
        candidates: candidate ? [{ id: candidate.id, name: candidate.name, phone: candidate.phone, wechat: candidate.wechat }] : []
      });
    }

    await applyQuickNote(customerId, note, analysis);
    return NextResponse.json({ applied: true, customerId, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quick note failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
