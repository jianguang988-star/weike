import { NextResponse } from "next/server";
import { analyzeFollowup } from "@/lib/ai/provider";
import { parseList, stringifyList } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type CreateFollowupBody = {
  content?: string;
  visitTime?: string;
};

function compactList(value: string | null | undefined) {
  return parseList(value).join("、") || "未填写";
}

function customerProfile(customer: {
  name: string | null;
  phone: string | null;
  wechat: string | null;
  source: string | null;
  agentName: string | null;
  agentStore: string | null;
  budget: string | null;
  preferredUnits: string | null;
  focusPoints: string | null;
  concerns: string | null;
  intentionLevel: string | null;
  summary: string | null;
}) {
  return [
    `姓名：${customer.name ?? "未填写"}`,
    `电话：${customer.phone ?? "未填写"}`,
    `微信：${customer.wechat ?? "未填写"}`,
    `带看来源备注：${customer.source ?? "未填写"}`,
    `带看人：${customer.agentName ?? "未填写"}`,
    `带看人联系方式：${customer.agentStore ?? "未填写"}`,
    `预算：${customer.budget ?? "未填写"}`,
    `意向户型：${compactList(customer.preferredUnits)}`,
    `关注点：${compactList(customer.focusPoints)}`,
    `抗性：${compactList(customer.concerns)}`,
    `意向等级：${customer.intentionLevel ?? "未填写"}`,
    `摘要：${customer.summary ?? "未填写"}`
  ].join("\n");
}

function mergeDetectedList(current: string | null, text: string, candidates: string[]) {
  const found = candidates.filter((item) => text.includes(item));
  return stringifyList(Array.from(new Set([...parseList(current), ...found])));
}

function nextIntentionLevel(current: string | null, priority: string | null) {
  if (current === "A") return current;
  if (priority === "高") return current === "B" ? "B" : "A";
  if (priority === "中" && !current) return "B";
  return current;
}

function appendSummary(current: string | null, content: string, keyPoint: string | null) {
  const stamp = new Date().toLocaleDateString("zh-CN");
  const next = [`${stamp} 跟进：${content}`, keyPoint ? `AI 判断：${keyPoint}` : null].filter(Boolean).join("\n");
  return [current, next].filter(Boolean).join("\n\n").slice(-3000);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
    }

    const body = (await request.json()) as CreateFollowupBody;
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followups: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const latestFollowup = customer.followups[0];
    const analysis = await analyzeFollowup({
      customerProfile: customerProfile(customer),
      latestFollowup: latestFollowup
        ? [
            `推荐跟进时间：${latestFollowup.recommendedTime ?? "未填写"}`,
            `优先级：${latestFollowup.priority ?? "未填写"}`,
            `关键点：${latestFollowup.keyPoint ?? "未填写"}`,
            `话术：${latestFollowup.script ?? "未填写"}`
          ].join("\n")
        : "暂无上一轮跟进建议",
      followupContent: content
    });

    const saved = await prisma.$transaction(async (tx) => {
      await tx.visit.create({
        data: {
          customerId: id,
          visitTime: body.visitTime?.trim() || analysis.visit_time || new Date().toLocaleString("zh-CN"),
          visitType: analysis.visit_type ?? "回访",
          content
        }
      });

      const followup = await tx.followup.create({
        data: {
          customerId: id,
          recommendedTime: analysis.recommended_time,
          priority: analysis.priority,
          keyPoint: analysis.key_point,
          script: analysis.script,
          status: analysis.status ?? "pending"
        }
      });

      await tx.customer.update({
        where: { id },
        data: {
          summary: appendSummary(customer.summary, content, analysis.key_point),
          focusPoints: mergeDetectedList(customer.focusPoints, `${content} ${analysis.key_point ?? ""}`, [
            "地铁",
            "学校",
            "学区",
            "户型",
            "朝向",
            "楼层",
            "交付",
            "配套",
            "总价",
            "首付",
            "月供"
          ]),
          concerns: mergeDetectedList(customer.concerns, `${content} ${analysis.key_point ?? ""}`, [
            "价格",
            "预算",
            "首付",
            "月供",
            "付款压力",
            "楼层",
            "距离",
            "家人意见",
            "老婆",
            "太太",
            "父母"
          ]),
          intentionLevel: nextIntentionLevel(customer.intentionLevel, analysis.priority)
        }
      });

      return followup;
    });

    return NextResponse.json({ id: saved.id, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create followup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
