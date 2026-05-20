"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { QuickNoteAnalysisResult } from "@/lib/ai/provider";

type Candidate = {
  id: number;
  name: string | null;
  phone: string | null;
  wechat: string | null;
};

type QuickNoteResponse = {
  applied: boolean;
  customerId?: number;
  analysis: QuickNoteAnalysisResult;
  candidates?: Candidate[];
  error?: string;
};

const templates = [
  "微信回访：客户今天微信说",
  "电话沟通：客户电话里反馈",
  "现场复访：客户今天到店复访",
  "客户抗性：客户主要担心",
  "家人意见：客户家人觉得"
];

export default function QuickNoteForm() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<QuickNoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(confirm = false, customerId?: number) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quick-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, confirm, customerId })
      });
      const result = (await response.json()) as QuickNoteResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "识别失败");
      }

      if (result.applied && result.customerId) {
        setNote("");
        setPending(null);
        router.push(`/customers/${result.customerId}`);
        router.refresh();
        return;
      }

      setPending(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "识别失败");
    } finally {
      setLoading(false);
    }
  }

  async function createNewCustomer() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quick-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, createNew: true })
      });
      const result = (await response.json()) as QuickNoteResponse;

      if (!response.ok || !result.customerId) {
        throw new Error(result.error ?? "新建客户失败");
      }

      setNote("");
      setPending(null);
      router.push(`/customers/${result.customerId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "新建客户失败");
    } finally {
      setLoading(false);
    }
  }

  const candidate = pending?.candidates?.[0];

  function appendTemplate(template: string) {
    setNote((value) => (value.trim() ? `${value.trim()}\n${template}` : template));
  }

  return (
    <div className="grid gap-4">
      <section className="crm-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="crm-title">随手记一条</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">像平时聊天一样写，越口语越方便。</p>
          </div>
          <span className="crm-badge-blue">AI 识别</span>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {templates.map((template) => (
            <button
              className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 active:bg-blue-100"
              key={template}
              onClick={() => appendTemplate(template)}
              type="button"
            >
              {template.split("：")[0]}
            </button>
          ))}
        </div>

        <textarea
          id="quick-note"
          className="crm-textarea mt-3 min-h-[260px] w-full resize-y"
          placeholder="例如：王先生今天微信说预算最多 120 万，老婆更关注学校，周末可能再来看。"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          className="crm-btn-primary mt-4 w-full px-4 py-4 text-base sm:w-fit sm:px-6 sm:py-3 sm:text-sm"
          disabled={loading || !note.trim()}
          onClick={() => submit(false)}
          type="button"
        >
          {loading ? "AI 识别并补充中..." : "AI 识别并补充档案"}
        </button>
      </section>

      {pending ? (
        <section className="crm-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="crm-title">需要确认</h2>
            <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              置信度：{pending.analysis.confidence}
            </span>
          </div>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <p className="crm-label">识别原因</p>
              <p className="mt-1">{pending.analysis.reason ?? "未说明"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-blue-500">行为分类</p>
                <p className="mt-1 font-medium text-zinc-950">{pending.analysis.visit.visit_type ?? "未识别"}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs text-blue-500">行为时间</p>
                <p className="mt-1 font-medium text-zinc-950">{pending.analysis.visit.visit_time ?? "未填写"}</p>
              </div>
            </div>
            {candidate ? (
              <div className="rounded-xl border border-blue-100 p-3">
                <p className="crm-label">候选客户</p>
                <p className="mt-1 font-medium text-zinc-950">{candidate.name ?? "未命名"}</p>
                <p className="mt-1 text-xs text-zinc-500">{candidate.phone ?? "无电话"} / {candidate.wechat ?? "无微信"}</p>
              </div>
            ) : (
              <p>未找到可确认的候选客户。</p>
            )}
          </div>
          {candidate ? (
            <button
              className="crm-btn-primary mt-4 w-full sm:w-fit"
              disabled={loading}
              onClick={() => submit(true, candidate.id)}
              type="button"
            >
              确认补充到该客户
            </button>
          ) : (
            <button
              className="crm-btn-primary mt-4 w-full sm:w-fit"
              disabled={loading}
              onClick={createNewCustomer}
              type="button"
            >
              没找到客户，一键新建档案
            </button>
          )}
        </section>
      ) : null}
    </div>
  );
}
