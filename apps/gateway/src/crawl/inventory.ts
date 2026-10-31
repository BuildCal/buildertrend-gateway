// Inventory of everything the Buildertrend web app CAN do, read from the
// JavaScript chunks it ships to the signed-in browser. This is the
// denominator the crawl is scored against: routes and API paths the crawl did
// not reach are listed by name. Identifiers only — no code is stored.

export interface InventoryApi {
  /** Normalised path: params → {p}, lower-cased segments kept as written. */
  path: string;
  methods: string[];
  chunks: string[];
}

export interface InventoryEnum {
  chunk: string;
  members: { name: string; value: number }[];
}

export interface Inventory {
  generatedAt: string;
  chunks: string[];
  apis: InventoryApi[];
  routes: string[];
  enums: InventoryEnum[];
  /** Property names read in *.api.types / *.api.handler chunks, by chunk. */
  fields: Record<string, string[]>;
}

/** Chunk file names referenced from a chunk (import map, dynamic imports, preload lists). */
export function chunkRefs(source: string): string[] {
  const out = new Set<string>();
  const re = /["'`](?:\.{0,2}\/)?(?:app\/static\/|static\/)?([A-Za-z0-9_.$-]+-[A-Za-z0-9_-]{6,12}\.js)["'`]/g;
  for (const m of source.matchAll(re)) out.add(m[1]!);
  return [...out];
}

/** `/api/ChangeOrders/${id}/Update` → `/api/ChangeOrders/{p}/Update`. */
export function normaliseApiPath(raw: string): string {
  let p = raw.replace(/\$\{[^}]*\}/g, "{p}").replace(/\?.*$/, "");
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/\d+(?=\/|$)/g, "/{p}").replace(/\/+$/, "");
  return p;
}

const API_LITERAL = /[`"'](\/?apix?\/(?:[^`"'\\\s]|\$\{[^}]*\})+)[`"']/g;
const METHOD_CALL = /\b(get|post|put|patch|delete|del)\s*\(\s*[`"'](\/?apix?\/(?:[^`"'\\\s]|\$\{[^}]*\})+)[`"']/gi;
const METHOD_PROP = /method\s*:\s*["'`](GET|POST|PUT|PATCH|DELETE)["'`]/gi;

/** API paths in a chunk, with HTTP methods where the call site shows them. */
export function apiRefs(source: string): { path: string; methods: string[] }[] {
  const found = new Map<string, Set<string>>();
  const add = (raw: string, method?: string) => {
    const path = normaliseApiPath(raw);
    if (!/^\/apix?\/[A-Za-z]/.test(path)) return;
    if (!found.has(path)) found.set(path, new Set());
    if (method) found.get(path)!.add(method.toUpperCase() === "DEL" ? "DELETE" : method.toUpperCase());
  };
  for (const m of source.matchAll(METHOD_CALL)) add(m[2]!, m[1]);
  for (const m of source.matchAll(API_LITERAL)) {
    // A `method: "PUT"` in the same call (before its closing paren) names its verb.
    let tail = source.slice(m.index! + m[0].length, m.index! + m[0].length + 200);
    const close = tail.indexOf(")");
    if (close >= 0) tail = tail.slice(0, close);
    const verb = [...tail.matchAll(METHOD_PROP)][0]?.[1];
    add(m[1]!, verb);
  }
  return [...found.entries()].map(([path, methods]) => ({ path, methods: [...methods].sort() }));
}

/** SPA routes: `/app/...` literals and router `path: "/X/:id"` definitions. */
export function routeRefs(source: string): string[] {
  const out = new Set<string>();
  const keep = (r: string) => !/\.(js|css|png|svg|jpe?g|gif|mp3|woff2?|json|ico)$/i.test(r) && !r.includes("${");
  for (const m of source.matchAll(/["'`](\/app\/[A-Za-z][^"'`\s?#]*)["'`]/g)) {
    const r = m[1]!.replace(/\$\{[^}]*\}/g, ":p");
    if (keep(r)) out.add(r);
  }
  // Route constants: any literal shaped like "/ChangeOrders/:changeOrderId/:jobId/Details".
  for (const m of source.matchAll(/["'`](\/?[A-Z][A-Za-z0-9]+(?:\/[A-Za-z0-9_.-]+)*\/:[A-Za-z]+\??(?:\/[A-Za-z0-9_:?.-]+)*)["'`]/g)) {
    const r = m[1]!.startsWith("/") ? m[1]! : `/${m[1]!}`;
    if (keep(r)) out.add(r);
  }
  // Router definitions, with or without a leading slash: path:"ChangeOrders/:id".
  for (const m of source.matchAll(/\bpath\s*:\s*["'`](\/?[A-Z][^"'`\s]*)["'`]/g)) {
    const r = m[1]!.startsWith("/") ? m[1]! : `/${m[1]!}`;
    if (keep(r)) out.add(r);
  }
  return [...out].sort();
}

/**
 * TypeScript numeric enums compile to `e[e.Draft=0]="Draft"`. Returns each
 * enum body found (member names are system labels, not tenant data).
 */
export function enumRefs(source: string): { name: string; value: number }[][] {
  const groups = new Map<string, { name: string; value: number }[]>();
  const re = /([A-Za-z_$][\w$]*)\[\1\.([A-Za-z_$][\w$]*)\s*=\s*(-?\d+)\]\s*=\s*["']\2["']/g;
  for (const m of source.matchAll(re)) {
    const key = `${m[1]}@${Math.floor(m.index! / 4000)}`;
    if (!groups.has(key)) groups.set(key, []);
    const list = groups.get(key)!;
    if (!list.some((x) => x.name === m[2])) list.push({ name: m[2]!, value: Number(m[3]) });
  }
  return [...groups.values()].filter((g) => g.length >= 2);
}

/** Property names a typed API chunk reads off payloads (`data.title`, `this.title=`). */
export function fieldRefs(source: string): string[] {
  const out = new Set<string>();
  for (const m of source.matchAll(/\b(?:data|t|e|n|r|i|o|s|response|entity|model)\.([a-z][A-Za-z0-9]{2,40})\b/g)) out.add(m[1]!);
  for (const m of source.matchAll(/\bthis\.([a-z][A-Za-z0-9]{2,40})\s*=/g)) out.add(m[1]!);
  // Strip obvious JS / framework members.
  for (const noise of NOISE) out.delete(noise);
  return [...out].sort();
}

const NOISE = new Set([
  "length", "push", "map", "filter", "forEach", "then", "catch", "call", "apply", "bind", "prototype",
  "toString", "valueOf", "hasOwnProperty", "keys", "values", "entries", "includes", "indexOf", "slice",
  "splice", "join", "split", "replace", "concat", "reduce", "some", "every", "find", "findIndex", "sort",
  "props", "state", "setState", "default", "exports", "current", "children", "target", "preventDefault",
  "stopPropagation", "trim", "toLowerCase", "toUpperCase", "test", "exec", "match", "assign", "create",
  "defineProperty", "freeze", "isArray", "parse", "stringify", "resolve", "reject", "next", "done",
  "value", "type", "name", "key", "ref", "style", "className", "jsx", "jsxs", "Fragment", "useState",
  "useEffect", "useMemo", "useCallback", "useRef", "useContext", "createElement",
]);

export function emptyInventory(): Inventory {
  return { generatedAt: new Date().toISOString(), chunks: [], apis: [], routes: [], enums: [], fields: {} };
}

/** Fold one chunk's extraction into the inventory. */
export function addChunk(inv: Inventory, chunk: string, source: string): string[] {
  if (!inv.chunks.includes(chunk)) inv.chunks.push(chunk);
  for (const a of apiRefs(source)) {
    let entry = inv.apis.find((x) => x.path === a.path);
    if (!entry) {
      entry = { path: a.path, methods: [], chunks: [] };
      inv.apis.push(entry);
    }
    for (const m of a.methods) if (!entry.methods.includes(m)) entry.methods.push(m);
    if (!entry.chunks.includes(chunk)) entry.chunks.push(chunk);
  }
  for (const r of routeRefs(source)) if (!inv.routes.includes(r)) inv.routes.push(r);
  for (const members of enumRefs(source)) inv.enums.push({ chunk, members });
  if (/\.api\.(types|handler)|Entity|Defaults|Details/i.test(chunk)) {
    const f = fieldRefs(source);
    if (f.length) inv.fields[chunk.replace(/-[A-Za-z0-9_-]{6,12}\.js$/, "")] = f;
  }
  return chunkRefs(source);
}

/** Path match that ignores param names and case: `/api/X/{p}` ~ `/api/x/{id}`. */
export function pathKey(path: string): string {
  return path
    .split("?")[0]!
    .replace(/\{[^}]*\}|:[A-Za-z]+/g, "{}")
    .replace(/\/(?:\d+|0|-1)(?=\/|$)/g, "/{}")
    .toLowerCase()
    .replace(/\/+$/, "");
}

/**
 * Concrete URLs for every route the app defines. `:jobId`-style params get the
 * selected job (or -1); every other id param gets 0, which opens the "new"
 * form and fires its Defaults GET. Wildcards are skipped.
 */
export function routeSeeds(routes: string[], jobId?: number): string[] {
  const out = new Set<string>();
  for (const raw of routes) {
    if (raw.includes("*") || raw.includes("(")) continue;
    let r = raw.startsWith("/app/") ? raw : `/app${raw.startsWith("/") ? raw : `/${raw}`}`;
    r = r.replace(/:([A-Za-z]+)\??/g, (_m, name: string) =>
      /^job(site)?(id)?s?$/i.test(name) || /jobId$/i.test(name) ? String(jobId ?? -1) : /id$/i.test(name) || name === "p" ? "0" : "0",
    );
    if (/\/app\/(login|logout|signin)/i.test(r)) continue;
    out.add(r);
  }
  return [...out].sort();
}
