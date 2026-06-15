import { NextRequest } from "next/server";
import { z } from "zod";
import { getDataSource } from "@/lib/data";
import type { DraftKind } from "@/lib/domain/types";
import { DRAFT_KIND_FA } from "@/lib/domain/taxonomies";
import { getTemplate } from "@/lib/domain/templates";
import { runAgent } from "@/lib/ai/orchestrator";
import { aiAvailable } from "@/lib/ai/providers";
import { guardRequest } from "@/lib/security/guard";
import { aiPreflight } from "@/lib/ai/cost-tracker";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

const GenerateSchema = z.object({
  mode: z.literal("generate"),
  templateCode: z.string(),
  caseId: z.string().nullable().optional(),
  instructions: z.string().max(6000).optional(),
});

const ReviseSchema = z.object({
  mode: z.literal("revise"),
  draftId: z.string(),
  content: z.string().max(60_000),
  instruction: z.string().max(2000),
});

const BodySchema = z.discriminatedUnion("mode", [GenerateSchema, ReviseSchema]);

/** Drafting copilot: template-driven generation + inline revision (journey J4). */
export async function POST(req: NextRequest) {
  const guard = await guardRequest(req, "ai_draft");
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(guard.body);
  if (!parsed.success) return Response.json({ error: "درخواست نامعتبر است" }, { status: 400 });
  const db = await getDataSource();

  const pre = await aiPreflight({ db, route: "/api/ai/draft", feature: "draft" });
  if (!pre.ok) return pre.response;
  const cost = { ownerId: pre.ownerId, route: "/api/ai/draft", feature: "draft" as const };

  if (parsed.data.mode === "generate") {
    const { templateCode, caseId, instructions } = parsed.data;
    const template = getTemplate(templateCode);
    if (!template) return Response.json({ error: "قالب یافت نشد" }, { status: 404 });

    let content: string;
    let model = "demo";
    if (aiAvailable()) {
      const prompt = [
        `یک «${template.title_fa}» کامل تهیه کن.`,
        `ابتدا قالب «${templateCode}» را با get_template بگیر و دقیقاً از ساختار آن پیروی کن.`,
        caseId
          ? `سند برای پرونده با شناسه «${caseId}» است — مشخصات واقعی را با get_case_brief بگیر و به‌کار ببر؛ هرچه در پرونده نبود، جای خالی [داخل کروشه] بگذار.`
          : "سند مستقل از پرونده است؛ مشخصات را جای خالی [داخل کروشه] بگذار.",
        instructions ? `دستور وکیل: ${instructions}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const result = await runAgent({
        agent: "drafting_agent",
        caseId: caseId ?? null,
        db,
        tierOverride: pre.tier,
        cost,
        messages: [{ role: "user", content: prompt }],
      });
      content = result.text;
      model = result.model;
    } else {
      content = `${template.skeleton_md}\n\n---\n*[حالت نمایشی: این اسکلت قالب است؛ با تنظیم کلید API، ایجنت نگارش آن را با داده‌های پرونده تکمیل می‌کند.]*`;
    }

    const kindTitle = DRAFT_KIND_FA[template.doc_kind as DraftKind];
    const draft = await db.createDraft({
      case_id: caseId ?? null,
      template_code: templateCode,
      title: `${kindTitle} — ${new Date().toLocaleDateString("fa-IR")}`,
      doc_kind: template.doc_kind,
      content_md: content,
    });
    if (caseId) {
      await db.addCaseEvent({
        case_id: caseId,
        event_type: "draft",
        title: `تهیه پیش‌نویس: ${draft.title}`,
      });
    }
    return Response.json({ draft, model });
  }

  // mode === "revise"
  const { draftId, content, instruction } = parsed.data;
  if (!aiAvailable()) {
    return Response.json({
      content: `${content}\n\n> *[نمایشی] دستور بازنویسی: «${instruction}» — در نسخه کامل، ایجنت نگارش متن را بازنویسی می‌کند.*`,
      model: "demo",
    });
  }
  const result = await runAgent({
    agent: "drafting_agent",
    db,
    tierOverride: pre.tier,
    cost,
    messages: [
      {
        role: "user",
        content: `متن سند زیر را طبق این دستور بازنویسی کن و فقط متن کامل بازنویسی‌شده را برگردان.\nدستور: ${instruction}\n\n---\n${content}`,
      },
    ],
  });
  const draft = await db.getDraft(draftId);
  if (draft) await db.updateDraft(draftId, { content_md: result.text });
  return Response.json({ content: result.text, model: result.model });
}
