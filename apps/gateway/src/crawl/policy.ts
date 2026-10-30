// Read-only crawl policy. Pure functions so the write-blocker is unit tested
// without a browser. The runner routes EVERY request through classifyRequest()
// and aborts anything that is not "allow".

export type RequestDecision =
  /** Let it through (GET reads, static assets, known read-only POSTs). */
  | { action: "allow"; reason: string }
  /** Abort and record as a write candidate (capture target). */
  | { action: "block"; reason: string }
  /** Abort silently (telemetry / push / websocket noise). */
  | { action: "drop"; reason: string };

const BT_HOST = /(^|\.)buildertrend\.(net|com)$/i;

/** Third-party telemetry and push noise. Aborted, never recorded. */
const TELEMETRY_HOST =
  /(sentry\.io|ingest\.sentry|datadoghq|browser-intake|rum\.|mixpanel|qualtrics|segment\.(io|com)|googletagmanager|google-analytics|doubleclick|hotjar|fullstory|intercom|launchdarkly|pendo|appcues|heap(analytics)?|amplitude|newrelic|nr-data|walkme|gainsight|zendesk|hubspot|facebook|clarity\.ms|bugsnag|logrocket|onesignal|pusher|firebase(io|installations)?|fcm\.googleapis)/i;

/** First-party paths that are telemetry / push registration / realtime noise. */
const TELEMETRY_PATH =
  /\/(signalr|mp-proxy|sawmill[\w-]*|notificationhub|push(registration|subscription)?s?|devicetokens?|telemetry|beacon|rum|clientlogs?|heartbeat|keepalive)(\/|$|\?)/i;

/**
 * Known read-only POSTs. Buildertrend uses POST for grid/list queries and a
 * few lookups. Anything not on this list is a write candidate.
 * Patterns match the pathname only (no query), case-insensitive.
 */
export const READ_ONLY_POSTS: { pattern: RegExp; why: string }[] = [
  { pattern: /^\/api(x)?\/(v\d\/)?[A-Za-z]+\/grid$/i, why: "list grid" },
  { pattern: /^\/api(x)?\/(v\d\/)?[A-Za-z]+\/[A-Za-z]+\/grid$/i, why: "nested list grid" },
  { pattern: /^\/apix\/v\d\/[A-Za-z]+\/tab-counts$/i, why: "grid tab counts" },
  { pattern: /^\/apix\/v\d\/Landing$/i, why: "landing dashboard read" },
  { pattern: /^\/api\/jobpicker\/GetJobPickerData$/i, why: "job picker rows" },
  // Session scope only (which job the picker shows). The gateway already fires it.
  { pattern: /^\/api\/jobpicker\/SetJobPickerData$/i, why: "job picker scope (session only)" },
  { pattern: /^\/api\/Search$/i, why: "search lookup" },
  { pattern: /^\/apix\/v\d\/JobCostingBudget$/i, why: "costing header read" },
  { pattern: /^\/apix\/v\d\/JobCostingBudget\/line-items$/i, why: "costing lines read" },
  { pattern: /^\/api(x)?\/(v\d\/)?[A-Za-z]+\/(get|search|lookup|list)[A-Za-z]*$/i, why: "explicit Get/Search/List lookup" },
  // List-shaped POSTs: GridTemplate, CalendarList, Calendar, ActivityFeed, …List.
  { pattern: /^\/api(x)?\/(v\d\/)?([A-Za-z]+\/)?[A-Za-z-]*(grid|calendar|feed)[A-Za-z-]*$/i, why: "grid/calendar/feed read" },
  { pattern: /^\/api(x)?\/(v\d\/)?[A-Za-z]+\/[A-Za-z]*List$/, why: "…List read" },
  // Last segment names a read: …/list, …/summary, …/search, …/count(s), …/totals, …/preview.
  { pattern: /^\/api(x)?\/(v\d\/)?([A-Za-z-]+\/){1,3}(list|summary|search|counts?|totals|preview)$/i, why: "list/summary read" },
];

/**
 * Path tokens that mean a request mutates state even when it is a GET.
 * Matched against camelCase / kebab tokens of each path segment.
 */
const MUTATING_TOKENS = new Set([
  "add", "create", "insert", "save", "update", "edit", "upsert", "put", "patch",
  "delete", "remove", "destroy", "purge", "void", "cancel", "archive", "restore",
  "send", "resend", "notify", "invite", "share", "publish",
  "submit", "approve", "decline", "reject", "release", "unrelease",
  "convert", "close", "reopen", "finalize", "finalise", "lock", "unlock",
  "pay", "payment", "charge", "refund", "sync", "import", "upload", "clone",
  "copy", "duplicate", "move", "merge", "assign", "unassign", "mark", "complete",
  "sign", "accept", "logout", "logoff", "signout", "reset", "disconnect", "set",
  "bulk", "apply", "temp", "tempfile", "ocr",
]);

/** Read-ish prefixes that neutralise a mutating token (e.g. GetLinkedItems). */
const READ_PREFIX_TOKENS = new Set(["get", "list", "search", "lookup", "can", "is", "has", "defaults", "default"]);

/** Never neutralised by a read prefix (GetAndDelete, can-send-and-notify …). */
const DESTRUCTIVE_TOKENS = new Set([
  "delete", "remove", "destroy", "purge", "void", "send", "resend", "notify",
  "submit", "approve", "release", "convert", "pay", "charge", "refund", "save",
]);

export function tokenizeSegment(segment: string): string[] {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s\-_.]+/)
    .map((t) => t.toLowerCase())
    .filter(Boolean);
}

/**
 * True when a path segment names a mutation. A Get/List/… prefix neutralises
 * soft tokens for GETs; `strict` (used for POSTs) ignores the prefix.
 */
export function segmentLooksMutating(segment: string, strict = false): boolean {
  const tokens = tokenizeSegment(segment);
  if (!tokens.length) return false;
  if (READ_PREFIX_TOKENS.has(tokens[0]!)) {
    const rest = tokens.slice(1);
    return rest.some((t) => DESTRUCTIVE_TOKENS.has(t) || (strict && MUTATING_TOKENS.has(t)));
  }
  return tokens.some((t) => MUTATING_TOKENS.has(t));
}

export function pathLooksMutating(pathname: string, strict = false): boolean {
  return pathname.split("/").filter(Boolean).some((seg) => segmentLooksMutating(seg, strict));
}

export function isBuildertrendHost(host: string): boolean {
  return BT_HOST.test(host);
}

export function isApiPath(pathname: string): boolean {
  return /^\/api(x)?\//i.test(pathname);
}

export function classifyRequest(input: {
  method: string;
  url: string;
  resourceType?: string;
}): RequestDecision {
  const method = input.method.toUpperCase();
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return { action: "drop", reason: "unparseable url" };
  }
  if (url.protocol === "data:" || url.protocol === "blob:") {
    return { action: "allow", reason: "inline resource" };
  }
  if (input.resourceType === "websocket" || url.protocol === "ws:" || url.protocol === "wss:") {
    return { action: "drop", reason: "websocket" };
  }
  if (TELEMETRY_HOST.test(url.hostname)) return { action: "drop", reason: "telemetry host" };
  if (input.resourceType === "ping" || input.resourceType === "beacon") {
    return { action: "drop", reason: "beacon" };
  }

  const firstParty = isBuildertrendHost(url.hostname);
  // Root-level opaque token POSTs are log/telemetry ingestion beacons.
  if (method !== "GET" && /^\/[A-Za-z0-9_-]{24,}\/?$/.test(url.pathname)) {
    return { action: "drop", reason: "opaque ingestion path" };
  }
  if (firstParty && TELEMETRY_PATH.test(url.pathname)) {
    return { action: "drop", reason: "first-party telemetry/push" };
  }

  if (method === "OPTIONS") return { action: "allow", reason: "preflight" };

  if (method === "GET" || method === "HEAD") {
    if (!firstParty) return { action: "allow", reason: "third-party asset" };
    // Navigations to /app/... are SPA routes, never handlers. Only API GETs
    // can carry a mutating verb in the path (…/Delete?id=…).
    if (isApiPath(url.pathname) && pathLooksMutating(url.pathname)) {
      return { action: "block", reason: "GET with mutating path" };
    }
    return { action: "allow", reason: "read" };
  }

  if (!firstParty) return { action: "block", reason: `third-party ${method}` };

  if (method === "POST") {
    const hit = READ_ONLY_POSTS.find((r) => r.pattern.test(url.pathname));
    if (hit && !pathLooksMutatingExcept(url.pathname, hit.pattern)) {
      return { action: "allow", reason: `read-only POST: ${hit.why}` };
    }
  }
  return { action: "block", reason: `write ${method}` };
}

// The allowlist regexes are deliberate; SetJobPickerData is the only allowlisted
// path with a mutating token, so let the matched pattern win over the token scan
// for that one, and keep the token scan for every other allowlisted shape.
function pathLooksMutatingExcept(pathname: string, matched: RegExp): boolean {
  if (/SetJobPickerData/i.test(matched.source)) return false;
  return pathLooksMutating(pathname, true);
}

// ── UI click guard ───────────────────────────────────────────────────────────

/**
 * Labels the crawler must never click, even though the network layer would
 * abort the write anyway. Belt and braces.
 */
const UNSAFE_LABEL =
  /\b(save|send|resend|submit|approve|decline|reject|delete|remove|release|unrelease|notify|convert|void|pay|payment|archive|restore|close|reopen|finali[sz]e|sign|publish|import|export|sync|email|text|share|invite|accept|request|lock|unlock|reset|disconnect|apply|assign|mark|complete|clone|copy|duplicate|move|merge|upload|download|print|log ?out|sign ?out|cancel|discard|confirm|ok|yes|done|update|create job|create invoice|generate|refresh|transfer|post|record|charge|refund|deactivate|activate|disable|enable|turn (on|off)|connect|link|unlink|attach|detach|mute|follow|subscribe|unsubscribe|pin|star|favorite|favourite|undo|redo|clear|check ?in|check ?out|clock ?in|clock ?out|start|stop|recall|withdraw|retract|revert|revoke|resubmit|reassign|like|unlike|react|reaction|vote|rate|acknowledge|confirm|dismiss|snooze|read|unread|rename|qr)\b/i;

/** Tabs / nav: anything not on the deny list. */
export function isSafeTabLabel(label: string): boolean {
  const text = label.trim();
  if (!text || text.length > 60) return false;
  // Counter-only buttons ("0", "3") are reactions / likes / read toggles.
  if (/^[\d\s{}n+]+$/.test(text)) return false;
  return !UNSAFE_LABEL.test(text);
}

/** "New" / "Add" openers only — they open a blank form that fires Defaults GETs. */
export function isSafeNewFormLabel(label: string): boolean {
  const text = label.replace(/\s+/g, " ").trim();
  if (!text || text.length > 40) return false;
  if (!/^\+?\s*(new|add|create)\b/i.test(text)) return false;
  // "Add" alone is fine; "Add & Send", "Create and release" are not.
  const rest = text.replace(/^\+?\s*(new|add|create)\b/i, "");
  return !UNSAFE_LABEL.test(rest);
}

/**
 * Control labels can carry data ("Email ‹person›", "Purchase Order: PO-305").
 * Template numbers and person-name tails before a label is recorded.
 */
export function templateActionLabel(label: string): string {
  // Avatar buttons: initials then a name ("JS Jane Smith", "AT Acme Trade").
  if (/^[A-Z]{1,3}\s+[A-Z0-9]/.test(label) && !/^(PO|CO|RFI|ID|GST|PDF|CSV|AIA|URL)\b/.test(label)) return "{avatar}";
  let t = label.replace(/\d+/g, "{n}");
  // Grid rows read as one button (folder name + timestamps): tenant data.
  if (/\{n\}:\{n\}|\b(AM|PM)\b/.test(t) || t.length > 60) return "{row}";
  t = t.replace(/^(Email|Call|Text|Message|Chat with)\s+([A-Z][a-z'’-]+)(\s+(&|and)?\s*[A-Z][a-z'’-]+)*$/u, "$1 {person}");
  t = t.replace(/:\s+.+$/, ": {value}");
  return t;
}

/** Form labels that embed a person ("Grant Jane automatic access to new jobs"). */
export function templateFieldLabel(label: string): string {
  // Not templateActionLabel: its avatar rule would eat "GL Account".
  return label
    .replace(/^(Grant|Give)\s+[A-Z][a-z'’-]+(\s+[A-Z][a-z'’-]+)?(?=\s+[a-z])/u, "$1 {person}")
    // "track when Jane clocks in": a capitalised word between lowercase ones.
    .replace(/(?<=\b[a-z]+\s)(?!Buildertrend\b)[A-Z][a-z'’-]+(?=\s+[a-z])/gu, "{person}");
}

// ── Templating (never record ids or personal data) ─────────────────────────

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function templateSegment(segment: string): string {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    /* keep raw */
  }
  if (/^-?\d+$/.test(decoded)) return decoded === "0" ? "0" : "{id}";
  if (GUID.test(decoded)) return "{guid}";
  if (decoded.includes("@")) return "{email}";
  if (/^(true|false)$/i.test(decoded)) return decoded.toLowerCase();
  if (/^[A-Za-z0-9+/=_-]{24,}$/.test(decoded) && /\d/.test(decoded)) return "{token}";
  if (/\s/.test(decoded) || decoded.length > 60) return "{text}";
  return segment;
}

/**
 * Path with ids templated; query reduced to sorted keys with `=` values
 * templated. `0` survives because `id=0` means "new form".
 */
export function templateUrl(rawUrl: string): { path: string; queryKeys: string[]; template: string } {
  const url = new URL(rawUrl, "https://buildertrend.net");
  const path = "/" + url.pathname.split("/").filter(Boolean).map(templateSegment).join("/");
  const queryKeys = [...new Set([...url.searchParams.keys()])].sort();
  const query = queryKeys.length ? "?" + queryKeys.map((k) => `${k}=`).join("&") : "";
  return { path, queryKeys, template: path + query };
}

/** Screen (SPA route) key: path only, templated. Query dropped. */
export function screenKey(rawUrl: string): string {
  return templateUrl(rawUrl).path;
}

// ── Session ──────────────────────────────────────────────────────────────────

export function looksLikeLoginUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (/auth0|login\.|signin\./i.test(url.hostname)) return true;
    return /\/(login|signin|sign-in|account\/login|app\/login|logout)(\/|$)/i.test(url.pathname);
  } catch {
    return false;
  }
}

/** True for a JSON payload Buildertrend sends when the session is dead. */
export function payloadNeedsRelogin(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const rec = payload as Record<string, unknown>;
  return rec.needsToRelogin === true || rec.NeedsToRelogin === true;
}
