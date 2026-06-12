"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, FileSearch, Gavel, Home, Loader2, ShieldAlert, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CaseType } from "@/lib/domain/types";

const ACTIONS: {
  kind: string;
  label: string;
  icon: React.ReactNode;
  hint: string;
  show?: (t: CaseType) => boolean;
}[] = [
  { kind: "case_analysis", label: "تحلیل جامع پرونده", icon: <Bot className="h-3.5 w-3.5" />, hint: "وضعیت، ارکان، ریسک‌ها و فرصت‌ها" },
  { kind: "strategy", label: "استراتژی دعوا", icon: <Swords className="h-3.5 w-3.5" />, hint: "ایرادات محتمل، استدلال‌ها، نقشه راه" },
  { kind: "evidence_review", label: "بررسی ادله", icon: <FileSearch className="h-3.5 w-3.5" />, hint: "نگاشت ادله به ارکان + خلأها" },
  { kind: "hearing_prep", label: "آماده‌سازی جلسه", icon: <Gavel className="h-3.5 w-3.5" />, hint: "گزارش ترکیبی چند ایجنت برای جلسه" },
  { kind: "contract_review", label: "بررسی قرارداد", icon: <ShieldAlert className="h-3.5 w-3.5" />, hint: "بندهای پرریسک و خلأها", show: (t) => ["civil", "commercial", "property"].includes(t) },
  { kind: "property_analysis", label: "تحلیل ملکی", icon: <Home className="h-3.5 w-3.5" />, hint: "تطبیق عنوان دعوا، دکترین املاک", show: (t) => t === "property" },
];

/** One-click structured analyses (docs/09 composite plans surface here). */
export function AnalyzeLauncher({ caseId, caseType }: { caseId: string; caseType: CaseType }) {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);

  async function run(kind: string, label: string) {
    setRunning(kind);
    toast.info(`${label} آغاز شد — بسته به حجم پرونده تا یک دقیقه طول می‌کشد`);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, kind }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${label} آماده شد`);
      router.refresh();
    } catch {
      toast.error(`${label} ناموفق بود — دوباره تلاش کنید`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {ACTIONS.filter((a) => !a.show || a.show(caseType)).map((a) => (
        <Button
          key={a.kind}
          variant="secondary"
          disabled={running !== null}
          onClick={() => run(a.kind, a.label)}
          className="h-auto flex-col items-start gap-0.5 px-3.5 py-2.5"
        >
          <span className="flex items-center gap-1.5 text-[0.76rem] font-bold text-ink">
            {running === a.kind ? <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" /> : <span className="text-accent">{a.icon}</span>}
            {a.label}
          </span>
          <span className="text-[0.62rem] font-normal text-muted">{a.hint}</span>
        </Button>
      ))}
    </div>
  );
}
