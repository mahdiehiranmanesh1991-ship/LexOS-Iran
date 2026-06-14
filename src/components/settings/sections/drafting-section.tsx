"use client";

import { PenLine } from "lucide-react";
import { Field, OptionCards, SaveBar, SectionHeader, SettingsCard, ToggleRow } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import {
  CITATION_STYLE_FA,
  DRAFTING_TONE_FA,
  NUMBERING_FA,
  PLEADING_STYLE_FA,
  PRECEDENT_PREF_FA,
  type AppSettings,
  type CitationStyle,
  type DraftingTone,
  type Numbering,
  type PleadingStyle,
  type PrecedentPreference,
} from "@/lib/domain/settings";

export function DraftingSection({ settings }: { settings: AppSettings }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("drafting", settings.drafting);

  return (
    <div>
      <SectionHeader
        icon={<PenLine />}
        title="ترجیحات نگارش حقوقی"
        description="کنترل‌های تخصصی که ایجنت نگارش هنگام تهیه دادخواست، لایحه و قرارداد رعایت می‌کند"
      />

      <SettingsCard title="سبک پیش‌فرض لایحه" description="ساختار و نثر کلی اسناد تولیدی">
        <OptionCards
          value={draft.pleading_style}
          onChange={(v) => set("pleading_style", v as PleadingStyle)}
          columns={2}
          options={(Object.entries(PLEADING_STYLE_FA) as [PleadingStyle, { label: string; hint: string }][]).map(([value, m]) => ({ value, label: m.label, hint: m.hint }))}
        />
      </SettingsCard>

      <SettingsCard title="لحن نگارش" className="mt-4">
        <OptionCards
          value={draft.tone}
          onChange={(v) => set("tone", v as DraftingTone)}
          columns={3}
          options={(Object.entries(DRAFTING_TONE_FA) as [DraftingTone, string][]).map(([value, label]) => ({ value, label }))}
        />
      </SettingsCard>

      <SettingsCard title="شیوه استناد به مواد قانونی" className="mt-4">
        <OptionCards
          value={draft.citation_style}
          onChange={(v) => set("citation_style", v as CitationStyle)}
          columns={2}
          options={(Object.entries(CITATION_STYLE_FA) as [CitationStyle, { label: string; hint: string }][]).map(([value, m]) => ({ value, label: m.label, hint: m.hint }))}
        />
      </SettingsCard>

      <SettingsCard title="ترجیح رویه قضایی" description="هنگام استناد به سابقه، کدام را مقدم بدارد" className="mt-4">
        <OptionCards
          value={draft.precedent_preference}
          onChange={(v) => set("precedent_preference", v as PrecedentPreference)}
          columns={2}
          options={(Object.entries(PRECEDENT_PREF_FA) as [PrecedentPreference, { label: string; hint: string }][]).map(([value, m]) => ({ value, label: m.label, hint: m.hint }))}
        />
      </SettingsCard>

      <SettingsCard title="جزئیات قالب‌بندی" className="mt-4">
        <Field label="شماره‌گذاری بندها">
          <select className="input" value={draft.numbering} onChange={(e) => set("numbering", e.target.value as Numbering)}>
            {(Object.entries(NUMBERING_FA) as [Numbering, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <div className="mt-3">
          <ToggleRow title="تعارفات و القاب رسمی" description="«ریاست محترم…»، «با سلام و احترام» و امضای رسمی" checked={draft.honorifics} onChange={(v) => set("honorifics", v)} />
        </div>
        <Field label="بلوک امضا" className="mt-3" hint="در انتهای اسناد تولیدی درج می‌شود">
          <textarea className="input resize-y" rows={2} value={draft.signature_block} onChange={(e) => set("signature_block", e.target.value)} />
        </Field>
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
