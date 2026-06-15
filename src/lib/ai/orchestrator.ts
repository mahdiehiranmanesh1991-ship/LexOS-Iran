import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import type { DataSource } from "@/lib/data/types";
import type { AgentCode, Citation } from "@/lib/domain/types";
import { AGENT_FA } from "@/lib/domain/taxonomies";
import { getAgent } from "./agents";
import { aiAvailable, anthropic, hasAnthropic, complete, modelFor, type Tier } from "./providers";
import { executeTool, TOOL_DEFINITIONS, type ProposedAction } from "./tools";
import { recordUsage } from "./cost-tracker";
import type { CallCost } from "./cost-control";

/**
 * Agent execution engine (docs/09).
 * One loop runs every agent: system prompt → ≤6 tool rounds → final text.
 * Emits streaming events the UI renders progressively.
 */

export type StreamEvent =
  | { type: "agent"; agent: AgentCode; name: string }
  | { type: "token"; text: string }
  | { type: "tool"; name: string; status: "start" | "end"; label: string }
  | { type: "citations"; citations: Citation[] }
  | { type: "actions"; actions: ProposedAction[] }
  | { type: "done"; model: string }
  | { type: "error"; message: string };

const MAX_ROUNDS = 6;

const TOOL_LABELS: Record<string, string> = {
  get_case_brief: "در حال مرور پرونده…",
  search_case_documents: "در حال جستجوی اسناد…",
  get_document_text: "در حال خواندن سند…",
  search_legal_articles: "در حال جستجوی مواد قانونی…",
  search_knowledge_notes: "در حال جستجوی گنجینه دانش…",
  list_deadline_rules: "در حال مرور قواعد مواعد…",
  compute_deadline: "در حال محاسبه موعد…",
  propose_deadline: "در حال آماده‌سازی پیشنهاد موعد…",
  get_template: "در حال بارگذاری قالب…",
};

export interface RunInput {
  agent: AgentCode;
  messages: { role: "user" | "assistant"; content: string }[];
  caseId?: string | null;
  db: DataSource;
  /** Governance-resolved tier (budget may downgrade the agent's default). */
  tierOverride?: Tier;
  /** When present, token usage + cost are recorded against this principal. */
  cost?: CallCost;
}

export interface RunResult {
  text: string;
  citations: Citation[];
  actions: ProposedAction[];
  model: string;
}

/** Pick the right specialist for a free-form question (fast intent routing). */
export async function routeIntent(question: string, cost?: CallCost): Promise<AgentCode> {
  if (!aiAvailable()) return "orchestrator";
  try {
    const answer = await complete({
      tier: "fast",
      cost,
      system:
        "نقش: مسیریاب. پرسش وکیل را بخوان و فقط یکی از این کدها را برگردان (بدون هیچ متن دیگر):\n" +
        "deadline_agent (مهلت/موعد/ابلاغ/واخواهی/تجدیدنظر زمان‌دار)، contract_agent (تحلیل قرارداد)، " +
        "property_agent (ملک/خلع ید/تخلیه/تصرف/سند ملکی)، strategy_agent (استراتژی/برنامه دعوا)، " +
        "evidence_agent (ادله/مدارک/شهادت/تناقض)، research_agent (سؤال حقوقی عمومی/ماده قانونی)، " +
        "drafting_agent (نوشتن دادخواست/لایحه/شکواییه/اظهارنامه/قرارداد)، case_analyzer (تحلیل کامل پرونده)، " +
        "orchestrator (سایر موارد).",
      messages: [{ role: "user", content: question.slice(0, 1500) }],
      maxTokens: 16,
      temperature: 0,
    });
    const code = answer.trim().replace(/[^a-z_]/g, "");
    const valid: AgentCode[] = [
      "deadline_agent", "contract_agent", "property_agent", "strategy_agent",
      "evidence_agent", "research_agent", "drafting_agent", "case_analyzer", "orchestrator",
    ];
    return valid.includes(code as AgentCode) ? (code as AgentCode) : "orchestrator";
  } catch {
    return "orchestrator";
  }
}

/** Run an agent and stream events. Falls back to OpenAI (no tools) or demo text. */
export async function* runAgentStream(input: RunInput): AsyncGenerator<StreamEvent> {
  const spec = getAgent(input.agent);
  yield { type: "agent", agent: spec.code, name: AGENT_FA[spec.code].name };

  if (!aiAvailable()) {
    yield* demoStream(input);
    return;
  }

  const { model } = modelFor(input.tierOverride ?? spec.tier);
  const citations: Citation[] = [];
  const actions: ProposedAction[] = [];
  const seenCitations = new Set<string>();
  let usageIn = 0;
  let usageOut = 0;

  const collect = (cs?: Citation[], as?: ProposedAction[]) => {
    for (const c of cs ?? []) {
      const key = `${c.kind}:${c.id}`;
      if (!seenCitations.has(key)) {
        seenCitations.add(key);
        citations.push(c);
      }
    }
    for (const a of as ?? []) actions.push(a);
  };

  const caseHint = input.caseId
    ? `\n\nزمینه: گفتگو در بستر پرونده با شناسه «${input.caseId}» است؛ در ابزارها از همین شناسه استفاده کن.`
    : "";

  if (!hasAnthropic()) {
    // OpenAI-only fallback: no tool use — answer directly with degraded grounding.
    try {
      const text = await complete({
        tier: input.tierOverride ?? spec.tier,
        cost: input.cost,
        system:
          spec.system +
          caseHint +
          "\n\n(حالت بدون ابزار: به منابع زنده دسترسی نداری؛ هر پاسخ حقوقی را با یادآوری لزوم راستی‌آزمایی ماده‌ها همراه کن.)",
        messages: input.messages,
      });
      yield { type: "token", text };
      yield { type: "citations", citations: [] };
      yield { type: "done", model: modelFor(spec.tier).model };
    } catch (err) {
      yield { type: "error", message: err instanceof Error ? err.message : "خطای نامشخص" };
    }
    return;
  }

  const tools = TOOL_DEFINITIONS.filter((t) => spec.tools.includes(t.name));
  const history: Anthropic.MessageParam[] = input.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    for (let round = 0; round <= MAX_ROUNDS; round++) {
      const finalRound = round === MAX_ROUNDS;
      const stream = anthropic().messages.stream({
        model,
        max_tokens: 4096,
        temperature: 0.3,
        system: spec.system + caseHint,
        messages: history,
        tools: finalRound ? undefined : tools,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta" &&
          event.delta.text
        ) {
          yield { type: "token", text: event.delta.text };
        }
      }

      const message = await stream.finalMessage();
      usageIn += message.usage.input_tokens;
      usageOut += message.usage.output_tokens;
      const toolUses = message.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (message.stop_reason !== "tool_use" || toolUses.length === 0) {
        if (input.cost) {
          await recordUsage({
            ...input.cost,
            provider: "anthropic",
            model,
            tokensIn: usageIn,
            tokensOut: usageOut,
          });
        }
        yield { type: "citations", citations };
        if (actions.length) yield { type: "actions", actions };
        yield { type: "done", model };
        return;
      }

      history.push({ role: "assistant", content: message.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        const label = TOOL_LABELS[tu.name] ?? `اجرای ${tu.name}…`;
        yield { type: "tool", name: tu.name, status: "start", label };
        // Whitelist enforcement: the model only sees whitelisted tools, but
        // guard anyway in case of hallucinated tool names.
        const outcome = spec.tools.includes(tu.name)
          ? await executeTool(tu.name, (tu.input ?? {}) as Record<string, unknown>, input.db)
          : { result: "این ابزار برای این ایجنت مجاز نیست." };
        collect(outcome.citations, outcome.actions);
        yield { type: "tool", name: tu.name, status: "end", label };
        results.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: outcome.result.slice(0, 30_000),
        });
      }
      history.push({ role: "user", content: results });
    }
  } catch (err) {
    yield {
      type: "error",
      message:
        err instanceof Error
          ? `خطا در ارتباط با مدل: ${err.message}`
          : "خطای نامشخص در اجرای ایجنت",
    };
  }
}

/** Non-streaming convenience wrapper (used by analyze/draft routes). */
export async function runAgent(input: RunInput): Promise<RunResult> {
  let text = "";
  const citations: Citation[] = [];
  const actions: ProposedAction[] = [];
  let model = "";
  for await (const ev of runAgentStream(input)) {
    if (ev.type === "token") text += ev.text;
    else if (ev.type === "citations") citations.push(...ev.citations);
    else if (ev.type === "actions") actions.push(...ev.actions);
    else if (ev.type === "done") model = ev.model;
    else if (ev.type === "error") throw new Error(ev.message);
  }
  return { text, citations, actions, model };
}

/* ------------------------------------------------------------------ */
/* Demo mode: no API keys — stream a curated, clearly-labeled response  */
/* so the public demo remains a complete product walkthrough.           */
/* ------------------------------------------------------------------ */

async function* demoStream(input: RunInput): AsyncGenerator<StreamEvent> {
  const spec = getAgent(input.agent);
  const question = input.messages[input.messages.length - 1]?.content ?? "";

  yield { type: "tool", name: "search_legal_articles", status: "start", label: TOOL_LABELS.search_legal_articles };
  await sleep(450);
  yield { type: "tool", name: "search_legal_articles", status: "end", label: "" };

  const { searchCorpus } = await import("@/lib/domain/legal-corpus");
  const hits = searchCorpus(question, 3);
  const citations: Citation[] = hits.map((h) => ({
    kind: "article",
    id: h.id,
    label: `ماده ${h.article_no} ${h.law_title_fa}`,
  }));

  const intro = `**[پاسخ نمایشی — بدون اتصال به مدل زبانی]**\n\nدر نسخه کامل، «${AGENT_FA[spec.code].name}» این پرسش را با جستجو در مواد قانونی، اسناد پرونده و گنجینه دانش شما پاسخ می‌دهد و به هر منبع استناد می‌کند. برای فعال‌سازی، کلید ANTHROPIC_API_KEY یا OPENAI_API_KEY را در تنظیمات محیط قرار دهید.\n\n`;
  const corpusPart = hits.length
    ? `نمونه‌ای از منابعی که برای این پرسش بازیابی شد:\n\n${hits
        .map((h) => `> **${h.law_title_fa} — ماده ${h.article_no}:** ${h.text_fa.slice(0, 220)}…`)
        .join("\n\n")}`
    : "برای این پرسش، ماده مستقیمی در پیکره نمایشی یافت نشد — در نسخه کامل، جستجوی معنایی روی کل پیکره و اسناد شما انجام می‌شود.";

  for (const chunk of (intro + corpusPart).match(/.{1,60}/gs) ?? []) {
    yield { type: "token", text: chunk };
    await sleep(24);
  }
  yield { type: "citations", citations };
  yield { type: "done", model: "demo" };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
