import Link from "next/link";
import { Plus, Scale } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDataSource } from "@/lib/data";
import {
  CASE_STAGE_FA,
  CASE_STATUS_FA,
  CASE_TYPE_FA,
  CLIENT_POSITION_FA,
} from "@/lib/domain/taxonomies";
import type { CaseType } from "@/lib/domain/types";
import { faNum, formatJalaliNumeric, formatRials } from "@/lib/jalali";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_TONES: Record<CaseType, "accent" | "danger" | "info" | "warn" | "neutral" | "ok"> = {
  property: "accent",
  criminal: "danger",
  civil: "info",
  family: "warn",
  commercial: "ok",
  administrative: "neutral",
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDataSource();
  const cases = await db.listCases({
    q: sp.q,
    case_type: sp.type,
    status: sp.status,
  });

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: "همه", href: "/cases", active: !sp.type && !sp.status },
    ...(["property", "civil", "criminal", "family", "commercial", "administrative"] as CaseType[]).map(
      (t) => ({
        label: CASE_TYPE_FA[t],
        href: `/cases?type=${t}`,
        active: sp.type === t,
      }),
    ),
    { label: "مختومه", href: "/cases?status=closed", active: sp.status === "closed" },
  ];

  return (
    <div>
      <PageHeader
        title="پرونده‌ها"
        subtitle={`${faNum(cases.length)} پرونده${sp.q ? ` برای «${sp.q}»` : ""}`}
        actions={
          <Link href="/cases/new">
            <Button variant="primary" size="md" className="gap-1.5">
              <Plus className="h-4 w-4" /> پرونده جدید
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={cn(
              "chip transition-colors hover:border-line-2",
              f.active && "border-accent bg-accent-soft font-bold text-accent-strong",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={<Scale />}
          title="پرونده‌ای یافت نشد"
          hint="اولین پرونده خود را ثبت کنید تا مواعد، جلسات و اسناد آن یک‌جا مدیریت شود."
          action={
            <Link href="/cases/new">
              <Button variant="primary">ثبت پرونده</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {cases.map((c) => {
            const client = c.parties?.find((p) => p.role === "client")?.contact?.full_name;
            return (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="card group p-4 transition-all hover:-translate-y-px hover:shadow-pop/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={TYPE_TONES[c.case_type]}>{CASE_TYPE_FA[c.case_type]}</Badge>
                      <Badge tone="neutral">{CASE_STAGE_FA[c.stage]}</Badge>
                      {c.status !== "active" && (
                        <Badge tone={c.status === "won" ? "ok" : "neutral"}>
                          {CASE_STATUS_FA[c.status]}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 truncate text-[0.88rem] font-bold text-ink group-hover:text-accent-strong">
                      {c.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-[0.7rem] text-muted">{c.subject}</p>
                  </div>
                  <div className="shrink-0 text-end text-[0.62rem] leading-5 text-faint">
                    <p>بایگانی {faNum(c.archive_no)}</p>
                    <p>{formatJalaliNumeric(c.updated_at)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2.5 text-[0.66rem] text-muted">
                  {client && (
                    <span>
                      موکل: <b className="text-ink-2">{client}</b> (
                      {CLIENT_POSITION_FA[c.client_position]})
                    </span>
                  )}
                  {c.court && <span className="truncate">{c.court.name}</span>}
                  {c.claim_value != null && <span>{formatRials(c.claim_value)}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
