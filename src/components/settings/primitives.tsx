"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* Building blocks shared by every settings section (Notion/Linear-grade). */

export function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent-line [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div>
        <h1 className="text-base font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-0.5 text-xs leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-start gap-2.5">
            {icon && <span className="mt-0.5 text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
            <div>
              {title && <h2 className="text-[0.82rem] font-bold text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-[0.68rem] leading-5 text-muted">{description}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[0.62rem] leading-5 text-muted">{hint}</p>}
    </div>
  );
}

/** A labeled toggle row — the workhorse of the settings UI. */
export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[0.78rem] font-semibold text-ink">{title}</p>
          {badge}
        </div>
        {description && <p className="mt-0.5 text-[0.66rem] leading-5 text-muted">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

/** Sticky save bar shown when a section has unsaved changes. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  if (!dirty) return null;
  return (
    <div className="sticky bottom-3 z-10 mt-5 flex items-center justify-between gap-3 rounded-xl border border-accent-line bg-accent-soft/90 px-4 py-2.5 shadow-pop backdrop-blur">
      <p className="text-[0.72rem] font-medium text-accent-strong">تغییرات ذخیره‌نشده دارید</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          disabled={saving}
          className="rounded-lg px-3 py-1.5 text-[0.72rem] font-medium text-ink-2 hover:bg-surface/60"
        >
          انصراف
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[0.72rem] font-bold text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          ذخیره تغییرات
        </button>
      </div>
    </div>
  );
}

/** Card-style radio group for choosing among labeled options. */
export function OptionCards<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 1 ? "sm:grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={cn("grid gap-2", cols)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-xl border p-3 text-start transition-all",
            value === o.value
              ? "border-accent bg-accent-soft shadow-sm ring-1 ring-accent-line"
              : "border-line bg-surface hover:border-line-2 hover:bg-raised",
          )}
        >
          <div className="flex items-center justify-between">
            <span className={cn("text-[0.76rem] font-bold", value === o.value ? "text-accent-strong" : "text-ink")}>
              {o.label}
            </span>
            <span
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2",
                value === o.value ? "border-accent bg-accent" : "border-line-2",
              )}
            />
          </div>
          {o.hint && <p className="mt-1 text-[0.64rem] leading-5 text-muted">{o.hint}</p>}
        </button>
      ))}
    </div>
  );
}

/** Multi-select chips. */
export function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={cn(
              "chip transition-colors",
              on ? "border-accent bg-accent-soft font-bold text-accent-strong" : "hover:border-line-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
