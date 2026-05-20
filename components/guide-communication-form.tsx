"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuideCommunicationForm({
  customerId,
  guideName
}: {
  customerId: number;
  guideName?: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!content.trim()) {
      setError("请先填写和带看人的沟通内容。");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${customerId}/guide-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "保存失败");
      }

      setContent("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm leading-6 text-zinc-500">
        专门记录你和{guideName || "带看人"}沟通到的客户真实想法，这类信息会沉淀到客户摘要里。
      </p>
      <textarea
        className="crm-textarea min-h-[140px] resize-y"
        placeholder="例如：问了小王，客户老婆更在意学校，预算最多能加到 130 万，周末有机会再来。"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        className="crm-btn-primary sm:w-fit"
        disabled={saving}
        onClick={handleSave}
        type="button"
      >
        {saving ? "保存中..." : "保存带看人沟通"}
      </button>
    </div>
  );
}
