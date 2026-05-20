"use client";

import { useEffect, useState } from "react";

const KEY = "fangchan-crm-last-backup";

function daysBetween(value: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / 86400000);
}

export default function BackupReminder() {
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    setLastBackup(window.localStorage.getItem(KEY));
  }, []);

  function markBackup() {
    const now = new Date().toISOString();
    window.localStorage.setItem(KEY, now);
    setLastBackup(now);
  }

  const days = daysBetween(lastBackup);
  const needBackup = days == null || days >= 7;

  return (
    <section className={`rounded-2xl border p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04)] ${needBackup ? "border-amber-200 bg-amber-50" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">数据备份</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {days == null ? "还没有记录备份时间" : `上次备份：${days} 天前`}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${needBackup ? "border-amber-100 bg-white text-amber-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>
          {needBackup ? "建议备份" : "已备份"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a className="crm-btn-primary py-2 text-center" href="/api/export/csv" onClick={markBackup}>
          导出 CSV
        </a>
        <a className="crm-btn-secondary py-2 text-center" href="/api/export/db" onClick={markBackup}>
          备份数据库
        </a>
      </div>
    </section>
  );
}
