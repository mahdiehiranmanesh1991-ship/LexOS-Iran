import "server-only";

import type { NextRequest } from "next/server";
import { getSessionUser, isDemoMode } from "@/lib/supabase/server";
import { secLog } from "./log";
import {
  fnv1a,
  limiter,
  payloadTooLargeResponse,
  rateLimitResponse,
  RATE_RULES,
  SIZE_LIMITS,
  STREAM_LIMITS,
  STREAM_RETRY_SEC,
  type Identity,
  type RateLimitKey,
} from "./rate-limit";

/**
 * The single integration point every protected route calls. Centralizes:
 * identity resolution → size/body limit → rate limit → abuse detection →
 * stream concurrency. Routes stay clean: one call in, one guard out.
 *
 * Architecture note (Step 8): we deliberately do NOT do this in proxy.ts
 * (middleware). Middleware can't read the body for size/abuse checks, runs on
 * the edge runtime (separate memory from our Node store), and can't express
 * per-route limits cleanly. A shared route wrapper is the most maintainable and
 * correct option; middleware stays responsible for auth only.
 */

export type GuardKind = RateLimitKey;

export type GuardResult =
  | { ok: true; identity: Identity; body: unknown; release: () => void }
  | { ok: false; response: Response };

/** Escape hatch for local debugging only. Never set in production. */
const DISABLED = process.env.RL_DISABLED === "1";

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Resolve who is calling. An expired/absent session (or demo mode) falls
 * through to anonymous → stricter limits, which is the desired posture.
 */
async function resolveIdentity(req: NextRequest): Promise<Identity> {
  const ip = clientIp(req);
  try {
    const user = await getSessionUser(); // null in demo or when session expired
    if (user) return { kind: "user", id: `u:${user.id}`, ip };
  } catch {
    // Auth backend hiccup → treat as anonymous (fail safe, stricter).
  }
  return { kind: "anon", id: `ip:${ip}`, ip };
}

/** Read a JSON body with a hard byte cap (Content-Length + actual bytes). */
async function readJsonLimited(
  req: NextRequest,
  maxBytes: number,
): Promise<{ ok: true; body: unknown; bytes: number } | { ok: false; bytes: number }> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared && declared > maxBytes) return { ok: false, bytes: declared };
  const buf = await req.arrayBuffer();
  if (buf.byteLength > maxBytes) return { ok: false, bytes: buf.byteLength };
  try {
    return { ok: true, body: JSON.parse(new TextDecoder().decode(buf)), bytes: buf.byteLength };
  } catch {
    // Malformed/empty JSON → let the route's Zod schema produce the 400.
    return { ok: true, body: undefined, bytes: buf.byteLength };
  }
}

export async function guardRequest(req: NextRequest, kind: GuardKind): Promise<GuardResult> {
  const identity = await resolveIdentity(req);
  const idHash = fnv1a(identity.id);
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 120);
  const logBase = { rule: kind, identityKind: identity.kind, idHash, ip: identity.ip, ua } as const;
  const maxBytes = SIZE_LIMITS[kind];

  // 1) Size + body. JSON kinds parse here (body is then consumed); multipart
  //    uploads are header-capped only so the route can still read formData().
  let body: unknown;
  if (kind === "doc_upload") {
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > maxBytes) {
      secLog("payload_rejected", { ...logBase, bytes: declared, maxBytes });
      return { ok: false, response: payloadTooLargeResponse(maxBytes) };
    }
  } else {
    const sized = await readJsonLimited(req, maxBytes);
    if (!sized.ok) {
      secLog("payload_rejected", { ...logBase, bytes: sized.bytes, maxBytes });
      return { ok: false, response: payloadTooLargeResponse(maxBytes) };
    }
    body = sized.body;
  }

  if (DISABLED) return { ok: true, identity, body, release: () => {} };

  // 2) Request rate.
  const rule = RATE_RULES[kind];
  const r = limiter.consume(rule, identity);
  if (!r.allowed) {
    secLog("rate_limit_exceeded", {
      ...logBase,
      limit: r.limit,
      remaining: r.remaining,
      retryAfter: r.retryAfterSec,
    });
    limiter.noteFailure(identity);
    return { ok: false, response: rateLimitResponse(r.retryAfterSec) };
  }

  // 3) Abuse: identical-request flooding (fingerprint only — never content).
  if (body !== undefined) {
    const fp = fnv1a(JSON.stringify(body));
    const flood = limiter.notePrompt(identity, fp);
    if (flood.flagged) {
      secLog("abuse_prompt_flood", { ...logBase, fingerprint: fp, count: flood.count });
      return {
        ok: false,
        response: rateLimitResponse(STREAM_RETRY_SEC, "درخواست تکراری بیش از حد. کمی صبر کنید."),
      };
    }
  }

  // 4) Stream concurrency (chat only).
  let release = () => {};
  if (kind === "ai_chat") {
    const max = STREAM_LIMITS[identity.kind];
    const token = limiter.acquireStream(identity, max);
    if (!token) {
      secLog("stream_rejected", { ...logBase, limit: max });
      return {
        ok: false,
        response: rateLimitResponse(
          STREAM_RETRY_SEC,
          "حداکثر تعداد گفتگوی هم‌زمان فعال است. یکی را ببندید و دوباره تلاش کنید.",
        ),
      };
    }
    let released = false;
    release = () => {
      if (released) return; // idempotent: safe on disconnect + finally + timeout
      released = true;
      limiter.releaseStream(identity, token);
    };
  }

  return { ok: true, identity, body, release };
}

/** Record a downstream failure (e.g. provider error) for abuse heuristics. */
export function noteRequestFailure(identity: Identity): void {
  const f = limiter.noteFailure(identity);
  if (f.flagged) {
    secLog("abuse_excessive_failures", {
      identityKind: identity.kind,
      idHash: fnv1a(identity.id),
      ip: identity.ip,
      count: f.count,
    });
  }
}

export { isDemoMode };
