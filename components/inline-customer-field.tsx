"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldName =
  | "name"
  | "phone"
  | "wechat"
  | "agentName"
  | "agentStore"
  | "budget"
  | "intentionLevel"
  | "preferredUnits"
  | "focusPoints"
  | "concerns"
  | "summary";

export default function InlineCustomerField({
  customerId,
  name,
  label,
  value,
  multiline = false,
  placeholder = "未填写"
}: {
  customerId: number;
  name: FieldName;
  label: string;
  value?: string | null;
  multiline?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [name]: draft })
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "保存失败");
      }

      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <dt className="crm-label">{label}</dt>
        {!editing ? (
          <button className="text-xs font-medium text-blue-600" onClick={() => setEditing(true)} type="button">
            修改
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-2 grid gap-2">
          {multiline ? (
            <textarea
              className="crm-textarea min-h-[96px] resize-y px-3 py-2 text-sm leading-6"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          ) : (
            <input
              className="crm-input px-3 py-2"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <button className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white" disabled={saving} onClick={save} type="button">
              {saving ? "保存中" : "保存"}
            </button>
            <button
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs"
              disabled={saving}
              onClick={() => {
                setDraft(value ?? "");
                setEditing(false);
              }}
              type="button"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <dd className="mt-1 text-sm leading-6 text-zinc-950">{value?.trim() || placeholder}</dd>
      )}
    </div>
  );
}
