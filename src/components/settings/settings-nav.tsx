"use client";

import {
  AlarmClockCheck,
  BadgeCheck,
  Bell,
  BrainCircuit,
  Building2,
  CreditCard,
  DatabaseBackup,
  FileStack,
  Library,
  type LucideIcon,
  PenLine,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  SETTINGS_GROUPS_FA,
  SETTINGS_SECTIONS,
  type SettingsGroup,
} from "@/lib/domain/settings";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  UserRound, BadgeCheck, Building2, Sparkles, BrainCircuit, PenLine, Library,
  FileStack, AlarmClockCheck, Bell, ShieldCheck, DatabaseBackup, CreditCard,
};

const GROUP_ORDER: SettingsGroup[] = ["workspace", "intelligence", "operations", "account"];

export function SettingsNav({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav className="space-y-4">
      {GROUP_ORDER.map((group) => {
        const items = SETTINGS_SECTIONS.filter((s) => s.group === group);
        return (
          <div key={group}>
            <p className="mb-1 px-2 text-[0.6rem] font-bold uppercase tracking-wide text-faint">
              {SETTINGS_GROUPS_FA[group]}
            </p>
            <div className="space-y-0.5">
              {items.map((s) => {
                const Icon = ICONS[s.icon] ?? UserRound;
                const isActive = active === s.slug;
                return (
                  <button
                    key={s.slug}
                    onClick={() => onSelect(s.slug)}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition-all",
                      isActive ? "bg-accent-soft text-accent-strong" : "text-ink-2 hover:bg-inset hover:text-ink",
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-faint group-hover:text-ink-2")}
                      strokeWidth={2}
                    />
                    <span className="truncate text-[0.78rem] font-medium">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/** Mobile section switcher: horizontal scrollable chips. */
export function SettingsNavMobile({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none]">
      {SETTINGS_SECTIONS.map((s) => {
        const Icon = ICONS[s.icon] ?? UserRound;
        const isActive = active === s.slug;
        return (
          <button
            key={s.slug}
            onClick={() => onSelect(s.slug)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.72rem] font-medium transition-colors",
              isActive ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-surface text-ink-2",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {s.title}
          </button>
        );
      })}
    </div>
  );
}
