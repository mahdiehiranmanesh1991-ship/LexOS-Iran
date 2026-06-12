"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  FolderOpen,
  LayoutDashboard,
  Library,
  PenLine,
  Scale,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "میز کار", icon: LayoutDashboard },
  { href: "/cases", label: "پرونده‌ها", icon: Scale },
  { href: "/calendar", label: "تقویم و مواعد", icon: CalendarDays },
  { href: "/documents", label: "اسناد", icon: FolderOpen },
  { href: "/ai", label: "دستیار هوشمند", icon: Bot },
  { href: "/drafts", label: "پیش‌نویس‌ها", icon: PenLine },
  { href: "/knowledge", label: "گنجینه دانش", icon: Library },
  { href: "/contacts", label: "مخاطبین", icon: Users },
] as const;

export function Sidebar({ demoMode }: { demoMode: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-56 flex-col border-e border-line bg-surface md:flex no-print">
      <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
          <Scale className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <p className="text-[0.85rem] font-extrabold tracking-tight text-ink">ایرانمنش</p>
          <p className="text-[0.62rem] font-medium text-muted">سیستم‌عامل حقوقی</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-medium transition-all",
              isActive(href)
                ? "bg-accent-soft text-accent-strong"
                : "text-ink-2 hover:bg-inset hover:text-ink",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                isActive(href) ? "text-accent" : "text-faint group-hover:text-ink-2",
              )}
              strokeWidth={2}
            />
            {label}
            {href === "/ai" && (
              <span className="ms-auto rounded-full bg-accent/10 px-1.5 text-[0.58rem] font-bold text-accent">
                AI
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="space-y-2 p-3">
        {demoMode && (
          <div className="rounded-xl border border-warn-line bg-warn-soft px-3 py-2.5">
            <p className="text-[0.7rem] font-bold text-warn">نسخه نمایشی</p>
            <p className="mt-0.5 text-[0.62rem] leading-5 text-warn/80">
              داده‌ها آزمایشی‌اند؛ برای استقرار کامل، Supabase و کلید AI را متصل کنید.
            </p>
          </div>
        )}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-accent-soft text-accent-strong"
              : "text-ink-2 hover:bg-inset hover:text-ink",
          )}
        >
          <Settings className="h-4 w-4 text-faint" strokeWidth={2} />
          تنظیمات
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 backdrop-blur md:hidden no-print">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.58rem] font-medium",
              active ? "text-accent-strong" : "text-muted",
            )}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export { NAV };
