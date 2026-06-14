"use server";

import { revalidatePath } from "next/cache";
import { getDataSource } from "@/lib/data";
import type { AppSettings, BrainSourceKind, DeepPartial } from "@/lib/domain/settings";

/** Settings control-center mutations. Each section sends its own slice. */

export async function saveSettingsAction(patch: DeepPartial<AppSettings>) {
  const db = await getDataSource();
  await db.updateSettings(patch);
  revalidatePath("/settings");
  // A couple of settings change behavior elsewhere (deadlines, AI).
  revalidatePath("/calendar");
  return { ok: true };
}

export async function revokeSessionAction(id: string) {
  const db = await getDataSource();
  await db.revokeSession(id);
  revalidatePath("/settings");
}

export async function revokeOtherSessionsAction() {
  const db = await getDataSource();
  await db.revokeOtherSessions();
  revalidatePath("/settings");
}

export async function addBrainSourceAction(input: { title: string; kind: BrainSourceKind; text?: string }) {
  const db = await getDataSource();
  const created = await db.addBrainSource(input);
  revalidatePath("/settings");
  return created;
}

export async function removeBrainSourceAction(id: string) {
  const db = await getDataSource();
  await db.removeBrainSource(id);
  revalidatePath("/settings");
}

export async function createCustomTemplateAction(input: { title: string; doc_kind: string; description: string }) {
  const db = await getDataSource();
  await db.createCustomTemplate(input);
  revalidatePath("/settings");
}

export async function deleteCustomTemplateAction(id: string) {
  const db = await getDataSource();
  await db.deleteCustomTemplate(id);
  revalidatePath("/settings");
}
