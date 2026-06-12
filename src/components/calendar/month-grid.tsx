"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  faNum,
  JALALI_MONTHS,
  jalaliMonthGrid,
  nextJalaliMonth,
  prevJalaliMonth,
  todayJalali,
  toISODate,
  WEEKDAYS_FA_SHORT,
} from "@/lib/jalali";
import { cn } from "@/lib/utils";

export interface CalendarItem {
  id: string;
  date: string; // ISO
  kind: "hearing" | "deadline" | "task";
  label: string;
  href?: string;
  critical?: boolean;
}

const KIND_DOT = {
  hearing: "bg-info",
  deadline: "bg-danger",
  task: "bg-warn",
} as const;

/** Jalali month grid — weeks run شنبه..جمعه (RTL-native, docs/06 §Dates). */
export function MonthGrid({ items }: { items: CalendarItem[] }) {
  const today = todayJalali();
  const [view, setView] = useState({ jy: today.jy, jm: today.jm });
  const [selected, setSelected] = useState<string>(toISODate(new Date()));

  const cells = useMemo(() => jalaliMonthGrid(view.jy, view.jm), [view]);
  const byDate = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const key = it.date.slice(0, 10);
      m.set(key, [...(m.get(key) ?? []), it]);
    }
    return m;
  }, [items]);

  const todayISO = toISODate(new Date());
  const selectedItems = byDate.get(selected) ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card p-4 lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.9rem] font-extrabold text-ink">
            {JALALI_MONTHS[view.jm - 1]} {faNum(view.jy)}
          </p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setView({ jy: today.jy, jm: today.jm })}>
              امروز
            </Button>
            {/* RTL: previous month is to the right */}
            <Button size="icon" variant="ghost" aria-label="ماه قبل" onClick={() => setView(prevJalaliMonth(view.jy, view.jm))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="ماه بعد" onClick={() => setView(nextJalaliMonth(view.jy, view.jm))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS_FA_SHORT.map((d, i) => (
            <div key={d} className={cn("pb-1 text-[0.62rem] font-bold", i === 6 ? "text-danger/70" : "text-faint")}>
              {d}
            </div>
          ))}
          {cells.map(({ date, jd, inMonth }) => {
            const iso = toISODate(date);
            const dayItems = byDate.get(iso) ?? [];
            const isToday = iso === todayISO;
            const isSelected = iso === selected;
            const isFriday = date.getDay() === 5;
            return (
              <button
                key={iso}
                onClick={() => setSelected(iso)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-start rounded-lg border p-1 transition-all",
                  inMonth ? "border-transparent hover:border-line hover:bg-raised" : "opacity-35 border-transparent",
                  isSelected && "border-accent bg-accent-soft",
                  isToday && !isSelected && "border-accent-line bg-accent-soft/40",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[0.72rem] font-semibold",
                    isToday ? "bg-accent text-white" : isFriday ? "text-danger/80" : "text-ink-2",
                  )}
                >
                  {faNum(jd)}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center justify-center gap-0.5">
                  {dayItems.slice(0, 4).map((it) => (
                    <span
                      key={it.id}
                      className={cn("h-1.5 w-1.5 rounded-full", KIND_DOT[it.kind], it.critical && "ring-2 ring-danger/30")}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-line pt-2.5 text-[0.62rem] text-muted">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-info" /> جلسه</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> موعد</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> کار</span>
        </div>
      </div>

      <div className="card p-4">
        <p className="mb-3 text-[0.78rem] font-bold text-ink">
          برنامه روز {faNum(selected === todayISO ? "امروز" : "")}{" "}
          {selected !== todayISO && faNum(selected.split("-").length === 3 ? "" : "")}
        </p>
        {selectedItems.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">برای این روز موردی ثبت نشده</p>
        ) : (
          <div className="space-y-2">
            {selectedItems.map((it) => {
              const inner = (
                <div className="flex items-start gap-2.5 rounded-lg border border-line bg-raised px-3 py-2.5 transition-colors hover:bg-inset">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", KIND_DOT[it.kind])} />
                  <span className="min-w-0 text-[0.72rem] leading-6 text-ink">{it.label}</span>
                </div>
              );
              return it.href ? (
                <a key={it.id} href={it.href} className="block">{inner}</a>
              ) : (
                <div key={it.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
