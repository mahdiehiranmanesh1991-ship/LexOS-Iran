"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/(app)/settings/actions";
import type { AppSettings } from "@/lib/domain/settings";

/**
 * Per-section draft manager: holds a local copy of one settings slice,
 * tracks dirty state, and persists via the server action.
 */
export function useSettingsDraft<K extends keyof AppSettings>(section: K, initial: AppSettings[K]) {
  const [draft, setDraft] = useState<AppSettings[K]>(initial);
  const [baseline, setBaseline] = useState<AppSettings[K]>(initial);
  const [saving, startSave] = useTransition();

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [draft, baseline]);

  function set<F extends keyof AppSettings[K]>(field: F, value: AppSettings[K][F]) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function save() {
    startSave(async () => {
      try {
        await saveSettingsAction({ [section]: draft } as Parameters<typeof saveSettingsAction>[0]);
        setBaseline(draft);
        toast.success("تنظیمات ذخیره شد");
      } catch {
        toast.error("ذخیره تنظیمات ناموفق بود");
      }
    });
  }

  function reset() {
    setDraft(baseline);
  }

  return { draft, set, setDraft, dirty, saving, save, reset };
}
