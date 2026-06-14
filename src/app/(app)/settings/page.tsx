import { PageHeader } from "@/components/shared/bits";
import { SettingsWorkspace, type SettingsBundle } from "@/components/settings/settings-workspace";
import { Badge } from "@/components/ui/badge";
import { hasAnthropic, hasOpenAI } from "@/lib/ai/providers";
import { getDataSource } from "@/lib/data";
import { DRAFT_TEMPLATES } from "@/lib/domain/templates";
import { isDemoMode } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const db = await getDataSource();

  const [
    settings,
    sessions,
    auditLogs,
    brainSources,
    brainProfile,
    customTemplates,
    subscription,
    invoices,
  ] = await Promise.all([
    db.getSettings(),
    db.listSessions(),
    db.listAuditLogs(),
    db.listBrainSources(),
    db.getBrainProfile(),
    db.listCustomTemplates(),
    db.getSubscription(),
    db.listInvoices(),
  ]);

  const data: SettingsBundle = {
    settings,
    sessions,
    auditLogs,
    brainSources,
    brainProfile,
    customTemplates,
    subscription,
    invoices,
    providers: {
      anthropic: hasAnthropic(),
      openai: hasOpenAI(),
      google: Boolean(process.env.GOOGLE_API_KEY),
    },
    systemTemplates: DRAFT_TEMPLATES.map((t) => ({
      code: t.code,
      title_fa: t.title_fa,
      doc_kind: t.doc_kind,
      description_fa: t.description_fa,
    })),
  };

  return (
    <div>
      <PageHeader
        title="تنظیمات"
        subtitle="مرکز کنترل دفتر حقوقی شما"
        actions={isDemoMode() ? <Badge tone="warn">نسخه نمایشی</Badge> : undefined}
      />
      <SettingsWorkspace data={data} initial={s} />
    </div>
  );
}
