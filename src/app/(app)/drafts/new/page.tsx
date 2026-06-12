import { DraftGenerator } from "@/components/drafts/generator";
import { PageHeader } from "@/components/shared/bits";
import { getDataSource } from "@/lib/data";
import { DRAFT_TEMPLATES } from "@/lib/domain/templates";

export const dynamic = "force-dynamic";

export default async function NewDraftPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDataSource();
  const cases = await db.listCases({ status: "active" });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="پیش‌نویس جدید"
        subtitle="سه گام: نوع سند، پرونده، دستور — خروجی با ساختار رسمی و استناد"
      />
      <div className="card p-5">
        <DraftGenerator
          templates={DRAFT_TEMPLATES}
          cases={cases.map((c) => ({ id: c.id, title: c.title }))}
          defaultCaseId={sp.case}
        />
      </div>
    </div>
  );
}
