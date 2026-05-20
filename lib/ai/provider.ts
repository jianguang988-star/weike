import { deepSeekProvider } from "./deepseek-provider";
import { mockProvider } from "./mock-provider";
import { openAIProvider } from "./openai-provider";
import type {
  AIProvider,
  CustomerAnalysisResult,
  FollowupAnalysisInput,
  FollowupAnalysisResult,
  QuickNoteAnalysisInput,
  QuickNoteAnalysisResult,
  SalesMaterialAnalysisInput,
  SalesMaterialAnalysisResult
} from "./types";

export type {
  CustomerAnalysisResult,
  FollowupAnalysisInput,
  FollowupAnalysisResult,
  QuickNoteAnalysisInput,
  QuickNoteAnalysisResult,
  SalesMaterialAnalysisInput,
  SalesMaterialAnalysisResult
};

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "mock";

  switch (provider.toLowerCase()) {
    case "openai":
      return openAIProvider;
    case "deepseek":
      return deepSeekProvider;
    case "mock":
      return mockProvider;
    default:
      return mockProvider;
  }
}

export function analyzeCustomer(input: string): Promise<CustomerAnalysisResult> {
  return getAIProvider().analyzeCustomer(input);
}

export function analyzeFollowup(input: FollowupAnalysisInput): Promise<FollowupAnalysisResult> {
  return getAIProvider().analyzeFollowup(input);
}

export function analyzeQuickNote(input: QuickNoteAnalysisInput): Promise<QuickNoteAnalysisResult> {
  return getAIProvider().analyzeQuickNote(input);
}

export async function analyzeSalesMaterial(input: SalesMaterialAnalysisInput): Promise<SalesMaterialAnalysisResult> {
  const provider = getAIProvider();
  if (!provider.analyzeSalesMaterial) {
    throw new Error("Current AI provider does not support sales material analysis.");
  }

  return provider.analyzeSalesMaterial(input);
}
