import type { Metadata, Viewport } from "next";
import Link from "next/link";
import HomeShortcut from "@/components/home-shortcut";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "阿广的外挂",
  description: "房产销售专属 AI 客户管理系统"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen pb-24 sm:pb-0">
          <header className="sticky top-0 z-20 hidden border-b border-zinc-200 bg-white/90 backdrop-blur sm:block">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <Link href="/" className="text-base font-semibold text-zinc-950 sm:text-lg">
                阿广的外挂
              </Link>
              <nav className="grid w-full grid-cols-2 gap-2 text-center text-sm sm:w-auto sm:flex sm:items-center">
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50" href="/">
                  首页
                </Link>
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50" href="/quick-note">
                  快速补充
                </Link>
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50" href="/reminders">
                  回访提醒
                </Link>
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50" href="/customers">
                  客户列表
                </Link>
                <Link className="rounded-xl border border-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-50" href="/knowledge">
                  知识库
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-6">{children}</main>
          <HomeShortcut />
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}

