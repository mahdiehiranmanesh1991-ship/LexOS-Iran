import Link from "next/link";
import { PenLine, Plus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDataSource } from "@/lib/data";
import { DRAFT_KIND_FA } from "@/lib/domain/taxonomies";
import { faNum, formatJalaliNumeric } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const db = await getDataSource();
  const drafts = await db.listDrafts();

  return (
    <div>
      <PageHeader
        title="پیش‌نویس‌ها"
        subtitle="دادخواست، لایحه، شکواییه، اظهارنامه و قرارداد — تولید با ایجنت نگارش"
        actions={
          <Link href="/drafts/new">
            <Button variant="primary" className="gap-1.5">
              <Plus className="h-4 w-4" /> پیش‌نویس جدید
            </Button>
          </Link>
        }
      />

      {drafts.length === 0 ? (
        <EmptyState
          icon={<PenLine />}
          title="هنوز پیش‌نویسی ندارید"
          hint="نوع سند را انتخاب کنید، پرونده را وصل کنید و دستور بدهید — ایجنت نگارش متن رسمی را با ساختار صحیح تولید می‌کند."
          action={
            <Link href="/drafts/new">
              <Button variant="primary">شروع نگارش</Button>
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-line">
          {drafts.map((d) => (
            <Link key={d.id} href={`/drafts/${d.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
              <Badge tone="accent">{DRAFT_KIND_FA[d.doc_kind]}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8rem] font-bold text-ink">{d.title}</p>
                <p className="mt-0.5 text-[0.64rem] text-muted">
                  {d.case ? d.case.title : "بدون پرونده"} · نسخه {faNum(d.version)}
                </p>
              </div>
              <Badge tone={d.status === "final" ? "ok" : "neutral"}>
                {d.status === "final" ? "نهایی" : "در حال ویرایش"}
              </Badge>
              <span className="text-[0.62rem] text-faint">{formatJalaliNumeric(d.updated_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
