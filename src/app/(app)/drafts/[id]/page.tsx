import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DraftEditor } from "@/components/drafts/editor";
import { Badge } from "@/components/ui/badge";
import { getDataSource } from "@/lib/data";
import { DRAFT_KIND_FA } from "@/lib/domain/taxonomies";

export const dynamic = "force-dynamic";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDataSource();
  const draft = await db.getDraft(id);
  if (!draft) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[0.7rem] text-muted no-print">
        <Link href="/drafts" className="flex items-center gap-1 hover:text-ink">
          <ArrowRight className="h-3.5 w-3.5" /> پیش‌نویس‌ها
        </Link>
        <span>/</span>
        <Badge tone="accent">{DRAFT_KIND_FA[draft.doc_kind]}</Badge>
        {draft.case && (
          <>
            <span>·</span>
            <Link href={`/cases/${draft.case.id}`} className="text-accent hover:underline">
              {draft.case.title}
            </Link>
          </>
        )}
      </div>
      <DraftEditor draft={draft} />
    </div>
  );
}
