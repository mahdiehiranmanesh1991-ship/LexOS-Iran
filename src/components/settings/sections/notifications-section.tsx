"use client";

import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { SaveBar, SectionHeader, SettingsCard, ToggleRow } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { Switch } from "@/components/ui/switch";
import type { AppSettings } from "@/lib/domain/settings";

export function NotificationsSection({ settings }: { settings: AppSettings }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("notifications", settings.notifications);

  return (
    <div>
      <SectionHeader
        icon={<Bell />}
        title="اعلان‌ها"
        description="انتخاب کانال‌ها و رویدادهایی که می‌خواهید درباره‌شان مطلع شوید"
      />

      <SettingsCard title="کانال‌های اطلاع‌رسانی">
        <div className="space-y-2">
          <ChannelRow icon={<Bell className="h-4 w-4" />} title="درون‌برنامه‌ای" desc="اعلان در زنگوله بالای صفحه" checked={draft.channel_in_app} onChange={(v) => set("channel_in_app", v)} />
          <ChannelRow icon={<Mail className="h-4 w-4" />} title="ایمیل" desc="ارسال به ایمیل ثبت‌شده" checked={draft.channel_email} onChange={(v) => set("channel_email", v)} />
          <ChannelRow icon={<Smartphone className="h-4 w-4" />} title="پیامک" desc="هشدار مواعد بحرانی با پیامک (نیازمند اتصال سرویس پیامک)" checked={draft.channel_sms} onChange={(v) => set("channel_sms", v)} />
        </div>
      </SettingsCard>

      <SettingsCard title="رویدادها" className="mt-4">
        <ToggleRow title="مواعد قانونی" description="هشدار نزدیک‌شدن سررسید مهلت‌ها" checked={draft.on_deadline} onChange={(v) => set("on_deadline", v)} />
        <ToggleRow title="جلسات دادرسی" description="یادآوری جلسات پیش رو" checked={draft.on_hearing} onChange={(v) => set("on_hearing", v)} />
        <ToggleRow title="آماده‌شدن اسناد" description="پایان پردازش و خلاصه‌سازی سند بارگذاری‌شده" checked={draft.on_document_ready} onChange={(v) => set("on_document_ready", v)} />
        <ToggleRow title="تکمیل تحلیل هوشمند" description="آماده‌شدن تحلیل پرونده یا قرارداد توسط ایجنت" checked={draft.on_agent_done} onChange={(v) => set("on_agent_done", v)} />
      </SettingsCard>

      <SettingsCard title="خلاصه و آرامش" icon={<MessageSquare />} className="mt-4">
        <ToggleRow title="خلاصه روزانه" description="هر صبح، فهرست جلسات و مواعد امروز و فردا" checked={draft.daily_digest} onChange={(v) => set("daily_digest", v)} />
        <ToggleRow title="ساعات سکوت (شب)" description="عدم ارسال اعلان غیربحرانی در ساعات شب" checked={draft.quiet_hours} onChange={(v) => set("quiet_hours", v)} />
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}

function ChannelRow({
  icon, title, desc, checked, onChange,
}: { icon: React.ReactNode; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-raised px-3.5 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.78rem] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[0.64rem] text-muted">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
