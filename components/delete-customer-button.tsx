"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCustomerButton({
  customerId,
  customerName,
  className = ""
}: {
  customerId: number;
  customerName?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const name = customerName?.trim() || "未命名客户";
    const typed = window.prompt(`删除后无法恢复。请输入客户姓名确认删除：${name}`);
    if (typed !== name) {
      alert("客户姓名不一致，已取消删除。");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "删除失败");
      }

      router.push("/customers");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      className={className || "rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"}
      disabled={deleting}
      onClick={handleDelete}
      type="button"
    >
      {deleting ? "删除中..." : "删除"}
    </button>
  );
}
