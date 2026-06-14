"use client";

import { Check, Sparkles, X } from "lucide-react";
import { Field, OptionCards, SaveBar, SectionHeader, SettingsCard, ToggleRow } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { Badge } from "@/components/ui/badge";
import { MODEL_TIER_FA, type AppSettings, type ModelTierPref } from "@/lib/domain/settings";
import { faNum } from "@/lib/jalali";

export interface ProviderStatus {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
}

const PROVIDERS: { id: keyof ProviderStatus; name: string; role: string; models: string }[] = [
  { id: "anthropic", name: "Anthropic Claude", role: "موتور اصلی استدلال و ابزارها", models: "Opus / Sonnet / Haiku" },
  { id: "openai", name: "OpenAI GPT", role: "امبدینگ جستجوی معنایی + مسیر جایگزین", models: "GPT-4o / 4o-mini" },
  { id: "google", name: "Google Gemini", role: "ارائه‌دهنده اختیاری", models: "Gemini 1.5 / 2.0" },
];

export function AiSection({ settings, providers }: { settings: AppSettings; providers: ProviderStatus }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("ai", settings.ai);

  return (
    <div>
      <SectionHeader
        icon={<Sparkles />}
        title="ارائه‌دهندگان هوش مصنوعی"
        description="انتخاب مدل، رفتار پاسخ‌گویی و وضعیت اتصال ارائه‌دهندگان"
      />

      <SettingsCard title="وضعیت ارائه‌دهندگان" description="کلیدها به‌صورت امن و فقط سمت سرور نگه‌داری می‌شوند (در فایل محیط)">
        <div className="space-y-2">
          {PROVIDERS.map((p) => {
            const connected = providers[p.id];
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-raised px-3.5 py-2.5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${connected ? "bg-accent-soft text-accent" : "bg-inset text-faint"}`}>
                  {connected ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[0.78rem] font-bold text-ink">{p.name}</p>
                    <Badge tone={connected ? "ok" : "neutral"}>{connected ? "متصل" : "متصل نیست"}</Badge>
                  </div>
                  <p className="mt-0.5 text-[0.64rem] text-muted">{p.role} · {p.models}</p>
                </div>
                {draft.primary_provider === p.id && <Badge tone="accent">اصلی</Badge>}
              </div>
            );
          })}
        </div>
        <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-[0.64rem] leading-5 text-info">
          برای اتصال، کلید مربوطه را در متغیرهای محیط (`ANTHROPIC_API_KEY`، `OPENAI_API_KEY`) قرار دهید. بدون کلید، پاسخ‌ها در حالت نمایشی ارائه می‌شوند.
        </p>
      </SettingsCard>

      <SettingsCard title="ارائه‌دهنده اصلی" className="mt-4">
        <OptionCards
          value={draft.primary_provider}
          onChange={(v) => set("primary_provider", v as AppSettings["ai"]["primary_provider"])}
          columns={3}
          options={[
            { value: "anthropic", label: "Anthropic", hint: "Claude — پیشنهادی" },
            { value: "openai", label: "OpenAI", hint: "GPT-4o" },
            { value: "google", label: "Google", hint: "Gemini" },
          ]}
        />
      </SettingsCard>

      <SettingsCard title="سطح کیفیت مدل" description="تعادل سرعت/هزینه در برابر عمق تحلیل" className="mt-4">
        <OptionCards
          value={draft.model_tier}
          onChange={(v) => set("model_tier", v as ModelTierPref)}
          columns={3}
          options={(Object.entries(MODEL_TIER_FA) as [ModelTierPref, { label: string; hint: string }][]).map(([value, m]) => ({ value, label: m.label, hint: m.hint }))}
        />
        <Field label={`خلاقیت پاسخ (دما): ${faNum(draft.temperature.toFixed(1))}`} className="mt-4" hint="پایین‌تر = دقیق‌تر و محافظه‌کارتر؛ بالاتر = خلاقانه‌تر">
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={draft.temperature}
            onChange={(e) => set("temperature", Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
        </Field>
      </SettingsCard>

      <SettingsCard title="رفتار و ایمنی پاسخ‌گویی" className="mt-4">
        <ToggleRow title="الزام استناد" description="هر ادعای حقوقی باید به ماده قانونی یا سند استناد شود" checked={draft.require_citations} onChange={(v) => set("require_citations", v)} />
        <ToggleRow title="قفل حوزه قضایی ایران" description="پاسخ‌ها محدود به حقوق ایران؛ جلوگیری از استناد به قوانین خارجی" checked={draft.jurisdiction_lock} onChange={(v) => set("jurisdiction_lock", v)} />
        <ToggleRow title="امتناع بدون منبع" description="اگر منبع کافی نبود، صریحاً اعلام کند به‌جای حدس زدن" checked={draft.refuse_without_source} onChange={(v) => set("refuse_without_source", v)} />
        <ToggleRow title="نمایش مراحل پردازش" description="نمایش «در حال جستجوی مواد قانونی…» هنگام کار ایجنت" checked={draft.stream_thoughts} onChange={(v) => set("stream_thoughts", v)} />
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
