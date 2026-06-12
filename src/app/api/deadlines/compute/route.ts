import { NextRequest } from "next/server";
import { z } from "zod";
import { computeDeadline, DEADLINE_RULES } from "@/lib/domain/deadlines";
import { formatJalaliNumeric, parseDateInput } from "@/lib/jalali";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  rule_code: z.string(),
  trigger_date: z.string(),
  is_abroad: z.boolean().default(false),
});

/** Deterministic deadline computation endpoint — no LLM in this path, ever. */
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "درخواست نامعتبر است" }, { status: 400 });

  const trigger = parseDateInput(parsed.data.trigger_date);
  if (!trigger) return Response.json({ error: "تاریخ مبدأ نامعتبر است" }, { status: 400 });

  try {
    const c = computeDeadline(parsed.data.rule_code, trigger, parsed.data.is_abroad);
    return Response.json({
      rule: c.rule,
      due_at: c.dueISO,
      due_at_fa: formatJalaliNumeric(c.dueDate),
      days: c.days,
      rolled_for_holiday: c.rolledForHoliday,
      explanation: c.explanationFa,
    });
  } catch {
    return Response.json({ error: "قاعده ناشناخته است" }, { status: 400 });
  }
}

export async function GET() {
  return Response.json({ rules: DEADLINE_RULES });
}
