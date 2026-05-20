"use client";

import { useState } from "react";
import CopyButton from "@/components/copy-button";
import { guideCommunicationScript } from "@/lib/customer-intelligence";

export default function AiSuggestionToggle({
  customerName,
  guideName,
  recommendedTime,
  keyPoint,
  script,
  priority
}: {
  customerName?: string | null;
  guideName?: string | null;
  recommendedTime?: string | null;
  keyPoint?: string | null;
  script?: string | null;
  priority?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const hasSuggestion = recommendedTime || keyPoint || script || priority;

  return (
    <div className="mt-4">
      <button
        className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-left text-sm font-semibold text-blue-700 active:bg-blue-100"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>AI 跟客建议</span>
        <span className={`text-lg leading-none transition ${open ? "rotate-90" : ""}`}>›</span>
      </button>

      {open ? (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm shadow-sm">
          {hasSuggestion ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                  优先级：{priority || "未评级"}
                </span>
                <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600">
                  建议：{recommendedTime || "待生成"}
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-500">内部突破口</p>
                <p className="mt-1 whitespace-pre-wrap leading-6 text-zinc-800">{keyPoint || "暂无跟进重点"}</p>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-zinc-500">可直接发给客户的话术</p>
                  <CopyButton text={script} label="复制话术" />
                </div>
                <p className="mt-1 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-3 leading-6 text-zinc-800">
                  {script || "暂无话术"}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-zinc-500">发给带看人的沟通话术</p>
                  <CopyButton
                    text={guideCommunicationScript({ customerName, guideName, keyPoint })}
                    label="复制"
                  />
                </div>
                <p className="mt-1 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-white p-3 leading-6 text-zinc-800">
                  {guideCommunicationScript({ customerName, guideName, keyPoint })}
                </p>
              </div>
            </div>
          ) : (
            <p className="leading-6 text-zinc-600">这个客户暂时还没有 AI 跟进建议。可以先进入详情页新增一次跟进，让系统生成新的建议。</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
