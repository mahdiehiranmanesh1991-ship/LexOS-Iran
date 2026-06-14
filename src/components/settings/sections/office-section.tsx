"use client";

import { Building2 } from "lucide-react";
import { Field, OptionCards, SaveBar, SectionHeader, SettingsCard } from "@/components/settings/primitives";
import { useSettingsDraft } from "@/components/settings/use-settings-draft";
import { OFFICE_TYPE_FA, type AppSettings, type OfficeType } from "@/lib/domain/settings";

export function OfficeSection({ settings }: { settings: AppSettings }) {
  const { draft, set, dirty, saving, save, reset } = useSettingsDraft("office", settings.office);

  return (
    <div>
      <SectionHeader
        icon={<Building2 />}
        title="اطلاعات دفتر"
        description="مشخصات دفتر وکالت برای سربرگ اسناد، فاکتورها و ارتباط با موکلین"
      />

      <SettingsCard title="نوع دفتر">
        <OptionCards
          value={draft.type}
          onChange={(v) => set("type", v as OfficeType)}
          columns={3}
          options={(Object.entries(OFFICE_TYPE_FA) as [OfficeType, string][]).map(([value, label]) => ({ value, label }))}
        />
      </SettingsCard>

      <SettingsCard title="مشخصات و تماس" className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام دفتر" className="sm:col-span-2">
            <input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="دفتر وکالت ایرانمنش" />
          </Field>
          <Field label="تلفن">
            <input className="input" dir="ltr" value={draft.phone} onChange={(e) => set("phone", e.target.value)} placeholder="۰۲۱۸۸۷۶۵۴۳۲" />
          </Field>
          <Field label="ایمیل">
            <input className="input" dir="ltr" value={draft.email} onChange={(e) => set("email", e.target.value)} placeholder="office@example.com" />
          </Field>
          <Field label="وب‌سایت">
            <input className="input" dir="ltr" value={draft.website} onChange={(e) => set("website", e.target.value)} placeholder="example.legal" />
          </Field>
          <Field label="شهر">
            <input className="input" value={draft.city} onChange={(e) => set("city", e.target.value)} placeholder="تهران" />
          </Field>
          <Field label="نشانی" className="sm:col-span-2">
            <input className="input" value={draft.address} onChange={(e) => set("address", e.target.value)} placeholder="نشانی کامل دفتر" />
          </Field>
          <Field label="تعداد همکاران" hint="برای دفاتر گروهی؛ مبنای ظرفیت اشتراک دفتر">
            <input
              type="number"
              min={1}
              className="input"
              value={draft.colleagues}
              onChange={(e) => set("colleagues", Number(e.target.value) || 1)}
            />
          </Field>
        </div>
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
