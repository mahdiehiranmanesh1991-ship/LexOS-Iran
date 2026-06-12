"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createContactAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CONTACT_KIND_FA } from "@/lib/domain/taxonomies";

export function ContactFormDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" className="gap-1.5">
          <UserPlus className="h-4 w-4" /> مخاطب جدید
        </Button>
      </DialogTrigger>
      <DialogContent title="افزودن مخاطب" description="موکل، طرف مقابل، وکیل، قاضی یا کارشناس">
        <form
          action={(fd) =>
            startTransition(async () => {
              try {
                await createContactAction(fd);
                toast.success("مخاطب ثبت شد");
                setOpen(false);
              } catch {
                toast.error("ثبت مخاطب ناموفق بود");
              }
            })
          }
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">نقش *</label>
              <select name="kind" className="input" defaultValue="client">
                {Object.entries(CONTACT_KIND_FA).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">نوع شخص</label>
              <select name="person_type" className="input" defaultValue="natural">
                <option value="natural">حقیقی</option>
                <option value="legal">حقوقی (شرکت/مؤسسه)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">نام کامل *</label>
            <input name="full_name" required className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">کد ملی / شناسه ملی</label>
              <input name="national_id" className="input" dir="ltr" />
              <p className="mt-1 text-[0.6rem] text-muted">برای بررسی خودکار تعارض منافع استفاده می‌شود</p>
            </div>
            <div>
              <label className="label">تلفن</label>
              <input name="phone" className="input" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">شهر</label>
              <input name="city" className="input" />
            </div>
            <div>
              <label className="label">ایمیل</label>
              <input name="email" className="input" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="label">نشانی</label>
            <input name="address" className="input" />
          </div>
          <div>
            <label className="label">یادداشت</label>
            <textarea name="notes" rows={2} className="input resize-y" placeholder="معرف، سابقه پرداخت، نکات رفتاری…" />
          </div>
          <div className="flex justify-end border-t border-line pt-3">
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "در حال ثبت…" : "ثبت مخاطب"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
