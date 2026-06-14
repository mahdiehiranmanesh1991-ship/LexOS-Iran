"use client";

import { UserRound } from "lucide-react";
import { Field, SaveBar, SectionHeader, SettingsCard } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import type { AppSettings } from "@/lib/domain/settings";

const COLORS = ["#047857", "#0369a1", "#7c3aed", "#be123c", "#b45309", "#0f766e", "#4338ca"];

export function ProfileSection({ settings }: { settings: AppSettings }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("profile", settings.profile);

  return (
    <div>
      <SectionHeader
        icon={<UserRound />}
        title="حساب و پروفایل"
        description="هویت شما در سامانه و آنچه در سربرگ اسناد و ارتباطات نمایش داده می‌شود"
      />

      <SettingsCard title="هویت نمایشی">
        <div className="flex items-center gap-4 border-b border-line pb-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm"
            style={{ background: draft.avatar_color }}
          >
            {draft.display_name.slice(0, 1) || "و"}
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold text-ink-2">رنگ آواتار</p>
            <div className="mt-1.5 flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("avatar_color", c)}
                  className="h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-transform hover:scale-110"
                  style={{ background: c, boxShadow: draft.avatar_color === c ? `0 0 0 2px ${c}` : "none" }}
                  aria-label="انتخاب رنگ"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="نام نمایشی">
            <input className="input" value={draft.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="دکتر مهدیه ایرانمنش" />
          </Field>
          <Field label="عنوان / سمت">
            <input className="input" value={draft.headline} onChange={(e) => set("headline", e.target.value)} placeholder="وکیل پایه یک دادگستری" />
          </Field>
        </div>
        <Field label="درباره من" className="mt-4" hint="در پروفایل و برخی سربرگ‌ها قابل استفاده است">
          <textarea className="input resize-y" rows={3} value={draft.bio} onChange={(e) => set("bio", e.target.value)} placeholder="خلاصه‌ای از سابقه و حوزه تخصص شما" />
        </Field>
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
