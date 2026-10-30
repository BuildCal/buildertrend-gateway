// Turn JSON payloads into key shapes. Values never leave this module except
// short dropdown labels on fields that are clearly system enums.

import { SECRET_FIELD_NAME } from "../secret-scan.js";

export interface EnumOptions {
  /** Dotted key path of the option array, e.g. `data.statusOptions`. */
  path: string;
  count: number;
  /** Present only when the field is a system enum (not people / jobs / vendors). */
  labels?: string[];
}

export interface PayloadShape {
  /** Sorted dotted key paths. Arrays collapse to `[]`. Ids in keys are templated. */
  keys: string[];
  enums: EnumOptions[];
}

const MAX_DEPTH = 7;
const MAX_KEYS = 1500;
const MAX_ENUM_LABELS = 40;

/** Fields whose option labels are people, companies, jobs or contact data. */
const PERSONAL_FIELD =
  /(pay|purchase|order|invoice|bill|bid|selection|schedule|phase|project|site|approv|person|people|user|member|employee|staff|assign|owner|vendor|sub(contractor)?s?\b|subs?[A-Z]|contact|customer|client|lead|job|builder|account|email|phone|mobile|address|street|suburb|city|postcode|zip|manager|creat|modif|approver|signer|recipient|viewer|watcher|crew|worker|sales|estimator|bank|card|name|company|supplier|payee|tag|folder|file|template|costcode|cost_code|costitem|catalog|item|location|lot)/i;

const OPTION_ID = ["id", "value", "key", "code", "enumValue"];
const OPTION_LABEL = ["name", "text", "label", "title", "displayName", "description"];

/** Template an object key that is itself data (ids, emails, free text). */
export function templateKey(key: string): string {
  if (/^-?\d+$/.test(key)) return "{id}";
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(key)) return "{guid}";
  if (key.includes("@")) return "{email}";
  if (/\s/.test(key) || key.length > 60) return "{text}";
  return key;
}

function isOptionArray(value: unknown[]): boolean {
  if (value.length === 0) return false;
  const sample = value.slice(0, 5);
  return sample.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const keys = Object.keys(item);
    return OPTION_ID.some((k) => keys.includes(k)) && OPTION_LABEL.some((k) => keys.includes(k));
  });
}

function labelOf(item: Record<string, unknown>): string | undefined {
  for (const k of OPTION_LABEL) {
    const v = item[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** A label is safe to record only if it carries no contact-shaped data. */
export function isSafeEnumLabel(label: string): boolean {
  if (label.length > 60) return false;
  if (label.includes("@")) return false;
  if (/\d{6,}/.test(label.replace(/[\s()+-]/g, ""))) return false; // phone / account no.
  if (/\b\d+\s+[A-Z][a-z]+\s+(St|Street|Rd|Road|Ave|Avenue|Dr|Drive|Ct|Court|Pl|Place|Cres|Lane|Ln|Way)\b/.test(label)) return false;
  return true;
}

/** Field names that hold system enums (allow-list: labels are only kept for these). */
const ENUM_FIELD =
  /(status|type|kind|category|categories|priority|unit|frequency|method|format|view|column|stage|source|reason|terms|tax|mode|visibility|permission|sort|group|range|period|role|level|option|state|condition|action|rule|setting|preference|currency|measure|scope|class|grade|severity|outcome|result)/i;

/**
 * System enum = option array on a key that names an enum (status, type, …)
 * and is not about people / jobs / vendors. Anything else keeps a count only.
 */
export function isSystemEnumField(path: string): boolean {
  const last = path.split(".").pop() ?? path;
  const bare = last.replace(/\[\]$/, "");
  // "Bill type", "PO status": the suffix makes it an enum of the entity.
  if (/(status|type)(es|s)?$/i.test(bare.trim())) return !/(user|contact|email|phone|address|name)/i.test(bare);
  return ENUM_FIELD.test(bare) && !PERSONAL_FIELD.test(bare);
}

export function shapeOf(payload: unknown): PayloadShape {
  const keys = new Set<string>();
  const enums = new Map<string, EnumOptions>();

  const walk = (value: unknown, path: string, depth: number): void => {
    if (keys.size >= MAX_KEYS || depth > MAX_DEPTH || value == null) return;
    if (Array.isArray(value)) {
      if (path && isOptionArray(value) && !enums.has(path)) {
        const entry: EnumOptions = { path, count: value.length };
        if (isSystemEnumField(path) && value.length <= MAX_ENUM_LABELS) {
          const labels = value
            .map((item) => labelOf(item as Record<string, unknown>))
            .filter((l): l is string => !!l);
          if (labels.every(isSafeEnumLabel)) entry.labels = labels;
        }
        enums.set(path, entry);
      }
      const arrPath = `${path}[]`;
      // Union the shapes of the first few elements.
      for (const item of value.slice(0, 3)) walk(item, arrPath, depth + 1);
      return;
    }
    if (typeof value !== "object") return;
    for (const [rawKey, inner] of Object.entries(value as Record<string, unknown>)) {
      const key = templateKey(rawKey);
      const next = path ? `${path}.${key}` : key;
      keys.add(next);
      if (SECRET_FIELD_NAME.test(rawKey)) continue; // key recorded, never descend into secrets
      walk(inner, next, depth + 1);
    }
  };

  walk(payload, "", 0);
  return { keys: [...keys].sort(), enums: [...enums.values()].sort((a, b) => a.path.localeCompare(b.path)) };
}

/** Top-level + nested keys of a request body (string or object). Never values. */
export function bodyKeys(body: string | null | undefined): { keys: string[]; kind: string } {
  if (body == null || body === "") return { keys: [], kind: "empty" };
  try {
    const parsed = JSON.parse(body) as unknown;
    return { keys: shapeOf(parsed).keys, kind: Array.isArray(parsed) ? "json-array" : "json" };
  } catch {
    // Form-encoded: keys only.
    if (/^[^=&\s]+=[^&]*(&[^=&\s]+=[^&]*)*$/.test(body)) {
      return { keys: [...new URLSearchParams(body).keys()].sort(), kind: "form" };
    }
    return { keys: [], kind: "opaque" };
  }
}
