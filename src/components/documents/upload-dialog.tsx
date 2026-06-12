"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DOC_TYPE_FA } from "@/lib/domain/taxonomies";
import type { LegalCase } from "@/lib/domain/types";

/**
 * Upload → pipeline (docs/08 ingest). After processing, an ابلاغیه/دادنامه
 * offers the Deadline-Agent handoff (journey J1).
 */
export function UploadDialog({
  cases,
  defaultCaseId,
  defaultOpen,
  trigger,
}: {
  cases: Pick<LegalCase, "id" | "title">[];
  defaultCaseId?: string;
  defaultOpen?: boolean;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [tab, setTab] = useState<"file" | "text">("file");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (tab === "text" && !(fd.get("text") as string)?.trim()) {
      toast.error("متن سند را وارد کنید");
      return;
    }
    if (tab === "file" && !(fd.get("file") as File)?.size) {
      toast.error("فایل را انتخاب کنید");
      return;
    }
    if (tab === "file") fd.delete("text");
    else fd.delete("file");

    setBusy(true);
    toast.info("سند در حال پردازش است: استخراج متن، دسته‌بندی و خلاصه‌سازی…");
    try {
      const res = await fetch("/api/documents/process", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      const caseId = (fd.get("case_id") as string) || null;
      if (data.suggestDeadlineScan) {
        toast.success("سند پردازش شد — به نظر می‌رسد ابلاغیه/دادنامه است", {
          description: "می‌خواهید ایجنت مواعد مهلت قانونی آن را محاسبه کند؟",
          action: {
            label: "محاسبه موعد",
            onClick: () =>
              router.push(
                `/ai?agent=deadline_agent${caseId ? `&case=${caseId}` : ""}&q=${encodeURIComponent(
                  `سند «${data.document.title}» را بررسی کن؛ نوع رأی/ابلاغ و تاریخ ابلاغ را تشخیص بده و موعد قانونی مربوط را محاسبه و پیشنهاد کن.`,
                )}`,
              ),
          },
          duration: 12_000,
        });
      } else {
        toast.success("سند پردازش و آماده شد");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "پردازش سند ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="primary" className="gap-1.5">
            <Upload className="h-4 w-4" /> بارگذاری سند
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        title="بارگذاری سند"
        description="PDF متنی، تصویر سند یا متن چسبانده‌شده — استخراج، دسته‌بندی و خلاصه خودکار"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-1 rounded-lg border border-line bg-inset p-1 text-xs">
            {(
              [
                ["file", "فایل (PDF / تصویر)"],
                ["text", "چسباندن متن (ثنا)"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setTab(v)}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${tab === v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "file" ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-2 bg-raised px-4 py-8 text-center transition-colors hover:border-accent hover:bg-accent-soft/30">
              <FileUp className="h-6 w-6 text-faint" />
              <span className="text-xs font-medium text-ink-2">
                {fileName || "انتخاب فایل PDF یا تصویر"}
              </span>
              <span className="text-[0.6rem] text-muted">حداکثر ~۱۰ مگابایت</span>
              <input
                type="file"
                name="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
          ) : (
            <textarea
              name="text"
              rows={7}
              className="input resize-y"
              placeholder="متن ابلاغیه ثنا یا هر سند دیگر را اینجا بچسبانید…"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">عنوان</label>
              <input name="title" className="input" placeholder={fileName || "مثلاً: ابلاغیه دادنامه شعبه ۴"} />
            </div>
            <div>
              <label className="label">نوع (اختیاری — تشخیص خودکار)</label>
              <select name="doc_type" className="input" defaultValue="">
                <option value="">تشخیص خودکار</option>
                {Object.entries(DOC_TYPE_FA).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
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

          <div className="flex justify-end border-t border-line pt-3">
            <Button type="submit" variant="primary" disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {busy ? "در حال پردازش…" : "بارگذاری و پردازش"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
