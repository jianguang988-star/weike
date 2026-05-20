"use client";

import { useState } from "react";
import FirstVisitTimeEditor from "@/components/first-visit-time-editor";

type VisitRecord = {
  id: number;
  visitTime: string;
  visitType: string;
  content: string;
  createdAt: string;
};

function RecordCard({ visit }: { visit: VisitRecord }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{visit.visitTime || visit.createdAt || "时间未记录"}</span>
        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600">{visit.visitType || "未分类"}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{visit.content || "无内容"}</p>
    </div>
  );
}

export default function RecordSummaryToggle({
  customerId,
  firstVisit,
  onsiteVisits,
  onlineFollowups,
  guideNotes
}: {
  customerId: number;
  firstVisit: VisitRecord | null;
  onsiteVisits: VisitRecord[];
  onlineFollowups: VisitRecord[];
  guideNotes?: VisitRecord[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="crm-card">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <div>
          <h2 className="crm-title">记录汇总</h2>
          <p className="mt-1 text-sm text-zinc-500">
            来访记录 {onsiteVisits.length} 条 / 跟进记录 {onlineFollowups.length} 条
            {guideNotes?.length ? ` / 带看人沟通 ${guideNotes.length} 条` : ""}
          </p>
        </div>
        <span className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white">
          {open ? "收起" : "展开"}
        </span>
      </button>

      {open ? (
        <div className="mt-4 grid gap-5">
          <div className="grid gap-3">
            <h3 className="text-sm font-semibold">来访记录</h3>
            <p className="text-xs leading-5 text-zinc-500">仅统计客户实际到项目现场的到店、复访行为。</p>
            {firstVisit ? (
              <FirstVisitTimeEditor
                customerId={customerId}
                visitId={firstVisit.id}
                initialValue={firstVisit.visitTime || firstVisit.createdAt}
              />
            ) : null}
            {onsiteVisits.map((visit) => (
              <RecordCard key={visit.id} visit={visit} />
            ))}
            {onsiteVisits.length === 0 ? <p className="text-sm text-zinc-500">暂无来访记录</p> : null}
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold">跟进记录</h3>
            <p className="text-xs leading-5 text-zinc-500">仅统计电话沟通、微信聊天等非到店形式的线上互动。</p>
            {onlineFollowups.map((visit) => (
              <RecordCard key={visit.id} visit={visit} />
            ))}
            {onlineFollowups.length === 0 ? <p className="text-sm text-zinc-500">暂无跟进记录</p> : null}
          </div>

          <div className="grid gap-3">
            <h3 className="text-sm font-semibold">带看人沟通</h3>
            <p className="text-xs leading-5 text-zinc-500">仅记录你和带看人、中介、渠道、转介绍人的沟通。</p>
            {guideNotes?.map((visit) => (
              <RecordCard key={visit.id} visit={visit} />
            ))}
            {!guideNotes?.length ? <p className="text-sm text-zinc-500">暂无带看人沟通记录</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
