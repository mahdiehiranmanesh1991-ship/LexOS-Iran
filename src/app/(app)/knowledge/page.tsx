import { Library, Search } from "lucide-react";
import { NoteFormDialog } from "@/components/knowledge/note-form";
import { Markdown } from "@/components/shared/markdown";
import { EmptyState, PageHeader } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { getDataSource } from "@/lib/data";
import { NOTE_KIND_FA } from "@/lib/domain/taxonomies";
import { faNum, formatJalaliNumeric } from "@/lib/jalali";

export const dynamic = "force-dynamic";

const OUTCOME_FA = { won: "✅ جواب داد", lost: "✗ جواب نداد", pending: "در انتظار", na: "" } as const;

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDataSource();
  const [notes, cases] = await Promise.all([db.listNotes(sp.q), db.listCases()]);
  const caseRefs = cases.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div>
      <PageHeader
        title="گنجینه دانش"
        subtitle="حافظه حرفه‌ای شما: استدلال‌های برنده، تجربه شعب، رویه قضایی — با جستجوی معنایی"
        actions={<NoteFormDialog cases={caseRefs} />}
      />

      <form className="relative mb-5 max-w-xl" action="/knowledge">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          className="input h-10 ps-9"
          placeholder="جستجوی معنایی: «استدلال خلع ید وقتی سند عادی است و خوانده مدعی بیع است»"
        />
      </form>

      {notes.length === 0 ? (
        <EmptyState
          icon={<Library />}
          title={sp.q ? "یادداشتی متناظر با جستجو نیافتیم" : "گنجینه شما خالی است"}
          hint="هر استدلالی که در دادگاه جواب داد، همان روز ثبتش کنید — دارایی حرفه‌ای شما همین‌جاست."
        />
      ) : (
        <div className="columns-1 gap-4 md:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid">
          {notes.map((n) => (
            <article key={n.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="accent">{NOTE_KIND_FA[n.kind]}</Badge>
                {n.outcome !== "na" && (
                  <Badge tone={n.outcome === "won" ? "ok" : n.outcome === "lost" ? "danger" : "warn"}>
                    {OUTCOME_FA[n.outcome]}
                  </Badge>
                )}
                {typeof n.similarity === "number" && sp.q && (
                  <Badge tone="info">تطابق {faNum(Math.round(Math.min(n.similarity, 1) * 100))}٪</Badge>
                )}
                <span className="ms-auto text-[0.6rem] text-faint">{formatJalaliNumeric(n.created_at)}</span>
              </div>
              <h3 className="mt-2 text-[0.84rem] font-bold text-ink">{n.title}</h3>
              <div className="mt-1.5 max-h-48 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
                <Markdown className="!text-[0.74rem]">{n.content_md}</Markdown>
              </div>
              {n.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                  {n.tags.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
