// Profile transport: requests run as fetch() inside the dedicated gateway
// Chrome profile, so they carry its cookies and Chrome's own TLS. The context
// keeps the crawl's network write-blocker: the Buildertrend page itself can
// never write. Only the gateway's own fetches (tagged with GATEWAY_HEADER) pass;
// BT_GATEWAY_READ_ONLY is enforced in front of this adapter (ReadOnlyAdapter).

import type { BrowserContext, Page, Route } from "playwright";
import {
  assertSafePath,
  contentTypeFor,
  interpretBtPayload,
  type BtAdapter,
  type BtRequest,
  type BtResponse,
} from "./adapter.js";
import type { GatewayConfig } from "./config.js";
import { GatewayError } from "./errors.js";
import { classifyRequest } from "./crawl/policy.js";
import { BT_ORIGIN, openGatewayProfile } from "./crawl/runner.js";

export const GATEWAY_HEADER = "x-bt-gateway-call";

/** Light same-origin page: gives fetch() the Buildertrend origin without booting the SPA. */
const ANCHOR_PATH = "/api/AccountInfo/GlobalInfo";

const FETCH_JS = `async ({ url, method, headers, body, raw, multipart }) => {
  const init = { method, headers, credentials: "include", redirect: "manual" };
  if (multipart) {
    const form = new FormData();
    for (const f of multipart) {
      const bytes = Uint8Array.from(atob(f.contentBase64), (c) => c.charCodeAt(0));
      form.append(f.fieldName || "fileList", new Blob([bytes], { type: f.contentType || "application/pdf" }), f.filename);
    }
    delete init.headers["content-type"];
    init.body = form;
  } else if (body !== undefined) {
    init.body = body;
  }
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  if (raw) {
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { status: res.status, contentType, base64: btoa(bin) };
  }
  return { status: res.status, contentType, text: await res.text() };
}`;

interface PageResult {
  status: number;
  contentType: string;
  text?: string;
  base64?: string;
}

export class ProfileAdapter implements BtAdapter {
  private context: BrowserContext | undefined;
  private page: Page | undefined;
  private opening: Promise<Page> | undefined;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly config: GatewayConfig) {}

  async request(req: BtRequest): Promise<BtResponse> {
    assertSafePath(req.path, this.config.enableSend);
    const url = `${BT_ORIGIN}${req.path}${queryString(req.query)}`;
    // One request at a time, like a person clicking: gentle on Buildertrend.
    const run = this.queue.then(() => this.send(req, url));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async send(req: BtRequest, url: string, retried = false): Promise<BtResponse> {
    const page = await this.ensurePage();
    const headers: Record<string, string> = {
      accept: "application/json, text/plain, */*",
      "content-type": contentTypeFor(req),
      portaltype: "1",
      [GATEWAY_HEADER]: "1",
    };
    const result = (await page.evaluate(`(${FETCH_JS})(${JSON.stringify({
      url,
      method: req.method,
      headers,
      body: req.json !== undefined && req.method !== "GET" ? JSON.stringify(req.json) : undefined,
      raw: Boolean(req.raw),
      multipart: req.multipart?.length ? req.multipart : undefined,
    })})`)) as PageResult;
    const text = result.text ?? "";
    let json: unknown;
    if (result.contentType.includes("json") && text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }
    try {
      interpretBtPayload(req.path, result.status, json, text);
    } catch (err) {
      // The app re-authenticates itself through Auth0 SSO; give it one chance.
      if (!retried && err instanceof GatewayError && err.code === "auth_required" && (await this.refreshSession())) {
        return this.send(req, url, true);
      }
      throw err;
    }
    return {
      status: result.status,
      contentType: result.contentType,
      json,
      bodyText: req.raw ? undefined : text,
      bodyBase64: result.base64,
    };
  }

  private async ensurePage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) return this.page;
    this.opening ??= this.open().finally(() => {
      this.opening = undefined;
    });
    return this.opening;
  }

  private async open(): Promise<Page> {
    const profile = this.config.chromeProfilePath;
    if (!profile) {
      throw new GatewayError("validation", "Profile transport needs BT_GATEWAY_PROFILE (dedicated gateway profile).");
    }
    this.context = await openGatewayProfile(profile, this.config.profileHeadless);
    await this.context.route("**/*", (route) => this.route(route));
    const page = this.context.pages()[0] ?? (await this.context.newPage());
    await page.goto(`${BT_ORIGIN}${ANCHOR_PATH}`, { waitUntil: "domcontentloaded" });
    this.page = page;
    return page;
  }

  /** Same policy as the crawl for everything the page does; gateway calls are tagged. */
  private async route(route: Route): Promise<void> {
    const req = route.request();
    const headers = req.headers();
    if (headers[GATEWAY_HEADER]) {
      const { [GATEWAY_HEADER]: _tag, ...rest } = headers;
      await route.continue({ headers: rest });
      return;
    }
    const decision = classifyRequest({ method: req.method(), url: req.url(), resourceType: req.resourceType() });
    if (decision.action === "allow") await route.continue();
    else await route.abort("blockedbyclient");
  }

  /** Load the app once so Auth0 SSO can renew the session. Never types a password. */
  private async refreshSession(): Promise<boolean> {
    const page = this.page;
    if (!page) return false;
    try {
      await page.goto(`${BT_ORIGIN}/app/Landing`, { waitUntil: "networkidle", timeout: 45_000 });
      await page.goto(`${BT_ORIGIN}${ANCHOR_PATH}`, { waitUntil: "domcontentloaded" });
      const probe = (await page.evaluate(
        `fetch(${JSON.stringify(ANCHOR_PATH)}, { credentials: "include", headers: { accept: "application/json", portaltype: "1" } }).then((r) => r.json()).catch(() => ({ needsToRelogin: true }))`,
      )) as Record<string, unknown>;
      return probe.needsToRelogin !== true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.context?.close();
    this.context = undefined;
    this.page = undefined;
  }
}

function queryString(query: BtRequest["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}
