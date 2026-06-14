"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Clock,
  Laptop,
  ListChecks,
  Lock,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
} from "lucide-react";
import { toast } from "sonner";
import { revokeOtherSessionsAction, revokeSessionAction } from "@/app/(app)/settings/actions";
import { Field, OptionCards, SaveBar, SectionHeader, SettingsCard, ToggleRow } from "@/components/settings/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { TWOFA_FA, type AppSettings, type AuditLog, type TwoFAMethod, type UserSession } from "@/lib/domain/settings";
import { faNum, relativeDayFa } from "@/lib/jalali";

const DEVICE_ICON: Record<string, React.ReactNode> = {
  "لپ‌تاپ": <Laptop className="h-4 w-4" />,
  "موبایل": <Smartphone className="h-4 w-4" />,
  "تبلت": <Tablet className="h-4 w-4" />,
};

const AUDIT_TONE = { info: "neutral", security: "info", danger: "danger" } as const;

export function SecuritySection({
  settings,
  sessions,
  auditLogs,
}: {
  settings: AppSettings;
  sessions: UserSession[];
  auditLogs: AuditLog[];
}) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("security", settings.security);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <SectionHeader
        icon={<ShieldCheck />}
        title="امنیت و حریم خصوصی"
        description="ورود دو مرحله‌ای، مدیریت نشست‌ها، گزارش رویدادها و رمزنگاری — محافظت از اسرار موکلین"
      />

      <SettingsCard title="ورود دو مرحله‌ای (2FA)" icon={<Shield />} description="لایه دوم امنیتی هنگام ورود به حساب">
        <OptionCards
          value={draft.twofa}
          onChange={(v) => set("twofa", v as TwoFAMethod)}
          columns={3}
          options={(Object.entries(TWOFA_FA) as [TwoFAMethod, string][]).map(([value, label]) => ({
            value,
            label,
            hint: value === "totp" ? "Google Authenticator / Authy" : value === "sms" ? "کد یک‌بارمصرف پیامکی" : "بدون لایه دوم",
          }))}
        />
        {draft.twofa !== "none" && (
          <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-[0.66rem] leading-5 text-accent-strong">
            پس از ذخیره، در ورود بعدی مراحل فعال‌سازی {TWOFA_FA[draft.twofa]} نمایش داده می‌شود.
          </p>
        )}
      </SettingsCard>

      <SettingsCard title="سیاست‌های امنیتی" icon={<Lock />} className="mt-4">
        <Field label="انقضای خودکار نشست (دقیقه)" hint="پس از این مدت بی‌فعالیتی، خروج خودکار انجام می‌شود">
          <select className="input max-w-40" value={draft.session_timeout_min} onChange={(e) => set("session_timeout_min", Number(e.target.value))}>
            {[15, 30, 60, 120, 480].map((m) => (
              <option key={m} value={m}>{faNum(m)} دقیقه</option>
            ))}
          </select>
        </Field>
        <div className="mt-3">
          <ToggleRow title="رمزنگاری در حالت سکون" description="رمزنگاری متن اسناد و یادداشت‌ها در پایگاه داده" checked={draft.encryption_at_rest} onChange={(v) => set("encryption_at_rest", v)} />
          <ToggleRow title="ثبت گزارش رویدادها (Audit Log)" description="ثبت اقدامات حساس برای پیگیری و اثبات دقت حرفه‌ای" checked={draft.audit_log} onChange={(v) => set("audit_log", v)} />
          <ToggleRow title="احراز مجدد برای اقدامات حساس" description="درخواست گذرواژه هنگام خروجی داده یا حذف حساب" checked={draft.reauth_sensitive} onChange={(v) => set("reauth_sensitive", v)} />
          <ToggleRow title="پاک‌سازی داده حساس از درخواست‌های هوش مصنوعی" description="حذف خودکار کد ملی و شماره‌های حساس پیش از ارسال به مدل" checked={draft.ai_redaction} onChange={(v) => set("ai_redaction", v)} />
        </div>
      </SettingsCard>

      <SettingsCard
        title="نشست‌های فعال"
        icon={<Laptop />}
        description="دستگاه‌هایی که به حساب شما وارد شده‌اند"
        action={
          sessions.some((s) => !s.current) ? (
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => startTransition(async () => { await revokeOtherSessionsAction(); toast.success("سایر نشست‌ها خارج شدند"); router.refresh(); })}
              className="gap-1"
            >
              <LogOut className="h-3.5 w-3.5" /> خروج از سایر دستگاه‌ها
            </Button>
          ) : undefined
        }
        className="mt-4"
      >
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-line bg-raised px-3.5 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-inset text-ink-2">
                {DEVICE_ICON[s.device] ?? <Laptop className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[0.76rem] font-bold text-ink">{s.device} · {s.browser}</p>
                  {s.current && <Badge tone="ok">این دستگاه</Badge>}
                </div>
                <p className="mt-0.5 text-[0.62rem] text-muted">
                  {s.os} · {s.location} · {s.ip} · {relativeDayFa(s.last_active)}
                </p>
              </div>
              {!s.current && (
                <button
                  onClick={() => startTransition(async () => { await revokeSessionAction(s.id); toast.success("نشست خارج شد"); router.refresh(); })}
                  disabled={pending}
                  className="rounded-md px-2 py-1 text-[0.66rem] font-medium text-danger hover:bg-danger-soft"
                >
                  خروج
                </button>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="گزارش رویدادها" icon={<ListChecks />} description="آخرین اقدامات ثبت‌شده روی حساب شما" className="mt-4">
        <div className="space-y-1.5">
          {auditLogs.map((a) => (
            <div key={a.id} className="flex items-start gap-2.5 border-b border-line py-2 last:border-0">
              <span className={`mt-0.5 ${a.level === "danger" ? "text-danger" : a.level === "security" ? "text-info" : "text-faint"}`}>
                {a.level === "danger" ? <ShieldAlert className="h-3.5 w-3.5" /> : a.level === "security" ? <Shield className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[0.74rem] font-semibold text-ink">{a.action}</p>
                  <Badge tone={AUDIT_TONE[a.level]}>{a.level === "danger" ? "هشدار" : a.level === "security" ? "امنیتی" : "عادی"}</Badge>
                </div>
                <p className="mt-0.5 text-[0.64rem] leading-5 text-muted">{a.detail}</p>
                <p className="mt-0.5 text-[0.58rem] text-faint">{a.ip} · {relativeDayFa(a.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
