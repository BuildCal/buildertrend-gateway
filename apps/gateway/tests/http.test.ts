import { describe, expect, it } from "vitest";
import { CONTENT_JSON } from "../src/adapter.js";
import { createHttpApp } from "../src/http.js";
import { parseVerbArgs } from "../src/schemas.js";
import { createHarness, testConfig } from "./helpers.js";

describe("HTTP /v1", () => {
  it("fails closed when BT_GATEWAY_TOKEN is unset", async () => {
    const { adapter, store } = createHarness();
    const app = createHttpApp(testConfig({ gatewayToken: undefined }), adapter, store);
    const res = await app.request("/v1/catalog");
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("auth_required");
  });

  it("fails closed when the token is empty", async () => {
    const { adapter, store } = createHarness();
    const app = createHttpApp(testConfig({ gatewayToken: "   " }), adapter, store);
    const res = await app.request("/v1/jobs/get?jobId=1");
    expect(res.status).toBe(401);
  });

  it("allows a valid token and dry-runs writes", async () => {
    const { adapter, store, config } = createHarness(undefined, { gatewayToken: "secret" });
    const app = createHttpApp(config, adapter, store);
    const res = await app.request("/v1/variations/add-lines", {
      method: "POST",
      headers: { "content-type": CONTENT_JSON, "x-bt-gateway-token": "secret" },
      body: JSON.stringify({ changeOrderId: 1, lines: [{ title: "x" }] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { dry_run: boolean; ok: boolean };
    expect(body.ok).toBe(true);
    expect(body.dry_run).toBe(true);
  });

  it("rejects a wrong token", async () => {
    const { adapter, store, config } = createHarness(undefined, { gatewayToken: "secret" });
    const app = createHttpApp(config, adapter, store);
    const res = await app.request("/v1/catalog", {
      headers: { "x-bt-gateway-token": "nope" },
    });
    expect(res.status).toBe(401);
  });

  it("returns not_captured for pos.create (create capture still pending)", async () => {
    const { adapter, store, config } = createHarness(undefined, { gatewayToken: "secret" });
    const app = createHttpApp(config, adapter, store);
    const res = await app.request("/v1/pos/create", {
      method: "POST",
      headers: { "content-type": CONTENT_JSON, "x-bt-gateway-token": "secret" },
      body: JSON.stringify({ jobId: 43320680, dry_run: false }),
    });
    expect(res.status).toBe(501);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_captured");
  });

  it("returns not_captured for invoice draft save", async () => {
    const { adapter, store, config } = createHarness(undefined, { gatewayToken: "secret" });
    const app = createHttpApp(config, adapter, store);
    const res = await app.request("/v1/invoices/save-draft", {
      method: "POST",
      headers: { "content-type": CONTENT_JSON, "x-bt-gateway-token": "secret" },
      body: JSON.stringify({ invoiceId: 1, jobId: 2, dry_run: false }),
    });
    expect(res.status).toBe(501);
    const body = (await res.json()) as { error: string; discovery: { click: string } };
    expect(body.error).toBe("not_captured");
    expect(body.discovery.click).toMatch(/Save/i);
  });

  it("keeps health open without a token", async () => {
    const { adapter, store } = createHarness();
    const app = createHttpApp(testConfig({ gatewayToken: undefined }), adapter, store);
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
  });

  it("accepts numeric bills.list statusFilter 0 and coerces it to a string", async () => {
    const parsed = parseVerbArgs("bills.list", { statusFilter: 0 });
    expect(parsed.statusFilter).toBe("0");

    const { adapter, store, config, calls } = createHarness(
      async () => ({
        status: 200,
        contentType: CONTENT_JSON,
        json: { success: true, data: { rows: [] } },
      }),
      { gatewayToken: "secret" },
    );
    const app = createHttpApp(config, adapter, store);
    const headers = { "content-type": CONTENT_JSON, "x-bt-gateway-token": "secret" };
    const invokeRes = await app.request("/v1/invoke", {
      method: "POST",
      headers,
      body: JSON.stringify({ verb: "bills.list", args: { statusFilter: 0 } }),
    });
    expect(invokeRes.status).toBe(200);
    expect(((await invokeRes.json()) as { ok: boolean }).ok).toBe(true);

    const verbRes = await app.request("/v1/bills/list", {
      method: "POST",
      headers,
      body: JSON.stringify({ statusFilter: 0 }),
    });
    expect(verbRes.status).toBe(200);
    const grid = calls.find((c) => c.path === "/api/v1/bills/grid");
    expect(grid?.json).toMatchObject({
      filters: JSON.stringify({ "0": "0", "1": "" }),
    });
  });

  it("returns JSON 400 when verb args fail Zod", async () => {
    const { adapter, store, config } = createHarness(undefined, { gatewayToken: "secret" });
    const app = createHttpApp(config, adapter, store);
    const headers = { "content-type": CONTENT_JSON, "x-bt-gateway-token": "secret" };

    const invokeRes = await app.request("/v1/invoke", {
      method: "POST",
      headers,
      body: JSON.stringify({ verb: "jobs.get", args: { jobId: "not-a-number" } }),
    });
    expect(invokeRes.status).toBe(400);
    const invokeBody = (await invokeRes.json()) as { ok: boolean; error: string };
    expect(invokeBody).toMatchObject({ ok: false, error: "validation" });

    const verbRes = await app.request("/v1/jobs/get?jobId=not-a-number", {
      headers: { "x-bt-gateway-token": "secret" },
    });
    expect(verbRes.status).toBe(400);
    const verbBody = (await verbRes.json()) as { ok: boolean; error: string };
    expect(verbBody).toMatchObject({ ok: false, error: "validation" });
    expect(verbRes.headers.get("content-type")).toMatch(/json/i);
  });
});
