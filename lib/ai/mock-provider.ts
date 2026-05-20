import type { AIProvider, CustomerAnalysisResult, FollowupAnalysisResult, QuickNoteAnalysisResult } from "./types";
import { inferMaterialMetadata } from "@/lib/sales-knowledge";

function pickName(input: string) {
  const match = input.match(/(?:客户|业主|买房人)?([王李张刘陈杨赵黄周吴郑冯][\u4e00-\u9fa5]{1,2})(?:先生|女士|总|姐|哥)?/);
  return match?.[1] ?? "王先生";
}

function pickPhone(input: string) {
  return input.match(/1[3-9]\d{9}/)?.[0] ?? null;
}

function pickBudget(input: string) {
  return input.match(/(?:预算|总价|首付)[^\n，。,.；;]{0,16}/)?.[0] ?? "预算待确认";
}

export const mockProvider: AIProvider = {
  async analyzeCustomer(input: string): Promise<CustomerAnalysisResult> {
    const name = pickName(input);

    return {
      customer: {
        name,
        phone: pickPhone(input),
        wechat: input.includes("微信") ? "待补充" : null,
        source: input.includes("抖音") ? "抖音" : input.includes("转介绍") ? "转介绍" : "自然到访",
        agent_name: null,
        agent_store: null,
        budget: pickBudget(input),
        preferred_units: input.includes("三房") ? ["三房"] : input.includes("两房") ? ["两房"] : [],
        concerns: input.includes("贵") ? ["价格抗性"] : input.includes("学区") ? ["学区匹配"] : [],
        focus_points: input.includes("地铁") ? ["地铁交通"] : input.includes("学校") ? ["教育配套"] : ["总价与户型"],
        intention_level: input.includes("今天定") || input.includes("很满意") ? "A" : input.includes("再考虑") ? "C" : "B",
        summary: `${name}对项目有初步兴趣，核心需求和抗性已从原始描述中整理，建议尽快补齐电话、微信、预算和决策人信息。`
      },
      visit: {
        visit_time: input.includes("今天") ? "今天" : null,
        visit_type: input.includes("到访") ? "到访" : "沟通记录",
        content: input
      },
      followup: {
        recommended_time: "明天上午",
        priority: "高",
        key_point: "先抓客户最在意的点聊，不要一次讲太多；顺带确认预算、付款方式和家里谁拍板。",
        script: `${name}，今天您说的几个点我记下来了。我先按预算和户型把范围收窄一点，明天发您看两套比较稳的。`
      }
    };
  },

  async analyzeFollowup(): Promise<FollowupAnalysisResult> {
    return {
      visit_type: "回访",
      visit_time: "今天",
      recommended_time: "明天上午",
      priority: "中",
      key_point: "根据本次沟通内容，先确认客户当前最大的顾虑和决策人意见，再围绕预算、户型和对比项目补充一轮有针对性的材料。",
      script: "您刚才提到的顾虑我理解。我先把总价、户型和后面住起来方便不方便这几个点摆清楚，您看完再判断。",
      status: "pending"
    };
  },

  async analyzeQuickNote(input): Promise<QuickNoteAnalysisResult> {
    const first = input.candidates[0];
    return {
      matched_customer_id: first?.id ?? null,
      confidence: first ? "medium" : "low",
      reason: first ? "mock 模式默认匹配第一个候选客户，请人工确认。" : "没有候选客户。",
      customer_updates: {
        name: null,
        phone: null,
        wechat: null,
        source: null,
        budget: input.note.includes("320") ? "320万以内" : null,
        preferred_units_add: [],
        concerns_add: input.note.includes("贵") || input.note.includes("压力") ? ["价格压力"] : [],
        focus_points_add: input.note.includes("学校") ? ["学校"] : [],
        intention_level: null,
        summary_append: input.note
      },
      visit: {
        visit_time: input.note.includes("今天") ? "今天" : null,
        visit_type: input.note.includes("到店") || input.note.includes("复访") ? "复访" : "回访",
        content: input.note
      },
      followup: {
        recommended_time: "明天上午",
        priority: "中",
        key_point: "补齐客户新增关注点，并围绕最新抗性安排下一次沟通。",
        script: "您刚才说的情况我记下来了。我先帮您把选择范围收窄一点，明天发您看两套更好判断的。",
        status: "pending"
      }
    };
  },

  async analyzeSalesMaterial(input) {
    const inferred = inferMaterialMetadata({
      fileName: input.file_name,
      folderPath: input.source_path ?? undefined,
      textPreview: input.text_preview ?? undefined
    });

    return {
      title: input.file_name.replace(/\.[^.]+$/, ""),
      material_type: inferred.materialType,
      visibility: inferred.visibility as "internal" | "customer_shareable" | "manager_only",
      project_name: null,
      region_name: null,
      competitor_name: null,
      description: "根据文件名自动归类的销售材料。",
      summary: input.text_preview?.slice(0, 180) || `上传文件：${input.file_name}。系统已根据文件名和关键词完成初步分类。`,
      tag_codes: inferred.tagCodes
    };
  }
};
