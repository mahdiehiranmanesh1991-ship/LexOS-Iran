"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarClock, Info } from "lucide-react";
import { toast } from "sonner";
import { createDeadlineAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DEADLINE_RULES } from "@/lib/domain/deadlines";
import type { LegalCase } from "@/lib/domain/types";
import { enNum } from "@/lib/jalali";

interface ComputePreview {
  due_at_fa: string;
  explanation: string;
  days: number;
}

/**
 * Deadline creation with the verifiability contract (docs/10):
 * rule + trigger + arithmetic + result are always visible before saving.
 */
export function DeadlineFormDialog({
  cases,
  defaultCaseId,
  trigger,
  defaultOpen,
}: {
  cases: Pick<LegalCase, "id" | "title">[];
  defaultCaseId?: string;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [mode, setMode] = useState<"rule" | "manual">("rule");
  const [ruleCode, setRuleCode] = useState("appeal_civil");
  const [triggerDate, setTriggerDate] = useState("");
  const [isAbroad, setIsAbroad] = useState(false);
  // Preview is keyed by the inputs that produced it, so a stale result is
  // simply not shown — no state reset needed when inputs change.
  const [computed, setComputed] = useState<{ key: string; data: ComputePreview } | null>(null);
  const [pending, startTransition] = useTransition();

  const rule = useMemo(() => DEADLINE_RULES.find((r) => r.code === ruleCode), [ruleCode]);
  const normalizedTrigger = enNum(triggerDate.trim());
  const previewKey = `${ruleCode}|${normalizedTrigger}|${isAbroad}`;
  const preview = computed?.key === previewKey ? computed.data : null;

  useEffect(() => {
    if (mode !== "rule" || !/^\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}$/.test(normalizedTrigger)) return;
    const controller = new AbortController();
    const key = previewKey;
    fetch("/api/deadlines/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rule_code: ruleCode, trigger_date: normalizedTrigger, is_abroad: isAbroad }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setComputed({ key, data: d }))
      .catch(() => {});
    return () => controller.abort();
  }, [mode, ruleCode, normalizedTrigger, isAbroad, previewKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="primary" size="md" className="gap-1.5">
            <CalendarClock className="h-4 w-4" /> ثبت موعد
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        title="ثبت موعد قانونی"
        description="محاسبه با موتور قواعد انجام می‌شود — قاعده، مبدأ و نتیجه را همیشه ببینید و راستی‌آزمایی کنید"
      >
        <form
          action={(fd) =>
            startTransition(async () => {
              try {
                await createDeadlineAction(fd);
                toast.success("موعد ثبت شد");
                setOpen(false);
              } catch {
                toast.error("ثبت موعد ناموفق بود — ورودی‌ها را بررسی کنید");
              }
            })
          }
          className="space-y-4"
        >
          <input type="hidden" name="mode" value={mode} />
          <div className="flex gap-1 rounded-lg border border-line bg-inset p-1 text-xs">
            {(
              [
                ["rule", "بر اساس قاعده قانونی"],
                ["manual", "دستی"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v)}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
                  mode === v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div>
            <label className="label">پرونده</label>
            <select name="case_id" className="input" defaultValue={defaultCaseId ?? ""}>
              <option value="">— بدون پرونده —</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {mode === "rule" ? (
            <>
              <div>
                <label className="label">قاعده (موعد قانونی)</label>
                <select
                  name="rule_code"
                  className="input"
                  value={ruleCode}
                  onChange={(e) => setRuleCode(e.target.value)}
                >
                  {DEADLINE_RULES.map((r) => (
                    <option key={r.code} value={r.code}>{r.title_fa}</option>
                  ))}
                </select>
                {rule && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[0.64rem] leading-5 text-muted">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-info" />
                    {rule.description_fa} ({rule.citation})
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">تاریخ ابلاغ / مبدأ (جلالی)</label>
                  <input
                    name="trigger_date"
                    className="input"
                    placeholder="۱۴۰۵/۰۳/۲۲"
                    value={triggerDate}
                    onChange={(e) => setTriggerDate(e.target.value)}
                    required
                  />
                </div>
                <label className="mt-6 flex cursor-pointer items-center gap-2 text-xs text-ink-2">
                  <input
                    type="checkbox"
                    name="is_abroad"
                    checked={isAbroad}
                    onChange={(e) => setIsAbroad(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                  />
                  مقیم خارج از کشور
                </label>
              </div>
              {preview && (
                <div className="rounded-xl border border-accent-line bg-accent-soft px-3.5 py-3">
                  <p className="text-[0.8rem] font-extrabold text-accent-strong">
                    آخرین روز: {preview.due_at_fa}
                  </p>
                  <p className="mt-1 text-[0.66rem] leading-5 text-accent-strong/80">
                    {preview.explanation}
                  </p>
                </div>
              )}
              <div>
                <label className="label">عنوان (اختیاری — پیش‌فرض: نام قاعده)</label>
                <input name="title" className="input" placeholder={rule?.title_fa} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">عنوان موعد *</label>
                <input name="title" className="input" required placeholder="مثلاً: تقدیم لایحه تکمیلی" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">سررسید (جلالی) *</label>
                  <input name="due_at" className="input" placeholder="۱۴۰۵/۰۴/۱۰" required />
                </div>
                <div>
                  <label className="label">اهمیت</label>
                  <select name="priority" className="input" defaultValue="high">
                    <option value="critical">بحرانی</option>
                    <option value="high">مهم</option>
                    <option value="normal">عادی</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="label">یادداشت</label>
            <textarea name="notes" rows={2} className="input resize-y" />
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-3">
            <Button type="submit" variant="primary" disabled={pending || (mode === "rule" && !preview)}>
              {pending ? "در حال ثبت…" : "ثبت موعد"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
