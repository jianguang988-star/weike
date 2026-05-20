import { buildCustomerStage, buildCustomerWarning, buildDealInsight } from "@/lib/customer-intelligence";
import { parseList } from "@/lib/format";
import type { Customer, Followup, Visit } from "@prisma/client";

type CustomerWithRelations = Customer & {
  visits: Visit[];
  followups: Followup[];
};

const toneClass: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-zinc-100 text-zinc-600"
};

export default function DealInsightCard({ customer }: { customer: CustomerWithRelations }) {
  const insight = buildDealInsight(customer);
  const stage = buildCustomerStage(customer);
  const warning = buildCustomerWarning(customer);
  const focusPoints = parseList(customer.focusPoints);
  const concerns = parseList(customer.concerns);

  return (
    <section className="crm-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="crm-title">成交判断卡</h2>
          <p className="mt-1 text-sm text-zinc-500">打开客户先看这里，判断下一步怎么推。</p>
        </div>
        <div className="shrink-0 rounded-xl bg-zinc-950 px-4 py-2 text-center text-white">
          <p className="text-xs opacity-80">成交概率</p>
          <p className="text-xl font-semibold">{insight.score}%</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass[insight.resultTone] ?? toneClass.slate}`}>
            {insight.resultLabel}
          </span>
          <span className="crm-badge">
            {customer.intentionLevel || "无等级"}
          </span>
          <span className="crm-badge-blue">{stage}</span>
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs text-amber-700">{warning.label}</span>
          {customer.budget ? (
            <span className="crm-badge">{customer.budget}</span>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">最大购买动力</p>
            <p className="mt-1 text-sm leading-6 text-zinc-950">{insight.motivation}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">最大抗性</p>
            <p className="mt-1 text-sm leading-6 text-zinc-950">{insight.resistance}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 sm:col-span-2">
            <p className="text-xs text-blue-500">下一步突破口</p>
            <p className="mt-1 text-sm leading-6 text-zinc-950">{insight.breakthrough}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 sm:col-span-2">
            <p className="text-xs text-amber-600">决策人提示</p>
            <p className="mt-1 text-sm leading-6 text-zinc-950">{insight.decisionHint}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {focusPoints.map((item) => (
            <span className="rounded-full border border-blue-100 px-2.5 py-1 text-blue-600" key={`focus-${item}`}>
              {item}
            </span>
          ))}
          {concerns.map((item) => (
            <span className="rounded-full border border-red-100 px-2.5 py-1 text-red-500" key={`concern-${item}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
