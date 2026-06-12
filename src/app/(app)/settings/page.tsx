import { BadgeCheck, Bot, Database, ShieldCheck } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/shared/bits";
import { Badge } from "@/components/ui/badge";
import { getDataSource } from "@/lib/data";
import { aiAvailable, hasAnthropic, hasOpenAI } from "@/lib/ai/providers";
import { isDemoMode } from "@/lib/supabase/server";
import { faNum } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const db = await getDataSource();
  const profile = await db.getProfile();
  const demo = isDemoMode();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="تنظیمات" subtitle="پروفایل، وضعیت اتصال‌ها و سیاست داده" />

      <section className="card p-5">
        <SectionTitle>پروفایل وکیل</SectionTitle>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-lg font-bold text-accent-strong ring-1 ring-accent-line">
            {profile.full_name.slice(0, 1)}
          </div>
          <div>
            <p className="text-[0.9rem] font-bold text-ink">{profile.full_name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {profile.bar_type === "kanoon" ? "کانون وکلای دادگستری" : profile.bar_type === "markaz" ? "مرکز وکلای قوه قضاییه" : "—"}
              {profile.bar_license_no && ` · پروانه ${faNum(profile.bar_license_no)}`}
              {profile.city && ` · ${profile.city}`}
            </p>
            {profile.firm_name && <p className="text-xs text-muted">{profile.firm_name}</p>}
          </div>
          <BadgeCheck className="ms-auto h-5 w-5 text-accent" />
        </div>
        {demo && (
          <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[0.66rem] leading-5 text-warn">
            در حالت نمایشی، پروفایل ثابت است. با اتصال Supabase، ثبت‌نام و پروفایل واقعی فعال می‌شود.
          </p>
        )}
      </section>

      <section className="card p-5">
        <SectionTitle>وضعیت سامانه</SectionTitle>
        <div className="space-y-2.5">
          <StatusRow
            icon={<Database className="h-4 w-4" />}
            title="پایگاه داده (Supabase)"
            ok={!demo}
            okText="متصل — RLS فعال"
            failText="حالت نمایشی (داده در حافظه) — NEXT_PUBLIC_SUPABASE_URL را تنظیم کنید"
          />
          <StatusRow
            icon={<Bot className="h-4 w-4" />}
            title="موتور هوش مصنوعی"
            ok={aiAvailable()}
            okText={`فعال — ${[hasAnthropic() && "Anthropic Claude", hasOpenAI() && "OpenAI"].filter(Boolean).join(" + ")}`}
            failText="کلیدی تنظیم نشده — پاسخ‌ها نمایشی است (ANTHROPIC_API_KEY / OPENAI_API_KEY)"
          />
          <StatusRow
            icon={<ShieldCheck className="h-4 w-4" />}
            title="موتور مواعد"
            ok
            okText="فعال — محاسبه قطعی بدون LLM (مواد ۴۴۳ تا ۴۴۵ ق.آ.د.م)"
            failText=""
          />
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle>سیاست داده و محرمانگی</SectionTitle>
        <ul className="list-disc space-y-2 ps-5 text-[0.74rem] leading-7 text-ink-2">
          <li>داده پرونده‌های شما فقط با شناسه کاربری خودتان قابل دسترسی است (Row-Level Security در پایگاه داده).</li>
          <li>در اقدامات هوشمند، فقط حداقلِ متنِ لازم (گزیده اسناد مرتبط) به ارائه‌دهنده مدل ارسال می‌شود؛ از داده شما برای آموزش مدل استفاده نمی‌شود.</li>
          <li>محاسبه تاریخ مواعد هرگز به مدل زبانی سپرده نمی‌شود؛ ایجنت پیشنهاد می‌دهد، موتور قواعد محاسبه می‌کند، شما تأیید می‌کنید.</li>
          <li>خروجی‌های هوش مصنوعی کمک تحلیلی‌اند؛ مسئولیت حرفه‌ای استناد با وکیل است و هر خروجی برچسب راستی‌آزمایی دارد.</li>
          <li>هر زمان بخواهید می‌توانید خروجی کامل داده‌ها (JSON + فایل‌ها) را دریافت کنید — معماری مهاجرت‌پذیر و قابل میزبانی شخصی است.</li>
        </ul>
      </section>

      <p className="text-center text-[0.62rem] text-faint">
        سیستم‌عامل حقوقی ایرانمنش · نسخه ۱٫۰ MVP · مستندات فنی در پوشه docs مخزن
      </p>
    </div>
  );
}

function StatusRow({
  icon,
  title,
  ok,
  okText,
  failText,
}: {
  icon: React.ReactNode;
  title: string;
  ok: boolean;
  okText: string;
  failText: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-raised px-3.5 py-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.76rem] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[0.66rem] leading-5 text-muted">{ok ? okText : failText}</p>
      </div>
      <Badge tone={ok ? "ok" : "warn"}>{ok ? "فعال" : "نمایشی"}</Badge>
    </div>
  );
}
