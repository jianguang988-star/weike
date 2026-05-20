import Link from "next/link";
import { notFound } from "next/navigation";
import CustomerEditForm, { type CustomerEditInitialData } from "@/components/customer-edit-form";
import { listToText } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function value(value: string | null | undefined) {
  return value ?? "";
}

export default async function CustomerEditPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      visits: { orderBy: { createdAt: "desc" }, take: 1 },
      followups: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  if (!customer) notFound();

  const latestVisit = customer.visits[0];
  const latestFollowup = customer.followups[0];

  const initialData: CustomerEditInitialData = {
    id: customer.id,
    name: value(customer.name),
    phone: value(customer.phone),
    wechat: value(customer.wechat),
    source: value(customer.source),
    agentName: value(customer.agentName),
    agentStore: value(customer.agentStore),
    budget: value(customer.budget),
    preferredUnits: listToText(customer.preferredUnits),
    concerns: listToText(customer.concerns),
    focusPoints: listToText(customer.focusPoints),
    intentionLevel: value(customer.intentionLevel),
    summary: value(customer.summary),
    visitId: latestVisit?.id ?? null,
    visitTime: value(latestVisit?.visitTime),
    visitType: value(latestVisit?.visitType),
    visitContent: value(latestVisit?.content),
    followupId: latestFollowup?.id ?? null,
    recommendedTime: value(latestFollowup?.recommendedTime),
    priority: value(latestFollowup?.priority),
    keyPoint: value(latestFollowup?.keyPoint),
    script: value(latestFollowup?.script),
    status: value(latestFollowup?.status) || "pending"
  };

  return (
    <div className="crm-shell">
      <section className="crm-card">
        <Link className="text-sm font-medium text-blue-600" href={`/customers/${customer.id}`}>
          返回客户详情
        </Link>
        <p className="crm-label mt-4">编辑客户</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{customer.name || "未命名客户"}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">修正客户档案、最近到访记录和跟进计划。</p>
      </section>
      <CustomerEditForm initialData={initialData} />
    </div>
  );
}
