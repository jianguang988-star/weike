import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { getCurrentDateContext } from "./date-context";
import type {
  AIProvider,
  CustomerAnalysisResult,
  FollowupAnalysisResult,
  QuickNoteAnalysisResult,
  SalesMaterialAnalysisResult
} from "./types";

function normalizeResult(value: CustomerAnalysisResult): CustomerAnalysisResult {
  return {
    customer: {
      name: value.customer?.name ?? null,
      phone: value.customer?.phone ?? null,
      wechat: value.customer?.wechat ?? null,
      source: value.customer?.source ?? null,
      agent_name: value.customer?.agent_name ?? null,
      agent_store: value.customer?.agent_store ?? null,
      budget: value.customer?.budget ?? null,
      preferred_units: Array.isArray(value.customer?.preferred_units) ? value.customer.preferred_units : [],
      concerns: Array.isArray(value.customer?.concerns) ? value.customer.concerns : [],
      focus_points: Array.isArray(value.customer?.focus_points) ? value.customer.focus_points : [],
      intention_level: value.customer?.intention_level ?? null,
      summary: value.customer?.summary ?? null
    },
    visit: {
      visit_time: value.visit?.visit_time ?? null,
      visit_type: value.visit?.visit_type ?? null,
      content: value.visit?.content ?? null
    },
    followup: {
      recommended_time: value.followup?.recommended_time ?? null,
      priority: value.followup?.priority ?? null,
      key_point: value.followup?.key_point ?? null,
      script: value.followup?.script ?? null
    }
  };
}

export const deepSeekProvider: AIProvider = {
  async analyzeCustomer(input: string): Promise<CustomerAnalysisResult> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }

    const promptPath = path.join(process.cwd(), "prompts", "customer-analysis.md");
    const systemPrompt = `${getCurrentDateContext()}\n\n${await fs.readFile(promptPath, "utf8")}`;
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
    });

    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty content.");
    }

    return normalizeResult(JSON.parse(content) as CustomerAnalysisResult);
  },

  async analyzeFollowup(input): Promise<FollowupAnalysisResult> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }

    const promptPath = path.join(process.cwd(), "prompts", "followup-analysis.md");
    const systemPrompt = `${getCurrentDateContext()}\n\n${await fs.readFile(promptPath, "utf8")}`;
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
    });

    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(input, null, 2) }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty content.");
    }

    const parsed = JSON.parse(content) as FollowupAnalysisResult;
    return {
      visit_type: parsed.visit_type ?? null,
      visit_time: parsed.visit_time ?? null,
      recommended_time: parsed.recommended_time ?? null,
      priority: parsed.priority ?? null,
      key_point: parsed.key_point ?? null,
      script: parsed.script ?? null,
      status: parsed.status ?? "pending"
    };
  },

  async analyzeQuickNote(input): Promise<QuickNoteAnalysisResult> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }

    const promptPath = path.join(process.cwd(), "prompts", "quick-note-analysis.md");
    const systemPrompt = `${getCurrentDateContext()}\n\n${await fs.readFile(promptPath, "utf8")}`;
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
    });

    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(input, null, 2) }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty content.");
    }

    return JSON.parse(content) as QuickNoteAnalysisResult;
  },

  async analyzeSalesMaterial(input): Promise<SalesMaterialAnalysisResult> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }

    const promptPath = path.join(process.cwd(), "prompts", "sales-material-analysis.md");
    const systemPrompt = `${getCurrentDateContext()}\n\n${await fs.readFile(promptPath, "utf8")}`;
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"
    });

    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(input, null, 2) }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("DeepSeek returned empty content.");
    }

    const parsed = JSON.parse(content) as SalesMaterialAnalysisResult;
    return {
      title: parsed.title || input.file_name.replace(/\.[^.]+$/, ""),
      material_type: parsed.material_type || "document",
      visibility: parsed.visibility || "internal",
      project_name: parsed.project_name ?? null,
      region_name: parsed.region_name ?? null,
      competitor_name: parsed.competitor_name ?? null,
      description: parsed.description ?? null,
      summary: parsed.summary ?? null,
      tag_codes: Array.isArray(parsed.tag_codes) ? parsed.tag_codes : []
    };
  }
};
