import type { Customer, Followup, MaterialTag, MaterialTagCategory, SalesMaterial, SalesMaterialTagRelation, Visit } from "@prisma/client";
import { parseList } from "./format";
import { prisma } from "./prisma";

export const materialTypes = [
  { code: "ppt", name: "竞品楼盘 PPT" },
  { code: "competitor_weakness", name: "竞品劣势总结" },
  { code: "region_compare", name: "区域对比资料" },
  { code: "sales_script", name: "本地化销售说辞" },
  { code: "objection_reply", name: "客户异议应对材料" },
  { code: "shareable_image_text", name: "可发客户图文材料" },
  { code: "training", name: "内部培训材料" },
  { code: "document", name: "其他文档" },
  { code: "image", name: "图片" }
];

export const defaultTagCategories = [
  {
    code: "resistance",
    name: "客户抗性",
    tags: [
      ["price_high", "价格高"],
      ["location_bad", "位置不理想"],
      ["traffic_bad", "交通顾虑"],
      ["school_weak", "学区顾虑"],
      ["future_unclear", "区域发展不确定"],
      ["competitor_better", "认为竞品更好"],
      ["delivery_risk", "交付风险"],
      ["investment_return", "投资回报顾虑"],
      ["family_disagree", "家人不同意"],
      ["decision_delay", "决策拖延"]
    ]
  },
  {
    code: "scene",
    name: "销售场景",
    tags: [
      ["first_visit", "首访"],
      ["revisit", "复访"],
      ["price_negotiation", "价格谈判"],
      ["competitor_compare", "竞品对比"],
      ["region_compare", "区域对比"],
      ["closing_push", "逼定成交"],
      ["post_visit_follow", "到访后跟进"],
      ["wechat_follow", "微信跟进"]
    ]
  },
  {
    code: "follow_goal",
    name: "跟进目标",
    tags: [
      ["invite_visit", "邀约到访"],
      ["push_revisit", "推动复访"],
      ["handle_objection", "处理异议"],
      ["create_urgency", "制造紧迫感"],
      ["recommend_unit", "推荐房源"],
      ["push_deposit", "推动认购"],
      ["maintain_relation", "关系维护"]
    ]
  },
  {
    code: "material_usage",
    name: "材料用途",
    tags: [
      ["talking_point", "销售说辞"],
      ["evidence", "佐证材料"],
      ["share_to_customer", "可转发客户"],
      ["training", "内部培训"],
      ["comparison", "对比分析"]
    ]
  }
] as const;

export const supportedImportExtensions = new Set([
  ".ppt",
  ".pptx",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".txt",
  ".md"
]);

export type SalesMaterialWithTags = SalesMaterial & {
  tags: Array<SalesMaterialTagRelation & { tag: MaterialTag & { category: MaterialTagCategory } }>;
};

export type CustomerForKnowledge = Customer & {
  visits: Visit[];
  followups: Followup[];
};

export async function ensureSalesKnowledgeDefaults() {
  for (const [categoryIndex, category] of defaultTagCategories.entries()) {
    const savedCategory = await prisma.materialTagCategory.upsert({
      where: { code: category.code },
      update: { name: category.name, sortOrder: categoryIndex },
      create: { code: category.code, name: category.name, sortOrder: categoryIndex }
    });

    for (const [tagIndex, [code, name]] of category.tags.entries()) {
      await prisma.materialTag.upsert({
        where: { categoryId_code: { categoryId: savedCategory.id, code } },
        update: { name, sortOrder: tagIndex },
        create: { categoryId: savedCategory.id, code, name, sortOrder: tagIndex }
      });
    }
  }
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function inferCustomerKnowledgeContext(customer: CustomerForKnowledge) {
  const concerns = parseList(customer.concerns);
  const focusPoints = parseList(customer.focusPoints);
  const latestFollowup = customer.followups[0];
  const latestVisit = customer.visits[0];
  const text = [
    customer.summary,
    customer.budget,
    customer.preferredUnits,
    customer.focusPoints,
    customer.concerns,
    latestFollowup?.keyPoint,
    latestFollowup?.script,
    latestVisit?.content
  ]
    .filter(Boolean)
    .join(" ");

  const resistanceCodes = new Set<string>();
  if (containsAny(text, ["贵", "价格", "预算", "首付", "月供", "便宜"])) resistanceCodes.add("price_high");
  if (containsAny(text, ["位置", "偏", "远"])) resistanceCodes.add("location_bad");
  if (containsAny(text, ["地铁", "交通", "通勤", "距离"])) resistanceCodes.add("traffic_bad");
  if (containsAny(text, ["学区", "学校", "孩子", "上学"])) resistanceCodes.add("school_weak");
  if (containsAny(text, ["区域", "发展", "规划", "成熟"])) resistanceCodes.add("future_unclear");
  if (containsAny(text, ["竞品", "对比", "别的楼盘", "另一个楼盘"])) resistanceCodes.add("competitor_better");
  if (containsAny(text, ["交付", "烂尾", "延期"])) resistanceCodes.add("delivery_risk");
  if (containsAny(text, ["投资", "升值", "回报"])) resistanceCodes.add("investment_return");
  if (containsAny(text, ["家人", "老婆", "爱人", "父母", "不同意", "商量"])) resistanceCodes.add("family_disagree");
  if (containsAny(text, ["考虑", "再看看", "等等", "不急"])) resistanceCodes.add("decision_delay");

  const sceneCodes = new Set<string>();
  if (containsAny(text, ["复访", "再来", "周末来"])) sceneCodes.add("revisit");
  if (containsAny(text, ["价格", "优惠", "折扣", "预算"])) sceneCodes.add("price_negotiation");
  if (containsAny(text, ["竞品", "对比", "别的楼盘"])) sceneCodes.add("competitor_compare");
  if (containsAny(text, ["区域", "板块"])) sceneCodes.add("region_compare");
  if (containsAny(text, ["微信", "发资料"])) sceneCodes.add("wechat_follow");
  if (customer.visits.length <= 1) sceneCodes.add("first_visit");
  if (customer.visits.length > 1) sceneCodes.add("post_visit_follow");

  const goalCodes = new Set<string>();
  if (containsAny(text, ["到访", "来看", "约"])) goalCodes.add("invite_visit");
  if (containsAny(text, ["复访", "再来"])) goalCodes.add("push_revisit");
  if (resistanceCodes.size) goalCodes.add("handle_objection");
  if (containsAny(text, ["认购", "定", "下定", "锁房"])) goalCodes.add("push_deposit");
  if (containsAny(text, ["房源", "楼层", "户型"])) goalCodes.add("recommend_unit");
  if (goalCodes.size === 0) goalCodes.add("maintain_relation");

  return {
    concerns,
    focusPoints,
    latestFollowNote: latestFollowup?.keyPoint || latestVisit?.content || customer.summary || "",
    resistanceCodes: Array.from(resistanceCodes),
    sceneCodes: Array.from(sceneCodes),
    goalCodes: Array.from(goalCodes)
  };
}

export function scoreMaterialForCustomer(material: SalesMaterialWithTags, customer: CustomerForKnowledge) {
  const context = inferCustomerKnowledgeContext(customer);
  const tagCodes = material.tags.map((item) => item.tag.code);
  const tagNames = material.tags.map((item) => item.tag.name);
  const reasonParts: string[] = [];
  let score = 0;

  for (const code of context.resistanceCodes) {
    if (tagCodes.includes(code)) {
      score += 30;
      reasonParts.push(`匹配客户抗性「${tagNames[tagCodes.indexOf(code)]}」`);
    }
  }

  for (const code of context.sceneCodes) {
    if (tagCodes.includes(code)) {
      score += 15;
      reasonParts.push(`适用于当前场景「${tagNames[tagCodes.indexOf(code)]}」`);
    }
  }

  for (const code of context.goalCodes) {
    if (tagCodes.includes(code)) {
      score += 15;
      reasonParts.push(`贴合跟进目标「${tagNames[tagCodes.indexOf(code)]}」`);
    }
  }

  const customerText = [customer.summary, customer.focusPoints, customer.concerns, context.latestFollowNote].filter(Boolean).join(" ");
  if (material.projectName && customerText.includes(material.projectName)) {
    score += 20;
    reasonParts.push(`涉及项目「${material.projectName}」`);
  }
  if (material.regionName && customerText.includes(material.regionName)) {
    score += 15;
    reasonParts.push(`涉及区域「${material.regionName}」`);
  }
  if (material.competitorName && customerText.includes(material.competitorName)) {
    score += 25;
    reasonParts.push(`涉及竞品「${material.competitorName}」`);
  }
  if (material.visibility === "customer_shareable" && context.goalCodes.some((code) => code === "invite_visit" || code === "push_revisit")) {
    score += 10;
    reasonParts.push("可直接转发客户");
  }
  if (["sales_script", "objection_reply"].includes(material.materialType)) score += 10;

  return {
    score,
    reason: reasonParts.length ? reasonParts.join("；") : "与客户关注点或销售阶段存在弱相关"
  };
}

export function classifyRecommendationType(material: SalesMaterial) {
  if (material.materialType === "sales_script" || material.materialType === "objection_reply") return "script";
  if (material.visibility === "customer_shareable" || material.materialType === "shareable_image_text") return "shareable";
  if (material.materialType === "ppt" || material.materialType === "image") return "asset";
  if (material.materialType === "training") return "training";
  return "internal";
}

export function inferMaterialMetadata(source: { fileName: string; folderPath?: string; textPreview?: string }) {
  const lower = `${source.fileName} ${source.folderPath ?? ""} ${source.textPreview ?? ""}`.toLowerCase();
  const tags = new Set<string>();
  let materialType = "document";
  let visibility = "internal";

  if (lower.includes("ppt") || lower.endsWith(".ppt") || lower.endsWith(".pptx")) materialType = "ppt";
  if (lower.includes("竞品") || lower.includes("对标") || lower.includes("对比楼盘")) materialType = "competitor_weakness";
  if (lower.includes("区域") || lower.includes("板块") || lower.includes("配套") || lower.includes("规划")) materialType = "region_compare";
  if (lower.includes("说辞") || lower.includes("话术") || lower.includes("接待")) materialType = "sales_script";
  if (lower.includes("异议") || lower.includes("抗性") || lower.includes("逼定") || lower.includes("谈判")) materialType = "objection_reply";
  if (lower.includes("图文") || lower.includes("朋友圈") || lower.includes("海报") || lower.includes("客户可发")) {
    materialType = "shareable_image_text";
    visibility = "customer_shareable";
  }
  if (lower.includes("培训") || lower.includes("内训") || lower.includes("考试")) materialType = "training";
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) materialType = "image";

  if (lower.includes("价格") || lower.includes("贵") || lower.includes("预算") || lower.includes("首付") || lower.includes("月供")) tags.add("price_high");
  if (lower.includes("位置") || lower.includes("偏远") || lower.includes("距离")) tags.add("location_bad");
  if (lower.includes("地铁") || lower.includes("交通") || lower.includes("通勤")) tags.add("traffic_bad");
  if (lower.includes("学校") || lower.includes("学区") || lower.includes("教育")) tags.add("school_weak");
  if (lower.includes("发展") || lower.includes("规划") || lower.includes("兑现")) tags.add("future_unclear");
  if (lower.includes("竞品") || lower.includes("对比楼盘")) tags.add("competitor_better");
  if (lower.includes("交付") || lower.includes("延期") || lower.includes("风险")) tags.add("delivery_risk");
  if (lower.includes("投资") || lower.includes("升值") || lower.includes("回报")) tags.add("investment_return");
  if (lower.includes("家人") || lower.includes("父母") || lower.includes("老婆") || lower.includes("爱人")) tags.add("family_disagree");
  if (lower.includes("犹豫") || lower.includes("观望") || lower.includes("再看看") || lower.includes("拖延")) tags.add("decision_delay");

  if (lower.includes("首访") || lower.includes("初访")) tags.add("first_visit");
  if (lower.includes("复访")) tags.add("revisit");
  if (lower.includes("价格") || lower.includes("谈判")) tags.add("price_negotiation");
  if (lower.includes("竞品") || lower.includes("对比楼盘")) tags.add("competitor_compare");
  if (lower.includes("区域") || lower.includes("板块")) tags.add("region_compare");
  if (lower.includes("逼定") || lower.includes("成交") || lower.includes("认购")) tags.add("closing_push");
  if (lower.includes("微信") || lower.includes("朋友圈") || lower.includes("客户可发")) tags.add("wechat_follow");

  if (lower.includes("邀约") || lower.includes("到访")) tags.add("invite_visit");
  if (lower.includes("复访")) tags.add("push_revisit");
  if (lower.includes("异议") || lower.includes("抗性")) tags.add("handle_objection");
  if (lower.includes("紧迫") || lower.includes("稀缺")) tags.add("create_urgency");
  if (lower.includes("认购") || lower.includes("下定") || lower.includes("锁房")) tags.add("push_deposit");

  if (materialType === "sales_script") tags.add("talking_point");
  if (["region_compare", "competitor_weakness", "image"].includes(materialType)) tags.add("evidence");
  if (visibility === "customer_shareable") tags.add("share_to_customer");
  if (materialType === "training") tags.add("training");
  if (materialType === "competitor_weakness" || materialType === "region_compare") tags.add("comparison");

  return { materialType, visibility, tagCodes: Array.from(tags) };
}

export function buildSalesResponseDraft(customer: CustomerForKnowledge, materials: SalesMaterialWithTags[]) {
  const context = inferCustomerKnowledgeContext(customer);
  const focus = context.focusPoints.slice(0, 2).join("、") || customer.summary || "客户当前核心诉求";
  const concerns = context.concerns.slice(0, 2).join("、") || "当前异议";
  const summaries = materials
    .slice(0, 3)
    .map((material) => `《${material.title}》：${material.summary || material.description || "暂无摘要"}`)
    .join("\n");
  const shareable = materials.filter((material) => material.visibility === "customer_shareable").slice(0, 2);

  return [
    `应对方向：先接住客户对「${concerns}」的担心，不急着反驳；再围绕「${focus}」给他一个更容易判断的看法。`,
    "",
    "可用话术：",
    `${customer.name || "您好"}，您担心的这个点我理解，买房确实不能只听销售说好。我先按您在意的${focus}，把几个关键差别讲清楚，您看完再判断哪边更适合家里。`,
    "",
    "材料佐证：",
    summaries || "当前还没有命中的材料摘要，建议先补充区域对比、竞品劣势和客户异议材料。",
    "",
    "下一步策略：",
    shareable.length
      ? `先发「${shareable.map((item) => item.title).join("」「")}」给客户，不要一次发太多；客户有回应后，再顺着他最在意的点约现场。`
      : "先把内部口径说人话，再补一份客户能看懂、能转给家人看的材料。"
  ].join("\n");
}
