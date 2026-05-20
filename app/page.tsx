import Link from "next/link";
import BackupReminder from "@/components/backup-reminder";
import { prisma } from "@/lib/prisma";
import { buildCustomerStage, buildCustomerWarning } from "@/lib/customer-intelligence";
import { display } from "@/lib/format";
import {
  getLatestOnsiteVisit,
  getNextStandardReminder,
  getReminderState,
  getStandardReminderForDate,
  getVisitBaseDate
} from "@/lib/reminders";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const customers = await prisma.customer.findMany({
    include: {
      visits: true,
      followups: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  const todayReminderCount = customers.filter((customer) => {
    const latestOnsiteVisit = getLatestOnsiteVisit(customer.visits);
    return latestOnsiteVisit ? Boolean(getStandardReminderForDate(getVisitBaseDate(latestOnsiteVisit))) : false;
  }).length;
  const reminderItems = customers
    .map((customer) => {
      const latestOnsiteVisit = getLatestOnsiteVisit(customer.visits);
      if (!latestOnsiteVisit) return null;
      const nextReminder = getNextStandardReminder(getVisitBaseDate(latestOnsiteVisit));
      return nextReminder ? { customer, dueDate: nextReminder.dueDate, state: getReminderState(nextReminder.dueDate) } : null;
    })
    .filter(Boolean);
  const overdueCount = reminderItems.filter((item) => item?.state.startsWith("已逾期")).length;
  const highIntentCustomers = customers.filter((customer) => customer.intentionLevel === "A" || customer.intentionLevel === "B");
  const warningCustomers = customers.filter((customer) => buildCustomerWarning(customer).urgent);
  const recentCustomers = customers.slice(0, 5);

  return (
    <div className="crm-shell">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="crm-label">阿广的外挂</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            阿广的外挂
          </h1>
          <p className="mt-2 text-sm text-zinc-500">今日回访、重点客户、快速录入都在这里处理。</p>
        </div>
        <Link className="crm-btn-primary text-center" href="/new-customer">
          新增客户
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link className="crm-stat" href="/customers">
          <p className="crm-label">总客户</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{customers.length}</p>
          <p className="mt-1 text-xs text-zinc-500">已录入客户档案</p>
        </Link>
        <Link className="crm-stat relative overflow-hidden" href="/reminders/today">
          {todayReminderCount > 0 ? <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
          <p className="crm-label">今日待回访</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{todayReminderCount}</p>
          <p className="mt-1 text-xs text-zinc-500">按标准节奏触发</p>
        </Link>
        <Link className="crm-stat" href="/customers?level=A">
          <p className="crm-label">高意向客户</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{highIntentCustomers.length}</p>
          <p className="mt-1 text-xs text-emerald-600">A/B 类客户</p>
        </Link>
        <Link className="crm-stat" href="/reminders">
          <p className="crm-label">逾期未跟</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{overdueCount}</p>
          <p className="mt-1 text-xs text-red-600">需要优先处理</p>
        </Link>
      </section>

      <Link className="crm-card flex items-center justify-between gap-4" href="/reminders/today">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700">
            待
            {todayReminderCount > 0 ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" /> : null}
          </div>
          <div>
            <h2 className="font-semibold text-zinc-950">老客户回访提醒</h2>
            <p className="mt-1 text-sm text-zinc-500">查看今天需要跟进的全部客户</p>
          </div>
        </div>
        <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">{todayReminderCount}</span>
      </Link>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { href: "/quick-note", mark: "补", title: "快速补充", desc: "一句话更新客户", tone: "bg-blue-50 text-blue-700 border-blue-100" },
          { href: "/new-customer", mark: "新", title: "新增客户", desc: "AI 录入建档", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { href: "/customers", mark: "客", title: "客户列表", desc: "检索客户档案", tone: "bg-zinc-50 text-zinc-700 border-zinc-200" },
          { href: "/reminders", mark: "醒", title: "回访提醒", desc: "查看节奏安排", tone: "bg-amber-50 text-amber-700 border-amber-100" }
        ].map((item) => (
          <Link className="crm-card lg:col-span-1" href={item.href} key={item.href}>
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold ${item.tone}`}>
              {item.mark}
            </div>
            <h2 className="font-semibold text-zinc-950">{item.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
          </Link>
        ))}
        <a className="crm-card lg:col-span-1" href="/api/export/csv">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700">
            表
          </div>
          <h2 className="font-semibold text-zinc-950">导出 CSV</h2>
          <p className="mt-1 text-sm text-zinc-500">表格备份</p>
        </a>
        <a className="crm-card lg:col-span-1" href="/api/export/db">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700">
            库
          </div>
          <h2 className="font-semibold text-zinc-950">备份数据库</h2>
          <p className="mt-1 text-sm text-zinc-500">完整备份</p>
        </a>
      </section>

      <BackupReminder />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="crm-card">
          <div className="flex items-center justify-between">
            <h2 className="crm-title">客户预警</h2>
            <Link className="text-sm font-medium text-blue-600" href="/customers">
              处理
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {warningCustomers.slice(0, 3).map((customer) => {
              const warning = buildCustomerWarning(customer);
              return (
                <Link className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3" href={`/customers/${customer.id}`} key={customer.id}>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950">{display(customer.name, "未命名客户")}</p>
                    <p className="mt-1 text-xs text-zinc-500">{buildCustomerStage(customer)} / {display(customer.intentionLevel, "无等级")}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-red-600">{warning.label}</span>
                </Link>
              );
            })}
            {warningCustomers.length === 0 ? <p className="py-6 text-center text-sm text-zinc-500">暂无高风险客户</p> : null}
          </div>
        </section>

        <section className="crm-card">
          <div className="flex items-center justify-between">
            <h2 className="crm-title">重点客户</h2>
            <Link className="text-sm font-medium text-blue-600" href="/customers?level=A">
              查看
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {highIntentCustomers.slice(0, 3).map((customer) => {
              const latestFollowup = customer.followups[0];
              return (
                <Link className="rounded-xl border border-blue-100 bg-blue-50 p-3" href={`/customers/${customer.id}`} key={customer.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-zinc-950">{display(customer.name, "未命名客户")}</p>
                    <span className="crm-badge-blue">{display(customer.intentionLevel, "无等级")}</span>
                  </div>
                  <p className="summary-clamp mt-2 text-sm leading-6 text-zinc-600">
                    {display(latestFollowup?.keyPoint, customer.summary || "暂无跟进重点")}
                  </p>
                </Link>
              );
            })}
            {highIntentCustomers.length === 0 ? <p className="py-6 text-center text-sm text-zinc-500">暂无 A/B 类重点客户</p> : null}
          </div>
        </section>
      </div>

      <section className="crm-card">
        <div className="flex items-center justify-between">
          <h2 className="crm-title">最近客户</h2>
          <Link className="text-sm font-medium text-blue-600" href="/customers">
            全部
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentCustomers.map((customer) => {
            const latestFollowup = customer.followups[0];
            return (
              <Link className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3" href={`/customers/${customer.id}`} key={customer.id}>
                <div className="min-w-0">
                  <p className="font-medium text-zinc-950">{display(customer.name, "未命名客户")}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">{display(customer.phone, "无电话")} / {display(customer.wechat, "无微信")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="crm-badge-blue">{display(customer.intentionLevel, "无等级")}</span>
                  <p className="mt-1 max-w-[120px] truncate text-xs text-zinc-500">{display(latestFollowup?.recommendedTime, "无跟进")}</p>
                </div>
              </Link>
            );
          })}
          {customers.length === 0 ? <p className="py-6 text-center text-sm text-zinc-500 md:col-span-2">暂无客户</p> : null}
        </div>
      </section>
    </div>
  );
}

