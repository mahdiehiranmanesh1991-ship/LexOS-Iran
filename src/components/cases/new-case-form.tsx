"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createCaseAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  CASE_TYPE_FA,
  CLIENT_POSITION_FA,
  CONTACT_KIND_FA,
} from "@/lib/domain/taxonomies";
import type { Contact, Court } from "@/lib/domain/types";

/** Case intake (journey J2) with the inline conflict-of-interest check. */
export function NewCaseForm({ courts, contacts }: { courts: Court[]; contacts: Contact[] }) {
  const [pending, startTransition] = useTransition();
  const [opponentName, setOpponentName] = useState("");

  // Conflict check: does the opposing party match one of my clients?
  const conflict = useMemo(() => {
    const q = opponentName.trim();
    if (q.length < 3) return null;
    return (
      contacts.find(
        (c) => c.kind === "client" && (c.full_name.includes(q) || c.national_id === q),
      ) ?? null
    );
  }, [opponentName, contacts]);

  const clients = contacts.filter((c) => c.kind === "client");
  const opponents = contacts.filter((c) => c.kind === "opponent");

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          try {
            await createCaseAction(fd);
          } catch (e) {
            // redirect() throws NEXT_REDIRECT — only real errors reach users
            if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
              toast.error("ثبت پرونده ناموفق بود؛ ورودی‌ها را بررسی کنید");
              return;
            }
            throw e;
          }
        })
      }
      className="card space-y-5 p-5"
    >
      <div>
        <label className="label">عنوان پرونده *</label>
        <input name="title" required className="input" placeholder="مثلاً: خلع ید — پلاک ثبتی ۱۲۳/۴" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">نوع دعوا *</label>
          <select name="case_type" required className="input" defaultValue="civil">
            {Object.entries(CASE_TYPE_FA).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">سمت موکل *</label>
          <select name="client_position" required className="input" defaultValue="plaintiff">
            {Object.entries(CLIENT_POSITION_FA).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">خواسته / موضوع *</label>
        <textarea
          name="subject"
          required
          rows={2}
          className="input resize-y"
          placeholder="خواسته دقیق — مثلاً: خلع ید و قلع و قمع بنا و اجرت‌المثل ایام تصرف"
        />
        <p className="mt-1 text-[0.62rem] leading-5 text-muted">
          عنوان خواسته را دقیق بنویسید؛ ایجنت املاک/استراتژی تطبیق عنوان دعوا با خواسته را بررسی می‌کند.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">موکل</label>
          <select name="client_contact_id" className="input" defaultValue="">
            <option value="">— بعداً انتخاب می‌کنم —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">طرف مقابل</label>
          <select
            name="opponent_contact_id"
            className="input"
            defaultValue=""
            onChange={(e) => {
              const c = contacts.find((x) => x.id === e.target.value);
              setOpponentName(c?.full_name ?? "");
            }}
          >
            <option value="">— بعداً انتخاب می‌کنم —</option>
            {[...opponents, ...contacts.filter((c) => !["client", "opponent"].includes(c.kind))].map(
              (c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({CONTACT_KIND_FA[c.kind]})
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {conflict && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warn-line bg-warn-soft px-3.5 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
          <div className="text-[0.72rem] leading-6 text-warn">
            <b>هشدار تعارض منافع:</b> «{conflict.full_name}» در مخاطبین شما به‌عنوان <b>موکل</b> ثبت
            شده است. پذیرش دعوا علیه موکل سابق ممکن است تخلف انتظامی باشد — پیش از ادامه بررسی کنید.
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">مرجع رسیدگی</label>
          <select name="court_id" className="input" defaultValue="">
            <option value="">— انتخاب —</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">شعبه</label>
          <input name="court_branch" className="input" placeholder="شعبه ۱۲" />
        </div>
        <div>
          <label className="label">قاضی</label>
          <input name="judge_name" className="input" placeholder="نام قاضی" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">شماره پرونده (کلاسه)</label>
          <input name="case_no" className="input ltr text-left" dir="ltr" placeholder="14046892…" />
        </div>
        <div>
          <label className="label">بهای خواسته (ریال)</label>
          <input name="claim_value" className="input" inputMode="numeric" placeholder="15000000000" />
        </div>
        <div>
          <label className="label">تاریخ طرح (جلالی)</label>
          <input name="filed_at" className="input" placeholder="۱۴۰۵/۰۳/۲۲" />
        </div>
      </div>

      <div>
        <label className="label">شرح ماوقع</label>
        <textarea
          name="description"
          rows={4}
          className="input resize-y"
          placeholder="خلاصه وقایع، رابطه حقوقی، اقدامات انجام‌شده — این متن زمینه تحلیل‌های هوش مصنوعی است"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? "در حال ثبت…" : "ثبت پرونده"}
        </Button>
      </div>
    </form>
  );
}
