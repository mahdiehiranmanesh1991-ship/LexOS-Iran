import Link from "next/link";
import { FileText, FolderOpen } from "lucide-react";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { EmptyState, PageHeader } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { getDataSource } from "@/lib/data";
import { DOC_STATUS_FA, DOC_TYPE_FA } from "@/lib/domain/taxonomies";
import type { DocType } from "@/lib/domain/types";
import { faNum, formatJalaliNumeric } from "@/lib/jalali";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ upload?: string; case?: string; type?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDataSource();
  const [documents, cases] = await Promise.all([db.listDocuments(), db.listCases()]);
  const caseRefs = cases.map((c) => ({ id: c.id, title: c.title }));

  let rows = documents;
  if (sp.type) rows = rows.filter((d) => d.doc_type === sp.type);
  if (sp.q) {
    const q = sp.q;
    rows = rows.filter(
      (d) =>
        d.title.includes(q) ||
        (d.ai_summary ?? "").includes(q) ||
        (d.extracted_text ?? "").includes(q) ||
        d.tags.some((t) => t.includes(q)),
    );
  }

  const typeCounts = documents.reduce<Record<string, number>>((acc, d) => {
    acc[d.doc_type] = (acc[d.doc_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="مرکز اسناد"
        subtitle={`${faNum(documents.length)} سند — متن همه اسناد قابل جستجو است`}
        actions={
          <UploadDialog cases={caseRefs} defaultCaseId={sp.case} defaultOpen={sp.upload === "1"} />
        }
      />

      <form className="mb-3" action="/documents">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          className="input max-w-md"
          placeholder="جستجو در عنوان، خلاصه و متن اسناد…"
        />
      </form>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link href="/documents" className={cn("chip", !sp.type && "border-accent bg-accent-soft font-bold text-accent-strong")}>
          همه {faNum(documents.length)}
        </Link>
        {(Object.entries(DOC_TYPE_FA) as [DocType, string][])
          .filter(([t]) => typeCounts[t])
          .map(([t, l]) => (
            <Link
              key={t}
              href={`/documents?type=${t}`}
              className={cn("chip", sp.type === t && "border-accent bg-accent-soft font-bold text-accent-strong")}
            >
              {l} {faNum(typeCounts[t])}
            </Link>
          ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<FolderOpen />}
          title="سندی یافت نشد"
          hint="اولین سند را بارگذاری کنید — PDF دادنامه، ابلاغیه ثنا یا تصویر قرارداد. متن استخراج و هوشمندسازی می‌شود."
          action={<UploadDialog cases={caseRefs} trigger={<span className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-accent px-4 text-xs font-medium text-white">بارگذاری سند</span>} />}
        />
      ) : (
        <div className="card divide-y divide-line">
          {rows.map((d) => (
            <div key={d.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-raised">
                <FileText className="h-4 w-4 text-faint" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[0.8rem] font-bold text-ink">{d.title}</p>
                  <Badge tone="neutral">{DOC_TYPE_FA[d.doc_type]}</Badge>
                  {d.status !== "ready" && (
                    <Badge tone={d.status === "failed" ? "danger" : "warn"} className={d.status === "processing" ? "pulse-soft" : ""}>
                      {DOC_STATUS_FA[d.status]}
                    </Badge>
                  )}
                </div>
                {d.ai_summary && (
                  <p className="mt-1 line-clamp-2 text-[0.7rem] leading-6 text-muted">{d.ai_summary}</p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] text-faint">
                  {d.case && (
                    <Link href={`/cases/${d.case.id}?tab=documents`} className="text-accent hover:underline">
                      {d.case.title}
                    </Link>
                  )}
                  <span>{formatJalaliNumeric(d.created_at)}</span>
                  {d.pages && <span>{faNum(d.pages)} صفحه</span>}
                  {d.tags.map((t) => (
                    <span key={t} className="chip !py-0">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
