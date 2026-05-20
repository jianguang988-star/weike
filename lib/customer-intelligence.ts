import type { Customer, Followup, Visit } from "@prisma/client";
import { parseList } from "./format";
import { getLatestOnsiteVisit, getVisitBaseDate } from "./reminders";

type CustomerWithRelations = Customer & {
  visits: Visit[];
  followups: Followup[];
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function customerSearchText(customer: CustomerWithRelations) {
  return [
    customer.name,
    customer.phone,
    customer.wechat,
    customer.source,
    customer.agentName,
    customer.agentStore,
    customer.budget,
    customer.intentionLevel,
    customer.summary,
    ...parseList(customer.preferredUnits),
    ...parseList(customer.focusPoints),
    ...parseList(customer.concerns),
    ...customer.visits.map((visit) => [visit.visitType, visit.visitTime, visit.content].join(" ")),
    ...customer.followups.map((followup) =>
      [followup.recommendedTime, followup.priority, followup.keyPoint, followup.script, followup.status].join(" ")
    )
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function semanticSearchTerms(query: string) {
  const q = query.trim().toLowerCase();
  const terms = [q];

  const groups = [
    ["预算紧张", "预算", "价格", "贵", "首付", "月供", "付款", "压力"],
    ["老婆不同意", "太太", "老婆", "爱人", "家人", "父母", "决策"],
    ["孩子上学", "孩子", "学校", "学区", "上学", "教育"],
    ["约复访", "复访", "再来", "到店", "现场", "周末"],
    ["地铁", "交通", "通勤", "地铁", "距离"],
    ["沉睡客户", "没回", "不回", "沉默", "冷淡", "暂缓"],
    ["高意向", "A", "B", "高", "强意向", "想定", "认筹"]
  ];

  for (const group of groups) {
    if (group.some((word) => q.includes(word.toLowerCase()))) {
      terms.push(...group.map((word) => word.toLowerCase()));
    }
  }

  return Array.from(new Set(terms.filter(Boolean)));
}

export function matchesSemanticSearch(customer: CustomerWithRelations, query: string) {
  const q = query.trim();
  if (!q) return true;

  const text = customerSearchText(customer);
  return semanticSearchTerms(q).some((term) => text.includes(term));
}

export function classifyFollowupResult(content: string | null | undefined, latestKeyPoint?: string | null) {
  const text = `${content ?? ""} ${latestKeyPoint ?? ""}`.toLowerCase();

  if (includesAny(text, ["成交", "定了", "下定", "认购", "认筹", "交钱", "锁房"])) {
    return { label: "推进明显", tone: "green", next: "尽快锁定房源、付款节点和签约资料。" };
  }

  if (includesAny(text, ["再来", "复访", "到店", "现场", "周末来看", "带家人"])) {
    return { label: "需要邀约复访", tone: "blue", next: "重点确认复访时间、同行决策人和必看房源。" };
  }

  if (includesAny(text, ["贵", "预算", "压力", "首付", "月供", "便宜", "价格"])) {
    return { label: "抗性加重", tone: "red", next: "先拆预算压力，再给替代方案和付款节奏。" };
  }

  if (includesAny(text, ["考虑", "再看看", "对比", "不急", "等等", "暂时"])) {
    return { label: "暂缓观望", tone: "amber", next: "用对比信息和稀缺点推进，不要只催问。" };
  }

  if (includesAny(text, ["户型", "楼层", "朝向", "面积", "房源", "换一套"])) {
    return { label: "需要换方案", tone: "violet", next: "围绕关注点重排房源，给 2-3 套选择。" };
  }

  return { label: "常规跟进", tone: "slate", next: "补齐预算、决策人、抗性和下次动作。" };
}

export function buildDealInsight(customer: CustomerWithRelations) {
  const focusPoints = parseList(customer.focusPoints);
  const concerns = parseList(customer.concerns);
  const latestVisit = customer.visits[0];
  const latestFollowup = customer.followups[0];
  const latestContent = latestVisit?.content ?? "";
  const result = classifyFollowupResult(latestContent, latestFollowup?.keyPoint);

  let score = 35;
  if (customer.intentionLevel === "A") score += 35;
  if (customer.intentionLevel === "B") score += 22;
  if (customer.intentionLevel === "C") score += 10;
  if (customer.budget) score += 8;
  if (focusPoints.length) score += 8;
  if (customer.visits.some((visit) => visit.visitType === "复访")) score += 15;
  if (latestFollowup?.priority === "高") score += 8;
  if (result.label === "抗性加重") score -= 12;
  if (result.label === "暂缓观望") score -= 8;
  score = Math.max(5, Math.min(95, score));

  const motivation =
    focusPoints.slice(0, 2).join("、") ||
    customer.budget ||
    customer.summary ||
    "尚未明确，需要继续挖掘核心购买动力";
  const resistance = concerns.slice(0, 2).join("、") || result.next || "抗性暂不清晰，优先确认预算和决策人";
  const breakthrough =
    latestFollowup?.keyPoint ||
    result.next ||
    "下一步先确认客户预算边界、决策人意见和是否愿意复访。";

  return {
    score,
    resultLabel: result.label,
    resultTone: result.tone,
    motivation,
    resistance,
    breakthrough,
    decisionHint: includesAny(customerSearchText(customer), ["老婆", "太太", "爱人", "父母", "家人"])
      ? "已出现家庭决策人信息，跟进时要同步照顾家人关注点。"
      : "决策人信息还不完整，下一次跟进建议主动确认谁一起决定。"
  };
}

export function buildCustomerStage(customer: CustomerWithRelations) {
  const text = customerSearchText(customer);
  const hasRevisit = customer.visits.some((visit) => visit.visitType === "复访");
  const latestResult = classifyFollowupResult(customer.visits[0]?.content, customer.followups[0]?.keyPoint);

  if (includesAny(text, ["成交", "认购", "下定", "已定", "签约"])) return "已成交";
  if (latestResult.label === "暂缓观望" || includesAny(text, ["流失", "不买", "无效"])) return "暂缓/流失";
  if (includesAny(text, ["认筹", "锁房", "定房", "交定金"])) return "准备认购";
  if (includesAny(text, ["价格", "贵", "优惠", "折扣", "付款", "首付", "月供"])) return "价格谈判";
  if (includesAny(text, ["老婆", "太太", "爱人", "父母", "家人", "商量"])) return "家人决策";
  if (customer.budget || includesAny(text, ["预算", "首付", "月供"])) return "预算确认";
  if (hasRevisit) return "复访中";
  if (customer.visits.some((visit) => visit.visitType === "来访" || visit.visitType === "到访")) return "初访";
  return "待培育";
}

export function buildCustomerWarning(customer: CustomerWithRelations) {
  const latestVisit = customer.visits[0];
  const latestFollowup = customer.followups[0];
  const latestTime = latestVisit?.createdAt ?? latestFollowup?.createdAt ?? customer.updatedAt;
  const diffDays = Math.max(0, Math.floor((Date.now() - latestTime.getTime()) / 86400000));

  if ((customer.intentionLevel === "A" || customer.intentionLevel === "B") && diffDays >= 3) {
    return { label: `${diffDays}天未跟`, tone: "red", urgent: true };
  }

  if (diffDays >= 15) return { label: "沉睡客户", tone: "amber", urgent: true };
  if (diffDays >= 7) return { label: "7天未动", tone: "amber", urgent: false };
  return { label: "正常", tone: "green", urgent: false };
}

export function scriptVariant(
  direction: string,
  context: {
    name?: string | null;
    budget?: string | null;
    focusPoints?: string[];
    concerns?: string[];
    summary?: string | null;
    latestScript?: string | null;
  }
) {
  const name = context.name || "您好";
  const focus = context.focusPoints?.filter(Boolean).slice(0, 2).join("、");
  const concerns = context.concerns?.filter(Boolean).slice(0, 2).join("、");
  const base = `${name}，`;

  switch (direction) {
    case "short":
      return `${base}我按您关注的${focus || "方向"}先筛了几套，您有空我发您过一眼。`;
    case "natural":
      return `${base}您上次说的${concerns || "顾虑"}我记着了。我先按${focus || "您的方向"}把范围收窄一点，您看起来也省心些。`;
    case "pressure":
      return `${base}${focus || "这个方向"}合适的房源确实要挑一挑。我先发两套我觉得还算稳的，您看完我们再决定要不要往下走。`;
    case "revisit":
      return `${base}光看资料有些细节容易没感觉，尤其是${focus || "户型和现场感受"}。您这两天哪天顺路，我提前把房源排好。`;
    case "price":
      return `${base}${concerns || "预算压力"}这块我理解。我们不急着看总价，我先把首付、月供和替代选择摆出来，您心里会更有底。`;
    default:
      return context.latestScript || `${base}我刚把您之前看的情况又过了一遍，先挑了几套相对稳一点的。您有空我发您看看。`;
  }
}

export function guideCommunicationScript(context: {
  customerName?: string | null;
  guideName?: string | null;
  keyPoint?: string | null;
  concerns?: string[];
  focusPoints?: string[];
}) {
  const customerName = context.customerName || "这个客户";
  const guideName = context.guideName || "您好";
  const focus = context.focusPoints?.filter(Boolean).slice(0, 2).join("、");
  const concerns = context.concerns?.filter(Boolean).slice(0, 2).join("、");
  const point = context.keyPoint?.trim();

  if (point) {
    return `${guideName}，${customerName}这边我准备再跟一下。你方便帮我探探客户现在真实想法吗？重点看预算、家里意见，还有有没有机会再来一趟。`;
  }

  if (focus || concerns) {
    return `${guideName}，${customerName}主要看${focus || "房源匹配"}，但${concerns || "决策节奏"}这块好像还没完全放下。你方便侧面问一句吗？我好判断怎么跟。`;
  }

  return `${guideName}，${customerName}这边我想再跟一下。你方便帮我问问客户现在怎么想、家里谁拍板、后面还会不会再看吗？`;
}

export function isLikelyPhone(value: string | null | undefined) {
  if (!value) return false;
  return /1[3-9]\d{9}/.test(value.replace(/\s/g, ""));
}

export function extractPhone(value: string | null | undefined) {
  return value?.replace(/\s/g, "").match(/1[3-9]\d{9}/)?.[0] ?? null;
}

export function lastOnsiteAgeDays(visits: Visit[]) {
  const latestOnsite = getLatestOnsiteVisit(visits);
  if (!latestOnsite) return null;
  const diff = Date.now() - getVisitBaseDate(latestOnsite).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}
