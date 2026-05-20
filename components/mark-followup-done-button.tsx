"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkFollowupDoneButton({ followupId }: { followupId?: number | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function markDone() {
    if (!followupId) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/followups/${followupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "标记失败");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "标记失败");
    } finally {
      setSaving(false);
    }
  }

  if (!followupId) return null;

  return (
    <button
      className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700 disabled:opacity-60"
      disabled={saving}
      onClick={markDone}
      type="button"
    >
      {saving ? "处理中" : "已跟进"}
    </button>
  );
}
