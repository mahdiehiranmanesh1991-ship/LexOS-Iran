"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { markNotificationsReadAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import type { AppNotification, Profile } from "@/lib/domain/types";
import { formatJalaliLong, relativeDayFa } from "@/lib/jalali";
import { cn } from "@/lib/utils";

export function Topbar({
  profile,
  notifications,
  todayFa,
}: {
  profile: Profile;
  notifications: AppNotification[];
  todayFa: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read_at);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur md:px-6 no-print">
      <form
        className="relative w-full max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/cases?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی پرونده، شماره بایگانی، خواسته…"
          className="input h-8.5 ps-8 text-xs"
        />
      </form>

      <div className="ms-auto flex items-center gap-2">
        <span className="hidden text-[0.7rem] font-medium text-muted lg:block">{todayFa}</span>

        <Dropdown>
          <DropdownTrigger asChild>
            <Link href="#" onClick={(e) => e.preventDefault()} className="relative">
              <Button variant="ghost" size="icon" aria-label="اعلان‌ها">
                <Bell className="h-4 w-4" />
              </Button>
              {unread.length > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.55rem] font-bold text-white">
                  {unread.length}
                </span>
              )}
            </Link>
          </DropdownTrigger>
          <DropdownContent className="w-80">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <p className="text-xs font-bold text-ink">اعلان‌ها</p>
              {unread.length > 0 && (
                <button
                  className="text-[0.65rem] text-accent hover:underline"
                  onClick={() => startTransition(() => markNotificationsReadAction())}
                >
                  خواندن همه
                </button>
              )}
            </div>
            <DropdownSeparator />
            {notifications.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted">اعلانی ندارید</p>
            )}
            {notifications.slice(0, 7).map((n) => (
              <DropdownItem
                key={n.id}
                onSelect={() => n.link && router.push(n.link)}
                className="items-start py-2"
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    n.read_at ? "bg-line-2" : "bg-accent",
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[0.72rem] font-semibold text-ink">
                    {n.title}
                  </span>
                  {n.body && (
                    <span className="mt-0.5 block truncate text-[0.65rem] text-muted">{n.body}</span>
                  )}
                  <span className="mt-0.5 block text-[0.6rem] text-faint">
                    {relativeDayFa(n.created_at)}
                  </span>
                </span>
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="primary" size="sm" className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              جدید
            </Button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem onSelect={() => router.push("/cases/new")}>پرونده جدید</DropdownItem>
            <DropdownItem onSelect={() => router.push("/documents?upload=1")}>
              بارگذاری سند / ابلاغیه
            </DropdownItem>
            <DropdownItem onSelect={() => router.push("/drafts/new")}>پیش‌نویس جدید</DropdownItem>
            <DropdownItem onSelect={() => router.push("/calendar?new=deadline")}>
              ثبت موعد قانونی
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        <div className="ms-1 hidden items-center gap-2 sm:flex">
          <div className="text-end leading-tight">
            <p className="text-[0.72rem] font-bold text-ink">{profile.full_name}</p>
            <p className="text-[0.6rem] text-muted">
              {profile.bar_license_no ? `پروانه ${profile.bar_license_no}` : "وکیل دادگستری"}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong ring-1 ring-accent-line">
            {profile.full_name.slice(0, 1)}
          </div>
        </div>
      </div>
    </header>
  );
}

export function todayBanner(): string {
  return formatJalaliLong(new Date(), { weekday: true });
}
