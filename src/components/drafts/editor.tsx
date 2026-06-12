"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Eye, Loader2, PencilLine, Printer, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { saveDraftAction } from "@/app/actions";
import { Markdown } from "@/components/shared/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Draft } from "@/lib/domain/types";
import { faNum } from "@/lib/jalali";
import { cn } from "@/lib/utils";

const REVISE_PRESETS = [
  "رسمی‌تر و حقوقی‌تر بازنویسی کن",
  "مبانی قانونی را با ذکر مواد تقویت کن",
  "خلاصه‌تر و منسجم‌تر کن",
  "ایرادات شکلی احتمالی را اصلاح کن",
];

export function DraftEditor({ draft }: { draft: Draft }) {
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content_md);
  const [view, setView] = useState<"edit" | "preview">("preview");
  const [version, setVersion] = useState(draft.version);
  const [status, setStatus] = useState(draft.status);
  const [revising, setRevising] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [pending, startTransition] = useTransition();

  function save(next?: { status?: "draft" | "final" }) {
    startTransition(async () => {
      await saveDraftAction(draft.id, { title, content_md: content, ...next });
      setVersion((v) => v + 1);
      if (next?.status) setStatus(next.status);
      toast.success(next?.status === "final" ? "سند نهایی شد" : `نسخه ${faNum(version + 1)} ذخیره شد`);
    });
  }

  async function revise(instruction: string) {
    if (!instruction.trim()) return;
    setRevising(true);
    toast.info("ایجنت نگارش در حال بازنویسی است…");
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "revise", draftId: draft.id, content, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setContent(data.content);
      setVersion((v) => v + 1);
      setCustomInstruction("");
      toast.success("بازنویسی انجام شد — متن جدید را مرور کنید");
    } catch {
      toast.error("بازنویسی ناموفق بود");
    } finally {
      setRevising(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input h-9 max-w-md flex-1 text-[0.85rem] font-bold"
        />
        <Badge tone={status === "final" ? "ok" : "neutral"}>
          {status === "final" ? "نهایی" : `نسخه ${faNum(version)}`}
        </Badge>
        <div className="ms-auto flex items-center gap-1.5">
          <div className="flex gap-1 rounded-lg border border-line bg-inset p-0.5 text-xs">
            <button
              onClick={() => setView("preview")}
              className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 font-medium", view === "preview" ? "bg-surface text-ink shadow-sm" : "text-muted")}
            >
              <Eye className="h-3.5 w-3.5" /> پیش‌نمایش
            </button>
            <button
              onClick={() => setView("edit")}
              className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 font-medium", view === "edit" ? "bg-surface text-ink shadow-sm" : "text-muted")}
            >
              <PencilLine className="h-3.5 w-3.5" /> ویرایش
            </button>
          </div>
          <Button size="md" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> چاپ
          </Button>
          <Button size="md" disabled={pending} onClick={() => save()} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> ذخیره نسخه
          </Button>
          <Button size="md" variant="primary" disabled={pending || status === "final"} onClick={() => save({ status: "final" })} className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> نهایی‌سازی
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="card print-sheet min-h-[28rem] p-6">
          {view === "edit" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-[34rem] w-full resize-y border-0 bg-transparent text-[0.85rem] leading-8 text-ink outline-none"
              placeholder="متن سند…"
            />
          ) : (
            <Markdown className="[&>*:first-child]:mt-0">{content || "*سند خالی است — وارد حالت ویرایش شوید.*"}</Markdown>
          )}
        </div>

        <aside className="space-y-3 no-print">
          <div className="card p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[0.74rem] font-bold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> بازنویسی با ایجنت نگارش
            </p>
            <div className="space-y-1.5">
              {REVISE_PRESETS.map((p) => (
                <button
                  key={p}
                  disabled={revising}
                  onClick={() => revise(p)}
                  className="w-full rounded-lg border border-line bg-raised px-3 py-2 text-start text-[0.68rem] leading-5 text-ink-2 transition-all hover:border-accent-line hover:bg-accent-soft/40 disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                rows={3}
                disabled={revising}
                className="input resize-none text-[0.7rem]"
                placeholder="دستور دلخواه: «بند دفاع دوم را با ماده ۲۳۰ تقویت کن»"
              />
              <Button
                size="sm"
                variant="primary"
                disabled={revising || !customInstruction.trim()}
                onClick={() => revise(customInstruction)}
                className="mt-2 w-full gap-1.5"
              >
                {revising ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                اجرای دستور
              </Button>
            </div>
          </div>
          <p className="px-1 text-[0.6rem] leading-5 text-faint">
            ⚖️ متن تولید هوش مصنوعی است؛ پیش از امضا و تقدیم، مشخصات و استنادات را شخصاً کنترل کنید.
          </p>
        </aside>
      </div>
    </div>
  );
}
