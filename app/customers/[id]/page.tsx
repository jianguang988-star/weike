import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/copy-button";
import CustomerDetailActions from "@/components/customer-detail-actions";
import DealInsightCard from "@/components/deal-insight-card";
import DeleteCustomerButton from "@/components/delete-customer-button";
import FollowupHistoryToggle from "@/components/followup-history-toggle";
import FollowupCreateForm from "@/components/followup-create-form";
import GuideCommunicationForm from "@/components/guide-communication-form";
import InlineCustomerField from "@/components/inline-customer-field";
import RecordSummaryToggle from "@/components/record-summary-toggle";
import ScriptVariantPanel from "@/components/script-variant-panel";
import SalesKnowledgeRecommendations from "@/components/sales-knowledge-recommendations";
import { prisma } from "@/lib/prisma";
import { display, parseList } from "@/lib/format";
import { guideCommunicationScript } from "@/lib/customer-intelligence";
import { getFirstOnsiteVisit, getVisitBaseDate } from "@/lib/reminders";

export const dynamic = "force-dynamic";

function Section({ title, children, action, id }: { title: string; children: React.ReactNode; action?: React.ReactNode; id?: string }) {
  return (
    <section className="crm-card scroll-mt-24" id={id}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="crm-title">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CollapsibleSection({
  title,
  description,
  children,
  id
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <details className="crm-card scroll-mt-24 group" id={id}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="crm-title">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
        </div>
        <span className="shrink-0 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white group-open:hidden">
          展开
        </span>
        <span className="hidden shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 group-open:inline-flex">
          收起
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      visits: { orderBy: { createdAt: "desc" } },
      followups: { orderBy: { createdAt: "desc" } },
      rawNotes: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!customer) notFound();

  const latestFollowup = customer.followups[0];
  const latestRawNote = customer.rawNotes[0];
  const onsiteVisits = customer.visits.filter((visit) => visit.visitType === "来访" || visit.visitType === "复访" || visit.visitType === "到访");
  const onlineFollowups = customer.visits.filter((visit) => visit.visitType === "回访" || visit.visitType === "跟进记录");
  const guideNotes = customer.visits.filter((visit) => visit.visitType === "带看人沟通");
  const firstOnsiteVisit = getFirstOnsiteVisit(customer.visits);
  const toRecord = (visit: (typeof customer.visits)[number]) => ({
    id: visit.id,
    visitTime: visit.visitTime ?? "",
    visitType: visit.visitType ?? "",
    content: visit.content ?? "",
    createdAt: visit.createdAt.toLocaleString("zh-CN")
  });

  return (
    <div className="crm-shell pb-20 sm:pb-0">
      <section className="crm-card">
        <Link className="text-sm font-medium text-blue-600" href="/customers">
          返回客户列表
        </Link>
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-900">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xl font-semibold text-blue-700">
              {display(customer.name, "客").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{display(customer.name, "未命名客户")}</h1>
                <span className="crm-badge-blue">
                  {display(customer.intentionLevel, "无等级")}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                {customer.phone ? (
                  <a className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700" href={`tel:${customer.phone}`}>
                    打电话
                  </a>
                ) : (
                  <span>{display(customer.phone, "无电话")}</span>
                )}
                {customer.wechat ? (
                  <CopyButton text={customer.wechat} label="复制微信" className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700" />
                ) : (
                  <span>{display(customer.wechat, "无微信")}</span>
                )}
              </div>
              <p className="summary-clamp mt-3 text-sm leading-6 text-zinc-600">{display(customer.summary, "暂无客户摘要")}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link className="crm-btn-secondary py-2 text-center" href={`/customers/${customer.id}/edit`}>
              编辑
            </Link>
            <Link className="crm-btn-primary py-2 text-center" href="#followup">
              新增跟进
            </Link>
            <DeleteCustomerButton
              customerId={customer.id}
              customerName={customer.name}
              className="rounded-xl border border-red-100 bg-white px-3 py-2 text-sm text-red-600"
            />
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto border-b border-zinc-200 bg-white/95 px-4 py-2 text-sm shadow-sm backdrop-blur sm:top-[65px] sm:mx-0 sm:rounded-2xl sm:border sm:border-zinc-200">
        {[
          ["#insight", "判断"],
          ["#ai", "建议"],
          ["#knowledge", "知识库"],
          ["#followup", "跟进"],
          ["#records", "记录"],
          ["#profile", "档案"]
        ].map(([href, label]) => (
          <a className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 font-medium text-zinc-700" href={href} key={href}>
            {label}
          </a>
        ))}
      </nav>

      <div id="insight" className="scroll-mt-24">
        <DealInsightCard customer={customer} />
      </div>

      <section className="crm-card scroll-mt-24" id="ai">
        <div className="flex items-center justify-between gap-3">
          <h2 className="crm-title">AI 跟进建议</h2>
          <span className="crm-badge-blue">
            {display(latestFollowup?.priority, "未评级")}
          </span>
        </div>
        <div className="mt-4 grid gap-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="crm-label">推荐跟进时间</p>
            <p className="mt-1 text-sm font-medium text-zinc-950">{display(latestFollowup?.recommendedTime)}</p>
          </div>
          <div>
            <p className="crm-label">跟进核心关键点</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{display(latestFollowup?.keyPoint)}</p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="crm-label">话术生成结果</p>
              <CopyButton text={latestFollowup?.script} label="复制话术" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700" />
            </div>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-zinc-800">{display(latestFollowup?.script)}</p>
          </div>
          <ScriptVariantPanel
            budget={customer.budget}
            concerns={parseList(customer.concerns)}
            focusPoints={parseList(customer.focusPoints)}
            latestScript={latestFollowup?.script}
            name={customer.name}
            summary={customer.summary}
          />
        </div>
      </section>

      <SalesKnowledgeRecommendations customer={customer} />

      <Section title="记录本次跟进" id="followup">
        <FollowupCreateForm customerId={customer.id} />
      </Section>

      <CollapsibleSection
        title="带看人协同"
        description="记录你和带看人的沟通，或复制一段发给带看人的协同话术。"
      >
        <div className="grid gap-4">
          <GuideCommunicationForm customerId={customer.id} guideName={customer.agentName} />
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-blue-500">发给带看人的沟通话术</p>
              <CopyButton
                text={guideCommunicationScript({
                  customerName: customer.name,
                  guideName: customer.agentName,
                  keyPoint: latestFollowup?.keyPoint,
                  concerns: parseList(customer.concerns),
                  focusPoints: parseList(customer.focusPoints)
                })}
                label="复制"
                className="rounded-xl border border-blue-100 bg-white px-3 py-1.5 text-xs font-medium text-blue-700"
              />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
              {guideCommunicationScript({
                customerName: customer.name,
                guideName: customer.agentName,
                keyPoint: latestFollowup?.keyPoint,
                concerns: parseList(customer.concerns),
                focusPoints: parseList(customer.focusPoints)
              })}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <div id="records" className="scroll-mt-24">
        <RecordSummaryToggle
        customerId={customer.id}
        firstVisit={
          firstOnsiteVisit
            ? {
                ...toRecord(firstOnsiteVisit),
                visitTime: firstOnsiteVisit.visitTime || getVisitBaseDate(firstOnsiteVisit).toLocaleString("zh-CN")
              }
            : null
        }
        onsiteVisits={onsiteVisits.map(toRecord)}
        onlineFollowups={onlineFollowups.map(toRecord)}
        guideNotes={guideNotes.map(toRecord)}
      />
      </div>

      <FollowupHistoryToggle
        followups={customer.followups.map((followup) => ({
          id: followup.id,
          createdAt: followup.createdAt.toLocaleString("zh-CN"),
          recommendedTime: followup.recommendedTime ?? "",
          priority: followup.priority ?? "",
          status: followup.status ?? "",
          keyPoint: followup.keyPoint ?? ""
        }))}
      />

      <CollapsibleSection
        title="客户基础档案"
        id="profile"
        description="基础信息默认收起，需要修改时再展开。"
      >
        <div className="mb-4 flex justify-end">
          <Link
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
            href={`/customers/${customer.id}/edit`}
          >
            编辑完整档案
          </Link>
        </div>
        <dl className="grid gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <InlineCustomerField customerId={customer.id} label="姓名" name="name" value={customer.name} />
          <InlineCustomerField customerId={customer.id} label="电话" name="phone" value={customer.phone} />
          <InlineCustomerField customerId={customer.id} label="微信" name="wechat" value={customer.wechat} />
          <InlineCustomerField customerId={customer.id} label="带看人" name="agentName" value={customer.agentName} />
          <InlineCustomerField customerId={customer.id} label="带看人联系方式" name="agentStore" value={customer.agentStore} />
          <InlineCustomerField customerId={customer.id} label="预算" name="budget" value={customer.budget} />
          <InlineCustomerField customerId={customer.id} label="意向等级" name="intentionLevel" value={customer.intentionLevel} placeholder="A / B / C / D" />
          <InlineCustomerField customerId={customer.id} label="意向户型" name="preferredUnits" value={parseList(customer.preferredUnits).join("、")} />
          <InlineCustomerField customerId={customer.id} label="关注点" name="focusPoints" value={parseList(customer.focusPoints).join("、")} />
          <InlineCustomerField customerId={customer.id} label="抗性" name="concerns" value={parseList(customer.concerns).join("、")} />
          <InlineCustomerField customerId={customer.id} label="客户摘要" name="summary" value={customer.summary} multiline />
        </dl>
      </CollapsibleSection>

      <CollapsibleSection
        title="原始录入记录"
        description="保留最初输入和 AI 原始结果，平时不用展开。"
      >
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">{display(latestRawNote?.rawText)}</p>
        {latestRawNote ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-blue-600">查看 AI 原始 JSON</summary>
            <pre className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-6 text-zinc-700">
              {JSON.stringify(JSON.parse(latestRawNote.aiResultJson), null, 2)}
            </pre>
          </details>
        ) : null}
      </CollapsibleSection>

      <CustomerDetailActions customerId={customer.id} />
    </div>
  );
}
