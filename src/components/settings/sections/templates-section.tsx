"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileStack, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCustomTemplateAction, deleteCustomTemplateAction } from "@/app/(app)/settings/actions";
import { SectionHeader, SettingsCard } from "@/components/settings/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DRAFT_KIND_FA } from "@/lib/domain/taxonomies";
import type { DraftKind } from "@/lib/domain/types";
import type { CustomTemplate } from "@/lib/domain/settings";
import { relativeDayFa } from "@/lib/jalali";

export function TemplatesSection({
  systemTemplates,
  customTemplates,
}: {
  systemTemplates: { code: string; title_fa: string; doc_kind: string; description_fa: string }[];
  customTemplates: CustomTemplate[];
}) {
  const router = useRouter();
  const [removing, startRemove] = useTransition();

  return (
    <div>
      <SectionHeader
        icon={<FileStack />}
        title="کتابخانه قالب اسناد"
        description="قالب‌های ساختاری که ایجنت نگارش از آن‌ها پیروی می‌کند — قالب‌های سیستمی و قالب‌های شخصی شما"
      />

      <SettingsCard title="قالب‌های سیستمی" description="قالب‌های استاندارد محاکم ایران؛ همیشه در دسترس">
        <div className="grid gap-2 sm:grid-cols-2">
          {systemTemplates.map((t) => (
            <div key={t.code} className="rounded-xl border border-line bg-raised p-3">
              <div className="flex items-center gap-1.5">
                <p className="min-w-0 flex-1 truncate text-[0.76rem] font-bold text-ink">{t.title_fa}</p>
                <Badge tone="neutral"><Lock className="h-2.5 w-2.5" /> سیستمی</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-[0.64rem] leading-5 text-muted">{t.description_fa}</p>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="قالب‌های شخصی"
        description="نسخه‌های اختصاصی دفتر شما"
        action={<AddTemplateDialog onAdded={() => router.refresh()} />}
        className="mt-4"
      >
        {customTemplates.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">هنوز قالب شخصی نساخته‌اید. قالب‌های پرکاربرد خود را اضافه کنید.</p>
        ) : (
          <div className="space-y-2">
            {customTemplates.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-line bg-raised p-3">
                <Badge tone="accent">{DRAFT_KIND_FA[t.doc_kind as DraftKind] ?? t.doc_kind}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.76rem] font-bold text-ink">{t.title}</p>
                  <p className="truncate text-[0.64rem] text-muted">{t.description} · {relativeDayFa(t.created_at)}</p>
                </div>
                <button
                  onClick={() => startRemove(async () => { await deleteCustomTemplateAction(t.id); toast.success("قالب حذف شد"); router.refresh(); })}
                  disabled={removing}
                  className="rounded-md p-1 text-faint hover:bg-danger-soft hover:text-danger"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}

function AddTemplateDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [docKind, setDocKind] = useState<string>("brief");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) { toast.error("عنوان قالب را وارد کنید"); return; }
    setBusy(true);
    try {
      await createCustomTemplateAction({ title: title.trim(), doc_kind: docKind, description: description.trim() });
      toast.success("قالب شخصی افزوده شد");
      setOpen(false); setTitle(""); setDescription("");
      onAdded();
    } catch {
      toast.error("افزودن قالب ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary" className="gap-1"><Plus className="h-3.5 w-3.5" /> قالب جدید</Button>
      </DialogTrigger>
      <DialogContent title="افزودن قالب شخصی" description="یک قالب پرکاربرد دفتر خود را تعریف کنید">
        <div className="space-y-4">
          <div>
            <label className="label">عنوان قالب *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="دادخواست خلع ید (الگوی دفتر)" />
          </div>
          <div>
            <label className="label">نوع سند</label>
            <select className="input" value={docKind} onChange={(e) => setDocKind(e.target.value)}>
              {Object.entries(DRAFT_KIND_FA).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">توضیح</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ویژگی‌های خاص این قالب" />
          </div>
          <div className="flex justify-end border-t border-line pt-3">
            <Button variant="primary" onClick={submit} disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} افزودن قالب
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
