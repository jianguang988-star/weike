import Link from "next/link";
import type { Customer, Followup, Visit } from "@prisma/client";
import CopyButton from "@/components/copy-button";
import { prisma } from "@/lib/prisma";
import {
  buildSalesResponseDraft,
  classifyRecommendationType,
  ensureSalesKnowledgeDefaults,
  inferCustomerKnowledgeContext,
  materialTypes,
  scoreMaterialForCustomer
} from "@/lib/sales-knowledge";

type CustomerWithRelations = Customer & {
  visits: Visit[];
  followups: Followup[];
};

const groupNames: Record<string, string> = {
  script: "应对说辞",
  shareable: "可发客户材料",
  asset: "PPT / 图片",
  internal: "内部参考",
  training: "培训材料"
};

export default async function SalesKnowledgeRecommendations({ customer }: { customer: CustomerWithRelations }) {
  await ensureSalesKnowledgeDefaults();
  const materials = await prisma.salesMaterial.findMany({
    where: { status: "active" },
    include: {
      tags: {
        include: {
          tag: { include: { category: true } }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  const context = inferCustomerKnowledgeContext(customer);
  const scored = materials
    .map((material) => ({ material, ...scoreMaterialForCustomer(material, customer), type: classifyRecommendationType(material) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const draft = buildSalesResponseDraft(
    customer,
    scored.slice(0, 4).map((item) => item.material)
  );
  const grouped = scored.reduce<Record<string, typeof scored>>((map, item) => {
    map[item.type] = [...(map[item.type] || []), item];
    return map;
  }, {});

  return (
    <details className="crm-card scroll-mt-24 group" id="knowledge">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <h2 className="crm-title">本地化知识推荐</h2>
          <p className="mt-1 text-sm text-zinc-500">按客户抗性、场景、跟进目标和材料标签自动匹配。</p>
        </div>
        <span className="shrink-0 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-semibold text-white group-open:hidden">
          展开
        </span>
        <span className="hidden shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 group-open:inline-flex">
          收起
        </span>
      </summary>

      <div className="mt-4 flex justify-end">
        <Link className="crm-btn-secondary py-2" href="/knowledge">
          管理材料
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="crm-label">识别抗性</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{context.resistanceCodes.length ? context.resistanceCodes.join(" / ") : "待补充"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="crm-label">当前场景</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{context.sceneCodes.length ? context.sceneCodes.join(" / ") : "常规跟进"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="crm-label">跟进目标</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{context.goalCodes.length ? context.goalCodes.join(" / ") : "维护关系"}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-blue-950">结合客户信息 + 材料摘要生成的应对说辞</h3>
          <CopyButton text={draft} label="复制" className="rounded-xl border border-blue-100 bg-white px-3 py-1.5 text-xs font-medium text-blue-700" />
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{draft}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {Object.entries(groupNames).map(([type, title]) => {
          const items = grouped[type] || [];
          if (!items.length) return null;

          return (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4" key={type}>
              <h3 className="font-semibold text-zinc-950">{title}</h3>
              <div className="mt-3 grid gap-3">
                {items.slice(0, 3).map(({ material, score, reason }) => (
                  <article className="rounded-xl border border-zinc-200 bg-white p-3" key={material.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-zinc-950">{material.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {materialTypes.find((item) => item.code === material.materialType)?.name || material.materialType}
                        </p>
                      </div>
                      <span className="crm-badge-blue">{score}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">{material.summary || material.description || "暂无摘要"}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">{reason}</p>
                    {material.fileUrl ? (
                      <a className="mt-2 inline-flex text-sm font-medium text-blue-600" href={material.fileUrl} target="_blank">
                        打开附件
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {scored.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">还没有可推荐材料。先去材料库上传竞品、区域对比或异议应对材料。</p>
          <Link className="mt-3 inline-flex text-sm font-medium text-blue-600" href="/knowledge">
            去上传材料
          </Link>
        </div>
      ) : null}
    </details>
  );
}
