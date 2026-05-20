"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FirstVisitTimeEditor({
  customerId,
  visitId,
  initialValue
}: {
  customerId: number;
  visitId: number;
  initialValue: string;
}) {
  const router = useRouter();
  const [visitTime, setVisitTime] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);

    if (!visitTime.trim()) {
      setError("请填写首次来访时间。");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitTime })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "保存失败");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
      <label className="grid gap-2 text-sm">
        <span className="font-medium text-zinc-700">首次来访时间</span>
        <input
          className="crm-input"
          placeholder="例如：2026-05-19 14:30、今天下午、5月18日"
          value={visitTime}
          onChange={(event) => setVisitTime(event.target.value)}
        />
      </label>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        className="crm-btn-primary mt-3"
        disabled={saving}
        onClick={handleSave}
        type="button"
      >
        {saving ? "保存中..." : "保存首次来访时间"}
      </button>
    </div>
  );
}
