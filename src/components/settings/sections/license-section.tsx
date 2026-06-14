"use client";

import { BadgeCheck } from "lucide-react";
import { ChipSelect, Field, SaveBar, SectionHeader, SettingsCard } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { BAR_RANK_FA, IRAN_PROVINCES, SPECIALTIES_FA, type AppSettings, type BarRank } from "@/lib/domain/settings";

export function LicenseSection({ settings }: { settings: AppSettings }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("license", settings.license);

  const toggleSpecialty = (v: string) =>
    set("specialties", draft.specialties.includes(v) ? draft.specialties.filter((x) => x !== v) : [...draft.specialties, v]);

  return (
    <div>
      <SectionHeader
        icon={<BadgeCheck />}
        title="اطلاعات پروانه وکالت"
        description="مرجع صدور پروانه، پایه و تخصص‌ها — مبنای سربرگ لوایح و اعتبارسنجی حرفه‌ای"
      />

      <SettingsCard title="پروانه و مرجع صدور">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="مرجع صدور پروانه">
            <select className="input" value={draft.bar_type} onChange={(e) => set("bar_type", e.target.value as AppSettings["license"]["bar_type"])}>
              <option value="">— انتخاب —</option>
              <option value="kanoon">کانون وکلای دادگستری</option>
              <option value="markaz">مرکز وکلای قوه قضاییه</option>
            </select>
          </Field>
          <Field label="پایه">
            <select className="input" value={draft.rank} onChange={(e) => set("rank", e.target.value as BarRank | "")}>
              <option value="">— انتخاب —</option>
              {Object.entries(BAR_RANK_FA).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="شماره پروانه">
            <input className="input" value={draft.license_no} onChange={(e) => set("license_no", e.target.value)} placeholder="۲۵۴۸۱" />
          </Field>
          <Field label="سال صدور">
            <input className="input" value={draft.issue_year} onChange={(e) => set("issue_year", e.target.value)} placeholder="۱۳۹۳" />
          </Field>
          <Field label="استان">
            <select className="input" value={draft.province} onChange={(e) => set("province", e.target.value)}>
              <option value="">— انتخاب —</option>
              {IRAN_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="نام کانون / مرجع">
            <input className="input" value={draft.kanoon_name} onChange={(e) => set("kanoon_name", e.target.value)} placeholder="کانون وکلای دادگستری مرکز" />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard title="حوزه‌های تخصصی" description="در مسیریابی ایجنت‌ها و پیشنهاد قالب‌ها به‌کار می‌رود" className="mt-4">
        <ChipSelect
          options={SPECIALTIES_FA.map((s) => ({ value: s, label: s }))}
          selected={draft.specialties}
          onToggle={toggleSpecialty}
        />
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
