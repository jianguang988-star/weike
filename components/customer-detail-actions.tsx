"use client";

import Link from "next/link";
import { useState } from "react";
import FollowupCreateForm from "@/components/followup-create-form";

export default function CustomerDetailActions({ customerId }: { customerId: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-[72px] left-4 right-4 z-20 grid grid-cols-[1fr_1.45fr] gap-2 sm:hidden">
        <Link className="block rounded-xl border border-zinc-200 bg-white px-5 py-4 text-center text-base font-semibold text-zinc-800 shadow-lg" href={`/customers/${customerId}/edit`}>
          编辑档案
        </Link>
        <button className="block rounded-xl bg-zinc-950 px-5 py-4 text-center text-base font-semibold text-white shadow-lg" onClick={() => setOpen(true)} type="button">
          新增跟进
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 bg-zinc-950/40 px-4 py-8 backdrop-blur-sm sm:hidden">
          <div className="mx-auto mt-16 max-h-[78vh] overflow-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="crm-title">新增跟进</h2>
              <button className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm" onClick={() => setOpen(false)} type="button">
                关闭
              </button>
            </div>
            <FollowupCreateForm customerId={customerId} onSaved={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
