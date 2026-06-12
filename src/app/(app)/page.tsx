import Link from "next/link";
import {
  AlarmClock,
  ArrowLeft,
  Bot,
  CalendarDays,
  FolderOpen,
  Gavel,
  Scale,
  Upload,
} from "lucide-react";
import { DueBadge, EmptyState, SectionTitle, StatCard } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskList } from "@/components/dashboard/task-list";
import { getDataSource } from "@/lib/data";
import { EVENT_TYPE_FA, HEARING_KIND_FA } from "@/lib/domain/taxonomies";
import { daysFromToday, faNum, formatJalaliLong, formatTime, relativeDayFa } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await getDataSource();
  const d = await db.getDashboard();
  const critical = d.urgentDeadlines.filter((x) => daysFromToday(x.due_at) <= 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">
          سلام، {d.profile.full_name.split(" ")[0]} {d.profile.full_name.split(" ").slice(1).join(" ")}
        </h1>
        <p className="mt-1 text-xs text-muted">
          {formatJalaliLong(new Date(), { weekday: true })} —{" "}
          {d.todayHearings.length > 0
            ? `امروز ${faNum(d.todayHearings.length)} جلسه دارید`
            : "امروز جلسه دادرسی ندارید"}
          {critical.length > 0 && `، ${faNum(critical.length)} موعد بحرانی در پیش است`}
        </p>
      </div>

      {critical.length > 0 && (
        <div className="card flex flex-col gap-2 border-danger-line bg-danger-soft/50 p-4">
          <div className="flex items-center gap-2 text-danger">
            <AlarmClock className="h-4 w-4" />
            <p className="text-[0.8rem] font-bold">مواعد بحرانی — اقدام فوری</p>
          </div>
          {critical.map((dl) => (
            <Link
              key={dl.id}
              href={dl.case ? `/cases/${dl.case.id}?tab=deadlines` : "/calendar"}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-surface/80 px-3 py-2 text-xs transition-colors hover:bg-surface"
            >
              <DueBadge dueAt={dl.due_at} />
              <span className="font-semibold text-ink">{dl.title}</span>
              {dl.case && <span className="text-muted">— {dl.case.title}</span>}
              {dl.citation && (
                <Badge tone="info" className="ms-auto hidden sm:inline-flex">
                  {dl.citation}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="پرونده‌های جاری" value={d.stats.activeCases} href="/cases" />
        <StatCard
          label="مواعد باز"
          value={d.stats.openDeadlines}
          href="/calendar"
          tone={critical.length > 0 ? "danger" : "neutral"}
        />
        <StatCard label="جلسات پیش رو" value={d.stats.upcomingHearings} href="/calendar" />
        <StatCard label="اسناد" value={d.stats.documents} href="/documents" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section>
            <SectionTitle
              action={
                <Link href="/calendar" className="flex items-center gap-1 text-[0.68rem] text-accent hover:underline">
                  تقویم کامل <ArrowLeft className="h-3 w-3" />
                </Link>
              }
            >
              جلسات دادرسی پیش رو
            </SectionTitle>
            {d.upcomingHearings.length === 0 ? (
              <EmptyState icon={<Gavel />} title="جلسه‌ای در دو هفته آینده ندارید" />
            ) : (
              <div className="card divide-y divide-line">
                {d.upcomingHearings.slice(0, 5).map((h) => (
                  <Link
                    key={h.id}
                    href={h.case ? `/cases/${h.case.id}?tab=hearings` : "/calendar"}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
                  >
                    <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-raised leading-none">
                      <span className="text-[0.6rem] text-muted">{relativeDayFa(h.hearing_at)}</span>
                      <span className="mt-0.5 text-[0.7rem] font-bold text-ink">
                        {formatTime(h.hearing_at)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8rem] font-semibold text-ink">
                        {h.case?.title ?? "بدون پرونده"}
                      </p>
                      <p className="mt-0.5 truncate text-[0.68rem] text-muted">
                        {HEARING_KIND_FA[h.kind]}
                        {h.location ? ` — ${h.location}` : ""}
                      </p>
                    </div>
                    <Badge tone={daysFromToday(h.hearing_at) <= 1 ? "warn" : "neutral"}>
                      {formatJalaliLong(h.hearing_at)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle
              action={
                <Link href="/calendar?view=deadlines" className="flex items-center gap-1 text-[0.68rem] text-accent hover:underline">
                  همه مواعد <ArrowLeft className="h-3 w-3" />
                </Link>
              }
            >
              مواعد دو هفته آینده
            </SectionTitle>
            {d.urgentDeadlines.length === 0 ? (
              <EmptyState icon={<AlarmClock />} title="موعد بازی در این بازه ندارید" />
            ) : (
              <div className="card divide-y divide-line">
                {d.urgentDeadlines.slice(0, 6).map((dl) => (
                  <Link
                    key={dl.id}
                    href={dl.case ? `/cases/${dl.case.id}?tab=deadlines` : "/calendar"}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-raised"
                  >
                    <DueBadge dueAt={dl.due_at} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.78rem] font-semibold text-ink">{dl.title}</p>
                      <p className="mt-0.5 truncate text-[0.66rem] text-muted">
                        {dl.case?.title ?? "عمومی"}
                        {dl.citation ? ` · ${dl.citation}` : ""}
                      </p>
                    </div>
                    {dl.created_by === "agent" && <Badge tone="accent">پیشنهاد AI</Badge>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle>رویدادهای اخیر</SectionTitle>
            <div className="card px-4 py-1">
              {d.recentEvents.map((e) => (
                <div key={e.id} className="flex gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-line ring-2 ring-accent-soft" />
                  <div className="min-w-0">
                    <p className="text-[0.75rem] text-ink">
                      <span className="font-semibold">{e.title}</span>
                      {e.case_title && <span className="text-muted"> — {e.case_title}</span>}
                    </p>
                    <p className="mt-0.5 text-[0.62rem] text-faint">
                      {EVENT_TYPE_FA[e.event_type]} · {relativeDayFa(e.event_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="border-b border-accent-line/60 bg-accent-soft/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-accent" />
                <p className="text-[0.78rem] font-bold text-accent-strong">دستیار هوشمند</p>
              </div>
              <p className="mt-1 text-[0.66rem] leading-5 text-accent-strong/70">
                ابلاغیه جدید دارید؟ بارگذاری کنید تا مهلت قانونی‌اش محاسبه و ثبت شود.
              </p>
            </div>
            <div className="space-y-2 p-3">
              <Link href="/documents?upload=1" className="block">
                <Button variant="secondary" className="w-full justify-start gap-2 text-xs">
                  <Upload className="h-3.5 w-3.5 text-accent" /> بارگذاری ابلاغیه / سند
                </Button>
              </Link>
              <Link href="/ai" className="block">
                <Button variant="secondary" className="w-full justify-start gap-2 text-xs">
                  <Bot className="h-3.5 w-3.5 text-accent" /> پرسش حقوقی از دستیار
                </Button>
              </Link>
              <Link href="/cases/new" className="block">
                <Button variant="secondary" className="w-full justify-start gap-2 text-xs">
                  <Scale className="h-3.5 w-3.5 text-accent" /> تشکیل پرونده جدید
                </Button>
              </Link>
            </div>
          </section>

          <section>
            <SectionTitle>کارهای باز</SectionTitle>
            <TaskList tasks={d.openTasks} />
          </section>

          <section>
            <SectionTitle>دسترسی سریع</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/calendar" className="card flex flex-col items-center gap-1.5 py-3 text-[0.68rem] font-medium text-ink-2 transition-all hover:-translate-y-px hover:text-ink">
                <CalendarDays className="h-4.5 w-4.5 text-accent" /> تقویم جلالی
              </Link>
              <Link href="/documents" className="card flex flex-col items-center gap-1.5 py-3 text-[0.68rem] font-medium text-ink-2 transition-all hover:-translate-y-px hover:text-ink">
                <FolderOpen className="h-4.5 w-4.5 text-accent" /> مرکز اسناد
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
