"use client";

import { useState } from "react";
import { classifyFollowupResult } from "@/lib/customer-intelligence";

type FollowupItem = {
  id: number;
  createdAt: string;
  recommendedTime: string;
  priority: string;
  status: string;
  keyPoint: string;
};

export default function FollowupHistoryToggle({ followups }: { followups: FollowupItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="crm-card">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <div>
          <h2 className="crm-title">跟进历史建议</h2>
          <p className="mt-1 text-sm text-zinc-500">共 {followups.length} 条历史建议</p>
        </div>
        <span className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-medium text-white">
          {open ? "收起" : "展开"}
        </span>
      </button>

      {open ? (
        <div className="mt-4 grid gap-3">
          {followups.map((followup) => {
            const result = classifyFollowupResult(followup.keyPoint);
            return (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3" key={followup.id}>
                <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span>{followup.createdAt}</span>
                  <span>优先级：{followup.priority || "未填写"}</span>
                  <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-blue-700">{result.label}</span>
                </div>
                <p className="mt-2 text-sm font-medium">建议时间：{followup.recommendedTime || "未填写"}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {followup.keyPoint || "未填写"}
                </p>
                <p className="mt-2 rounded-xl border border-zinc-200 bg-white p-2 text-xs leading-5 text-zinc-600">下一步：{result.next}</p>
              </div>
            );
          })}
          {followups.length === 0 ? <p className="text-sm text-zinc-500">暂无历史建议</p> : null}
        </div>
      ) : null}
    </section>
  );
}
