"use client";

import { Library } from "lucide-react";
import { ChipSelect, SaveBar, SectionHeader, SettingsCard, ToggleRow } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { LAW_CODE_FA } from "@/lib/domain/taxonomies";
import type { AppSettings } from "@/lib/domain/settings";
import { faNum } from "@/lib/jalali";

const LAW_OPTIONS = Object.entries(LAW_CODE_FA).map(([value, label]) => ({ value, label }));

export function KnowledgeSection({ settings }: { settings: AppSettings }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("knowledge", settings.knowledge);

  const toggleLaw = (v: string) =>
    set("enabled_laws", draft.enabled_laws.includes(v) ? draft.enabled_laws.filter((x) => x !== v) : [...draft.enabled_laws, v]);

  return (
    <div>
      <SectionHeader
        icon={<Library />}
        title="منابع دانش حقوقی"
        description="قوانین و منابعی که پژوهشگر حقوقی و سایر ایجنت‌ها برای پاسخ و استناد از آن‌ها استفاده می‌کنند"
      />

      <SettingsCard
        title="قوانین فعال"
        description={`${faNum(draft.enabled_laws.length)} منبع فعال — فقط از منابع انتخاب‌شده استناد می‌شود`}
      >
        <ChipSelect options={LAW_OPTIONS} selected={draft.enabled_laws} onToggle={toggleLaw} />
        <div className="mt-3 flex gap-2">
          <button onClick={() => set("enabled_laws", LAW_OPTIONS.map((o) => o.value))} className="text-[0.66rem] font-medium text-accent hover:underline">انتخاب همه</button>
          <span className="text-faint">·</span>
          <button onClick={() => set("enabled_laws", [])} className="text-[0.66rem] font-medium text-muted hover:underline">حذف همه</button>
        </div>
      </SettingsCard>

      <SettingsCard title="رفتار استناد و پژوهش" className="mt-4">
        <ToggleRow title="اولویت آرای وحدت رویه" description="در کنار نص قانون، آرای لازم‌الاتباع دیوان عالی نیز جستجو شود" checked={draft.prefer_unification_rulings} onChange={(v) => set("prefer_unification_rulings", v)} />
        <ToggleRow title="استناد خودکار به شماره ماده" description="در پاسخ‌ها شماره دقیق ماده و قانون درج شود" checked={draft.auto_cite_articles} onChange={(v) => set("auto_cite_articles", v)} />
        <ToggleRow title="استفاده از گنجینه دانش شخصی" description="یادداشت‌ها و استدلال‌های ذخیره‌شده شما هم منبع پاسخ باشند" checked={draft.allow_personal_vault} onChange={(v) => set("allow_personal_vault", v)} />
        <ToggleRow
          title="جستجوی وب (به‌زودی)"
          description="دسترسی به منابع برخط بیرونی — هنوز فعال نیست"
          checked={draft.allow_web}
          onChange={(v) => set("allow_web", v)}
          disabled
        />
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
