import { AlarmClock } from "lucide-react";
import { DeadlineFormDialog } from "@/components/calendar/deadline-form";
import { DeadlineRow } from "@/components/calendar/deadline-row";
import { HearingFormDialog } from "@/components/calendar/hearing-form";
import { MonthGrid, type CalendarItem } from "@/components/calendar/month-grid";
import { EmptyState, PageHeader, SectionTitle } from "@/components/shared/bits";
import { getDataSource } from "@/lib/data";
import { HEARING_KIND_FA } from "@/lib/domain/taxonomies";
import { formatTime } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDataSource();
  const [hearings, deadlines, tasks, cases] = await Promise.all([
    db.listHearings(),
    db.listDeadlines(),
    db.listTasks(),
    db.listCases(),
  ]);

  const caseRefs = cases.map((c) => ({ id: c.id, title: c.title }));
  const items: CalendarItem[] = [
    ...hearings
      .filter((h) => h.status === "upcoming" || h.status === "held")
      .map((h) => ({
        id: `h-${h.id}`,
        date: h.hearing_at,
        kind: "hearing" as const,
        label: `${formatTime(h.hearing_at)} — ${HEARING_KIND_FA[h.kind]}${h.case ? `: ${h.case.title}` : ""}${h.location ? ` (${h.location})` : ""}`,
        href: h.case ? `/cases/${h.case.id}?tab=hearings` : undefined,
      })),
    ...deadlines
      .filter((d) => d.status === "open")
      .map((d) => ({
        id: `d-${d.id}`,
        date: d.due_at,
        kind: "deadline" as const,
        label: `آخرین مهلت: ${d.title}${d.case ? ` — ${d.case.title}` : ""}${d.citation ? ` [${d.citation}]` : ""}`,
        href: d.case ? `/cases/${d.case.id}?tab=deadlines` : undefined,
        critical: d.priority === "critical",
      })),
    ...tasks
      .filter((t) => t.status === "open" && t.due_on)
      .map((t) => ({
        id: `t-${t.id}`,
        date: t.due_on!,
        kind: "task" as const,
        label: t.title,
      })),
  ];

  const openDeadlines = deadlines.filter((d) => d.status === "open");
  const closedDeadlines = deadlines.filter((d) => d.status !== "open").slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقویم و مواعد"
        subtitle="تقویم جلالی یکپارچه: جلسات دادرسی، مواعد قانونی و کارها"
        actions={
          <>
            <HearingFormDialog cases={caseRefs} />
            <DeadlineFormDialog cases={caseRefs} defaultOpen={sp.new === "deadline"} />
          </>
        }
      />

      <MonthGrid items={items} />

      <section>
        <SectionTitle>مواعد باز ({openDeadlines.length > 0 ? openDeadlines.length.toLocaleString("fa-IR") : "۰"})</SectionTitle>
        {openDeadlines.length === 0 ? (
          <EmptyState icon={<AlarmClock />} title="موعد بازی ندارید" />
        ) : (
          <div className="card divide-y divide-line">
            {openDeadlines.map((d) => (
              <DeadlineRow key={d.id} deadline={d} showCase />
            ))}
          </div>
        )}
      </section>

      {closedDeadlines.length > 0 && (
        <section>
          <SectionTitle>مواعد اخیر (بسته)</SectionTitle>
          <div className="card divide-y divide-line">
            {closedDeadlines.map((d) => (
              <DeadlineRow key={d.id} deadline={d} showCase />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
