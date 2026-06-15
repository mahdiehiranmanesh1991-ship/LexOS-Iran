import { NextRequest } from "next/server";
import { z } from "zod";
import { getDataSource } from "@/lib/data";
import type { AgentCode, AnalysisKind, AnalysisStructured } from "@/lib/domain/types";
import { ANALYSIS_KIND_FA } from "@/lib/domain/taxonomies";
import { runAgent } from "@/lib/ai/orchestrator";
import { aiAvailable, completeJSON } from "@/lib/ai/providers";
import { guardRequest } from "@/lib/security/guard";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  caseId: z.string(),
  kind: z.enum([
    "case_analysis",
    "contract_review",
    "strategy",
    "evidence_review",
    "hearing_prep",
    "property_analysis",
  ]),
  instructions: z.string().max(4000).optional(),
});

const KIND_TO_AGENT: Record<string, AgentCode> = {
  case_analysis: "case_analyzer",
  contract_review: "contract_agent",
  strategy: "strategy_agent",
  evidence_review: "evidence_agent",
  hearing_prep: "strategy_agent",
  property_analysis: "property_agent",
};

const StructuredSchema = z.object({
  risks: z.array(z.object({ title: z.string(), detail: z.string(), severity: z.enum(["high", "medium", "low"]).optional(), citation: z.string().optional() })).optional(),
  weaknesses: z.array(z.object({ title: z.string(), detail: z.string(), severity: z.enum(["high", "medium", "low"]).optional(), citation: z.string().optional() })).optional(),
  opportunities: z.array(z.object({ title: z.string(), detail: z.string(), severity: z.enum(["high", "medium", "low"]).optional(), citation: z.string().optional() })).optional(),
  missing_evidence: z.array(z.object({ title: z.string(), detail: z.string(), severity: z.enum(["high", "medium", "low"]).optional() })).optional(),
  suggested_articles: z.array(z.object({ law: z.string(), article: z.string(), why: z.string() })).optional(),
  next_steps: z.array(z.string()).optional(),
});

/**
 * Structured analysis flow (docs/08 §Structured out):
 * deep-tier agent writes the markdown report → fast tier distills the
 * validated JSON panel → both persist to ai_analyses + case timeline.
 */
export async function POST(req: NextRequest) {
  const guard = await guardRequest(req, "ai_analyze");
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(guard.body);
  if (!parsed.success) return Response.json({ error: "درخواست نامعتبر است" }, { status: 400 });

  const { caseId, kind, instructions } = parsed.data;
  const db = await getDataSource();
  const c = await db.getCase(caseId);
  if (!c) return Response.json({ error: "پرونده یافت نشد" }, { status: 404 });

  const agent = KIND_TO_AGENT[kind];
  const kindFa = ANALYSIS_KIND_FA[kind as AnalysisKind];

  if (!aiAvailable()) {
    // Demo mode: persist a labeled sample so the product flow stays complete.
    const analysis = await db.createAnalysis({
      case_id: caseId,
      agent,
      kind: kind as AnalysisKind,
      title: `${kindFa} (نمایشی)`,
      content_md: `**[خروجی نمایشی — بدون اتصال به مدل]**\n\nدر نسخه کامل، ${kindFa} پرونده «${c.title}» اینجا با استناد به اسناد و مواد قانونی تولید می‌شود. برای فعال‌سازی، کلید API را تنظیم کنید.`,
      structured: { next_steps: ["تنظیم ANTHROPIC_API_KEY در محیط", "اجرای مجدد تحلیل"] },
      model: "demo",
    });
    return Response.json({ analysis });
  }

  const prompt =
    kind === "hearing_prep"
      ? `برای پرونده با شناسه «${caseId}» گزارش کامل آماده‌سازی جلسه دادرسی تهیه کن: وضعیت پرونده، نگاشت ادله به ارکان، تناقض‌ها، سؤالات محتمل قاضی، و استدلال‌های شفاهی پیشنهادی.`
      : `برای پرونده با شناسه «${caseId}» یک «${kindFa}» کامل و مستند تهیه کن.`;

  const result = await runAgent({
    agent,
    caseId,
    db,
    messages: [{ role: "user", content: instructions ? `${prompt}\n\nملاحظات وکیل: ${instructions}` : prompt }],
  });

  let structured: AnalysisStructured | null = null;
  try {
    structured = await completeJSON({
      tier: "fast",
      system:
        "از گزارش حقوقی زیر، فقط JSON با این کلیدها استخراج کن (هر کدام موجود بود): " +
        `risks, weaknesses, opportunities, missing_evidence (آرایه‌ای از {title, detail, severity: "high"|"medium"|"low", citation?}), ` +
        `suggested_articles (آرایه {law, article, why}), next_steps (آرایه رشته). به فارسی.`,
      messages: [{ role: "user", content: result.text.slice(0, 14_000) }],
      validate: (raw) => StructuredSchema.parse(raw),
    });
  } catch {
    structured = null; // The markdown report stands on its own.
  }

  const analysis = await db.createAnalysis({
    case_id: caseId,
    agent,
    kind: kind as AnalysisKind,
    title: `${kindFa} — ${c.title}`,
    content_md: result.text,
    structured,
    model: result.model,
  });

  return Response.json({ analysis });
}
