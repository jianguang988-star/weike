"use client";

import { useMemo, useState } from "react";
import CopyButton from "@/components/copy-button";
import { scriptVariant } from "@/lib/customer-intelligence";

const directions = [
  { key: "natural", label: "更自然" },
  { key: "short", label: "更短" },
  { key: "pressure", label: "更有推进感" },
  { key: "revisit", label: "约复访" },
  { key: "price", label: "解决价格抗性" }
];

export default function ScriptVariantPanel({
  name,
  budget,
  focusPoints,
  concerns,
  summary,
  latestScript
}: {
  name?: string | null;
  budget?: string | null;
  focusPoints: string[];
  concerns: string[];
  summary?: string | null;
  latestScript?: string | null;
}) {
  const [direction, setDirection] = useState("natural");
  const text = useMemo(
    () => scriptVariant(direction, { name, budget, focusPoints, concerns, summary, latestScript }),
    [budget, concerns, direction, focusPoints, latestScript, name, summary]
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <p className="crm-label">一键重写方向</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {directions.map((item) => (
          <button
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium ${
              direction === item.key ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-600"
            }`}
            key={item.key}
            onClick={() => setDirection(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-3">
        <div className="mb-2 flex justify-end">
          <CopyButton text={text} label="复制这版" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700" />
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">{text}</p>
      </div>
    </div>
  );
}
