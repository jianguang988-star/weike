"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FollowupCreateForm({ customerId, onSaved }: { customerId: number; onSaved?: () => void }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!content.trim()) {
      setError("请先输入本次跟进内容。");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, visitTime })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "生成跟进建议失败");
      }

      setContent("");
      setVisitTime("");
      onSaved?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成跟进建议失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <input
        className="crm-input"
        placeholder="跟进时间，例如：今天下午、2026-05-18 16:30；不填则自动记录当前时间"
        value={visitTime}
        onChange={(event) => setVisitTime(event.target.value)}
      />
      <textarea
        className="crm-textarea min-h-[180px] resize-y"
        placeholder="把本次跟进内容粘贴到这里，例如：客户说还在对比隔壁项目，老婆觉得预算压力大，但对地铁和三房户型比较满意..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        className="crm-btn-primary px-4 py-4 text-base sm:w-fit sm:px-5 sm:py-3 sm:text-sm"
        disabled={saving}
        onClick={handleSubmit}
        type="button"
      >
        {saving ? "AI 分析跟进中..." : "保存跟进并生成下一步建议"}
      </button>
    </div>
  );
}
