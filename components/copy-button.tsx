"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label = "复制",
  copiedLabel = "已复制",
  className = ""
}: {
  text?: string | null;
  label?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("复制下面内容", text);
    }
  }

  return (
    <button
      className={className || "rounded-full bg-white px-3 py-1.5 text-xs font-medium text-blue-600"}
      disabled={!text}
      onClick={handleCopy}
      type="button"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
