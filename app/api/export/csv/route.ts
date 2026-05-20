import { NextResponse } from "next/server";
import { parseList } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      visits: { orderBy: { createdAt: "desc" }, take: 1 },
      followups: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { createdAt: "asc" }
  });

  const headers = [
    "客户姓名",
    "电话",
    "微信",
    "带看人",
    "带看人联系方式",
    "预算",
    "意向等级",
    "关注点",
    "抗性",
    "最近来访/跟进类型",
    "最近来访/跟进时间",
    "推荐跟进时间",
    "客户摘要"
  ];

  const rows = customers.map((customer) => {
    const visit = customer.visits[0];
    const followup = customer.followups[0];
    return [
      customer.name,
      customer.phone,
      customer.wechat,
      customer.agentName,
      customer.agentStore,
      customer.budget,
      customer.intentionLevel,
      parseList(customer.focusPoints).join("、"),
      parseList(customer.concerns).join("、"),
      visit?.visitType,
      visit?.visitTime,
      followup?.recommendedTime,
      customer.summary
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const body = `\uFEFF${csv}`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
