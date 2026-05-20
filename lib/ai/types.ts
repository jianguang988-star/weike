export type NullableString = string | null;

export interface CustomerAnalysisResult {
  customer: {
    name: NullableString;
    phone: NullableString;
    wechat: NullableString;
    source: NullableString;
    agent_name: NullableString;
    agent_store: NullableString;
    budget: NullableString;
    preferred_units: string[];
    concerns: string[];
    focus_points: string[];
    intention_level: NullableString;
    summary: NullableString;
  };
  visit: {
    visit_time: NullableString;
    visit_type: NullableString;
    content: NullableString;
  };
  followup: {
    recommended_time: NullableString;
    priority: NullableString;
    key_point: NullableString;
    script: NullableString;
  };
}

export interface FollowupAnalysisInput {
  customerProfile: string;
  latestFollowup: string;
  followupContent: string;
}

export interface FollowupAnalysisResult {
  visit_type: NullableString;
  visit_time: NullableString;
  recommended_time: NullableString;
  priority: NullableString;
  key_point: NullableString;
  script: NullableString;
  status: NullableString;
}

export interface CustomerCandidate {
  id: number;
  name: NullableString;
  phone: NullableString;
  wechat: NullableString;
  budget: NullableString;
  summary: NullableString;
  focus_points: string[];
  concerns: string[];
}

export interface QuickNoteAnalysisInput {
  note: string;
  candidates: CustomerCandidate[];
}

export interface QuickNoteAnalysisResult {
  matched_customer_id: number | null;
  confidence: "high" | "medium" | "low";
  reason: NullableString;
  customer_updates: {
    name: NullableString;
    phone: NullableString;
    wechat: NullableString;
    source: NullableString;
    budget: NullableString;
    preferred_units_add: string[];
    concerns_add: string[];
    focus_points_add: string[];
    intention_level: NullableString;
    summary_append: NullableString;
  };
  visit: {
    visit_time: NullableString;
    visit_type: NullableString;
    content: NullableString;
  };
  followup: {
    recommended_time: NullableString;
    priority: NullableString;
    key_point: NullableString;
    script: NullableString;
    status: NullableString;
  };
}

export interface SalesMaterialAnalysisInput {
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  text_preview: NullableString;
  source_path: NullableString;
}

export interface SalesMaterialAnalysisResult {
  title: string;
  material_type: string;
  visibility: "internal" | "customer_shareable" | "manager_only";
  project_name: NullableString;
  region_name: NullableString;
  competitor_name: NullableString;
  description: NullableString;
  summary: NullableString;
  tag_codes: string[];
}

export interface AIProvider {
  analyzeCustomer(input: string): Promise<CustomerAnalysisResult>;
  analyzeFollowup(input: FollowupAnalysisInput): Promise<FollowupAnalysisResult>;
  analyzeQuickNote(input: QuickNoteAnalysisInput): Promise<QuickNoteAnalysisResult>;
  analyzeSalesMaterial?(input: SalesMaterialAnalysisInput): Promise<SalesMaterialAnalysisResult>;
}
