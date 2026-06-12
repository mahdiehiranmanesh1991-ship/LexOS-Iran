import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { deadlineUrgency } from "@/lib/domain/deadlines";
import { daysFromToday, faNum, relativeDayFa } from "@/lib/jalali";
import { cn } from "@/lib/utils";

/** Small shared presentation atoms used across modules. */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="text-faint [&>svg]:h-8 [&>svg]:w-8">{icon}</div>}
      <p className="text-sm font-medium text-ink-2">{title}</p>
      {hint && <p className="max-w-sm text-xs leading-6 text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "neutral" | "danger" | "accent";
}) {
  const body = (
    <div
      className={cn(
        "card group px-4 py-3.5 transition-all hover:shadow-pop/40 hover:-translate-y-px",
        tone === "danger" && "border-danger-line bg-danger-soft/40",
        tone === "accent" && "border-accent-line bg-accent-soft/40",
      )}
    >
      <p className="text-[0.7rem] font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tracking-tight",
          tone === "danger" ? "text-danger" : tone === "accent" ? "text-accent-strong" : "text-ink",
        )}
      >
        {typeof value === "number" ? faNum(value) : value}
      </p>
      {hint && <p className="mt-0.5 text-[0.68rem] text-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Deadline urgency chip: «۳ روز دیگر» colored by docs/10 buckets. */
export function DueBadge({ dueAt, done }: { dueAt: string; done?: boolean }) {
  if (done) return <Badge tone="ok">انجام شد</Badge>;
  const days = daysFromToday(dueAt);
  const urgency = deadlineUrgency(days);
  const tone =
    urgency === "overdue" || urgency === "critical"
      ? "danger"
      : urgency === "soon"
        ? "warn"
        : "neutral";
  const label = urgency === "overdue" ? `${faNum(-days)} روز گذشته` : relativeDayFa(dueAt);
  return (
    <Badge tone={tone} className={urgency === "critical" || urgency === "overdue" ? "font-bold" : ""}>
      {label}
    </Badge>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="text-[0.8rem] font-bold text-ink-2">{children}</h2>
      {action}
    </div>
  );
}
