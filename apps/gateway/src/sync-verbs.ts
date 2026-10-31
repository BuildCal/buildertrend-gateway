// Handlers for the registry read verbs (`subs.list`, `schedule.get`, …) and the
// sync surface apps integrate against: sync.run, changes.list, records.*,
// links.*, push and webhooks.deliver.

import { unwrapData } from "./adapter.js";
import { GENERATED_VERBS, VERB_BY_NAME } from "./catalog.js";
import { GatewayError } from "./errors.js";
import { asRecord, numberish, pickId } from "./grids.js";
import { btJson, invokeByName, registerVerb, type VerbContext } from "./invoke.js";
import { RESOURCES, RESOURCE_BY_TYPE, resolveGet, type ResourceDef } from "./resources.js";
import { parseVerbArgs } from "./schemas.js";
import { sanitizeReadOutput } from "./secret-scan.js";
import {
  allJobIds,
  deliverWebhooks,
  expandChange,
  fetchDetail,
  fetchListPage,
  requireSync,
  runSync,
  toSyncRecord,
} from "./sync.js";

function jobIdsArg(ctx: VerbContext): number[] | undefined {
  const ids = Array.isArray(ctx.args.jobIds) ? (ctx.args.jobIds as unknown[]).map(Number).filter(Boolean) : [];
  const one = numberish(ctx.args.jobId);
  if (one) ids.push(one);
  return ids.length ? ids : undefined;
}

function idArg(ctx: VerbContext): string {
  const id = ctx.args.id;
  if (id == null || id === "") throw new GatewayError("validation", "id is required");
  return String(id);
}

const generated = new Set(GENERATED_VERBS.map((v) => v.verb));

function registerResourceVerbs(def: ResourceDef): void {
  const own = (verb: string) => generated.has(verb);

  if (own(`${def.prefix}.list`)) {
    registerVerb(`${def.prefix}.list`, async (ctx) => {
      const jobIds = def.list.jobScoped ? (jobIdsArg(ctx) ?? (await allJobIds(ctx))) : [];
      const page = numberish(ctx.args.page) ?? 1;
      const pageSize = numberish(ctx.args.pageSize) ?? 100;
      const result = await fetchListPage(ctx, def, jobIds, page, pageSize, ctx.args.search as string | undefined);
      return sanitizeReadOutput({ type: def.type, page, pageSize, total: result.total, rows: result.rows });
    });
  }
  if (def.get && own(`${def.prefix}.get`)) {
    registerVerb(`${def.prefix}.get`, async (ctx) => fetchDetail(ctx, def, idArg(ctx), numberish(ctx.args.jobId)));
  }
  if (def.defaults && own(`${def.prefix}.defaults`)) {
    const spec = def.defaults;
    registerVerb(`${def.prefix}.defaults`, async (ctx) => {
      const { path, query } = resolveGet(spec, undefined, numberish(ctx.args.jobId));
      return sanitizeReadOutput(unwrapData(await btJson(ctx, { method: "GET", path, query })));
    });
  }
  if (def.setup && own(`${def.prefix}.setup`)) {
    const path = def.setup;
    registerVerb(`${def.prefix}.setup`, async (ctx) =>
      sanitizeReadOutput(unwrapData(await btJson(ctx, { method: "GET", path }))),
    );
  }
}

for (const def of RESOURCES) registerResourceVerbs(def);

registerVerb("resources.list", async () => ({
  resources: RESOURCES.map((def) => ({
    type: def.type,
    label: def.label,
    module: def.module,
    verbs: [".list", ".get", ".defaults", ".setup"]
      .map((suffix) => `${def.prefix}${suffix}`)
      .filter((verb) => VERB_BY_NAME.has(verb)),
    list: { method: def.list.kind === "get" ? "GET" : "POST", path: def.list.path, jobScoped: def.list.jobScoped },
    get: def.get?.path,
    defaults: def.defaults?.path,
    setup: def.setup,
    syncDefault: def.syncDefault,
    write: WRITE_ROUTES[def.type] ?? null,
  })),
}));

function typesArg(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) return value.split(",").map((s) => s.trim());
  return undefined;
}

registerVerb("sync.run", async (ctx) => {
  const run = await runSync(ctx, {
    types: typesArg(ctx.args.types),
    jobIds: jobIdsArg(ctx),
    hydrate: ctx.args.hydrate === true,
    maxHydrate: numberish(ctx.args.maxHydrate),
    maxPages: numberish(ctx.args.maxPages),
    pageSize: numberish(ctx.args.pageSize),
  });
  const webhook = ctx.args.deliver === false ? undefined : await deliverWebhooks(ctx.config, requireSync(ctx));
  return { ...run, webhook };
});

registerVerb("changes.list", async (ctx) => {
  const sync = requireSync(ctx);
  const since = numberish(ctx.args.since) ?? 0;
  const limit = Math.min(numberish(ctx.args.limit) ?? 500, 5000);
  const events = await sync.changesSince(since, limit, typesArg(ctx.args.types));
  const expanded = await Promise.all(events.map((event) => expandChange(sync, event)));
  return {
    events: expanded,
    cursor: events.length ? events[events.length - 1]!.seq : since,
    hasMore: events.length === limit,
  };
});

function requireType(value: unknown): ResourceDef {
  const def = RESOURCE_BY_TYPE.get(String(value ?? ""));
  if (!def) throw new GatewayError("validation", "Unknown or missing type", { known: RESOURCES.map((r) => r.type) });
  return def;
}

registerVerb("records.list", async (ctx) => {
  const def = requireType(ctx.args.type);
  const records = await requireSync(ctx).listRecords({
    type: def.type,
    jobId: numberish(ctx.args.jobId),
    includeRemoved: ctx.args.includeRemoved === true,
    limit: Math.min(numberish(ctx.args.limit) ?? 500, 5000),
    offset: numberish(ctx.args.offset) ?? 0,
  });
  return { type: def.type, count: records.length, records };
});

registerVerb("records.get", async (ctx) => {
  const def = requireType(ctx.args.type);
  const sync = requireSync(ctx);
  const id = idArg(ctx);
  const record = await sync.getRecord(def.type, id);
  if (ctx.args.fresh !== true) {
    if (!record) throw new GatewayError("not_found", `No mirrored ${def.type} ${id}. Run sync.run or pass fresh=true.`);
    return record;
  }
  const detail = await fetchDetail(ctx, def, id, numberish(ctx.args.jobId) ?? record?.jobId);
  const now = new Date().toISOString();
  const updated = record
    ? { ...record, detail, lastSeenAt: now }
    : { ...toSyncRecord(def, { ...asRecord(detail), id }, now)!, detail };
  await sync.putRecord(updated);
  return updated;
});

function linkKey(ctx: VerbContext): { app: string; appType: string; appId: string } {
  const app = String(ctx.args.app ?? "default");
  const appType = String(ctx.args.appType ?? ctx.args.btType ?? "");
  const appId = String(ctx.args.appId ?? "");
  if (!appType || !appId) throw new GatewayError("validation", "appType and appId are required");
  return { app, appType, appId };
}

registerVerb("links.set", async (ctx) => {
  const key = linkKey(ctx);
  const def = requireType(ctx.args.btType);
  const btId = String(ctx.args.btId ?? "");
  if (!btId) throw new GatewayError("validation", "btId is required");
  const link = { ...key, btType: def.type, btId, createdAt: new Date().toISOString() };
  await requireSync(ctx).putLink(link);
  return link;
});

registerVerb("links.get", async (ctx) => {
  const sync = requireSync(ctx);
  if (ctx.args.btId != null) {
    const def = requireType(ctx.args.btType);
    return { links: await sync.findLinksByBt(def.type, String(ctx.args.btId)) };
  }
  const key = linkKey(ctx);
  const link = await sync.findLinkByApp(key.app, key.appType, key.appId);
  return { links: link ? [link] : [] };
});

registerVerb("links.list", async (ctx) => ({
  links: await requireSync(ctx).listLinks(
    ctx.args.app == null ? undefined : String(ctx.args.app),
    ctx.args.appType == null ? undefined : String(ctx.args.appType),
  ),
}));

registerVerb("links.delete", async (ctx) => {
  const key = linkKey(ctx);
  return { deleted: await requireSync(ctx).deleteLink(key.app, key.appType, key.appId) };
});

/**
 * Where `push` sends each Buildertrend type. The verbs carry their own capture
 * status: an uncaptured one answers not_captured with the click to capture.
 */
export const WRITE_ROUTES: Record<string, { create?: string; update?: string; idArg: string }> = {
  job: { create: "jobs.create", update: "jobs.update", idArg: "jobId" },
  lead: { create: "leads.create", update: "leads.update", idArg: "leadId" },
  contact: { create: "contacts.create", update: "contacts.update", idArg: "contactId" },
  variation: { create: "variations.createDraft", update: "variations.saveDraft", idArg: "changeOrderId" },
  invoice: { create: "invoices.saveDraft", update: "invoices.saveDraft", idArg: "invoiceId" },
  bill: { create: "bills.create", update: "bills.update", idArg: "billId" },
  purchaseOrder: { create: "pos.create", update: "pos.update", idArg: "purchaseOrderId" },
};

/** Id of the record a create verb returned. */
export function createdIdFrom(data: unknown, idKey: string): string | undefined {
  const record = asRecord(data);
  for (const candidate of [record, asRecord(record.raw), asRecord(record.data), asRecord(record.created)]) {
    const value = candidate[idKey] ?? pickId(candidate);
    if (value != null && value !== "" && value !== 0) return String(value);
  }
  return undefined;
}

registerVerb("push", async (ctx) => {
  const def = requireType(ctx.args.btType);
  const key = linkKey({ ...ctx, args: { ...ctx.args, appType: ctx.args.appType ?? def.type } });
  const sync = requireSync(ctx);
  const route = WRITE_ROUTES[def.type];
  const link = await sync.findLinkByApp(key.app, key.appType, key.appId);
  const op = link ? "update" : "create";
  const verb = route?.[op];
  if (!route || !verb) {
    throw new GatewayError("not_captured", `No ${op} path for ${def.type} yet. Capture it first (docs/buildertrend-coverage-map.md, "Write captures still needed").`, {
      btType: def.type,
      op,
    });
  }
  const target = VERB_BY_NAME.get(verb);
  if (target && !target.captured) {
    throw new GatewayError("not_captured", `${verb} has no captured write path.`, {
      btType: def.type,
      op,
      verb,
      discovery: target.discovery,
    });
  }
  const args: Record<string, unknown> = { ...asRecord(ctx.args.args) };
  if (ctx.args.dry_run !== undefined) args.dry_run = ctx.args.dry_run;
  if (link) args[route.idArg] = numberish(link.btId) ?? link.btId;
  const result = await invokeByName(verb, {
    config: ctx.config,
    adapter: ctx.adapter,
    store: ctx.store,
    sync,
    args: parseVerbArgs(verb, args),
  });
  let saved = link;
  if (!link && result.ok && result.dry_run === false) {
    const btId = createdIdFrom(result.data, route.idArg);
    if (btId) {
      saved = { ...key, btType: def.type, btId, createdAt: new Date().toISOString() };
      await sync.putLink(saved);
    }
  }
  return { op, verb, link: saved ?? null, result };
});

registerVerb("webhooks.deliver", async (ctx) => deliverWebhooks(ctx.config, requireSync(ctx)));

