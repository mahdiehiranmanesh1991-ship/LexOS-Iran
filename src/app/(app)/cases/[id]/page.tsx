import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlarmClock,
  Bot,
  FileText,
  Gavel,
  History,
  LayoutPanelTop,
  PenLine,
  Upload,
} from "lucide-react";
import { AnalysisCard } from "@/components/cases/analysis-card";
import { AnalyzeLauncher } from "@/components/cases/analyze-launcher";
import { CaseStateMenu } from "@/components/cases/case-state-menu";
import { DeadlineFormDialog } from "@/components/calendar/deadline-form";
import { HearingFormDialog } from "@/components/calendar/hearing-form";
import { DeadlineRow } from "@/components/calendar/deadline-row";
import { DueBadge, EmptyState, SectionTitle } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDataSource } from "@/lib/data";
import {
  CASE_STAGE_FA,
  CASE_STATUS_FA,
  CASE_TYPE_FA,
  CLIENT_POSITION_FA,
  DOC_STATUS_FA,
  DOC_TYPE_FA,
  EVENT_TYPE_FA,
  HEARING_KIND_FA,
  HEARING_STATUS_FA,
  PARTY_ROLE_FA,
} from "@/lib/domain/taxonomies";
import {
  faNum,
  formatJalaliLong,
  formatJalaliNumeric,
  formatJalaliWithTime,
  formatRials,
} from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const db = await getDataSource();
  const c = await db.getCase(id);
  if (!c) notFound();

  const caseRefs = [{ id: c.id, title: c.title }];
  const openDeadlines = c.deadlines.filter((d) => d.status === "open");

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="accent">{CASE_TYPE_FA[c.case_type]}</Badge>
              <Badge tone="neutral">{CASE_STAGE_FA[c.stage]}</Badge>
              <Badge tone={c.status === "active" ? "info" : c.status === "won" ? "ok" : "neutral"}>
                {CASE_STATUS_FA[c.status]}
              </Badge>
              {openDeadlines[0] && <DueBadge dueAt={openDeadlines[0].due_at} />}
            </div>
            <h1 className="mt-2 text-lg font-extrabold tracking-tight text-ink">{c.title}</h1>
            <p className="mt-1 text-xs leading-6 text-muted">{c.subject}</p>
          </div>
          <CaseStateMenu caseId={c.id} stage={c.stage} status={c.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-3.5 text-[0.7rem] sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <dt className="text-faint">شماره بایگانی</dt>
            <dd className="mt-0.5 font-bold text-ink">{faNum(c.archive_no)}</dd>
          </div>
          <div>
            <dt className="text-faint">کلاسه پرونده</dt>
            <dd className="mt-0.5 font-bold text-ink" dir="ltr">{c.case_no ? faNum(c.case_no) : "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-faint">مرجع رسیدگی</dt>
            <dd className="mt-0.5 truncate font-bold text-ink">
              {c.court ? `${c.court.name}${c.court_branch ? ` — ${c.court_branch}` : ""}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-faint">قاضی</dt>
            <dd className="mt-0.5 font-bold text-ink">{c.judge_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-faint">بهای خواسته</dt>
            <dd className="mt-0.5 font-bold text-ink">{formatRials(c.claim_value)}</dd>
          </div>
        </dl>

        {c.ai_summary && (
          <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-accent-line/70 bg-accent-soft/50 px-3.5 py-2.5">
            <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <p className="text-[0.72rem] leading-6 text-accent-strong">{c.ai_summary}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue={tab ?? "overview"}>
        <TabsList>
          <TabsTrigger value="overview"><LayoutPanelTop className="h-3.5 w-3.5" /> نمای کلی</TabsTrigger>
          <TabsTrigger value="timeline"><History className="h-3.5 w-3.5" /> رویدادها</TabsTrigger>
          <TabsTrigger value="deadlines"><AlarmClock className="h-3.5 w-3.5" /> مواعد {openDeadlines.length > 0 && <Badge tone="danger">{faNum(openDeadlines.length)}</Badge>}</TabsTrigger>
          <TabsTrigger value="hearings"><Gavel className="h-3.5 w-3.5" /> جلسات</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5" /> اسناد</TabsTrigger>
          <TabsTrigger value="ai"><Bot className="h-3.5 w-3.5" /> تحلیل هوشمند</TabsTrigger>
          <TabsTrigger value="drafts"><PenLine className="h-3.5 w-3.5" /> پیش‌نویس‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <section className="card p-4">
                <SectionTitle>شرح پرونده</SectionTitle>
                <p className="whitespace-pre-wrap text-[0.78rem] leading-7 text-ink-2">
                  {c.description ?? "شرحی ثبت نشده است."}
                </p>
              </section>
              <section className="card p-4">
                <SectionTitle>آخرین رویدادها</SectionTitle>
                <Timeline events={c.events.slice(0, 5)} />
              </section>
            </div>
            <div className="space-y-4">
              <section className="card p-4">
                <SectionTitle>طرفین پرونده</SectionTitle>
                <div className="space-y-2">
                  {c.parties.length === 0 && (
                    <p className="text-xs text-muted">طرفی ثبت نشده است.</p>
                  )}
                  {c.parties.map((p) => (
                    <div key={p.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-raised px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[0.65rem] font-bold text-accent-strong">
                        {p.contact?.full_name?.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.74rem] font-bold text-ink">{p.contact?.full_name}</p>
                        <p className="text-[0.6rem] text-muted">
                          {PARTY_ROLE_FA[p.role]}
                          {p.role === "client" && ` — ${CLIENT_POSITION_FA[c.client_position]}`}
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="card p-4">
                <SectionTitle>اقدام سریع</SectionTitle>
                <div className="space-y-2">
                  <DeadlineFormDialog
                    cases={caseRefs}
                    defaultCaseId={c.id}
                    trigger={<Button className="w-full justify-start gap-2 text-xs"><AlarmClock className="h-3.5 w-3.5 text-accent" /> ثبت موعد قانونی</Button>}
                  />
                  <HearingFormDialog
                    cases={caseRefs}
                    defaultCaseId={c.id}
                    trigger={<Button className="w-full justify-start gap-2 text-xs"><Gavel className="h-3.5 w-3.5 text-accent" /> ثبت جلسه</Button>}
                  />
                  <Link href={`/documents?upload=1&case=${c.id}`} className="block">
                    <Button className="w-full justify-start gap-2 text-xs"><Upload className="h-3.5 w-3.5 text-accent" /> بارگذاری سند</Button>
                  </Link>
                  <Link href={`/ai?case=${c.id}`} className="block">
                    <Button className="w-full justify-start gap-2 text-xs"><Bot className="h-3.5 w-3.5 text-accent" /> گفتگو درباره پرونده</Button>
                  </Link>
                  <Link href={`/drafts/new?case=${c.id}`} className="block">
                    <Button className="w-full justify-start gap-2 text-xs"><PenLine className="h-3.5 w-3.5 text-accent" /> پیش‌نویس جدید</Button>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="card p-4">
            {c.events.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">رویدادی ثبت نشده است.</p>
            ) : (
              <Timeline events={c.events} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="deadlines">
          <div className="mb-3 flex justify-end">
            <DeadlineFormDialog cases={caseRefs} defaultCaseId={c.id} />
          </div>
          {c.deadlines.length === 0 ? (
            <EmptyState
              icon={<AlarmClock />}
              title="موعدی ثبت نشده"
              hint="ابلاغیه را در تب اسناد بارگذاری کنید تا ایجنت مواعد مهلت را پیشنهاد دهد، یا دستی ثبت کنید."
            />
          ) : (
            <div className="card divide-y divide-line">
              {c.deadlines.map((d) => (
                <DeadlineRow key={d.id} deadline={d} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hearings">
          <div className="mb-3 flex justify-end">
            <HearingFormDialog cases={caseRefs} defaultCaseId={c.id} />
          </div>
          {c.hearings.length === 0 ? (
            <EmptyState icon={<Gavel />} title="جلسه‌ای ثبت نشده" />
          ) : (
            <div className="card divide-y divide-line">
              {c.hearings.map((h) => (
                <div key={h.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Badge tone={h.status === "upcoming" ? "info" : h.status === "held" ? "ok" : "neutral"}>
                    {HEARING_STATUS_FA[h.status]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.78rem] font-bold text-ink">
                      {HEARING_KIND_FA[h.kind]} — {formatJalaliWithTime(h.hearing_at)}
                    </p>
                    <p className="mt-0.5 text-[0.66rem] text-muted">
                      {h.location ?? "—"}
                      {h.notes ? ` · ${h.notes}` : ""}
                    </p>
                    {h.result && (
                      <p className="mt-1 rounded-lg bg-inset px-2.5 py-1.5 text-[0.68rem] text-ink-2">
                        نتیجه: {h.result}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="mb-3 flex justify-end">
            <Link href={`/documents?upload=1&case=${c.id}`}>
              <Button variant="primary" className="gap-1.5"><Upload className="h-4 w-4" /> بارگذاری سند</Button>
            </Link>
          </div>
          {c.documents.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="سندی بارگذاری نشده"
              hint="دادخواست، دادنامه، ابلاغیه و قرارداد را بارگذاری کنید — متن استخراج، دسته‌بندی و قابل جستجو می‌شود."
            />
          ) : (
            <div className="card divide-y divide-line">
              {c.documents.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Badge tone="neutral">{DOC_TYPE_FA[d.doc_type]}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.78rem] font-bold text-ink">{d.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[0.66rem] text-muted">
                      {d.ai_summary ?? "—"}
                    </p>
                  </div>
                  {d.status !== "ready" && (
                    <Badge tone={d.status === "failed" ? "danger" : "warn"} className={d.status === "processing" ? "pulse-soft" : ""}>
                      {DOC_STATUS_FA[d.status]}
                    </Badge>
                  )}
                  <span className="text-[0.62rem] text-faint">{formatJalaliNumeric(d.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-4">
            <section className="card p-4">
              <SectionTitle>اجرای تحلیل تخصصی</SectionTitle>
              <AnalyzeLauncher caseId={c.id} caseType={c.case_type} />
            </section>
            {c.analyses.length === 0 ? (
              <EmptyState
                icon={<Bot />}
                title="هنوز تحلیلی اجرا نشده"
                hint="یکی از تحلیل‌های بالا را اجرا کنید؛ نتیجه به‌صورت گزارش ساخت‌یافته همین‌جا ماندگار می‌شود."
              />
            ) : (
              c.analyses.map((a) => <AnalysisCard key={a.id} analysis={a} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="mb-3 flex justify-end">
            <Link href={`/drafts/new?case=${c.id}`}>
              <Button variant="primary" className="gap-1.5"><PenLine className="h-4 w-4" /> پیش‌نویس جدید</Button>
            </Link>
          </div>
          {c.drafts.length === 0 ? (
            <EmptyState icon={<PenLine />} title="پیش‌نویسی برای این پرونده ندارید" />
          ) : (
            <div className="card divide-y divide-line">
              {c.drafts.map((d) => (
                <Link key={d.id} href={`/drafts/${d.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
                  <Badge tone={d.status === "final" ? "ok" : "neutral"}>
                    {d.status === "final" ? "نهایی" : `نسخه ${faNum(d.version)}`}
                  </Badge>
                  <p className="min-w-0 flex-1 truncate text-[0.78rem] font-bold text-ink">{d.title}</p>
                  <span className="text-[0.62rem] text-faint">{formatJalaliNumeric(d.updated_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Timeline({ events }: { events: { id: string; title: string; description: string | null; event_date: string; event_type: keyof typeof EVENT_TYPE_FA }[] }) {
  return (
    <ol className="relative space-y-0 border-s border-line ps-4">
      {events.map((e) => (
        <li key={e.id} className="relative pb-4 last:pb-0">
          <span className="absolute -start-[1.34rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent-line" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-[0.76rem] font-bold text-ink">{e.title}</p>
            <span className="text-[0.6rem] text-faint">
              {EVENT_TYPE_FA[e.event_type]} · {formatJalaliLong(e.event_date)}
            </span>
          </div>
          {e.description && <p className="mt-0.5 text-[0.68rem] leading-6 text-muted">{e.description}</p>}
        </li>
      ))}
    </ol>
  );
}
