import Link from "next/link";
import MarkFollowupDoneButton from "@/components/mark-followup-done-button";
import { prisma } from "@/lib/prisma";
import {
  formatDate,
  getFirstOnsiteVisit,
  getLatestOnsiteVisit,
  getNextStandardReminder,
  getReminderState,
  getVisitBaseDate,
  standardReminderScript
} from "@/lib/reminders";
import { parseList } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      visits: { orderBy: { createdAt: "asc" } },
      followups: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { updatedAt: "desc" }
  });

  const reminders = customers
    .map((customer) => {
      const firstVisit = getFirstOnsiteVisit(customer.visits);
      const latestOnsiteVisit = getLatestOnsiteVisit(customer.visits);
      if (!firstVisit || !latestOnsiteVisit) return null;
      const latestFollowup = customer.followups[0];
      if (latestFollowup?.status === "done") return null;

      const baseDate = getVisitBaseDate(latestOnsiteVisit);
      const nextReminder = getNextStandardReminder(baseDate);
      if (!nextReminder) return null;

      return {
        customer,
        firstVisit,
        latestOnsiteVisit,
        firstBaseDate: getVisitBaseDate(firstVisit),
        baseDate,
        dueDate: nextReminder.dueDate,
        label: nextReminder.label,
        state: getReminderState(nextReminder.dueDate),
        latestFollowup
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.dueDate.getTime() - b!.dueDate.getTime());
  const overdueReminders = reminders.filter((item) => item?.state.startsWith("已逾期"));
  const todayReminders = reminders.filter((item) => item?.state === "今天回访");
  const upcomingReminders = reminders.filter((item) => item && !item.state.startsWith("已逾期") && item.state !== "今天回访");
  const groups = [
    { title: "已逾期", items: overdueReminders },
    { title: "今天必须跟", items: todayReminders },
    { title: "接下来要跟", items: upcomingReminders }
  ];

  return (
    <div className="crm-shell">
      <section className="crm-card">
        <p className="crm-label">回访提醒</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">今天先跟谁，一眼看清</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          标准节奏：来访当天、第3天、第7天、第15天、第30天、第49天；满49天后每月一次。
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">全部提醒</p>
            <p className="mt-1 text-xl font-semibold text-zinc-950">{reminders.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">今天</p>
            <p className="mt-1 text-xl font-semibold text-zinc-950">{todayReminders.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">逾期</p>
            <p className="mt-1 text-xl font-semibold text-zinc-950">{overdueReminders.length}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        {groups.map((group) =>
          group.items.length > 0 ? (
            <section className="grid gap-3" key={group.title}>
              <h2 className="px-1 text-base font-semibold text-zinc-950">{group.title}</h2>
              {group.items.map((item) => {
                if (!item) return null;
                const focusPoints = parseList(item.customer.focusPoints);
                const concerns = parseList(item.customer.concerns);
                const stateClass =
                  item.state.startsWith("已逾期")
                    ? "bg-red-50 text-red-600"
                    : item.state === "今天回访"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-600";

                return (
                  <article className="crm-card" key={item.customer.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link className="text-lg font-semibold text-zinc-950" href={`/customers/${item.customer.id}`}>
                    {item.customer.name || "未命名客户"}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">
                    首次来访：{item.firstVisit.visitTime || formatDate(item.firstBaseDate)}
                    {item.latestOnsiteVisit.id !== item.firstVisit.id
                      ? ` / 最近现场：${item.latestOnsiteVisit.visitTime || formatDate(item.baseDate)}`
                      : ""}
                  </p>
                </div>
                <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${stateClass}`}>
                  {item.state}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="crm-label">提醒日期</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950">
                  {formatDate(item.dueDate)} / {item.state}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="crm-label">提醒节点</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-950">{item.label}</p>
                </div>
              </div>
              <details className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-blue-700">查看 AI 跟进建议</summary>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700">
                  <p>关注点：{focusPoints.join("、") || "未填写"}</p>
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
                  记录跟进
                </Link>
                <Link className="crm-btn-secondary py-2 text-center" href={`/customers/${item.customer.id}`}>
                  客户详情
                </Link>
              </div>
            </article>
                );
              })}
            </section>
          ) : null
        )}

        {reminders.length === 0 ? (
          <div className="crm-card px-4 py-10 text-center text-sm text-zinc-500">
            暂无可计算的回访提醒。客户需要先有现场来访或复访记录。
          </div>
        ) : null}
      </div>
    </div>
  );
}
