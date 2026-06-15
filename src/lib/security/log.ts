/**
 * Structured security logging (docs/07 §Incident response).
 *
 * Hard rule: this logger is the ONLY place security events are emitted, and its
 * field set is a closed allow-list of NON-sensitive metadata. There is no way to
 * pass document text, prompt content, messages, or extracted text through it —
 * privileged content can never reach the logs by construction.
 */

export type SecEvent =
  | "rate_limit_exceeded"
  | "stream_rejected"
  | "payload_rejected"
  | "abuse_prompt_flood"
  | "abuse_excessive_failures"
  | "abuse_suspicious_agent";

/** Closed allow-list of safe fields. No content-bearing keys exist here. */
export interface SecFields {
  rule?: string;
  identityKind?: "user" | "anon";
  /** Stable hash of the identity (never the raw user id). */
  idHash?: string;
  ip?: string;
  ua?: string;
  limit?: number;
  count?: number;
  remaining?: number;
  retryAfter?: number;
  bytes?: number;
  maxBytes?: number;
  /** Fingerprint hash of a repeated request — never the request itself. */
  fingerprint?: string;
  reason?: string;
}

/**
 * Emit one structured JSON line to stderr. Pluggable: swap the sink for Sentry /
 * Logtail / Vector later without touching call sites.
 */
export function secLog(event: SecEvent, fields: SecFields = {}): void {
  const line = {
    ts: new Date().toISOString(),
    level: "warn" as const,
    scope: "security" as const,
    event,
    ...fields,
  };
  console.warn(JSON.stringify(line));
}
