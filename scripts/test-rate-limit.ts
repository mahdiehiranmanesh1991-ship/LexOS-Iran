/**
 * Tests for the rate-limit / abuse-protection core (docs/07).
 *
 *   npm run test:security  →  npx tsx scripts/test-rate-limit.ts
 *
 * Unit tests run hermetically with an injected clock (no sleeps, deterministic).
 * Optional HTTP integration tests run only when RL_INTEGRATION=1 with a live
 * server (BASE_URL); they are skipped in CI by default.
 */
import {
  RateLimiter,
  RATE_RULES,
  STREAM_LIMITS,
  STREAM_TTL_MS,
  ABUSE,
  fnv1a,
  rateLimitResponse,
  payloadTooLargeResponse,
  type Identity,
} from "../src/lib/security/rate-limit";

let failures = 0;
function ok(name: string, cond: boolean) {
  if (!cond) failures++;
  console.log(`${cond ? "✓" : "✗ FAIL"} ${name}`);
}

const USER: Identity = { kind: "user", id: "u:alice", ip: "1.1.1.1" };
const ANON: Identity = { kind: "anon", id: "ip:9.9.9.9", ip: "9.9.9.9" };

/* clock harness */
function harness() {
  const ctx = { now: 1_000_000 };
  const rl = new RateLimiter(() => ctx.now);
  return { rl, advance: (ms: number) => (ctx.now += ms) };
}

/* ── 1. fixed-window limiter logic ── */
{
  const { rl } = harness();
  const rule = RATE_RULES.ai_chat; // user 60 / anon 10
  let lastAllowed = true;
  for (let i = 0; i < rule.user; i++) lastAllowed = rl.consume(rule, USER).allowed;
  ok("chat: 60th authed request allowed", lastAllowed);
  const over = rl.consume(rule, USER);
  ok("chat: 61st authed request blocked", !over.allowed);
  ok("chat: blocked result has retryAfter > 0", over.retryAfterSec > 0);
  ok("chat: blocked result remaining === 0", over.remaining === 0);
}

/* ── 2. window reset ── */
{
  const { rl, advance } = harness();
  const rule = RATE_RULES.ai_chat;
  for (let i = 0; i < rule.user + 5; i++) rl.consume(rule, USER);
  ok("reset: blocked before window elapses", !rl.consume(rule, USER).allowed);
  advance(rule.windowMs + 1);
  ok("reset: allowed again after window elapses", rl.consume(rule, USER).allowed);
}

/* ── 3. user vs anon ceilings ── */
{
  const { rl } = harness();
  const rule = RATE_RULES.ai_chat;
  let n = 0;
  while (rl.consume(rule, ANON).allowed) n++;
  ok("anon: chat ceiling is 10", n === rule.anon);
}

/* ── 4. identity isolation ── */
{
  const { rl } = harness();
  const rule = RATE_RULES.ai_analyze; // user 20
  for (let i = 0; i < rule.user; i++) rl.consume(rule, USER);
  const other: Identity = { kind: "user", id: "u:bob", ip: "2.2.2.2" };
  ok("isolation: a separate user has a fresh bucket", rl.consume(rule, other).allowed);
}

/* ── 5. stream concurrency ── */
{
  const { rl } = harness();
  const max = STREAM_LIMITS.user; // 3
  const t1 = rl.acquireStream(USER, max);
  const t2 = rl.acquireStream(USER, max);
  const t3 = rl.acquireStream(USER, max);
  ok("streams: first 3 acquired", !!t1 && !!t2 && !!t3);
  ok("streams: 4th rejected", rl.acquireStream(USER, max) === null);
  rl.releaseStream(USER, t2!);
  ok("streams: slot frees after release", rl.acquireStream(USER, max) !== null);
  ok("streams: anon limited to 1", STREAM_LIMITS.anon === 1);
}

/* ── 6. stream cleanup-on-timeout (TTL) ── */
{
  const { rl, advance } = harness();
  const max = STREAM_LIMITS.user;
  rl.acquireStream(USER, max);
  rl.acquireStream(USER, max);
  rl.acquireStream(USER, max);
  ok("timeout: at capacity before TTL", rl.acquireStream(USER, max) === null);
  advance(STREAM_TTL_MS + 1);
  ok("timeout: stale slots reclaimed after TTL", rl.activeStreams(USER) === 0);
  ok("timeout: can acquire again", rl.acquireStream(USER, max) !== null);
}

/* ── 7. release idempotency / unknown token ── */
{
  const { rl } = harness();
  const t = rl.acquireStream(USER, 3)!;
  rl.releaseStream(USER, t);
  rl.releaseStream(USER, t); // double release — must not throw or underflow
  rl.releaseStream(USER, "nonexistent");
  ok("release: idempotent + unknown token safe", rl.activeStreams(USER) === 0);
}

/* ── 8. abuse: prompt flooding ── */
{
  const { rl, advance } = harness();
  const fp = fnv1a("same exact request");
  let flagged = false;
  for (let i = 0; i <= ABUSE.promptRepeat.threshold; i++) {
    flagged = rl.notePrompt(USER, fp).flagged;
  }
  ok("flood: same fingerprint flagged past threshold", flagged);
  ok("flood: a different fingerprint resets", !rl.notePrompt(USER, fnv1a("different")).flagged);
  advance(ABUSE.promptRepeat.windowMs + 1);
  ok("flood: window expiry resets", !rl.notePrompt(USER, fp).flagged);
}

/* ── 9. abuse: excessive failures ── */
{
  const { rl } = harness();
  let flagged = false;
  for (let i = 0; i <= ABUSE.failures.threshold; i++) flagged = rl.noteFailure(USER).flagged;
  ok("failures: flagged past threshold", flagged);
}

/* ── 10. cleanup / sweep frees memory ── */
{
  const { rl, advance } = harness();
  for (let i = 0; i < 50; i++) {
    rl.consume(RATE_RULES.ai_chat, { kind: "anon", id: `ip:10.0.0.${i}`, ip: `10.0.0.${i}` });
  }
  ok("sweep: counters populated", rl.stats().counters === 50);
  advance(RATE_RULES.ai_chat.windowMs + 1);
  rl.sweep();
  ok("sweep: expired counters removed", rl.stats().counters === 0);
}

/* ── 11. edge: expired session falls back to anon (stricter) ── */
{
  const { rl } = harness();
  const rule = RATE_RULES.ai_chat;
  // Same person, session expired → identity becomes anon → 10 not 60.
  let n = 0;
  while (rl.consume(rule, ANON).allowed) n++;
  ok("edge/expired-session: anon ceiling applies (10)", n === rule.anon);
}

/* ── 12. edge: browser refresh reuses the same bucket ── */
{
  const { rl } = harness();
  const rule = RATE_RULES.ai_draft;
  rl.consume(rule, USER);
  const second = rl.consume(rule, USER); // "refresh" = same identity, new request
  ok("edge/refresh: counter persists across requests", second.remaining === rule.user - 2);
}

/* ── 13. edge: network disconnect frees the stream slot ── */
{
  const { rl } = harness();
  const t = rl.acquireStream(USER, STREAM_LIMITS.user)!;
  // guard.release() is what the route's cancel()/finally calls on disconnect.
  rl.releaseStream(USER, t);
  ok("edge/disconnect: slot freed", rl.activeStreams(USER) === 0);
}

/* ── 14. standard error responses (Step 7) ── */
async function responseTests() {
  const r429 = rateLimitResponse(42);
  ok("429: status", r429.status === 429);
  ok("429: Retry-After header", r429.headers.get("Retry-After") === "42");
  const b429 = (await r429.json()) as { error: string; message: string; retryAfter: number };
  ok("429: body shape { error, message, retryAfter }",
    b429.error === "rate_limit_exceeded" && typeof b429.message === "string" && b429.retryAfter === 42);
  const r413 = payloadTooLargeResponse(25 * 1024);
  ok("413: status", r413.status === 413);
  const b413 = (await r413.json()) as { error: string };
  ok("413: error code", b413.error === "payload_too_large");
}

/* ── optional HTTP integration (skipped unless RL_INTEGRATION=1) ── */
async function integrationTests() {
  if (process.env.RL_INTEGRATION !== "1") {
    console.log("• integration: skipped (set RL_INTEGRATION=1 BASE_URL=… to run)");
    return;
  }
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  // Payload limit: a >25KB chat body must be rejected with 413.
  const big = "x".repeat(26 * 1024);
  const res = await fetch(`${base}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: big }] }),
  });
  ok("integration: oversized chat body → 413", res.status === 413);

  // Throttle: hammer beyond the anon ceiling, expect a 429 to appear.
  let saw429 = false;
  for (let i = 0; i < RATE_RULES.ai_chat.anon + 3; i++) {
    const r = await fetch(`${base}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: `q${i}` }] }),
    });
    if (r.status === 429) saw429 = true;
  }
  ok("integration: anon chat throttled with 429", saw429);
}

(async () => {
  await responseTests();
  await integrationTests();
  console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll rate-limit tests passed ✓");
  process.exit(failures ? 1 : 0);
})();
