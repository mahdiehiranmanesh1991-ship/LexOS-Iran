"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { DraftTemplate, LegalCase } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function DraftGenerator({
  templates,
  cases,
  defaultCaseId,
}: {
  templates: DraftTemplate[];
  cases: Pick<LegalCase, "id" | "title">[];
  defaultCaseId?: string;
}) {
  const router = useRouter();
  const [templateCode, setTemplateCode] = useState(templates[0]?.code ?? "");
  const [caseId, setCaseId] = useState(defaultCaseId ?? "");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = templates.find((t) => t.code === templateCode);

  async function generate() {
    setBusy(true);
    toast.info("ایجنت نگارش مشغول است — مشخصات پرونده و مواد مرتبط را جمع می‌کند…");
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          templateCode,
          caseId: caseId || null,
          instructions: instructions || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      toast.success("پیش‌نویس آماده شد");
      router.push(`/drafts/${data.draft.id}`);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "تولید پیش‌نویس ناموفق بود");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="label">۱ — نوع سند</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => setTemplateCode(t.code)}
              className={cn(
                "rounded-xl border p-3.5 text-start transition-all",
                templateCode === t.code
                  ? "border-accent bg-accent-soft shadow-sm"
                  : "border-line bg-surface hover:border-line-2 hover:bg-raised",
              )}
            >
              <p className={cn("text-[0.8rem] font-bold", templateCode === t.code ? "text-accent-strong" : "text-ink")}>
                {t.title_fa}
              </p>
              <p className="mt-1 text-[0.64rem] leading-5 text-muted">{t.description_fa}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="label">۲ — پرونده (برای پر شدن خودکار مشخصات)</p>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input">
            <option value="">بدون پرونده — سند مستقل</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="label">۳ — دستور نگارش</p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="input resize-y"
          placeholder={`مثلاً: «${
            selected?.doc_kind === "brief"
              ? "رد ادعای مطالبه وجه؛ استناد به پرداخت قبلی و ایراد مرور زمان چک"
              : "بر مبنای سند رسمی مالکیت، خلع ید و قلع بنا و اجرت‌المثل از تاریخ اظهارنامه"
          }»`}
        />
        <p className="mt-1 text-[0.62rem] leading-5 text-muted">
          ایجنت از ساختار رسمی قالب پیروی می‌کند، مشخصات را از پرونده می‌خواند و مواد استنادی را از پیکره قوانین تأیید می‌کند.
        </p>
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button variant="primary" size="lg" disabled={busy || !templateCode} onClick={generate} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "در حال نگارش…" : "تولید پیش‌نویس"}
        </Button>
      </div>
    </div>
  );
}
