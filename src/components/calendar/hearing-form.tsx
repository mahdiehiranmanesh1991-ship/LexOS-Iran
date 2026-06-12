"use client";

import { useState, useTransition } from "react";
import { Gavel } from "lucide-react";
import { toast } from "sonner";
import { createHearingAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { HEARING_KIND_FA } from "@/lib/domain/taxonomies";
import type { LegalCase } from "@/lib/domain/types";

export function HearingFormDialog({
  cases,
  defaultCaseId,
  trigger,
}: {
  cases: Pick<LegalCase, "id" | "title">[];
  defaultCaseId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="md" className="gap-1.5">
            <Gavel className="h-4 w-4" /> ثبت جلسه
          </Button>
        )}
      </DialogTrigger>
      <DialogContent title="ثبت جلسه دادرسی">
        <form
          action={(fd) =>
            startTransition(async () => {
              try {
                await createHearingAction(fd);
                toast.success("جلسه ثبت شد");
                setOpen(false);
              } catch {
                toast.error("ثبت جلسه ناموفق بود");
              }
            })
          }
          className="space-y-4"
        >
          <div>
            <label className="label">پرونده *</label>
            <select name="case_id" className="input" required defaultValue={defaultCaseId ?? ""}>
              <option value="" disabled>— انتخاب پرونده —</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">تاریخ (جلالی) *</label>
              <input name="date" className="input" placeholder="۱۴۰۵/۰۴/۰۲" required />
            </div>
            <div>
              <label className="label">ساعت</label>
              <input name="time" className="input" placeholder="10:00" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="label">نوع جلسه</label>
            <select name="kind" className="input" defaultValue="trial">
              {Object.entries(HEARING_KIND_FA).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">محل (مجتمع / شعبه)</label>
            <input name="location" className="input" placeholder="مجتمع قضایی شهید بهشتی — شعبه ۱۲" />
          </div>
          <div>
            <label className="label">یادداشت آمادگی</label>
            <textarea name="notes" rows={2} className="input resize-y" placeholder="مدارک همراه، شهود، نکات جلسه…" />
          </div>
          <div className="flex justify-end border-t border-line pt-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "در حال ثبت…" : "ثبت جلسه"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
