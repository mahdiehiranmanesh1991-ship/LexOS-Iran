import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { recordUsage } from "./cost-tracker";
import type { CallCost } from "./cost-control";

/**
 * Provider layer — tiered model routing with failover (docs/08).
 *   fast: classification/extraction · core: chat/drafting · deep: strategy/analysis
 * Primary reasoning runs on Anthropic (full tool-use support). OpenAI provides
 * embeddings and a no-tools fallback path if Anthropic is unavailable.
 */

export type Tier = "fast" | "core" | "deep";

const ANTHROPIC_MODELS: Record<Tier, string> = {
  fast: process.env.AI_MODEL_FAST ?? "claude-haiku-4-5-20251001",
  core: process.env.AI_MODEL_CORE ?? "claude-sonnet-4-6",
  deep: process.env.AI_MODEL_DEEP ?? "claude-opus-4-8",
};

const OPENAI_MODELS: Record<Tier, string> = {
  fast: "gpt-4o-mini",
  core: "gpt-4o",
  deep: "gpt-4o",
};

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

export function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
/** Any LLM available? Otherwise the AI layer serves demo responses. */
export function aiAvailable(): boolean {
  return hasAnthropic() || hasOpenAI();
}

let anthropicClient: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicClient;
}

let openaiClient: OpenAI | null = null;
export function openai(): OpenAI {
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

export function modelFor(tier: Tier): { provider: "anthropic" | "openai"; model: string } {
  if (hasAnthropic()) return { provider: "anthropic", model: ANTHROPIC_MODELS[tier] };
  return { provider: "openai", model: OPENAI_MODELS[tier] };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Plain completion with provider failover. */
export async function complete(opts: {
  tier: Tier;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** When present, token usage + cost are recorded for governance. */
  cost?: CallCost;
}): Promise<string> {
  const { tier, system, messages, maxTokens = 4096, temperature = 0.4, cost } = opts;
  if (hasAnthropic()) {
    try {
      const res = await anthropic().messages.create({
        model: ANTHROPIC_MODELS[tier],
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
      });
      if (cost) {
        await recordUsage({
          ...cost,
          provider: "anthropic",
          model: ANTHROPIC_MODELS[tier],
          tokensIn: res.usage.input_tokens,
          tokensOut: res.usage.output_tokens,
        });
      }
      return res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    } catch (err) {
      if (!hasOpenAI()) throw err;
    }
  }
  const res = await openai().chat.completions.create({
    model: OPENAI_MODELS[tier],
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: "system", content: system }, ...messages],
  });
  if (cost) {
    await recordUsage({
      ...cost,
      provider: "openai",
      model: OPENAI_MODELS[tier],
      tokensIn: res.usage?.prompt_tokens ?? 0,
      tokensOut: res.usage?.completion_tokens ?? 0,
    });
  }
  return res.choices[0]?.message?.content ?? "";
}

/**
 * Schema-validated JSON completion with one self-repair retry.
 * `validate` should throw (or return an error) on bad shape — pass a Zod parse.
 */
export async function completeJSON<T>(opts: {
  tier: Tier;
  system: string;
  messages: ChatMessage[];
  validate: (raw: unknown) => T;
  maxTokens?: number;
  cost?: CallCost;
}): Promise<T> {
  const ask = async (extra?: string): Promise<T> => {
    const text = await complete({
      tier: opts.tier,
      system: `${opts.system}\n\nخروجی را فقط به صورت JSON معتبر بده — بدون هیچ متن اضافه، بدون \`\`\`.`,
      messages: extra
        ? [...opts.messages, { role: "user", content: extra }]
        : opts.messages,
      maxTokens: opts.maxTokens ?? 4096,
      temperature: 0.2,
      cost: opts.cost,
    });
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    return opts.validate(JSON.parse(cleaned));
  };
  try {
    return await ask();
  } catch {
    return await ask("خروجی قبلی JSON معتبر نبود. دوباره فقط JSON معتبر مطابق ساختار خواسته‌شده بده.");
  }
}

/** Embedding via OpenAI (1536d). Returns null when no key (callers degrade to keyword search). */
export async function embed(texts: string[], cost?: CallCost): Promise<number[][] | null> {
  if (!hasOpenAI() || texts.length === 0) return null;
  const res = await openai().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.slice(0, 8000)),
  });
  if (cost) {
    await recordUsage({
      ...cost,
      provider: "openai",
      model: EMBEDDING_MODEL,
      tokensIn: res.usage?.prompt_tokens ?? 0,
      tokensOut: 0,
    });
  }
  return res.data.map((d) => d.embedding);
}

export async function embedOne(text: string, cost?: CallCost): Promise<number[] | null> {
  const r = await embed([text], cost);
  return r?.[0] ?? null;
}
