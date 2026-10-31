import { describe, expect, it } from "vitest";
import { CONTENT_JSON, ReadOnlyAdapter, ScriptedAdapter, type BtRequest, type BtResponse } from "../src/adapter.js";
import { GENERATED_VERBS, VERB_BY_NAME, VERBS } from "../src/catalog.js";
import { createHttpApp } from "../src/http.js";
import { invokeByName } from "../src/invoke.js";
import { RESOURCES, RESOURCE_BY_TYPE, resolveGet, scalar } from "../src/resources.js";
import { VERB_SCHEMAS } from "../src/schemas.js";
import { MemoryStore } from "../src/store.js";
import { changedFields, deliverWebhooks, signWebhook, toSyncRecord } from "../src/sync.js";
import { MemorySyncStore, SqliteSyncStore, type SyncStore } from "../src/sync-store.js";
import { createdIdFrom, WRITE_ROUTES } from "../src/sync-verbs.js";
import "../src/verbs.js";
import { testConfig } from "./helpers.js";

const json = (data: unknown): BtResponse => ({ status: 200, contentType: CONTENT_JSON, json: { success: true, data } });

/** Fake Buildertrend: jobs 1 and 2, and whatever subs / bills the test sets. */
function fakeBt(state: { subs: Record<string, unknown>[]; bills: Record<string, unknown>[] }) {
  const calls: BtRequest[] = [];
  const adapter = new ScriptedAdapter((req) => {
    calls.push(req);
    if (req.path === "/api/Jobsites/Grid") return json({ data: [{ jobId: 1, jobName: "Alpha" }, { jobId: 2, jobName: "Beta" }] });
    if (req.path === "/api/Subs/Grid") return json({ data: state.subs, records: state.subs.length });
    if (req.path === "/api/v1/bills/grid") {
      const body = req.json as { pagingData: { currentPage: number; pageSize: number } };
      const { currentPage, pageSize } = body.pagingData;
      return json({ data: state.bills.slice((currentPage - 1) * pageSize, currentPage * pageSize), records: state.bills.length });
    }
    return json({});
  });
  return { calls, adapter };
}

function harness(state: { subs: Record<string, unknown>[]; bills: Record<string, unknown>[] }, sync: SyncStore = new MemorySyncStore()) {
  const { calls, adapter } = fakeBt(state);
  const config = testConfig({ syncDelayMs: 0 });
  const store = new MemoryStore();
  return {
    calls,
    sync,
    config,
    invoke: (verb: string, args: Record<string, unknown> = {}) => invokeByName(verb, { config, adapter, store, sync, args }),
  };
}

describe("resource registry", () => {
  it("has unique types and prefixes and only /api or /apix paths", () => {
    expect(new Set(RESOURCES.map((r) => r.type)).size).toBe(RESOURCES.length);
    expect(new Set(RESOURCES.map((r) => r.prefix)).size).toBe(RESOURCES.length);
    for (const def of RESOURCES) {
      for (const path of [def.list.path, def.get?.path, def.defaults?.path, def.setup].filter(Boolean)) {
        expect(path).toMatch(/^\/(api|apix)\//);
      }
    }
  });

  it("gives every generated and sync verb a schema, tool and route", () => {
    for (const spec of VERBS) expect(VERB_SCHEMAS[spec.verb], spec.verb).toBeDefined();
    expect(new Set(VERBS.map((v) => v.tool)).size).toBe(VERBS.length);
    expect(new Set(VERBS.map((v) => `${v.httpMethod} ${v.httpPath}`)).size).toBe(VERBS.length);
    expect(VERB_BY_NAME.get("subs.list")?.httpPath).toBe("/v1/subs/list");
    expect(VERB_BY_NAME.get("dailyLogs.get")?.tool).toBe("bt_daily_logs_get");
  });

  it("never shadows a hand-written verb", () => {
    expect(GENERATED_VERBS.map((v) => v.verb)).not.toContain("jobs.list");
    expect(GENERATED_VERBS.map((v) => v.verb)).not.toContain("bills.get");
    expect(GENERATED_VERBS.every((v) => v.kind === "read")).toBe(true);
  });

  it("fills ids and job ids into record paths", () => {
    const invoice = RESOURCE_BY_TYPE.get("invoice")!;
    expect(resolveGet(invoice.get!, "7", 3)).toEqual({ path: "/apix/v3/Invoices/get-invoice", query: { invoiceId: "7", job: 3 } });
    expect(resolveGet(invoice.defaults!, undefined, undefined).query).toEqual({});
    const schedule = RESOURCE_BY_TYPE.get("scheduleItem")!;
    expect(schedule.id({ title: { scheduleItemId: 55, jobId: 9, title: "Frame" } })).toBe("55");
  });

  it("reduces grid cells to plain values", () => {
    expect(scalar({ title: "PO-1", url: "/x" })).toBe("PO-1");
    expect(scalar({ value: 12.5 })).toBe(12.5);
    expect(scalar(["a"])).toEqual(["a"]);
  });
});

describe("sync.run", () => {
  it("records created, updated and removed changes with a cursor", async () => {
    const state = {
      subs: [
        { id: 10, company: "Sparky Electrical", status: "Active" },
        { id: 11, company: "Pipe Co", status: "Active" },
      ],
      bills: [],
    };
    const h = harness(state);
    const first = await h.invoke("sync.run", { types: ["sub"] });
    expect(first.ok).toBe(true);
    const run1 = first.data as { results: { created: number }[]; cursor: number };
    expect(run1.results[0]!.created).toBe(2);

    state.subs = [{ id: 10, company: "Sparky Electrical", status: "Inactive" }];
    await h.invoke("sync.run", { types: ["sub"] });

    const changes = (await h.invoke("changes.list", { since: 0 })).data as {
      events: { seq: number; action: string; id: string; changedFields?: string[]; record?: { title?: string } }[];
      cursor: number;
    };
    expect(changes.events.map((e) => `${e.action}:${e.id}`)).toEqual(["created:10", "created:11", "updated:10", "removed:11"]);
    expect(changes.events[2]!.changedFields).toEqual(["status"]);
    expect(changes.events[0]!.record?.title).toBe("Sparky Electrical");

    const later = (await h.invoke("changes.list", { since: changes.cursor })).data as { events: unknown[] };
    expect(later.events).toEqual([]);

    const records = (await h.invoke("records.list", { type: "sub" })).data as { count: number };
    expect(records.count).toBe(1);
    const withRemoved = (await h.invoke("records.list", { type: "sub", includeRemoved: true })).data as { count: number };
    expect(withRemoved.count).toBe(2);
  });

  it("does not report removals from a partial (job-filtered) pass", async () => {
    const state = { subs: [{ id: 10, company: "A" }], bills: [] };
    const h = harness(state);
    await h.invoke("sync.run", { types: ["sub"] });
    state.subs = [];
    const run = (await h.invoke("sync.run", { types: ["sub"], jobIds: [1] })).data as { results: { removed: number }[] };
    expect(run.results[0]!.removed).toBe(0);
  });

  it("pages job-scoped grids across every job with the grid's entity number", async () => {
    const bills = Array.from({ length: 5 }, (_, i) => ({ id: 100 + i, jobId: 1, title: `Bill ${i}` }));
    const h = harness({ subs: [], bills });
    const run = (await h.invoke("sync.run", { types: ["bill"], pageSize: 2 })).data as {
      results: { listed: number; complete: boolean }[];
    };
    expect(run.results[0]).toMatchObject({ listed: 5, complete: true });
    const gridCalls = h.calls.filter((c) => c.path === "/api/v1/bills/grid");
    expect(gridCalls).toHaveLength(3);
    const body = gridCalls[0]!.json as { jobIds: number[]; filters: string; gridRequest: { emptyStateEntity: number } };
    expect(body.jobIds).toEqual([1, 2]);
    expect(body.filters).toBe("{}");
    expect(body.gridRequest.emptyStateEntity).toBe(58);
  });

  it("ignores view-only fields when deciding a record changed", () => {
    expect(changedFields({ a: 1, lastViewed: "x" }, { a: 1, lastViewed: "y" })).toEqual([]);
    const def = RESOURCE_BY_TYPE.get("sub")!;
    const a = toSyncRecord(def, { id: 1, rowNumber: 1 }, "t")!;
    const b = toSyncRecord(def, { id: 1, rowNumber: 2 }, "t")!;
    expect(a.hash).toBe(b.hash);
  });

  it("refuses unknown types", async () => {
    const h = harness({ subs: [], bills: [] });
    await expect(h.invoke("sync.run", { types: ["nope"] })).rejects.toMatchObject({ code: "validation" });
  });
});

describe("links and push", () => {
  it("dry-runs a create when the app record is not linked yet", async () => {
    const h = harness({ subs: [], bills: [] });
    const res = await h.invoke("push", { app: "viabuild", btType: "bill", appId: "inv-1", args: { jobId: 1, vendorId: 2 } });
    const data = res.data as { op: string; verb: string; link: unknown; result: { dry_run: boolean } };
    expect(data).toMatchObject({ op: "create", verb: "bills.create", link: null });
    expect(data.result.dry_run).toBe(true);
    expect(h.calls).toHaveLength(0);
  });

  it("routes a linked record to the update verb with the Buildertrend id", async () => {
    const h = harness({ subs: [], bills: [] });
    await h.invoke("links.set", { app: "viabuild", appType: "variation", appId: "v-9", btType: "variation", btId: "77" });
    const res = await h.invoke("push", { app: "viabuild", appType: "variation", appId: "v-9", btType: "variation", args: { header: { title: "x" } } });
    const data = res.data as { op: string; verb: string; result: { dry_run: boolean; data: { args: Record<string, unknown> } } };
    expect(data.op).toBe("update");
    expect(data.verb).toBe("variations.saveDraft");
    expect(data.result.dry_run).toBe(true);
    expect(data.result.data.args.changeOrderId).toBe(77);
  });

  it("answers not_captured for writes Buildertrend has not shown us", async () => {
    const h = harness({ subs: [], bills: [] });
    await expect(h.invoke("push", { btType: "purchaseOrder", appId: "po-1", args: {} })).rejects.toMatchObject({ code: "not_captured" });
    await expect(h.invoke("push", { btType: "warrantyClaim", appId: "w-1", args: {} })).rejects.toMatchObject({ code: "not_captured" });
  });

  it("finds links both ways and deletes them", async () => {
    const h = harness({ subs: [], bills: [] });
    await h.invoke("links.set", { app: "a", appType: "job", appId: "j1", btType: "job", btId: "5" });
    const byBt = (await h.invoke("links.get", { btType: "job", btId: "5" })).data as { links: { appId: string }[] };
    expect(byBt.links[0]!.appId).toBe("j1");
    expect(((await h.invoke("links.delete", { app: "a", appType: "job", appId: "j1" })).data as { deleted: boolean }).deleted).toBe(true);
    expect(((await h.invoke("links.list", {})).data as { links: unknown[] }).links).toEqual([]);
  });

  it("reads the new id from a create result", () => {
    expect(createdIdFrom({ raw: { billId: 42 } }, "billId")).toBe("42");
    expect(createdIdFrom({ id: 9 }, "billId")).toBe("9");
    expect(createdIdFrom({}, "billId")).toBeUndefined();
    for (const route of Object.values(WRITE_ROUTES)) {
      for (const verb of [route.create, route.update].filter(Boolean)) expect(VERB_BY_NAME.has(verb!), verb).toBe(true);
    }
  });
});

describe("webhooks", () => {
  it("signs batches and advances the cursor only on success", async () => {
    const sync = new MemorySyncStore();
    await sync.appendChange({ type: "sub", id: "1", action: "created", at: "t" });
    await sync.appendChange({ type: "sub", id: "2", action: "created", at: "t" });
    const config = testConfig({ webhookUrl: "https://app.example/hook", webhookSecret: "s3cret" });

    const failing = (async () => new Response("no", { status: 500 })) as unknown as typeof fetch;
    expect(await deliverWebhooks(config, sync, failing)).toMatchObject({ delivered: 0, error: "webhook HTTP 500" });
    expect(await sync.getCursor("webhook")).toBeUndefined();

    const seen: { body: string; signature: string }[] = [];
    const ok = (async (_url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      seen.push({ body: String(init.body), signature: headers["x-bt-gateway-signature"]! });
      return new Response("ok", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await deliverWebhooks(config, sync, ok, 1)).toMatchObject({ delivered: 2, cursor: 2 });
    expect(seen).toHaveLength(2);
    expect(seen[0]!.signature).toBe(signWebhook("s3cret", seen[0]!.body));
    expect(await deliverWebhooks(config, sync, ok)).toMatchObject({ delivered: 0, cursor: 2 });
  });

  it("refuses to send unsigned webhooks", async () => {
    const config = testConfig({ webhookUrl: "https://app.example/hook", webhookSecret: undefined });
    expect((await deliverWebhooks(config, new MemorySyncStore())).error).toMatch(/BT_WEBHOOK_SECRET/);
  });
});

describe("read-only mode", () => {
  it("lets reads and list POSTs through and refuses writes", async () => {
    const inner = new ScriptedAdapter(() => json({ ok: 1 }));
    const adapter = new ReadOnlyAdapter(inner, "https://buildertrend.net");
    await expect(adapter.request({ method: "GET", path: "/api/Subs/1" })).resolves.toBeTruthy();
    await expect(adapter.request({ method: "POST", path: "/api/Subs/Grid", json: {} })).resolves.toBeTruthy();
    await expect(adapter.request({ method: "PUT", path: "/api/PurchaseOrders/1", json: {} })).rejects.toMatchObject({ code: "send_disabled" });
    await expect(adapter.request({ method: "POST", path: "/api/v1/bills", json: {} })).rejects.toMatchObject({ code: "send_disabled" });
  });
});

describe("SQLite sync store", () => {
  it("round-trips records, changes, links and cursors", async () => {
    const sync = await SqliteSyncStore.open(":memory:");
    const record = toSyncRecord(RESOURCE_BY_TYPE.get("sub")!, { id: 3, company: "Acme", jobId: 4 }, "t")!;
    await sync.putRecord(record);
    expect(await sync.getRecord("sub", "3")).toEqual(record);
    expect(await sync.countRecords()).toEqual({ sub: 1 });
    expect((await sync.listRecords({ type: "sub", jobId: 4 })).map((r) => r.id)).toEqual(["3"]);
    const event = await sync.appendChange({ type: "sub", id: "3", action: "updated", changedFields: ["company"], at: "t" });
    expect(await sync.changesSince(0, 10, ["sub"])).toEqual([event]);
    expect(await sync.changesSince(0, 10, ["bill"])).toEqual([]);
    await sync.putLink({ app: "a", appType: "sub", appId: "x", btType: "sub", btId: "3", createdAt: "t" });
    expect((await sync.findLinksByBt("sub", "3"))[0]!.appId).toBe("x");
    await sync.setCursor("webhook", "1");
    expect(await sync.getCursor("webhook")).toBe("1");
  });
});

describe("HTTP surface", () => {
  it("exposes registry reads and the change feed behind the token", async () => {
    const state = { subs: [{ id: 10, company: "A" }], bills: [] };
    const { adapter } = fakeBt(state);
    const config = testConfig({ gatewayToken: "t", syncDelayMs: 0 });
    const app = createHttpApp(config, adapter, new MemoryStore(), new MemorySyncStore());
    const headers = { "content-type": CONTENT_JSON, "x-bt-gateway-token": "t" };
    const list = await app.request("/v1/subs/list", { method: "POST", headers, body: "{}" });
    expect(((await list.json()) as { data: { rows: unknown[] } }).data.rows).toHaveLength(1);
    await app.request("/v1/sync/run", { method: "POST", headers, body: JSON.stringify({ types: "sub" }) });
    const feed = await app.request("/v1/changes/list?since=0", { headers });
    expect(((await feed.json()) as { data: { events: unknown[] } }).data.events).toHaveLength(1);
    expect((await app.request("/v1/changes/list")).status).toBe(401);
  });
});
