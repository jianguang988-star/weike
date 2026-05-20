"use client";

import { useState } from "react";
import type { CustomerAnalysisResult } from "@/lib/ai/provider";

const example =
  "今天王先生到访，电话 13800138000，预算大概 300 万左右，想看三房，比较关注地铁和学校，觉得价格有点贵，说要回去和爱人再考虑。";

export default function CustomerInputForm() {
  const [text, setText] = useState(example);
  const [result, setResult] = useState<CustomerAnalysisResult | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setCustomerId(null);

    if (!text.trim()) {
      setError("请先输入客户描述。");
      return;
    }

    setLoading(true);
    try {
      const analyzeResponse = await fetch("/api/analyze-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!analyzeResponse.ok) {
        throw new Error("AI 分析失败，请稍后再试。");
      }

      const analysis = (await analyzeResponse.json()) as CustomerAnalysisResult;
      setResult(analysis);

      const saveResponse = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text, analysis })
      });

      if (!saveResponse.ok) {
        throw new Error("保存客户失败，请检查数据库是否已初始化。");
      }

      const saved = (await saveResponse.json()) as { id: number };
      setCustomerId(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="crm-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <label className="crm-title" htmlFor="customer-text">
              客户描述
            </label>
            <p className="mt-1 text-sm text-zinc-500">直接粘贴微信、电话记录或销售口述。</p>
          </div>
          <span className="crm-badge-blue">AI 建档</span>
        </div>
        <textarea
          id="customer-text"
          className="crm-textarea mt-4 min-h-[280px] w-full resize-y sm:min-h-[360px]"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="例如：今天王先生到访，预算 300 万，想看三房，关注地铁和学校..."
        />
        <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <button
            className="crm-btn-primary px-4 py-4 text-base sm:px-5 sm:py-3 sm:text-sm"
            disabled={loading}
            onClick={handleSubmit}
            type="button"
          >
            {loading ? "分析并保存中..." : "一键分析并存档"}
          </button>
          {customerId ? (
            <a className="crm-btn-secondary text-center sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none" href={`/customers/${customerId}`}>
              查看客户详情
            </a>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="crm-card">
        <h2 className="crm-title">分析结果</h2>
        {result ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-blue-600">查看完整 JSON</summary>
            <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-6 text-zinc-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-sm text-zinc-500">
            分析结果会显示在这里，并同步保存到 SQLite 数据库。
          </div>
        )}
      </section>
    </div>
  );
}
