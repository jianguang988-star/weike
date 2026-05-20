import Link from "next/link";
import { createSalesMaterial, importSalesMaterialsFromFolder } from "./actions";
import { ensureSalesKnowledgeDefaults, materialTypes } from "@/lib/sales-knowledge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function displayAttachmentName(material: { title: string; fileName: string | null; fileUrl: string | null }) {
  const sourceName = material.fileName || material.fileUrl || "";
  const ext = sourceName.match(/\.[A-Za-z0-9]+(?:$|\?)/)?.[0]?.replace("?", "") || "";
  return `${material.title}${ext}`;
}

export default async function KnowledgePage({
  searchParams
}: {
  searchParams: { q?: string; type?: string; visibility?: string; imported?: string };
}) {
  await ensureSalesKnowledgeDefaults();
  const q = searchParams.q?.trim() ?? "";
  const type = searchParams.type?.trim() ?? "";
  const visibility = searchParams.visibility?.trim() ?? "";
  const imported = searchParams.imported?.trim() ?? "";

  const categories = await prisma.materialTagCategory.findMany({
    include: { tags: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" }
  });
  const materials = await prisma.salesMaterial.findMany({
    where: {
      status: "active",
      AND: [
        type ? { materialType: type } : {},
        visibility ? { visibility } : {},
        q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { summary: { contains: q } },
                { contentText: { contains: q } },
                { projectName: { contains: q } },
                { regionName: { contains: q } },
                { competitorName: { contains: q } }
              ]
            }
          : {}
      ]
    },
    include: {
      tags: {
        include: {
          tag: { include: { category: true } }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="crm-shell">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="crm-label">本地化销售知识库</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">材料沉淀与智能应对</h1>
          <p className="mt-2 text-sm text-zinc-500">统一管理竞品、区域、说辞、异议和可转发图文材料。</p>
        </div>
        <Link className="crm-btn-secondary text-center" href="/customers">
          返回客户列表
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-4">
        <form action={createSalesMaterial} className="crm-card" encType="multipart/form-data">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="crm-title">上传材料</h2>
              <p className="mt-1 text-sm text-zinc-500">只选择文件即可，DeepSeek 会自动生成标题、摘要、类型和标签。</p>
            </div>
            <span className="crm-badge-blue">AI 自动归类</span>
          </div>

          <div className="mt-4 grid gap-3">
            <input className="crm-input" name="file" type="file" required />
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
              PDF、Word、PPT 会先在本地抽取正文，图片会先交给火山方舟 / 豆包视觉理解提取画面文字和卖点，最后统一交给 DeepSeek 自动分类。AI 失败时会自动退回本地关键词分类，不会中断上传。
            </div>
          </div>

          <details className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">需要时手动修正</summary>
            <div className="mt-3 grid gap-3">
              <input className="crm-input" name="title" placeholder="可选：覆盖 AI 标题" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="crm-input" name="materialType" defaultValue="">
                  <option value="">AI 判断材料类型</option>
                  {materialTypes.map((item) => (
                    <option value={item.code} key={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select className="crm-input" name="visibility" defaultValue="">
                  <option value="">AI 判断可见范围</option>
                  <option value="internal">内部参考</option>
                  <option value="customer_shareable">可发客户</option>
                  <option value="manager_only">仅管理者</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="crm-input" name="projectName" placeholder="可选：适用项目" />
                <input className="crm-input" name="regionName" placeholder="可选：适用区域" />
                <input className="crm-input" name="competitorName" placeholder="可选：关联竞品" />
              </div>
              <textarea className="crm-textarea min-h-[84px] text-sm" name="description" placeholder="可选：覆盖材料描述" />
              <textarea className="crm-textarea min-h-[120px] text-sm" name="summary" placeholder="可选：覆盖材料摘要" />
              <textarea className="crm-textarea min-h-[96px] text-sm" name="contentText" placeholder="可选：补充正文关键内容，帮助 AI 分类" />
            </div>

            <div className="mt-5 grid gap-4">
              {categories.map((category) => (
                <fieldset className="rounded-xl border border-zinc-200 bg-white p-3" key={category.id}>
                  <legend className="px-1 text-sm font-semibold text-zinc-800">{category.name}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {category.tags.map((tag) => (
                      <label className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700" key={tag.id}>
                        <input className="sr-only" name="tagIds" type="checkbox" value={tag.id} />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </details>

          <button className="crm-btn-primary mt-5 w-full" type="submit">
            上传并自动归类
          </button>
        </form>

        <form action={importSalesMaterialsFromFolder} className="crm-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="crm-title">本地文件夹批量导入</h2>
              <p className="mt-1 text-sm text-zinc-500">填写电脑里的文件夹路径，系统会复制材料并按文件名、目录名自动归类。</p>
            </div>
            <span className="crm-badge-blue">自动归类</span>
          </div>
          <div className="mt-4 grid gap-3">
            <input className="crm-input" name="folderPath" placeholder="例如：D:\楼盘资料\城东新区" />
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input className="h-4 w-4 rounded border-zinc-300" name="recursive" type="checkbox" defaultChecked />
              包含子文件夹
            </label>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              支持一键导入 PPT、PDF、Word、图片、txt、md 等文件。系统会先本地抽取正文，图片走豆包视觉理解，再统一交给 DeepSeek 自动分类和打标签。
            </div>
          </div>
          <button className="crm-btn-secondary mt-4 w-full" type="submit">
            扫描并导入
          </button>
        </form>
        </div>

        <section className="crm-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="crm-title">材料检索</h2>
            <span className="crm-badge">{materials.length} 份</span>
          </div>
          {imported ? (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              已批量导入 {imported} 份材料。
            </div>
          ) : null}
          <form className="mt-4 grid gap-2 lg:grid-cols-[1fr_150px_120px_auto]">
            <input className="crm-input" name="q" placeholder="搜索标题、摘要、项目、区域、竞品" defaultValue={q} />
            <select className="crm-input" name="type" defaultValue={type}>
              <option value="">全部类型</option>
              {materialTypes.map((item) => (
                <option value={item.code} key={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            <select className="crm-input" name="visibility" defaultValue={visibility}>
              <option value="">全部权限</option>
              <option value="internal">内部</option>
              <option value="customer_shareable">可发客户</option>
              <option value="manager_only">管理者</option>
            </select>
            <button className="crm-btn-secondary" type="submit">
              检索
            </button>
          </form>

          <div className="mt-4 grid gap-3">
            {materials.map((material) => (
              <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4" key={material.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-950">{material.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {materialTypes.find((item) => item.code === material.materialType)?.name || material.materialType}
                      {material.projectName ? ` / ${material.projectName}` : ""}
                      {material.regionName ? ` / ${material.regionName}` : ""}
                      {material.competitorName ? ` / ${material.competitorName}` : ""}
                    </p>
                  </div>
                  <span className={material.visibility === "customer_shareable" ? "crm-badge-blue" : "crm-badge"}>
                    {material.visibility === "customer_shareable" ? "可发客户" : "内部参考"}
                  </span>
                </div>
                <p className="summary-clamp mt-3 text-sm leading-6 text-zinc-700">{material.summary || material.description || "暂无摘要"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {material.tags.map((item) => (
                    <span className="crm-badge" key={item.id}>
                      {item.tag.name}
                    </span>
                  ))}
                </div>
                {material.fileUrl ? (
                  <a className="mt-3 inline-flex text-sm font-medium text-blue-600" href={material.fileUrl} target="_blank">
                    查看附件：{displayAttachmentName(material)}
                  </a>
                ) : null}
              </article>
            ))}
            {materials.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">暂无材料，先上传一份竞品或异议材料。</p> : null}
          </div>
        </section>
      </section>
    </div>
  );
}
