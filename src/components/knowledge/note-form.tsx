"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createNoteAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { NOTE_KIND_FA } from "@/lib/domain/taxonomies";
import type { LegalCase } from "@/lib/domain/types";

export function NoteFormDialog({ cases }: { cases: Pick<LegalCase, "id" | "title">[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" className="gap-1.5">
          <Plus className="h-4 w-4" /> یادداشت جدید
        </Button>
      </DialogTrigger>
      <DialogContent
        title="افزودن به گنجینه دانش"
        description="استدلال برنده، تجربه شعبه، رویه قضایی — برای همیشه قابل جستجو می‌شود"
        wide
      >
        <form
          action={(fd) =>
            startTransition(async () => {
              try {
                await createNoteAction(fd);
                toast.success("به گنجینه دانش افزوده شد");
                setOpen(false);
              } catch {
                toast.error("ثبت یادداشت ناموفق بود");
              }
            })
          }
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">نوع</label>
              <select name="kind" className="input" defaultValue="argument">
                {Object.entries(NOTE_KIND_FA).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">عنوان *</label>
              <input name="title" required className="input" placeholder="مثلاً: استدلال خلع ید وقتی خوانده مدعی بیع است" />
            </div>
          </div>
          <div>
            <label className="label">متن *</label>
            <textarea name="content_md" required rows={7} className="input resize-y" placeholder="متن کامل استدلال/تجربه — Markdown پشتیبانی می‌شود" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">برچسب‌ها (با ویرگول)</label>
              <input name="tags" className="input" placeholder="خلع ید، سند رسمی" />
            </div>
            <div>
              <label className="label">پرونده مرتبط</label>
              <select name="case_id" className="input" defaultValue="">
                <option value="">—</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">نتیجه</label>
              <select name="outcome" className="input" defaultValue="na">
                <option value="na">—</option>
                <option value="won">جواب داد (برد)</option>
                <option value="lost">جواب نداد</option>
                <option value="pending">در انتظار نتیجه</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end border-t border-line pt-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "در حال ثبت…" : "ثبت در گنجینه"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
