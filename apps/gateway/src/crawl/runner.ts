// Read-only Buildertrend screen crawl on the DEDICATED gateway Chrome profile.
//
// Hard rule: every request goes through classifyRequest(). Anything that is
// not a GET read or a known read-only POST is aborted at the network layer
// and logged as a write candidate (keys only). The UI guard (isSafeTabLabel /
// isSafeNewFormLabel) is a second layer; the network block is the real one.

import type { BrowserContext, Page, Request, Response, Route } from "playwright";
import { join } from "node:path";
import { assertDedicatedGatewayProfile } from "../capture.js";
import { assertSessionStatusSafe, projectSessionStatus, type SessionStatus } from "../session-status.js";
import {
  classifyRequest,
  isApiPath,
  isBuildertrendHost,
  isSafeNewFormLabel,
  isSafeTabLabel,
  looksLikeLoginUrl,
  payloadNeedsRelogin,
  screenKey,
  templateUrl,
} from "./policy.js";
import { bodyKeys, shapeOf } from "./shape.js";
import { CrawlRecorder } from "./state.js";

export const BT_ORIGIN = "https://buildertrend.net";

export interface CrawlOptions {
  profileDir: string;
  outDir: string;
  seeds: string[];
  maxPages: number;
  maxMinutes: number;
  /** Concrete URLs per route template (list pages get 1, details this many). */
  perTemplate: number;
  /** Navigation delay range, ms. */
  navDelay: [number, number];
  clickDelay: [number, number];
  headless: boolean;
}

export const DEFAULT_SEEDS = [
  "/app/Landing",
  "/app/Summary",
  "/app/Jobsites",
  "/app/JobPage/0/1?openCondensed=true",
  "/app/Leads",
  "/app/Contacts",
  "/app/ChangeOrders",
  "/app/OwnerInvoices",
  "/app/PurchaseOrders",
  "/app/Bills",
  "/app/Bids",
  "/app/Schedule",
  "/app/DailyLogs",
  "/app/ToDos",
  "/app/Selections",
  "/app/Warranty",
  "/app/RFIs",
  "/app/TimeClock",
  "/app/Messages",
  "/app/Documents",
  "/app/Photos",
  "/app/Videos",
  "/app/Estimate",
  "/app/JobCostingBudget",
  "/app/Settings",
];

class StopCrawl extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = ([lo, hi]: [number, number]) => lo + Math.floor(Math.random() * (hi - lo));

type PlaywrightModule = typeof import("playwright");

async function loadPlaywright(): Promise<PlaywrightModule> {
  try {
    return (await import("playwright")) as PlaywrightModule;
  } catch {
    throw new Error("Playwright is not installed. pnpm --filter gateway install (devDependency).");
  }
}

export async function openGatewayProfile(profileDir: string, headless: boolean): Promise<BrowserContext> {
  assertDedicatedGatewayProfile(profileDir, process.env.BT_GATEWAY_HUMAN_PROFILE);
  const { chromium } = await loadPlaywright();
  return chromium.launchPersistentContext(profileDir, {
    channel: "chrome",
    headless,
    viewport: { width: 1440, height: 900 },
    serviceWorkers: "block",
    acceptDownloads: false,
  });
}

/** `session.status` projection, fetched from inside the signed-in page. */
export async function sessionStatusFromPage(page: Page): Promise<SessionStatus> {
  const [init, globalInfo] = await page.evaluate(async () => {
    const get = async (path: string) => {
      const res = await fetch(path, { credentials: "include", headers: { accept: "application/json" } });
      const text = await res.text();
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return { needsToRelogin: true };
      }
    };
    return [await get("/apix/v2/context/init"), await get("/api/AccountInfo/GlobalInfo")];
  });
  return assertSessionStatusSafe(projectSessionStatus(init, globalInfo));
}

/** Log-safe subset: no names or emails. */
export function statusLine(status: SessionStatus): string {
  return JSON.stringify({
    authenticated: status.authenticated,
    needsToRelogin: status.needsToRelogin,
    builderId: status.builderId ?? null,
    currentJobId: status.currentJob?.jobId ?? null,
  });
}

/**
 * Open the dedicated profile headed and wait for a human to sign in (password
 * and MFA are theirs). Never reads or types credentials. No write blocker here:
 * the sign-in form itself POSTs. The window closes as soon as the session is live.
 */
export async function runLogin(profileDir: string, timeoutMs = 30 * 60_000): Promise<SessionStatus> {
  const context = await openGatewayProfile(profileDir, false);
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${BT_ORIGIN}/app/Landing`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
  console.error("LOGIN_OPEN Sign in to buildertrend.net in the window that just opened.");
  const started = Date.now();
  try {
    while (Date.now() - started < timeoutMs) {
      await sleep(5000);
      if (looksLikeLoginUrl(page.url()) || !page.url().startsWith(BT_ORIGIN)) continue;
      const status = await sessionStatusFromPage(page).catch(() => null);
      if (status?.authenticated && status.builderId) {
        console.error(`SIGNED_IN ${statusLine(status)}`);
        await sleep(15_000); // let "remember this device" cookies settle
        return status;
      }
    }
    throw new Error("TIMED_OUT waiting for sign-in");
  } finally {
    await context.close();
  }
}

type BlockSink = (req: Request, reason: string) => void;

/** Route every request through the policy. Exported for the integration test. */
export async function installWriteBlocker(context: BrowserContext, onBlock: BlockSink, onDrop?: () => void): Promise<void> {
  await context.route("**/*", async (route: Route) => {
    const req = route.request();
    const decision = classifyRequest({ method: req.method(), url: req.url(), resourceType: req.resourceType() });
    if (decision.action === "allow") {
      await route.continue();
      return;
    }
    if (decision.action === "block") onBlock(req, decision.reason);
    else onDrop?.();
    await route.abort("blockedbyclient");
  });
  // Realtime sockets: never connect to the server.
  if ("routeWebSocket" in context) {
    await context.routeWebSocket(/.*/, () => undefined);
  }
}

export async function runCrawl(opts: CrawlOptions): Promise<CrawlRecorder> {
  const rec = await CrawlRecorder.load(opts.outDir);
  const cp = rec.checkpoint;
  if (cp.stoppedReason) {
    console.error(`RESUME from ${cp.resumeFrom ?? "queue head"} (last stop: ${cp.stoppedReason})`);
    delete cp.stoppedReason;
    delete cp.stoppedAt;
  }
  const visited = new Set(cp.visited);
  const queued = new Set(cp.queue);
  const enqueue = (raw: string, front = false) => {
    let url: URL;
    try {
      url = new URL(raw, BT_ORIGIN);
    } catch {
      return;
    }
    if (url.origin !== BT_ORIGIN || !url.pathname.startsWith("/app/")) return;
    url.hash = "";
    const href = url.toString();
    if (visited.has(href) || queued.has(href) || looksLikeLoginUrl(href)) return;
    const tmpl = templateUrl(href).template;
    const cap = tmpl.includes("{") ? opts.perTemplate : 1;
    if ((cp.templateVisits[tmpl] ?? 0) >= cap) return;
    queued.add(href);
    if (front) cp.queue.unshift(href);
    else cp.queue.push(href);
  };
  for (const seed of opts.seeds) enqueue(seed);

  const context = await openGatewayProfile(opts.profileDir, opts.headless);
  let currentScreen = "(startup)";
  let lastTrigger: string | undefined;
  let relogin = false;

  await installWriteBlocker(
    context,
    (req, reason) => {
      const url = new URL(req.url());
      if (!isBuildertrendHost(url.hostname)) return;
      const t = templateUrl(req.url());
      const body = bodyKeys(req.postData());
      rec.recordWrite({
        method: req.method(),
        template: t.template,
        requestContentType: req.headers()["content-type"] ?? "",
        requestKeys: body.keys,
        reason,
        screen: currentScreen,
        trigger: lastTrigger,
      });
      console.error(`WRITE_CANDIDATE ${req.method()} ${t.template} keys=${body.keys.length}`);
    },
    () => {
      cp.droppedCount += 1;
    },
  );

  context.on("page", (p) => {
    // Popups / new tabs: close them; the crawl drives one tab.
    if (context.pages().length > 1) void p.close().catch(() => undefined);
  });

  const page = context.pages()[0] ?? (await context.newPage());
  page.on("dialog", (d) => void d.dismiss().catch(() => undefined));
  page.on("response", (res: Response) => {
    void onResponse(res).catch(() => undefined);
  });

  async function onResponse(res: Response): Promise<void> {
    const req = res.request();
    const url = new URL(req.url());
    if (!isBuildertrendHost(url.hostname) || !isApiPath(url.pathname)) return;
    const status = res.status();
    const ct = res.headers()["content-type"] ?? "";
    let shape = { keys: [] as string[], enums: [] as ReturnType<typeof shapeOf>["enums"] };
    if (/json/i.test(ct)) {
      const len = Number(res.headers()["content-length"] ?? 0);
      if (!len || len < 8_000_000) {
        const payload = (await res.json().catch(() => undefined)) as unknown;
        if (payloadNeedsRelogin(payload)) relogin = true;
        shape = shapeOf(payload);
      }
    }
    if (status === 401) relogin = true;
    const t = templateUrl(req.url());
    const decision = classifyRequest({ method: req.method(), url: req.url(), resourceType: req.resourceType() });
    rec.recordEndpoint({
      method: req.method(),
      template: t.template,
      requestContentType: req.headers()["content-type"] ?? "",
      requestKeys: bodyKeys(req.postData()).keys,
      responseContentType: ct.split(";")[0] ?? "",
      responseKeys: shape.keys,
      enums: shape.enums,
      decision: decision.reason,
      status,
      screen: currentScreen,
    });
  }

  const checkSession = async () => {
    if (relogin || looksLikeLoginUrl(page.url())) throw new StopCrawl("needsToRelogin");
  };

  const collectLinks = async () => {
    const hrefs = await page
      .$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href))
      .catch(() => [] as string[]);
    for (const h of hrefs) enqueue(h);
  };

  const safeClick = async (label: string, handle: { click: (o?: object) => Promise<void> }) => {
    lastTrigger = label;
    await handle.click({ timeout: 4000 }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    await sleep(jitter(opts.clickDelay));
    await checkSession();
    await collectLinks();
  };

  const exploreTabs = async () => {
    const screen = rec.screen(currentScreen);
    const tabs = page.locator('[role="tab"], .ant-tabs-tab');
    const n = Math.min(await tabs.count().catch(() => 0), 25);
    for (let i = 0; i < n; i++) {
      const tab = tabs.nth(i);
      const label = ((await tab.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      if (!isSafeTabLabel(label) || screen.tabs.includes(label)) continue;
      if (!(await tab.isVisible().catch(() => false))) continue;
      screen.tabs.push(label);
      await safeClick(`tab:${label}`, tab);
    }
  };

  const exploreNewForms = async (pageUrl: string) => {
    const screen = rec.screen(currentScreen);
    const buttons = page.locator('button, a[role="button"], [role="button"]');
    const n = Math.min(await buttons.count().catch(() => 0), 200);
    const labels: string[] = [];
    for (let i = 0; i < n; i++) {
      const label = ((await buttons.nth(i).innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      if (isSafeNewFormLabel(label) && !labels.includes(label) && !screen.newForms.includes(label)) labels.push(label);
    }
    for (const label of labels.slice(0, 3)) {
      const btn = page.locator('button, a[role="button"], [role="button"]', { hasText: label }).first();
      if (!(await btn.isVisible().catch(() => false))) continue;
      screen.newForms.push(label);
      await safeClick(`new:${label}`, btn);
      // A "New" button may open a menu of entity types. One level only.
      const items = page.locator('[role="menuitem"]:visible');
      const m = Math.min(await items.count().catch(() => 0), 12);
      const itemLabels: string[] = [];
      for (let j = 0; j < m; j++) {
        const t = ((await items.nth(j).innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
        if (isSafeTabLabel(t)) itemLabels.push(t);
      }
      for (const itemLabel of itemLabels) {
        await page.goto(pageUrl, { waitUntil: "domcontentloaded" }).catch(() => undefined);
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
        await safeClick(`new:${label}`, btn);
        const item = page.locator('[role="menuitem"]:visible', { hasText: itemLabel }).first();
        screen.newForms.push(`${label} › ${itemLabel}`);
        await safeClick(`new:${label}›${itemLabel}`, item);
      }
      await page.keyboard.press("Escape").catch(() => undefined);
      await page.goto(pageUrl, { waitUntil: "domcontentloaded" }).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    }
  };

  const hoverNav = async () => {
    const navs = page.locator('nav a, nav button, header a, header button, [role="menubar"] [role="menuitem"]');
    const n = Math.min(await navs.count().catch(() => 0), 40);
    for (let i = 0; i < n; i++) {
      await navs.nth(i).hover({ timeout: 1500 }).catch(() => undefined);
      await sleep(400);
      await collectLinks();
    }
  };

  const stopOnSignal = () => {
    cp.stoppedReason = "signal";
    cp.stoppedAt = new Date().toISOString();
    void rec.save().finally(() => process.exit(130));
  };
  process.once("SIGINT", stopOnSignal);
  process.once("SIGTERM", stopOnSignal);

  const deadline = Date.now() + opts.maxMinutes * 60_000;
  try {
    // session.status before touching anything.
    await page.goto(`${BT_ORIGIN}/app/Landing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
    const status = await sessionStatusFromPage(page);
    console.error(`SESSION ${statusLine(status)}`);
    if (!status.authenticated) throw new StopCrawl("needsToRelogin");
    await hoverNav();

    while (cp.queue.length) {
      if (cp.pagesVisited >= opts.maxPages) throw new StopCrawl("maxPages");
      if (Date.now() > deadline) throw new StopCrawl("maxMinutes");
      const href = cp.queue[0]!;
      cp.resumeFrom = href;
      await sleep(jitter(opts.navDelay));
      currentScreen = screenKey(href);
      lastTrigger = `nav:${currentScreen}`;
      await page.goto(href, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
      await sleep(1500);
      await checkSession();
      // SPA may redirect; record under where we actually landed.
      if (page.url().startsWith(BT_ORIGIN)) currentScreen = screenKey(page.url());
      rec.screen(currentScreen).visits += 1;

      await collectLinks();
      await exploreTabs();
      await exploreNewForms(href);

      // "New" variant of a detail route: first id → 0 fires the Defaults GET.
      const tmpl = templateUrl(href).template;
      if (tmpl.includes("{id}")) {
        enqueue(href.replace(/\/\d+(?=\/|$|\?)/, "/0"));
      }

      cp.queue.shift();
      queued.delete(href);
      visited.add(href);
      cp.visited.push(href);
      cp.templateVisits[tmpl] = (cp.templateVisits[tmpl] ?? 0) + 1;
      cp.pagesVisited += 1;
      await rec.save();
      console.error(
        `PAGE ${cp.pagesVisited} ${currentScreen} queue=${cp.queue.length} endpoints=${rec.endpoints.size} writes=${rec.writes.size}`,
      );
    }
    cp.stoppedReason = "complete";
  } catch (err) {
    cp.stoppedReason = err instanceof StopCrawl ? err.reason : `error: ${(err as Error).message}`;
    console.error(`STOP ${cp.stoppedReason} resumeFrom=${cp.resumeFrom ? screenKey(cp.resumeFrom) : "-"}`);
  } finally {
    cp.stoppedAt = new Date().toISOString();
    await rec.save();
    await context.close().catch(() => undefined);
    process.removeListener("SIGINT", stopOnSignal);
    process.removeListener("SIGTERM", stopOnSignal);
  }
  return rec;
}

export function defaultCrawlDir(): string {
  const base = process.env.BT_GATEWAY_CRAWL_DIR ?? join(process.env.HOME ?? ".", "Library/Application Support/bt-gateway/crawl");
  return join(base, new Date().toISOString().slice(0, 10));
}
