"use client";

import { useState, useTransition } from "react";
import { Check, CreditCard, Receipt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/(app)/settings/actions";
import { SectionHeader, SettingsCard } from "@/components/settings/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_FA, type Invoice, type PlanTier, type Subscription } from "@/lib/domain/settings";
import { faNum, formatJalaliNumeric } from "@/lib/jalali";

const ORDER: PlanTier[] = ["free", "pro", "firm", "enterprise"];

function rial(n: number): string {
  if (n === 0) return "تماس بگیرید";
  return `${faNum(n.toLocaleString("en-US").replace(/,/g, "٬"))} ریال`;
}

const INVOICE_STATUS_FA = { paid: "پرداخت‌شده", open: "باز", void: "ابطال" } as const;

export function BillingSection({
  subscription,
  invoices,
}: {
  subscription: Subscription;
  invoices: Invoice[];
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">(subscription.cycle);
  const [pending, startTransition] = useTransition();
  const current = subscription.plan;

  function choose(plan: PlanTier) {
    if (plan === current && cycle === subscription.cycle) return;
    startTransition(async () => {
      await saveSettingsAction({ billing: { plan, cycle } });
      toast.success(plan === "enterprise" ? "درخواست پلن سازمانی ثبت شد" : `پلن «${PLAN_FA[plan].label}» انتخاب شد`, {
        description: "در نسخه نمایشی پرداخت شبیه‌سازی می‌شود.",
      });
    });
  }

  return (
    <div>
      <SectionHeader
        icon={<CreditCard />}
        title="صورتحساب و اشتراک"
        description="مدیریت طرح اشتراک، چرخه پرداخت و فاکتورها"
      />

      <SettingsCard
        title="طرح فعلی"
        icon={<Sparkles />}
        action={
          <div className="flex rounded-lg border border-line bg-inset p-0.5 text-[0.66rem]">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${cycle === c ? "bg-surface text-ink shadow-sm" : "text-muted"}`}
              >
                {c === "monthly" ? "ماهانه" : "سالانه (۲۰٪ تخفیف)"}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER.map((plan) => {
            const meta = PLAN_FA[plan];
            const isCurrent = plan === current;
            const price = cycle === "yearly" ? meta.price_year : meta.price_month;
            return (
              <div
                key={plan}
                className={`flex flex-col rounded-2xl border p-4 ${isCurrent ? "border-accent bg-accent-soft/40 ring-1 ring-accent-line" : "border-line bg-surface"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[0.82rem] font-extrabold text-ink">{meta.label}</p>
                  {isCurrent && <Badge tone="accent">فعلی</Badge>}
                </div>
                <p className="mt-0.5 text-[0.62rem] text-muted">{meta.tagline}</p>
                <p className="mt-2 text-[0.95rem] font-extrabold text-ink">
                  {rial(price)}
                  {price > 0 && <span className="text-[0.6rem] font-normal text-muted"> / {cycle === "yearly" ? "سال" : "ماه"}</span>}
                </p>
                <ul className="mt-3 flex-1 space-y-1">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[0.64rem] leading-5 text-ink-2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "secondary" : "primary"}
                  size="sm"
                  disabled={pending || (isCurrent && cycle === subscription.cycle)}
                  onClick={() => choose(plan)}
                  className="mt-3 w-full"
                >
                  {isCurrent && cycle === subscription.cycle ? "طرح فعلی" : plan === "enterprise" ? "تماس با فروش" : "انتخاب طرح"}
                </Button>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="فاکتورها" icon={<Receipt />} description="سابقه پرداخت‌های شما" className="mt-4">
        {invoices.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">فاکتوری ثبت نشده است. (درگاه پرداخت در نسخه استقرار کامل متصل می‌شود.)</p>
        ) : (
          <div className="divide-y divide-line">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-2.5">
                <Receipt className="h-4 w-4 text-faint" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.74rem] font-semibold text-ink">فاکتور {inv.number}</p>
                  <p className="text-[0.62rem] text-muted">{formatJalaliNumeric(inv.date)}</p>
                </div>
                <p className="text-[0.72rem] font-bold text-ink">{rial(inv.amount_rial)}</p>
                <Badge tone={inv.status === "paid" ? "ok" : inv.status === "open" ? "warn" : "neutral"}>
                  {INVOICE_STATUS_FA[inv.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
