/**
 * Centralized rate limiting + abuse protection (docs/07 §Availability/abuse).
 *
 * Single reusable implementation — every route goes through this module via
 * `guard.ts`. Pure and framework-agnostic (no Next/Supabase imports) so it is
 * unit-testable with an injected clock.
 *
 * STORE: in-process fixed-window counters + concurrency + abuse trackers.
 * This is correct and production-ready for a SINGLE-INSTANCE deployment
 * (a persistent Node server — Railway/Render/Fly or `next start`). For a
 * multi-instance / serverless fan-out, swap `RateLimiter` for a shared backend
 * (Postgres atomic counters or Upstash) behind the SAME public surface — every
 * call site already depends only on the methods below, so nothing else changes.
 */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/* ───────────────────────── types ───────────────────────── */

export type RateLimitKey = "ai_chat" | "ai_analyze" | "ai_draft" | "doc_upload";
export type IdentityKind = "user" | "anon";

/** Who is making the request. `id` is namespaced (`u:<uuid>` or `ip:<addr>`). */
export interface Identity {
  kind: IdentityKind;
  id: string;
  ip: string;
}

/** A fixed-window rule with separate authenticated / anonymous ceilings. */
export interface RateRule {
  key: RateLimitKey;
  windowMs: number;
  user: number;
  anon: number;
}

export interface RateResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the window resets. */
  resetAt: number;
  /** Seconds the client should wait before retrying (0 when allowed). */
  retryAfterSec: number;
}

export interface AbuseResult {
  flagged: boolean;
  count: number;
}

type Clock = () => number;

/* ───────────────────────── policy ───────────────────────── */

/** Step 3 — request-rate ceilings. */
export const RATE_RULES: Record<RateLimitKey, RateRule> = {
  ai_chat: { key: "ai_chat", windowMs: HOUR, user: 60, anon: 10 },
  ai_analyze: { key: "ai_analyze", windowMs: HOUR, user: 20, anon: 5 },
  ai_draft: { key: "ai_draft", windowMs: HOUR, user: 20, anon: 5 },
  doc_upload: { key: "doc_upload", windowMs: DAY, user: 50, anon: 10 },
};

/** Step 4 — max concurrent streams per identity. */
export const STREAM_LIMITS: Record<IdentityKind, number> = { user: 3, anon: 1 };

/** Safety net: a stream slot auto-frees after this if release() never fires
 * (crash / killed function / dropped socket). > route maxDuration (120s). */
export const STREAM_TTL_MS = 130 * SECOND;

/** Step 5 — max request body sizes (bytes). */
export const SIZE_LIMITS: Record<RateLimitKey, number> = {
  ai_chat: 25 * 1024,
  ai_analyze: 250 * 1024,
  ai_draft: 100 * 1024,
  doc_upload: 25 * 1024 * 1024, // multipart upload hard cap (header-checked)
};

/** Step 6 — abuse thresholds. */
export const ABUSE = {
  /** Same exact request fingerprint repeated within the window. */
  promptRepeat: { windowMs: 2 * MINUTE, threshold: 5 },
  /** Rejected/failed requests from one identity within the window. */
  failures: { windowMs: 10 * MINUTE, threshold: 20 },
} as const;

/** Suggested wait (s) shown to a client that exceeded stream concurrency. */
export const STREAM_RETRY_SEC = 15;

/* ───────────────────────── store entries ───────────────────────── */

interface CounterEntry {
  count: number;
  resetAt: number;
}
interface AbuseEntry {
  fingerprint: string;
  count: number;
  resetAt: number;
}

/* ───────────────────────── limiter ───────────────────────── */

export class RateLimiter {
  private counters = new Map<string, CounterEntry>();
  private streams = new Map<string, Map<string, number>>(); // identity → token → expiresAt
  private prompts = new Map<string, AbuseEntry>();
  private failures = new Map<string, CounterEntry>();
  private ops = 0;

  constructor(private clock: Clock = Date.now) {}

  /* fixed-window request counting */
  consume(rule: RateRule, identity: Identity): RateResult {
    this.maybeSweep();
    const now = this.clock();
    const limit = identity.kind === "user" ? rule.user : rule.anon;
    const key = `${rule.key}:${identity.id}`;
    let e = this.counters.get(key);
    if (!e || now >= e.resetAt) {
      e = { count: 0, resetAt: now + rule.windowMs };
      this.counters.set(key, e);
    }
    e.count++;
    const allowed = e.count <= limit;
    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - e.count),
      resetAt: e.resetAt,
      retryAfterSec: allowed ? 0 : Math.ceil((e.resetAt - now) / SECOND),
    };
  }

  /* ── concurrency: streams ── */

  /** Acquire a stream slot. Returns a token, or null if at capacity. */
  acquireStream(identity: Identity, max: number): string | null {
    const now = this.clock();
    let m = this.streams.get(identity.id);
    if (!m) {
      m = new Map();
      this.streams.set(identity.id, m);
    }
    // Cleanup-on-timeout: drop any slot whose TTL elapsed (missed release).
    for (const [token, expiresAt] of m) if (now >= expiresAt) m.delete(token);
    if (m.size >= max) return null;
    const token = `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    m.set(token, now + STREAM_TTL_MS);
    return token;
  }

  /** Cleanup-on-disconnect / error / completion. Idempotent and safe. */
  releaseStream(identity: Identity, token: string): void {
    const m = this.streams.get(identity.id);
    if (!m) return;
    m.delete(token);
    if (m.size === 0) this.streams.delete(identity.id);
  }

  activeStreams(identity: Identity): number {
    const now = this.clock();
    const m = this.streams.get(identity.id);
    if (!m) return 0;
    for (const [token, expiresAt] of m) if (now >= expiresAt) m.delete(token);
    return m.size;
  }

  /* ── abuse: prompt flooding ── */

  /** Record a request fingerprint; flag when the same one repeats too fast. */
  notePrompt(identity: Identity, fingerprint: string): AbuseResult {
    const now = this.clock();
    const e = this.prompts.get(identity.id);
    if (!e || now >= e.resetAt || e.fingerprint !== fingerprint) {
      this.prompts.set(identity.id, {
        fingerprint,
        count: 1,
        resetAt: now + ABUSE.promptRepeat.windowMs,
      });
      return { flagged: false, count: 1 };
    }
    e.count++;
    return { flagged: e.count > ABUSE.promptRepeat.threshold, count: e.count };
  }

  /* ── abuse: excessive failures ── */

  noteFailure(identity: Identity): AbuseResult {
    const now = this.clock();
    let e = this.failures.get(identity.id);
    if (!e || now >= e.resetAt) {
      e = { count: 0, resetAt: now + ABUSE.failures.windowMs };
      this.failures.set(identity.id, e);
    }
    e.count++;
    return { flagged: e.count > ABUSE.failures.threshold, count: e.count };
  }

  /* ── memory hygiene (cleanup) ── */

  /** Opportunistic sweep so the maps can't grow unbounded under a key-spraying
   * DoS. Runs every 500 ops or whenever a map gets large. */
  private maybeSweep(): void {
    this.ops++;
    if (this.ops % 500 !== 0 && this.counters.size < 5_000) return;
    this.sweep();
  }

  /** Remove all expired entries. Exposed for deterministic tests. */
  sweep(now = this.clock()): void {
    for (const [k, e] of this.counters) if (now >= e.resetAt) this.counters.delete(k);
    for (const [k, e] of this.prompts) if (now >= e.resetAt) this.prompts.delete(k);
    for (const [k, e] of this.failures) if (now >= e.resetAt) this.failures.delete(k);
    for (const [id, m] of this.streams) {
      for (const [token, expiresAt] of m) if (now >= expiresAt) m.delete(token);
      if (m.size === 0) this.streams.delete(id);
    }
  }

  /** Internal sizes — for tests/observability only. */
  stats(): { counters: number; streams: number; prompts: number; failures: number } {
    return {
      counters: this.counters.size,
      streams: this.streams.size,
      prompts: this.prompts.size,
      failures: this.failures.size,
    };
  }
}

/* ── process-wide singleton (survives HMR via globalThis, like the demo store) ── */

const globalRef = globalThis as unknown as { __lexosRateLimiter?: RateLimiter };
export const limiter: RateLimiter = (globalRef.__lexosRateLimiter ??= new RateLimiter());

/* ───────────────────────── helpers ───────────────────────── */

/** Fast non-cryptographic hash (FNV-1a, 32-bit) for fingerprints/log ids. */
export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/* ───────────────────────── standard responses (Step 7) ───────────────────────── */

/** 429 — never leaks internal detail; message is user-facing Persian. */
export function rateLimitResponse(
  retryAfterSec: number,
  message = "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
): Response {
  return Response.json(
    { error: "rate_limit_exceeded", message, retryAfter: retryAfterSec },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

/** 413 — oversized payload. */
export function payloadTooLargeResponse(
  maxBytes: number,
  message = "حجم درخواست بیش از حد مجاز است.",
): Response {
  return Response.json(
    { error: "payload_too_large", message, maxBytes },
    { status: 413 },
  );
}
