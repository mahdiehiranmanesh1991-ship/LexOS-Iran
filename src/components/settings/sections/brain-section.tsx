"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BrainCircuit, FileUp, Loader2, Plus, Quote, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { addBrainSourceAction, removeBrainSourceAction } from "@/app/(app)/settings/actions";
import { SaveBar, SectionHeader, SettingsCard, ToggleRow } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  BRAIN_KIND_FA,
  BRAIN_STATUS_FA,
  type AppSettings,
  type BrainProfile,
  type BrainSource,
  type BrainSourceKind,
} from "@/lib/domain/settings";
import { faNum, relativeDayFa } from "@/lib/jalali";

export function BrainSection({
  settings,
  sources,
  profile,
}: {
  settings: AppSettings;
  sources: BrainSource[];
  profile: BrainProfile | null;
}) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("brain", settings.brain);
  const router = useRouter();
  const [removing, startRemove] = useTransition();

  return (
    <div>
      <SectionHeader
        icon={<BrainCircuit />}
        title="مغز حقوقی شخصی"
        description="با بارگذاری لوایح گذشته، هوش مصنوعی سبک نگارش، شیوه استدلال و استنادات مرجح شما را می‌آموزد و در پیش‌نویس‌های جدید به‌کار می‌برد"
      />

      <div className="mb-4 rounded-2xl border border-accent-line bg-gradient-to-bl from-accent-soft/80 to-surface p-4">
        <div className="flex items-center gap-2 text-accent-strong">
          <Sparkles className="h-4 w-4" />
          <p className="text-[0.8rem] font-bold">دستیاری که مثل شما می‌نویسد</p>
        </div>
        <p className="mt-1.5 text-[0.7rem] leading-6 text-ink-2">
          مغز حقوقی شخصی، یک پروفایل سبک از شما می‌سازد: لحن، ساختار بندبندی، عبارات امضایی و استنادات پرتکرار. این پروفایل صرفاً روی داده‌های خودِ شما ساخته می‌شود و با کاربران دیگر به اشتراک گذاشته نمی‌شود.
        </p>
      </div>

      <SettingsCard title="فعال‌سازی یادگیری">
        <ToggleRow title="مغز حقوقی شخصی فعال باشد" description="یادگیری از اسناد شما و ساخت پروفایل سبک" checked={draft.enabled} onChange={(v) => set("enabled", v)} />
        <ToggleRow title="یادگیری سبک نگارش" description="لحن، طول جملات، ساختار و عبارات امضایی" checked={draft.learn_style} onChange={(v) => set("learn_style", v)} disabled={!draft.enabled} />
        <ToggleRow title="یادگیری شیوه استدلال" description="نحوه چیدمان دفاعیات و منطق حقوقی شما" checked={draft.learn_reasoning} onChange={(v) => set("learn_reasoning", v)} disabled={!draft.enabled} />
        <ToggleRow title="یادگیری استنادات مرجح" description="مواد و آرای وحدت رویه‌ای که بیشتر استفاده می‌کنید" checked={draft.learn_citations} onChange={(v) => set("learn_citations", v)} disabled={!draft.enabled} />
        <ToggleRow title="اعمال در پیش‌نویس‌های جدید" description="ایجنت نگارش از پروفایل سبک شما استفاده کند" checked={draft.apply_to_drafts} onChange={(v) => set("apply_to_drafts", v)} disabled={!draft.enabled} />
      </SettingsCard>

      {profile && (
        <SettingsCard title="پروفایل سبک آموخته‌شده" icon={<Wand2 />} description={`بر اساس ${faNum(profile.trained_on)} سند آموخته شد`} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-raised p-3">
              <p className="text-[0.62rem] font-semibold text-muted">لحن غالب</p>
              <p className="mt-1 text-[0.8rem] font-bold text-ink">{profile.tone}</p>
            </div>
            <div className="rounded-xl border border-line bg-raised p-3">
              <p className="text-[0.62rem] font-semibold text-muted">میانگین طول جمله</p>
              <p className="mt-1 text-[0.8rem] font-bold text-ink">{faNum(profile.avg_sentence_words)} کلمه</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-1.5 text-[0.66rem] font-semibold text-muted">استنادات پرتکرار شما</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.favorite_citations.map((c) => (
                <span key={c} className="chip"><Quote className="h-3 w-3 text-accent" /> {c}</span>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-1.5 text-[0.66rem] font-semibold text-muted">عبارات امضایی</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.signature_phrases.map((c) => (
                <span key={c} className="chip">«{c}»</span>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-raised p-3">
            <p className="text-[0.62rem] font-semibold text-muted">الگوی ساختار</p>
            <p className="mt-1 text-[0.72rem] leading-6 text-ink-2">{profile.structure_notes}</p>
          </div>
        </SettingsCard>
      )}

      <SettingsCard
        title="منابع آموزش"
        description="لوایح، دادخواست‌ها و قراردادهای گذشته شما"
        icon={<FileUp />}
        action={<AddBrainSourceDialog onAdded={() => router.refresh()} />}
        className="mt-4"
      >
        {sources.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">هنوز سندی برای آموزش اضافه نکرده‌اید.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="rounded-xl border border-line bg-raised p-3">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{BRAIN_KIND_FA[s.kind]}</Badge>
                  <p className="min-w-0 flex-1 truncate text-[0.76rem] font-bold text-ink">{s.title}</p>
                  <Badge tone={s.status === "learned" ? "ok" : s.status === "failed" ? "danger" : "warn"} className={s.status === "learning" ? "pulse-soft" : ""}>
                    {BRAIN_STATUS_FA[s.status]}
                  </Badge>
                  <button
                    onClick={() => startRemove(async () => { await removeBrainSourceAction(s.id); toast.success("سند حذف شد"); router.refresh(); })}
                    disabled={removing}
                    className="rounded-md p-1 text-faint hover:bg-danger-soft hover:text-danger"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {s.insights && s.insights.length > 0 && (
                  <ul className="mt-2 space-y-0.5 ps-1">
                    {s.insights.map((ins, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[0.66rem] leading-5 text-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" /> {ins}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1.5 text-[0.6rem] text-faint">
                  {s.pages ? `${faNum(s.pages)} صفحه · ` : ""}{relativeDayFa(s.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}

function AddBrainSourceDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<BrainSourceKind>("brief");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) { toast.error("عنوان سند را وارد کنید"); return; }
    setBusy(true);
    try {
      await addBrainSourceAction({ title: title.trim(), kind, text: text.trim() || undefined });
      toast.success("سند برای یادگیری اضافه شد", { description: "هوش مصنوعی در حال تحلیل سبک نگارش شماست" });
      setOpen(false); setTitle(""); setText("");
      onAdded();
    } catch {
      toast.error("افزودن سند ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary" className="gap-1"><Plus className="h-3.5 w-3.5" /> افزودن سند</Button>
      </DialogTrigger>
      <DialogContent title="افزودن سند به مغز حقوقی" description="یک لایحه یا دادخواست گذشته خود را برای یادگیری سبک اضافه کنید">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">عنوان سند *</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="لایحه خلع ید پرونده…" />
            </div>
            <div>
              <label className="label">نوع</label>
              <select className="input" value={kind} onChange={(e) => setKind(e.target.value as BrainSourceKind)}>
                {Object.entries(BRAIN_KIND_FA).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">متن سند</label>
            <textarea className="input resize-y" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="متن کامل لایحه/دادخواست را اینجا بچسبانید تا سبک نگارش آموخته شود…" />
            <p className="mt-1 text-[0.62rem] text-muted">متن شما فقط برای ساخت پروفایل سبک شخصی شما استفاده می‌شود.</p>
          </div>
          <div className="flex justify-end border-t border-line pt-3">
            <Button variant="primary" onClick={submit} disabled={busy} className="gap-1.5">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} افزودن و یادگیری
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
