"use client";

import { AlarmClockCheck } from "lucide-react";
import { Field, OptionCards, SaveBar, SectionHeader, SettingsCard, ToggleRow } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { DEADLINE_RULES } from "@/lib/domain/deadlines";
import { HOLIDAY_FA, type AppSettings, type HolidayCalendar } from "@/lib/domain/settings";
import { faNum } from "@/lib/jalali";

const OFFSET_OPTIONS = [14, 7, 3, 1];

export function DeadlinesSection({ settings }: { settings: AppSettings }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("deadlines", settings.deadlines);

  const toggleOffset = (v: number) =>
    set("reminder_offsets", draft.reminder_offsets.includes(v)
      ? draft.reminder_offsets.filter((x) => x !== v)
      : [...draft.reminder_offsets, v].sort((a, b) => b - a));

  return (
    <div>
      <SectionHeader
        icon={<AlarmClockCheck />}
        title="موتور مواعد قانونی"
        description="پیکربندی محاسبه قطعی مهلت‌ها (مواد ۴۴۳ تا ۴۴۵ ق.آ.د.م)، احتساب تعطیلات و یادآوری‌ها"
      />

      <div className="mb-4 rounded-xl border border-info-line bg-info-soft px-4 py-3">
        <p className="text-[0.72rem] leading-6 text-info">
          محاسبه تاریخ مواعد همیشه به‌صورت قطعی و بدون دخالت هوش مصنوعی انجام می‌شود؛ ایجنت‌ها فقط «پیشنهاد» می‌دهند و شما تأیید می‌کنید. هم‌اکنون <b>{faNum(DEADLINE_RULES.length)}</b> قاعده مواعد فعال است.
        </p>
      </div>

      <SettingsCard title="رفتار محاسبه">
        <ToggleRow title="محاسبه خودکار از ابلاغیه" description="هنگام بارگذاری ابلاغیه/دادنامه، موعد مربوط به‌صورت پیشنهاد ساخته شود" checked={draft.auto_compute} onChange={(v) => set("auto_compute", v)} />
        <ToggleRow title="انتقال روز جمعه" description="اگر آخرین روز موعد جمعه باشد، به شنبه منتقل شود (ماده ۴۴۴)" checked={draft.block_friday} onChange={(v) => set("block_friday", v)} />
        <ToggleRow title="پیش‌فرض «مقیم خارج از کشور»" description="مهلت‌ها به‌صورت پیش‌فرض با احتساب اقامت خارج محاسبه شوند" checked={draft.default_abroad} onChange={(v) => set("default_abroad", v)} />
      </SettingsCard>

      <SettingsCard title="تقویم تعطیلات" className="mt-4">
        <OptionCards
          value={draft.holiday_calendar}
          onChange={(v) => set("holiday_calendar", v as HolidayCalendar)}
          columns={2}
          options={(Object.entries(HOLIDAY_FA) as [HolidayCalendar, { label: string; hint: string }][]).map(([value, m]) => ({ value, label: m.label, hint: m.hint }))}
        />
      </SettingsCard>

      <SettingsCard title="یادآوری‌ها" description="چند روز قبل از سررسید به شما هشدار داده شود" className="mt-4">
        <div className="flex flex-wrap gap-1.5">
          {OFFSET_OPTIONS.map((o) => {
            const on = draft.reminder_offsets.includes(o);
            return (
              <button
                key={o}
                onClick={() => toggleOffset(o)}
                className={`chip transition-colors ${on ? "border-accent bg-accent-soft font-bold text-accent-strong" : "hover:border-line-2"}`}
              >
                {faNum(o)} روز قبل
              </button>
            );
          })}
        </div>
        <Field label="حاشیه امنیت (روز)" className="mt-4" hint="موعدهای پیشنهادی این تعداد روز زودتر در نظر گرفته شوند تا فرصت اقدام بماند">
          <input
            type="number"
            min={0}
            max={5}
            className="input max-w-28"
            value={draft.safety_buffer_days}
            onChange={(e) => set("safety_buffer_days", Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
          />
        </Field>
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
