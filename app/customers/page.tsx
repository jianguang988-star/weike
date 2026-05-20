import Link from "next/link";
import AiSuggestionToggle from "@/components/ai-suggestion-toggle";
import CopyButton from "@/components/copy-button";
import DeleteCustomerButton from "@/components/delete-customer-button";
import {
  buildCustomerStage,
  buildCustomerWarning,
  extractPhone,
  isLikelyPhone,
  matchesSemanticSearch
} from "@/lib/customer-intelligence";
import { prisma } from "@/lib/prisma";
import { display, parseList } from "@/lib/format";
import {
  formatDate,
  getFirstOnsiteVisit,
  getLatestOnsiteVisit,
  getLatestRevisit,
  getPendingNextReminder,
  getVisitBaseDate
} from "@/lib/reminders";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams
}: {
  searchParams: { q?: string; level?: string; priority?: string; guide?: string; view?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const level = searchParams.level?.trim() ?? "";
  const priority = searchParams.priority?.trim() ?? "";
  const guide = searchParams.guide?.trim() ?? "";
  const view = searchParams.view?.trim() ?? "";
  const allCustomersForCounts = await prisma.customer.findMany({
    select: { intentionLevel: true }
  });
  const customers = await prisma.customer.findMany({
    where: {
      AND: [
        level ? { intentionLevel: level } : {},
        priority ? { followups: { some: { priority } } } : {}
      ]
    },
    include: {
      visits: {
        orderBy: { createdAt: "asc" }
      },
      followups: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  const searchedCustomers = q ? customers.filter((customer) => matchesSemanticSearch(customer, q)) : customers;
  const guideFilteredCustomers = guide
    ? searchedCustomers.filter((customer) => `${customer.agentName ?? ""} ${customer.agentStore ?? ""}`.includes(guide))
    : searchedCustomers;
  const visibleCustomers = guideFilteredCustomers.filter((customer) => {
    const text = `${customer.budget ?? ""} ${customer.summary ?? ""} ${customer.focusPoints ?? ""} ${customer.concerns ?? ""}`;
    const stage = buildCustomerStage(customer);
    const warning = buildCustomerWarning(customer);
    if (view === "high") return customer.intentionLevel === "A" || customer.intentionLevel === "B";
    if (view === "price") return text.includes("价格") || text.includes("预算") || text.includes("首付") || text.includes("月供");
    if (view === "family") return stage === "家人决策";
    if (view === "sleep") return warning.label === "沉睡客户" || warning.label.includes("未跟");
    if (view === "guide-missing") return !customer.agentName && !customer.agentStore;
    return true;
  });
  const levelCounts = {
    A: allCustomersForCounts.filter((customer) => customer.intentionLevel === "A").length,
    B: allCustomersForCounts.filter((customer) => customer.intentionLevel === "B").length,
    C: allCustomersForCounts.filter((customer) => customer.intentionLevel === "C").length,
    D: allCustomersForCounts.filter((customer) => customer.intentionLevel === "D").length
  };
  const highIntentCount = levelCounts.A + levelCounts.B;
  const filteredWithoutVisitCount = visibleCustomers.filter((customer) => !getFirstOnsiteVisit(customer.visits)).length;
  const guideStats = Array.from(
    customers.reduce((map, customer) => {
      const name = customer.agentName?.trim() || "未填写带看人";
      const current = map.get(name) ?? { total: 0, high: 0, warning: 0, contact: customer.agentStore };
      current.total += 1;
      if (customer.intentionLevel === "A" || customer.intentionLevel === "B") current.high += 1;
      if (buildCustomerWarning(customer).urgent) current.warning += 1;
      if (!current.contact && customer.agentStore) current.contact = customer.agentStore;
      map.set(name, current);
      return map;
    }, new Map<string, { total: number; high: number; warning: number; contact?: string | null }>())
  ).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="crm-shell">
      <section className="crm-card">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="crm-label">客户档案</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">已录入客户</h1>
          </div>
          <Link className="crm-btn-primary py-2" href="/new-customer">
            新增
          </Link>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm">
          <Link className={`shrink-0 rounded-full border px-4 py-2 ${!level ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-700"}`} href="/customers">
            全部 {allCustomersForCounts.length}
          </Link>
          {(["A", "B", "C", "D"] as const).map((item) => (
            <Link
              className={`shrink-0 rounded-full border px-4 py-2 ${level === item ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-700"}`}
              href={`/customers?level=${item}`}
              key={item}
            >
              {item} 类 {levelCounts[item]}
            </Link>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm">
          {[
            ["", "全部视图"],
            ["high", "高意向"],
            ["price", "价格抗性"],
            ["family", "家人决策"],
            ["sleep", "沉睡/未跟"],
            ["guide-missing", "带看人未补"]
          ].map(([value, label]) => (
            <Link
              className={`shrink-0 rounded-full border px-4 py-2 ${view === value ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700"}`}
              href={value ? `/customers?view=${value}` : "/customers"}
              key={value || "all-view"}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">当前结果</p>
            <p className="mt-1 text-xl font-semibold text-zinc-950">{visibleCustomers.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">A/B 意向</p>
            <p className="mt-1 text-xl font-semibold text-zinc-950">{highIntentCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">待补来访</p>
            <p className="mt-1 text-xl font-semibold text-zinc-950">{filteredWithoutVisitCount}</p>
          </div>
        </div>
      </section>

      <form className="sticky top-0 z-10 grid gap-2 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:static lg:grid-cols-[1fr_120px_120px_150px_auto]">
        <input
          className="crm-input min-w-0 flex-1"
          name="q"
          placeholder="搜客户、电话，或输入：预算紧张、老婆不同意、约复访、孩子上学..."
          defaultValue={q}
        />
        <select
          className="crm-input"
          name="level"
          defaultValue={level}
        >
          <option value="">全部等级</option>
          <option value="A">A 类</option>
          <option value="B">B 类</option>
          <option value="C">C 类</option>
          <option value="D">D 类</option>
        </select>
        <select
          className="crm-input"
          name="priority"
          defaultValue={priority}
        >
          <option value="">全部优先级</option>
          <option value="高">高</option>
          <option value="中">中</option>
          <option value="低">低</option>
        </select>
        <input
          className="crm-input"
          name="guide"
          placeholder="按带看人筛选"
          defaultValue={guide}
        />
        <input name="view" type="hidden" value={view} />
        <button className="crm-btn-primary" type="submit">
          搜索
        </button>
      </form>

      <section className="crm-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="crm-title">带看人统计</h2>
          <span className="text-xs text-zinc-500">{guideStats.length} 组</span>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {guideStats.slice(0, 8).map(([name, stat]) => {
            const phone = extractPhone(stat.contact);
            return (
              <div className="min-w-[180px] rounded-xl border border-zinc-200 bg-zinc-50 p-3" key={name}>
                <Link className="font-semibold text-zinc-950" href={`/customers?guide=${encodeURIComponent(name)}`}>
                  {name}
                </Link>
                <p className="mt-2 text-xs text-zinc-500">客户 {stat.total} / A-B {stat.high} / 预警 {stat.warning}</p>
                <div className="mt-3 flex gap-2">
                  {phone ? (
                    <a className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700" href={`tel:${phone}`}>
                      拨打
                    </a>
                  ) : null}
                  {stat.contact ? (
                    <CopyButton text={stat.contact} label={isLikelyPhone(stat.contact) ? "复制号码" : "复制联系方式"} className="rounded-full bg-white px-3 py-1.5 text-xs text-blue-600" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 md:hidden">
        {visibleCustomers.map((customer) => {
          const latestFollowup = customer.followups[0];
          const focusPoints = parseList(customer.focusPoints).join("、") || "未填写";
          const concerns = parseList(customer.concerns).join("、") || "未填写";
          const firstVisit = getFirstOnsiteVisit(customer.visits);
          const latestRevisit = getLatestRevisit(customer.visits);
          const nextReminder = getPendingNextReminder(customer.visits, latestFollowup);
          const stage = buildCustomerStage(customer);
          const warning = buildCustomerWarning(customer);
          const warningClass =
            warning.tone === "red"
              ? "bg-red-50 text-red-600"
              : warning.tone === "amber"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700";

          return (
            <article className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(24,24,27,0.04)]" key={customer.id}>
              <div className="absolute right-0 top-0 rounded-bl-xl border-b border-l border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                {firstVisit ? "来访" : "待补访"}
              </div>
              <div className="flex items-start gap-3 pr-14">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-semibold text-blue-700">
                  {display(customer.name, "客").slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link className="text-lg font-semibold text-zinc-950" href={`/customers/${customer.id}`}>
                      {display(customer.name, "未命名客户")}
                    </Link>
                    <span className="crm-badge-blue">
                      {display(customer.intentionLevel, "无等级")}
                    </span>
                    <span className="crm-badge">
                      {stage}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm leading-5 text-zinc-600">
                    {customer.phone ? (
                      <a className="font-medium text-zinc-800" href={`tel:${customer.phone}`}>
                        {customer.phone}
                      </a>
                    ) : (
                      <span>无电话</span>
                    )}
                    {customer.wechat ? <CopyButton text={customer.wechat} label="复制微信" className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600" /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">微信：{display(customer.wechat, "未填写")}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    带看人：{display(customer.agentName, "未填写")}
                    {customer.agentStore ? (
                      <CopyButton text={customer.agentStore} label="复制联系方式" className="ml-2 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600" />
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="crm-badge-blue">
                  到访 {firstVisit ? "1+" : "0"} 次
                </span>
                {customer.budget ? <span className="crm-badge">{customer.budget}</span> : null}
                {focusPoints !== "未填写" ? <span className="crm-badge">{focusPoints}</span> : null}
                <span className={`rounded-full px-2.5 py-1 text-xs ${warningClass}`}>{warning.label}</span>
              </div>

              <details className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
                <summary className="cursor-pointer font-medium text-zinc-700">查看客户细节</summary>
                <div className="mt-3 grid gap-2">
                  <p>
                    <span className="text-zinc-500">客户抗性：</span>
                    {concerns}
                  </p>
                  <p>
                    <span className="text-zinc-500">最新跟进：</span>
                    {display(latestFollowup?.recommendedTime)}
                  </p>
                  <p>
                    <span className="text-zinc-500">首次来访：</span>
                    {firstVisit ? display(firstVisit.visitTime, formatDate(getVisitBaseDate(firstVisit))) : "未记录"}
                  </p>
                  <p>
                    <span className="text-zinc-500">最近复访：</span>
                    {latestRevisit ? display(latestRevisit.visitTime, formatDate(getVisitBaseDate(latestRevisit))) : "未记录"}
                  </p>
                  <p>
                    <span className="text-zinc-500">标准提醒：</span>
                    {nextReminder ? `${formatDate(nextReminder.dueDate)} / ${nextReminder.state}` : "未生成"}
                  </p>
                </div>
              </details>

              <AiSuggestionToggle
                customerName={customer.name}
                guideName={customer.agentName}
                keyPoint={latestFollowup?.keyPoint}
                priority={latestFollowup?.priority}
                recommendedTime={latestFollowup?.recommendedTime}
                script={latestFollowup?.script}
              />

              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-zinc-100 pt-3">
                {customer.phone ? (
                  <a className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700" href={`tel:${customer.phone}`}>
                    电话
                  </a>
                ) : (
                  <span className="rounded-xl border border-zinc-100 px-3 py-2 text-center text-sm text-zinc-300">电话</span>
                )}
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-center text-sm hover:bg-zinc-50" href={`/customers/${customer.id}`}>
                  详情
                </Link>
                <Link className="rounded-xl bg-zinc-950 px-3 py-2 text-center text-sm font-medium text-white shadow-sm" href={`/customers/${customer.id}#followup`}>
                  跟进
                </Link>
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-center text-sm hover:bg-zinc-50" href={`/customers/${customer.id}/edit`}>
                  编辑
                </Link>
              </div>
            </article>
          );
        })}
        {visibleCustomers.length === 0 ? (
          <div className="crm-card px-4 py-10 text-center text-sm text-zinc-500">
            暂无客户数据
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)] md:block">
        <div className="overflow-x-auto">
          <table className="crm-desktop-table min-w-[1520px] divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">客户姓名</th>
                <th className="px-4 py-3 font-medium">带看人</th>
                <th className="px-4 py-3 font-medium">带看人联系方式</th>
                <th className="px-4 py-3 font-medium">意向等级</th>
                <th className="px-4 py-3 font-medium">预算</th>
                <th className="px-4 py-3 font-medium">关注点</th>
                <th className="px-4 py-3 font-medium">抗性</th>
                <th className="px-4 py-3 font-medium">首次来访</th>
                <th className="px-4 py-3 font-medium">最近复访</th>
                <th className="px-4 py-3 font-medium">最近跟进时间</th>
                <th className="px-4 py-3 font-medium">标准回访提醒</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {visibleCustomers.map((customer) => {
                const latestFollowup = customer.followups[0];
                const firstVisit = getFirstOnsiteVisit(customer.visits);
                const latestRevisit = getLatestRevisit(customer.visits);
                const nextReminder = getPendingNextReminder(customer.visits, latestFollowup);
                return (
                  <tr key={customer.id} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link className="font-medium text-blue-600" href={`/customers/${customer.id}`}>
                        {display(customer.name, "未命名客户")}
                      </Link>
                      <div className="mt-1 text-xs text-zinc-500">
                        {display(customer.phone, "无电话")} / {display(customer.wechat, "无微信")}
                      </div>
                    </td>
                    <td className="px-4 py-3">{display(customer.agentName)}</td>
                    <td className="px-4 py-3">{display(customer.agentStore)}</td>
                    <td className="px-4 py-3">{display(customer.intentionLevel)}</td>
                    <td className="px-4 py-3">{display(customer.budget)}</td>
                    <td className="px-4 py-3">{parseList(customer.focusPoints).join("、") || "未填写"}</td>
                    <td className="px-4 py-3">{parseList(customer.concerns).join("、") || "未填写"}</td>
                    <td className="px-4 py-3">
                      {firstVisit ? display(firstVisit.visitTime, formatDate(getVisitBaseDate(firstVisit))) : "未记录"}
                    </td>
                    <td className="px-4 py-3">
                      {latestRevisit ? display(latestRevisit.visitTime, formatDate(getVisitBaseDate(latestRevisit))) : "未记录"}
                    </td>
                    <td className="px-4 py-3">{display(latestFollowup?.recommendedTime)}</td>
                    <td className="px-4 py-3">
                      {nextReminder ? (
                        <div>
                          <div>{formatDate(nextReminder.dueDate)}</div>
                          <div className="text-xs text-zinc-500">{nextReminder.label} / {nextReminder.state}</div>
                        </div>
                      ) : (
                        "未生成"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link className="mr-3 text-blue-600" href={`/customers/${customer.id}/edit`}>
                        编辑
                      </Link>
                      <DeleteCustomerButton customerId={customer.id} customerName={customer.name} className="text-sm text-red-600" />
                    </td>
                  </tr>
                );
              })}
              {visibleCustomers.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-zinc-500" colSpan={12}>
                    暂无客户数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
