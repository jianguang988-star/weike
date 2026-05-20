"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomeShortcut() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link
      aria-label="返回首页"
      className="fixed bottom-[132px] right-4 z-30 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-4 py-3 text-sm font-semibold text-zinc-900 shadow-[0_10px_30px_rgba(24,24,27,0.16)] backdrop-blur active:scale-[0.98] sm:hidden"
      href="/"
    >
      <span className="home block h-5 w-5" aria-hidden="true" />
      首页
    </Link>
  );
}
