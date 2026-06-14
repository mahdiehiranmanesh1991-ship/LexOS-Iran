"use client";

import { useCallback, useEffect, useState } from "react";
import { SettingsNav, SettingsNavMobile } from "@/components/settings/settings-nav";
import { ProfileSection } from "@/components/settings/sections/profile-section";
import { LicenseSection } from "@/components/settings/sections/license-section";
import { OfficeSection } from "@/components/settings/sections/office-section";
import { AiSection, type ProviderStatus } from "@/components/settings/sections/ai-section";
import { BrainSection } from "@/components/settings/sections/brain-section";
import { DraftingSection } from "@/components/settings/sections/drafting-section";
import { KnowledgeSection } from "@/components/settings/sections/knowledge-section";
import { TemplatesSection } from "@/components/settings/sections/templates-section";
import { DeadlinesSection } from "@/components/settings/sections/deadlines-section";
import { NotificationsSection } from "@/components/settings/sections/notifications-section";
import { SecuritySection } from "@/components/settings/sections/security-section";
import { BackupSection } from "@/components/settings/sections/backup-section";
import { BillingSection } from "@/components/settings/sections/billing-section";
import type {
  AppSettings,
  AuditLog,
  BrainProfile,
  BrainSource,
  CustomTemplate,
  Invoice,
  Subscription,
  UserSession,
} from "@/lib/domain/settings";
import { SETTINGS_SECTIONS } from "@/lib/domain/settings";

export interface SettingsBundle {
  settings: AppSettings;
  providers: ProviderStatus;
  sessions: UserSession[];
  auditLogs: AuditLog[];
  brainSources: BrainSource[];
  brainProfile: BrainProfile | null;
  customTemplates: CustomTemplate[];
  systemTemplates: { code: string; title_fa: string; doc_kind: string; description_fa: string }[];
  subscription: Subscription;
  invoices: Invoice[];
}

const SLUGS = new Set(SETTINGS_SECTIONS.map((s) => s.slug));

export function SettingsWorkspace({ data, initial }: { data: SettingsBundle; initial?: string }) {
  const [active, setActive] = useState(initial && SLUGS.has(initial) ? initial : "profile");

  // Keep ?s= in the URL so sections are deep-linkable / shareable.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("s") !== active) {
      url.searchParams.set("s", active);
      window.history.replaceState(null, "", url.toString());
    }
  }, [active]);

  const select = useCallback((slug: string) => {
    setActive(slug);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="md:grid md:grid-cols-[15rem_1fr] md:gap-6">
      {/* desktop rail */}
      <aside className="sticky top-20 hidden h-fit md:block">
        <SettingsNav active={active} onSelect={select} />
      </aside>

      {/* mobile chips */}
      <div className="mb-4 md:hidden">
        <SettingsNavMobile active={active} onSelect={select} />
      </div>

      <div className="min-w-0">
        {active === "profile" && <ProfileSection settings={data.settings} />}
        {active === "license" && <LicenseSection settings={data.settings} />}
        {active === "office" && <OfficeSection settings={data.settings} />}
        {active === "ai" && <AiSection settings={data.settings} providers={data.providers} />}
        {active === "brain" && <BrainSection settings={data.settings} sources={data.brainSources} profile={data.brainProfile} />}
        {active === "drafting" && <DraftingSection settings={data.settings} />}
        {active === "knowledge" && <KnowledgeSection settings={data.settings} />}
        {active === "templates" && <TemplatesSection systemTemplates={data.systemTemplates} customTemplates={data.customTemplates} />}
        {active === "deadlines" && <DeadlinesSection settings={data.settings} />}
        {active === "notifications" && <NotificationsSection settings={data.settings} />}
        {active === "security" && <SecuritySection settings={data.settings} sessions={data.sessions} auditLogs={data.auditLogs} />}
        {active === "backup" && <BackupSection />}
        {active === "billing" && <BillingSection subscription={data.subscription} invoices={data.invoices} />}
      </div>
    </div>
  );
}
