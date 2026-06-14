"use client";

import { useState } from "react";
import { AlertTriangle, Database, DatabaseBackup, Download, FileJson, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader, SettingsCard } from "@/components/settings/primitives";
import { Button } from "@/components/ui/button";

export function BackupSection() {
  const [exporting, setExporting] = useState<string | null>(null);

  function fakeExport(kind: string, label: string) {
    setExporting(kind);
    setTimeout(() => {
      setExporting(null);
      toast.success(`${label} آماده شد`, { description: "در نسخه کامل، فایل خروجی دانلود می‌شود." });
    }, 1200);
  }

  return (
    <div>
      <SectionHeader
        icon={<DatabaseBackup />}
        title="پشتیبان‌گیری و خروجی"
        description="کنترل کامل بر داده‌های خود — خروجی، پشتیبان و حذف. داده شما متعلق به شماست و قابل انتقال است"
      />

      <SettingsCard title="خروجی داده‌ها" icon={<Download />} description="دریافت نسخه کامل و قابل‌انتقال از اطلاعات شما">
        <div className="grid gap-2 sm:grid-cols-3">
          <ExportButton icon={<FileJson className="h-4 w-4" />} title="خروجی JSON" desc="کل داده‌ها (پرونده‌ها، اسناد، مواعد)" loading={exporting === "json"} onClick={() => fakeExport("json", "خروجی JSON")} />
          <ExportButton icon={<FileText className="h-4 w-4" />} title="خروجی PDF" desc="گزارش خوانا از پرونده‌ها" loading={exporting === "pdf"} onClick={() => fakeExport("pdf", "خروجی PDF")} />
          <ExportButton icon={<Database className="h-4 w-4" />} title="پشتیبان کامل" desc="آرشیو فشرده شامل فایل‌ها" loading={exporting === "zip"} onClick={() => fakeExport("zip", "پشتیبان کامل")} />
        </div>
        <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-[0.64rem] leading-5 text-info">
          معماری سامانه مهاجرت‌پذیر است: می‌توانید داده خود را خروجی بگیرید و روی نمونه‌ی خودمیزبان (Self-hosted) منتقل کنید.
        </p>
      </SettingsCard>

      <SettingsCard title="پشتیبان‌گیری خودکار" icon={<DatabaseBackup />} className="mt-4">
        <div className="flex items-center justify-between rounded-xl border border-line bg-raised px-3.5 py-3">
          <div>
            <p className="text-[0.76rem] font-bold text-ink">پشتیبان روزانه ابری</p>
            <p className="mt-0.5 text-[0.64rem] text-muted">در پلن حرفه‌ای و بالاتر فعال است (Point-in-Time Recovery)</p>
          </div>
          <span className="chip border-accent-line bg-accent-soft text-accent-strong">فعال</span>
        </div>
      </SettingsCard>

      <SettingsCard title="منطقه خطر" className="mt-4 border-danger-line">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger-line bg-danger-soft/50 px-3.5 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-[0.76rem] font-bold text-danger">حذف حساب و تمام داده‌ها</p>
              <p className="mt-0.5 text-[0.64rem] leading-5 text-danger/80">این عمل غیرقابل بازگشت است. پیش از حذف، حتماً خروجی کامل تهیه کنید.</p>
            </div>
          </div>
          <Button
            variant="danger"
            className="gap-1.5"
            onClick={() => toast.error("حذف حساب", { description: "برای ایمنی، این اقدام در نسخه نمایشی غیرفعال است." })}
          >
            <Trash2 className="h-3.5 w-3.5" /> حذف حساب
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}

function ExportButton({
  icon, title, desc, loading, onClick,
}: { icon: React.ReactNode; title: string; desc: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-start gap-1 rounded-xl border border-line bg-surface p-3 text-start transition-all hover:-translate-y-px hover:border-accent-line hover:bg-accent-soft/30 disabled:opacity-60"
    >
      <span className="flex items-center gap-1.5 text-accent">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        <span className="text-[0.76rem] font-bold text-ink">{title}</span>
      </span>
      <span className="text-[0.62rem] leading-5 text-muted">{desc}</span>
    </button>
  );
}
