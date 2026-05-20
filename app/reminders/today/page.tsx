import Link from "next/link";
import MarkFollowupDoneButton from "@/components/mark-followup-done-button";
import { parseList } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import {
  formatDate,
  getPendingTodayReminder,
  standardReminderScript
} from "@/lib/reminders";

export const dynamic = "force-dynamic";

export default async function TodayRemindersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      visits: { orderBy: { createdAt: "desc" } },
      followups: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { updatedAt: "desc" }
  });

  const reminders = customers
    .map((customer) => {
      const latestFollowup = customer.followups[0];
      const reminder = getPendingTodayReminder(customer.visits, latestFollowup);
      if (!reminder) return null;

      return {
        customer,
        latestOnsiteVisit: reminder.latestOnsiteVisit,
        baseDate: reminder.baseDate,
        reminder,
        latestFollowup
      };
    })
    .filter(Boolean);

  return (
    <div className="crm-shell">
      <section className="crm-card">
        <Link className="text-sm font-medium text-blue-600" href="/">
          返回首页
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">今日待回访客户</h1>
        <p className="mt-2 text-sm text-zinc-500">共 {reminders.length} 组客户需要跟进。</p>
      </section>

      <div className="grid gap-3">
        {reminders.map((item) => {
          if (!item) return null;
          const focusPoints = parseList(item.customer.focusPoints);
          const concerns = parseList(item.customer.concerns);

          return (
            <article className="crm-card" key={item.customer.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link className="text-lg font-semibold text-zinc-950" href={`/customers/${item.customer.id}`}>
                    {item.customer.name || "未命名客户"}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">
                    最近现场：{item.latestOnsiteVisit.visitTime || formatDate(item.baseDate)}
                  </p>
                </div>
                <span className="crm-badge-red">
                  今日待回访
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="crm-badge-blue">
                  {item.reminder.label}
                </span>
                {item.customer.budget ? <span className="crm-badge">{item.customer.budget}</span> : null}
                {focusPoints.length ? <span className="crm-badge">{focusPoints.join("、")}</span> : null}
              </div>

              <details className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-blue-700">查看 AI 跟进建议</summary>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
                  <p>抗性：{concerns.join("、") || "未填写"}</p>
                  <p className="rounded-xl bg-white p-3">
                  {standardReminderScript(item.customer.name, {
                    budget: item.customer.budget,
                    focusPoints,
                    concerns,
                    summary: item.customer.summary
                  })}
                  </p>
                </div>
              </details>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MarkFollowupDoneButton followupId={item.latestFollowup?.id} />
                <Link className="crm-btn-primary py-2 text-center" href={`/customers/${item.customer.id}#followup`}>
                  新增跟进
                </Link>
                <Link className="crm-btn-secondary py-2 text-center" href={`/customers/${item.customer.id}`}>
                  查看客户
                </Link>
              </div>
            </article>
          );
        })}

        {reminders.length === 0 ? (
          <div className="crm-card px-4 py-10 text-center text-sm text-zinc-500">
            今天暂无待回访客户。
          </div>
        ) : null}
      </div>
    </div>
  );
}
