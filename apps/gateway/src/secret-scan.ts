import { GatewayError } from "./errors.js";

/**
 * Shared secret scanner for verb outputs.
 *
 * Policy:
 * - `session.status` is an allowlist and **fails closed** if anything secret-shaped
 *   remains (`assertSessionStatusSafe`).
 * - List/get `{ raw, rows }` (and `{ raw, jobs }`) plus form-defaults are
 *   otherwise legitimate business records. Offending fields are **redacted**
 *   in place; the rest of the payload is kept. If a token-shaped *string*
 *   is still present after redaction, the call fails closed.
 *
 * Findings never include the secret text — only a path and a shape label.
 */

/** Field names that must never appear unredacted on a verb output. */
export const SECRET_FIELD_NAME =
  /key|token|secret|password|license|licence|private/i;

export const REDACTED_SECRET = "[redacted]";

const PEM_BLOCK = /-----BEGIN [A-Z ]{0,40}KEY-----/;
const GOOGLE_API_KEY = /AIza[0-9A-Za-z_-]{20,}/;
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
const HEX_TOKEN = /^[0-9a-fA-F]{24,}$/;
const BASE64_TOKEN = /^[A-Za-z0-9+/]{24,}={0,2}$/;

const MAX_DEPTH = 12;

export interface SecretFinding {
  path: string;
  reason: string;
  /** Never the secret itself — only a short shape label. */
  shape: string;
}

function valueShape(value: string): string | undefined {
  if (PEM_BLOCK.test(value)) return "pem";
  if (GOOGLE_API_KEY.test(value)) return "google_api_key";
  if (JWT.test(value)) return "jwt";
  const trimmed = value.trim();
  if (HEX_TOKEN.test(trimmed)) return "hex_token";
  if (BASE64_TOKEN.test(trimmed)) return "base64_token";
  return undefined;
}

/**
 * Walk a payload and report token-shaped values or secret-named keys.
 * Findings never include the secret text.
 */
export function findSecretShapedValues(value: unknown, path = "$"): SecretFinding[] {
  const findings: SecretFinding[] = [];
  walk(value, path, findings, 0);
  return findings;
}

function walk(value: unknown, path: string, findings: SecretFinding[], depth: number): void {
  if (value == null || depth > MAX_DEPTH) return;
  if (typeof value === "string") {
    const shape = valueShape(value);
    if (shape) findings.push({ path, reason: "token-shaped string", shape });
    return;
  }
  if (typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, findings, depth + 1));
    return;
  }
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    const child = `${path}.${key}`;
    if (SECRET_FIELD_NAME.test(key) && inner !== REDACTED_SECRET) {
      findings.push({ path: child, reason: "secret-named field", shape: "field_name" });
    }
    walk(inner, child, findings, depth + 1);
  }
}

/**
 * Replace token-shaped strings and secret-named field values with `[redacted]`.
 * Other fields (ids, titles, amounts, options) are copied unchanged.
 */
export function redactSecretShapedValues(value: unknown, depth = 0): unknown {
  if (value == null || depth > MAX_DEPTH) return value;
  if (typeof value === "string") {
    return valueShape(value) ? REDACTED_SECRET : value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactSecretShapedValues(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_FIELD_NAME.test(key)
      ? REDACTED_SECRET
      : redactSecretShapedValues(inner, depth + 1);
  }
  return out;
}

/** Fail closed if any token-shaped *string* is still present (field names already redacted are ok). */
export function assertNoTokenShapedStrings(value: unknown, message: string): void {
  const leftover = findSecretShapedValues(value).filter(
    (finding) => finding.reason === "token-shaped string",
  );
  if (leftover.length) {
    throw new GatewayError("bt_error", message, {
      findings: leftover.map((finding) => ({ path: finding.path, shape: finding.shape })),
    });
  }
}

/**
 * Redact offending fields on a list/get or form-defaults payload.
 * Fails closed only if a token-shaped string survives redaction.
 */
export function sanitizeReadOutput<T>(value: T): T {
  const redacted = redactSecretShapedValues(value);
  assertNoTokenShapedStrings(
    redacted,
    "Read output still contained a token-shaped value after redaction",
  );
  return redacted as T;
}
