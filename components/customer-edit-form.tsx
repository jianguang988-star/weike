"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type CustomerEditInitialData = {
  id: number;
  name: string;
  phone: string;
  wechat: string;
  source: string;
  agentName: string;
  agentStore: string;
  budget: string;
  preferredUnits: string;
  concerns: string;
  focusPoints: string;
  intentionLevel: string;
  summary: string;
  visitId: number | null;
  visitTime: string;
  visitType: string;
  visitContent: string;
  followupId: number | null;
  recommendedTime: string;
  priority: string;
  keyPoint: string;
  script: string;
  status: string;
};

function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder
}: {
  label: string;
  name: keyof CustomerEditInitialData;
  value: string;
  onChange: (name: keyof CustomerEditInitialData, value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <input
        className="crm-input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder
}: {
  label: string;
  name: keyof CustomerEditInitialData;
  value: string;
  onChange: (name: keyof CustomerEditInitialData, value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <textarea
        className="crm-textarea resize-y text-sm leading-6"
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="crm-card">
      <h2 className="crm-title">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function CustomerEditForm({ initialData }: { initialData: CustomerEditInitialData }) {
  const router = useRouter();
  const [form, setForm] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(name: keyof CustomerEditInitialData, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "保存失败");
      }

      router.push(`/customers/${form.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Section title="客户基础档案">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextInput label="姓名" name="name" value={form.name} onChange={updateField} />
          <TextInput label="电话" name="phone" value={form.phone} onChange={updateField} />
          <TextInput label="微信" name="wechat" value={form.wechat} onChange={updateField} />
          <TextInput label="带看人" name="agentName" value={form.agentName} onChange={updateField} placeholder="例如：张经理、李姐、中介小王" />
          <TextInput label="带看人联系方式" name="agentStore" value={form.agentStore} onChange={updateField} placeholder="电话、微信或备注" />
          <TextInput label="预算" name="budget" value={form.budget} onChange={updateField} />
          <TextInput label="意向等级" name="intentionLevel" value={form.intentionLevel} onChange={updateField} placeholder="A / B / C / D" />
          <TextInput label="意向户型" name="preferredUnits" value={form.preferredUnits} onChange={updateField} placeholder="三房、四房" />
          <TextInput label="关注点" name="focusPoints" value={form.focusPoints} onChange={updateField} placeholder="地铁、学校、户型" />
          <TextInput label="抗性" name="concerns" value={form.concerns} onChange={updateField} placeholder="价格、楼层、付款压力" />
        </div>
        <div className="mt-4">
          <TextArea label="客户摘要" name="summary" value={form.summary} onChange={updateField} />
        </div>
      </Section>

      <Section title="最近到访记录">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="到访时间" name="visitTime" value={form.visitTime} onChange={updateField} />
          <TextInput label="到访类型" name="visitType" value={form.visitType} onChange={updateField} />
        </div>
        <div className="mt-4">
          <TextArea label="到访内容" name="visitContent" value={form.visitContent} onChange={updateField} rows={5} />
        </div>
      </Section>

      <Section title="最近跟进计划">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput label="推荐跟进时间" name="recommendedTime" value={form.recommendedTime} onChange={updateField} />
          <TextInput label="优先级" name="priority" value={form.priority} onChange={updateField} />
          <TextInput label="状态" name="status" value={form.status} onChange={updateField} placeholder="pending / done" />
        </div>
        <div className="mt-4 grid gap-4">
          <TextArea label="跟进核心关键点" name="keyPoint" value={form.keyPoint} onChange={updateField} rows={4} />
          <TextArea label="微信跟进话术" name="script" value={form.script} onChange={updateField} rows={5} />
        </div>
      </Section>

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="sticky bottom-24 z-10 grid grid-cols-2 gap-3 rounded-[22px] bg-white/95 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:static sm:flex sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          className="crm-btn-primary"
          disabled={saving}
          onClick={handleSave}
          type="button"
        >
          {saving ? "保存中..." : "保存修改"}
        </button>
        <button
          className="crm-btn-secondary"
          onClick={() => router.push(`/customers/${form.id}`)}
          type="button"
        >
          取消
        </button>
      </div>
    </div>
  );
}
