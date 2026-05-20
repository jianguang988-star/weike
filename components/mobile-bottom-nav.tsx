"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "首页", mark: "home" },
  { href: "/customers", label: "客户", mark: "user" },
  { href: "/quick-note", label: "补充", mark: "plus" },
  { href: "/reminders", label: "提醒", mark: "bell" }
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-zinc-200 bg-white/95 px-2 pt-2 text-center text-xs text-zinc-500 shadow-[0_-8px_24px_rgba(24,24,27,0.08)] backdrop-blur sm:hidden">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            className="rounded-xl px-2 py-1.5 active:bg-blue-50"
            data-active={active}
            href={item.href}
            key={item.href}
          >
            <span className={`mx-auto mb-1 block h-6 w-6 ${item.mark}`} aria-hidden="true" />
            <span className={active ? "font-medium text-blue-600" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
