import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stringifyList } from "@/lib/format";
import { formatDate, getNextStandardReminder, isOnsiteVisitType, standardReminderScript } from "@/lib/reminders";
import type { CustomerAnalysisResult } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      rawText?: string;
      analysis?: CustomerAnalysisResult;
    };

    if (!body.rawText?.trim() || !body.analysis) {
      return NextResponse.json({ error: "rawText and analysis are required" }, { status: 400 });
    }

    const { customer, visit, followup } = body.analysis;
    const guideName = customer.agent_name;
    const guideContact = customer.agent_store;

    const standardReminder = isOnsiteVisitType(visit.visit_type) ? getNextStandardReminder(new Date()) : null;
    const standardReminderText = standardReminder
      ? `${formatDate(standardReminder.dueDate)}（${standardReminder.label}）`
      : followup.recommended_time;

    const saved = await prisma.customer.create({
      data: {
        name: customer.name,
        phone: customer.phone,
        wechat: customer.wechat,
        source: customer.source,
        agentName: guideName,
        agentStore: guideContact,
        budget: customer.budget,
        preferredUnits: stringifyList(customer.preferred_units),
        concerns: stringifyList(customer.concerns),
        focusPoints: stringifyList(customer.focus_points),
        intentionLevel: customer.intention_level,
        summary: customer.summary,
        visits: {
          create: {
            visitTime: visit.visit_time,
            visitType: visit.visit_type,
            content: visit.content
          }
        },
        followups: {
          create: {
            recommendedTime: standardReminderText,
            priority: followup.priority,
            keyPoint: standardReminder
              ? `${followup.key_point ?? ""}\n下一次重点：先接住客户最在意的问题，再用一两个具体选择试探真实态度。`.trim()
              : followup.key_point,
            script: standardReminder
              ? standardReminderScript(customer.name, {
                  budget: customer.budget,
                  focusPoints: customer.focus_points,
                  concerns: customer.concerns,
                  summary: customer.summary
                })
              : followup.script,
            status: "pending"
          }
        },
        rawNotes: {
          create: {
            rawText: body.rawText,
            aiResultJson: JSON.stringify(body.analysis)
          }
        }
      }
    });

    return NextResponse.json({ id: saved.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create customer failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
