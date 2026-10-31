// Sync engine: Buildertrend as the system of record, any app as the working
// app. Each run pages through every resource list, keeps a mirror of records,
// and appends created / updated / removed events to a change log. Apps either
// read `changes.list` from a cursor or receive the same events by webhook.
// Buildertrend has no change feed of its own, so this is polling, gently.

import { createHmac } from "node:crypto";
import { unwrapData } from "./adapter.js";
import type { GatewayConfig } from "./config.js";
import { GatewayError } from "./errors.js";
import { asRecord, asRows, buildGridBody, extractGridRows, numberish } from "./grids.js";
import { stableHash } from "./hash.js";
import { btJson, type VerbContext } from "./invoke.js";
import { RESOURCES, RESOURCE_BY_TYPE, resolveGet, resourceJobId, scalar, type ResourceDef } from "./resources.js";
import { sanitizeReadOutput } from "./secret-scan.js";
import type { ChangeEvent, SyncRecord, SyncStore } from "./sync-store.js";

export const DEFAULT_PAGE_SIZE = 200;

const TITLE_KEYS = [
  "title", "billTitle", "purchaseOrderTitle", "packageTitle", "logTitle", "name", "displayName",
  "company", "opportunityTitle", "sourceTitle", "subject", "jobName",
];
const NUMBER_KEYS = [
  "customId", "invoiceNumber", "purchaseOrderNumber", "poNumber", "billNumber", "billNumberLink",
  "rfiNumber", "changeOrderNumber", "submittalNumber", "jobNumber",
];
const STATUS_KEYS = [
  "status", "statusText", "approvalStatus", "proposalStatus", "paymentStatus", "completionStatus",
  "subActivationStatus", "activationStatus",
];
const AMOUNT_KEYS = [
  "ownerPrice", "totalWithTax", "paymentAmount", "totalAmount", "total", "amount", "builderCost",
  "totalApprovedBidAmount",
];
const UPDATED_KEYS = ["updated", "lastUpdatedDate", "updatedDate", "dateUpdated", "lastModified", "modifiedDate", "updatedOn"];

/** Fields that change on view, not on edit. Left out of the change hash. */
const VOLATILE = /^(rowNumber|lastViewed|ownerLastViewed|viewedByOwnerOn|isUnread|unreadCount|relativeDate)$/;

function first(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = scalar(row[key]);
    if (value != null && value !== "") return value;
  }
  return undefined;
}

export function rowHash(row: Record<string, unknown>): string {
  const stable: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) if (!VOLATILE.test(key)) stable[key] = value;
  return stableHash(stable);
}

/** Generic summary fields every app can rely on; `data` keeps the full row. */
export function toSyncRecord(
  def: ResourceDef,
  rawRow: Record<string, unknown>,
  now: string,
  previous?: SyncRecord | null,
): SyncRecord | null {
  const row = sanitizeReadOutput(rawRow) as Record<string, unknown>;
  const id = def.id(row);
  if (!id) return null;
  const title = first(row, TITLE_KEYS);
  const number = first(row, NUMBER_KEYS);
  const status = first(row, STATUS_KEYS);
  const updatedAt = first(row, UPDATED_KEYS);
  return {
    type: def.type,
    id,
    jobId: resourceJobId(def, row),
    title: title == null ? undefined : String(title),
    number: number == null ? undefined : String(number),
    status: status == null ? undefined : String(status),
    amount: numberish(first(row, AMOUNT_KEYS)),
    updatedAt: updatedAt == null ? undefined : String(updatedAt),
    hash: rowHash(row),
    data: row,
    detail: previous?.detail,
    firstSeenAt: previous?.firstSeenAt ?? now,
    lastSeenAt: now,
  };
}

export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => !VOLATILE.test(key) && stableHash(before[key]) !== stableHash(after[key])).sort();
}

export function requireSync(ctx: VerbContext): SyncStore {
  if (!ctx.sync) throw new GatewayError("validation", "Sync store is not configured.");
  return ctx.sync;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every job id visible to the signed-in user: job-scoped lists need them all. */
export async function allJobIds(ctx: VerbContext): Promise<number[]> {
  const jobs = RESOURCE_BY_TYPE.get("job")!;
  const { rows } = await fetchAll(ctx, jobs, [], { delayMs: ctx.config.syncDelayMs });
  return [...new Set(rows.map((row) => resourceJobId(jobs, row)).filter((id): id is number => Boolean(id)))];
}

export interface ListPage {
  rows: Record<string, unknown>[];
  total?: number;
}

export async function fetchListPage(
  ctx: VerbContext,
  def: ResourceDef,
  jobIds: number[],
  page: number,
  pageSize: number,
  search?: string,
): Promise<ListPage> {
  const list = def.list;
  if (list.kind === "get") {
    const data = asRecord(unwrapData(await btJson(ctx, { method: "GET", path: list.path, query: list.query })));
    return { rows: asRows(data[list.rowsAt]) };
  }
  if (list.kind === "post") {
    const data = asRecord(unwrapData(await btJson(ctx, { method: "POST", path: list.path, json: list.body(jobIds) })));
    return { rows: asRows(data[list.rowsAt]) };
  }
  const body = buildGridBody({ jobIds: list.jobScoped ? jobIds : [], page, pageSize, search });
  const gridRequest = asRecord(body.gridRequest);
  if (list.entity) gridRequest.emptyStateEntity = list.entity;
  body.filters = "{}";
  const payload = await btJson(ctx, { method: "POST", path: list.path, query: list.query, json: body });
  return { rows: asRows(extractGridRows(payload)), total: numberish(asRecord(unwrapData(payload)).records) };
}

/** Page through a list. `complete` is false when the page cap cut it short. */
export async function fetchAll(
  ctx: VerbContext,
  def: ResourceDef,
  jobIds: number[],
  opts: { pageSize?: number; maxPages?: number; delayMs?: number } = {},
): Promise<{ rows: Record<string, unknown>[]; complete: boolean }> {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxPages = opts.maxPages ?? 50;
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchListPage(ctx, def, jobIds, page, pageSize);
    let fresh = 0;
    for (const row of result.rows) {
      const key = def.id(row) ?? stableHash(row);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      fresh += 1;
    }
    // Non-grid lists return everything at once; grids stop on a short or repeated page.
    if (def.list.kind !== "grid" || result.rows.length < pageSize || fresh === 0) return { rows, complete: true };
    if (result.total != null && rows.length >= result.total) return { rows, complete: true };
    if (opts.delayMs) await sleep(opts.delayMs);
  }
  return { rows, complete: false };
}

export async function fetchDetail(ctx: VerbContext, def: ResourceDef, id: string, jobId?: number): Promise<unknown> {
  if (!def.get) throw new GatewayError("validation", `${def.type} has no single-record read.`);
  const { path, query } = resolveGet(def.get, id, jobId);
  return sanitizeReadOutput(unwrapData(await btJson(ctx, { method: "GET", path, query })));
}

export interface SyncRunOptions {
  types?: string[];
  /** Restrict to these jobs. Skips removal detection (the pass is partial). */
  jobIds?: number[];
  /** Fetch the full record for every created / updated row (slower). */
  hydrate?: boolean;
  maxHydrate?: number;
  maxPages?: number;
  pageSize?: number;
}

export interface TypeResult {
  type: string;
  listed: number;
  created: number;
  updated: number;
  removed: number;
  hydrated: number;
  complete: boolean;
  error?: string;
}

export async function runSync(ctx: VerbContext, opts: SyncRunOptions = {}): Promise<{
  startedAt: string;
  finishedAt: string;
  cursor: number;
  results: TypeResult[];
}> {
  const sync = requireSync(ctx);
  const startedAt = new Date().toISOString();
  const defs = opts.types?.length
    ? opts.types.map((type) => {
        const def = RESOURCE_BY_TYPE.get(type);
        if (!def) throw new GatewayError("validation", `Unknown resource type ${type}`, { known: RESOURCES.map((r) => r.type) });
        return def;
      })
    : RESOURCES.filter((r) => r.syncDefault);
  const partial = Boolean(opts.jobIds?.length);
  const jobIds = partial ? opts.jobIds! : await allJobIds(ctx);
  let hydrateBudget = opts.maxHydrate ?? 200;
  const results: TypeResult[] = [];

  for (const def of defs) {
    const result: TypeResult = { type: def.type, listed: 0, created: 0, updated: 0, removed: 0, hydrated: 0, complete: false };
    results.push(result);
    try {
      const listed = await fetchAll(ctx, def, jobIds, {
        pageSize: opts.pageSize,
        maxPages: opts.maxPages,
        delayMs: ctx.config.syncDelayMs,
      });
      result.listed = listed.rows.length;
      result.complete = listed.complete;
      const now = new Date().toISOString();
      const seen = new Set<string>();
      for (const row of listed.rows) {
        const id = def.id(row);
        if (!id) continue;
        seen.add(id);
        const previous = await sync.getRecord(def.type, id);
        const record = toSyncRecord(def, row, now, previous);
        if (!record) continue;
        const isNew = !previous || previous.removed;
        const isChanged = !isNew && previous!.hash !== record.hash;
        if ((isNew || isChanged) && opts.hydrate && def.get && hydrateBudget > 0) {
          hydrateBudget -= 1;
          try {
            record.detail = await fetchDetail(ctx, def, id, record.jobId);
            result.hydrated += 1;
          } catch (err) {
            if (err instanceof GatewayError && err.code === "auth_required") throw err;
          }
        }
        await sync.putRecord(record);
        if (isNew) {
          result.created += 1;
          await sync.appendChange({ type: def.type, id, jobId: record.jobId, action: "created", at: now });
        } else if (isChanged) {
          result.updated += 1;
          await sync.appendChange({
            type: def.type,
            id,
            jobId: record.jobId,
            action: "updated",
            changedFields: changedFields(previous!.data, record.data),
            at: now,
          });
        }
      }
      // Only a full, uncapped pass can say a record is gone.
      if (!partial && listed.complete) {
        for (const id of await sync.recordIds(def.type)) {
          if (seen.has(id)) continue;
          const previous = await sync.getRecord(def.type, id);
          if (!previous) continue;
          await sync.putRecord({ ...previous, removed: true, lastSeenAt: now });
          await sync.appendChange({ type: def.type, id, jobId: previous.jobId, action: "removed", at: now });
          result.removed += 1;
        }
      }
    } catch (err) {
      if (err instanceof GatewayError && err.code === "auth_required") throw err;
      result.error = err instanceof Error ? err.message : String(err);
    }
  }

  return { startedAt, finishedAt: new Date().toISOString(), cursor: await sync.lastSeq(), results };
}

/** Event as apps receive it: the change plus the record's summary fields. */
export async function expandChange(sync: SyncStore, event: ChangeEvent): Promise<Record<string, unknown>> {
  const record = await sync.getRecord(event.type, event.id);
  return {
    ...event,
    record: record
      ? {
          type: record.type,
          id: record.id,
          jobId: record.jobId,
          title: record.title,
          number: record.number,
          status: record.status,
          amount: record.amount,
          updatedAt: record.updatedAt,
          removed: record.removed ?? false,
        }
      : undefined,
  };
}

export function signWebhook(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

/** POST pending events to BT_WEBHOOK_URL in batches; advance the cursor only on 2xx. */
export async function deliverWebhooks(
  config: GatewayConfig,
  sync: SyncStore,
  post: typeof fetch = fetch,
  batchSize = 100,
): Promise<{ delivered: number; cursor: number; error?: string }> {
  if (!config.webhookUrl) return { delivered: 0, cursor: Number((await sync.getCursor("webhook")) ?? 0) };
  if (!config.webhookSecret) {
    return { delivered: 0, cursor: 0, error: "BT_WEBHOOK_SECRET is required to sign webhooks." };
  }
  let cursor = Number((await sync.getCursor("webhook")) ?? 0);
  let delivered = 0;
  for (;;) {
    const events = await sync.changesSince(cursor, batchSize);
    if (!events.length) break;
    const payload = {
      source: "buildertrend-gateway",
      events: await Promise.all(events.map((event) => expandChange(sync, event))),
      cursor: events[events.length - 1]!.seq,
    };
    const body = JSON.stringify(payload);
    try {
      const res = await post(config.webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-bt-gateway-event": "changes",
          "x-bt-gateway-signature": signWebhook(config.webhookSecret, body),
        },
        body,
      });
      if (!res.ok) return { delivered, cursor, error: `webhook HTTP ${res.status}` };
    } catch (err) {
      return { delivered, cursor, error: err instanceof Error ? err.message : String(err) };
    }
    cursor = payload.cursor;
    delivered += events.length;
    await sync.setCursor("webhook", String(cursor));
  }
  return { delivered, cursor };
}

/**
 * In-process poller for `serve` / `mcp` when BT_SYNC_INTERVAL_SEC > 0. Runs
 * never overlap. Stops polling on auth_required until the next start: a
 * person has to sign in; the gateway never loops logins.
 */
export function startSyncLoop(
  ctx: Omit<VerbContext, "args" | "dryRun">,
  log: (line: string) => void = (line) => console.error(line),
): () => void {
  const intervalMs = ctx.config.syncIntervalSec * 1000;
  if (intervalMs <= 0) return () => undefined;
  let running = false;
  let stopped = false;
  const tick = async () => {
    if (running || stopped) return;
    running = true;
    try {
      const run = await runSync({ ...ctx, args: {}, dryRun: false }, { hydrate: ctx.config.syncHydrate });
      const totals = run.results.reduce(
        (acc, r) => ({ c: acc.c + r.created, u: acc.u + r.updated, r: acc.r + r.removed }),
        { c: 0, u: 0, r: 0 },
      );
      const hook = await deliverWebhooks(ctx.config, requireSync({ ...ctx, args: {}, dryRun: false }));
      log(`[sync] created=${totals.c} updated=${totals.u} removed=${totals.r} cursor=${run.cursor} webhook=${hook.delivered}${hook.error ? ` (${hook.error})` : ""}`);
    } catch (err) {
      if (err instanceof GatewayError && err.code === "auth_required") {
        stopped = true;
        log("[sync] auth_required: sign in to buildertrend.net in the gateway profile, then restart. Polling stopped.");
      } else {
        log(`[sync] error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, intervalMs);
  void tick();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
