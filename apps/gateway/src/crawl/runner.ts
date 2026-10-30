// Read-only Buildertrend screen crawl on the DEDICATED gateway Chrome profile.
//
// Hard rule: every request goes through classifyRequest(). Anything that is
// not a GET read or a known read-only POST is aborted at the network layer
// and logged as a write candidate (keys only). The UI guard (isSafeTabLabel /
// isSafeNewFormLabel) is a second layer; the network block is the real one.

import type { BrowserContext, Page, Request, Response, Route } from "playwright";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { assertDedicatedGatewayProfile } from "../capture.js";
import { assertSessionStatusSafe, projectSessionStatus, type SessionStatus } from "../session-status.js";
import {
  classifyRequest,
  isApiPath,
  isBuildertrendHost,
  isSafeNewFormLabel,
  isSafeTabLabel,
  looksLikeLoginUrl,
  templateActionLabel,
  payloadNeedsRelogin,
  screenKey,
  templateUrl,
} from "./policy.js";
import { bodyKeys, isSafeEnumLabel, isSystemEnumField, shapeOf } from "./shape.js";
import {
  OPEN_MENU_ITEMS_JS,
  OPEN_SELECT_OPTIONS_JS,
  OVERLAY_COUNT_JS,
  OVERLAY_SELECTOR,
  buttonLabelsJs,
  fieldsJs,
  selectLabelsJs,
  type FieldInfo,
} from "./dom.js";
import { CrawlRecorder, type SelectInfo } from "./state.js";
import { addChunk, emptyInventory, routeSeeds, type Inventory } from "./inventory.js";
import { unwrapData } from "../adapter.js";
import { asRecord, numberish } from "../grids.js";
import { readFile, writeFile } from "node:fs/promises";

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
  /** Build inventory.json and stop. */
  inventoryOnly?: boolean;
  /** Max time spent exploring controls on one screen. */
  screenBudgetMs: number;
  /** Sidebar job to select (text match). Default: the first job listed. */
  jobText?: string;
}

/**
 * Only the landing page. Every other route comes from Buildertrend's own menus
 * (discoverMenu) and links on the pages it renders. No guessed routes.
 */
export const DEFAULT_SEEDS = ["/app/Landing"];

/** Abandon the current screen (forbidden route) and move to the next. */
class SkipScreen extends Error {}

class StopCrawl extends Error {
  constructor(readonly reason: string) {
    super(reason);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Reject with SkipScreen if `work` outlives `ms` (a hung modal or print dialog). */
function withScreenTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new SkipScreen("screen timeout")), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** Print views call window.print(), whose native dialog blocks the tab. */
export const NO_PRINT_JS = "window.print = function () {};";
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

/** In-page GETs for session.status. portaltype: 1 = builder portal, as the adapter sends. */
export const SESSION_PROBE_JS = `(async () => {
  const get = async (path) => {
    const res = await fetch(path, { credentials: "include", headers: { accept: "application/json", portaltype: "1" } });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { needsToRelogin: true, httpStatus: res.status }; }
  };
  return [await get("/apix/v2/context/init"), await get("/api/AccountInfo/GlobalInfo")];
})()`;

const getJs = (path: string) =>
  `fetch(${JSON.stringify(path)}, { credentials: "include", headers: { accept: "application/json", portaltype: "1" } }).then((r) => r.json())`;

const LINKS_JS = `[...document.querySelectorAll("a[href]")].map((a) => a.href)`;

/** `session.status` projection, fetched from inside the signed-in page. */
export async function sessionStatusFromPage(page: Page): Promise<SessionStatus> {
  // A string, not a function: tsx/esbuild wraps compiled functions with a
  // `__name` helper that does not exist inside the page.
  const [init, globalInfo] = (await page.evaluate(SESSION_PROBE_JS)) as [unknown, unknown];
  return assertSessionStatusSafe(projectSessionStatus(init, globalInfo));
}

/**
 * Poll until the human in this window has signed in. Returns false on timeout.
 * Never reads or types credentials.
 */
export async function waitForSignIn(page: Page, timeoutMs: number): Promise<SessionStatus | null> {
  const started = Date.now();
  let announced = false;
  while (Date.now() - started < timeoutMs) {
    if (page.url().startsWith(BT_ORIGIN) && !looksLikeLoginUrl(page.url())) {
      const status = await sessionStatusFromPage(page).catch((err: Error) => {
        console.error(`LOGIN_PROBE error ${err.message.slice(0, 120)}`);
        return null;
      });
      // builderId is not always on GlobalInfo (the gateway falls back to config).
      if (status?.authenticated) return status;
      if (status) console.error(`LOGIN_PROBE ${statusLine(status)}`);
    }
    if (!announced) {
      console.error("LOGIN_OPEN Sign in to buildertrend.net in the gateway window.");
      announced = true;
    }
    await sleep(5000);
  }
  return null;
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
  try {
    const status = await waitForSignIn(page, timeoutMs);
    if (!status) throw new Error("TIMED_OUT waiting for sign-in");
    console.error(`SIGNED_IN ${statusLine(status)}`);
    return status;
  } finally {
    await context.close();
  }
}

type BlockSink = (req: Request, reason: string) => void;

/** Route every request through the policy. Exported for the integration test. */
export async function installWriteBlocker(
  context: BrowserContext,
  onBlock: BlockSink,
  onDrop?: () => void,
  /** While true a human is signing in: pass everything, record nothing. */
  loginPhase: () => boolean = () => false,
): Promise<void> {
  await context.route("**/*", async (route: Route) => {
    const req = route.request();
    if (loginPhase()) {
      await route.continue();
      return;
    }
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
  const queuedPerTemplate = new Map<string, number>();
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
    if ((cp.templateVisits[tmpl] ?? 0) + (queuedPerTemplate.get(tmpl) ?? 0) >= cap) return;
    queuedPerTemplate.set(tmpl, (queuedPerTemplate.get(tmpl) ?? 0) + 1);
    queued.add(href);
    if (front) cp.queue.unshift(href);
    else cp.queue.push(href);
  };
  for (const seed of opts.seeds) enqueue(seed);

  const context = await openGatewayProfile(opts.profileDir, opts.headless);
  let currentScreen = "(startup)";
  let lastTrigger: string | undefined;
  let relogin = false;
  let signingIn = false;
  let screenDeadline = 0;
  let selectedJobId: number | undefined;

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
    () => signingIn,
  );

  await context.addInitScript(NO_PRINT_JS);
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

  /**
   * A 401 / needsToRelogin on one endpoint can be a permission wall (e.g.
   * /app/Admin routes), not a dead session. Re-probe session.status: stop only
   * if the session itself is gone.
   */
  const checkSession = async () => {
    if (!relogin && !looksLikeLoginUrl(page.url())) return;
    const onLogin = looksLikeLoginUrl(page.url()) || !page.url().startsWith(BT_ORIGIN);
    if (onLogin) await reload(`${BT_ORIGIN}/app/Landing`);
    const status = await sessionStatusFromPage(page).catch(() => null);
    if (!status?.authenticated || looksLikeLoginUrl(page.url())) throw new StopCrawl("needsToRelogin");
    relogin = false;
    rec.screen(currentScreen).forbidden = true;
    console.error(`AUTH_PROBE ok (forbidden on ${currentScreen})`);
    // The route bounced to a login page: nothing to explore here.
    if (onLogin) throw new SkipScreen();
  };

  const collectLinks = async () => {
    const hrefs = ((await page.evaluate(LINKS_JS).catch(() => [])) ?? []) as string[];
    for (const h of hrefs) enqueue(h);
  };

  const safeClick = async (label: string, handle: { click: (o?: object) => Promise<void> }) => {
    lastTrigger = label;
    await handle.click({ timeout: 4000 }).catch(() => undefined);
    // Buildertrend polls, so networkidle rarely fires: cap the wait.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    await sleep(jitter(opts.clickDelay));
    await checkSession();
    await collectLinks();
  };

  /** Tabs inside a scope (page or the innermost overlay). */
  const exploreTabs = async (scope: string | null = null) => {
    const screen = rec.screen(currentScreen);
    const root = scope ? page.locator(scope).last() : page;
    const tabs = root.locator('[role="tab"], .ant-tabs-tab');
    const n = Math.min(await tabs.count().catch(() => 0), 25);
    for (let i = 0; i < n; i++) {
      const tab = tabs.nth(i);
      const label = ((await tab.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      const recorded = templateActionLabel(label);
      if (!isSafeTabLabel(label) || screen.tabs.includes(recorded)) continue;
      if (!(await tab.isVisible().catch(() => false))) continue;
      screen.tabs.push(recorded);
      await safeClick(`tab:${label}`, tab);
      await recordFields(scope);
    }
  };

  /** Every visible form control: label + type. Never values. */
  const recordFields = async (scope: string | null) => {
    const fields = ((await page.evaluate(fieldsJs(scope)).catch(() => [])) ?? []) as FieldInfo[];
    const screen = rec.screen(currentScreen);
    for (const f of fields) {
      if (!screen.fields.some((x) => x.label === f.label && x.type === f.type)) screen.fields.push(f);
    }
  };

  /**
   * Open each dropdown so lazy lookups fire and options are listed. Never picks
   * an option (Escape closes it): picking can trigger inline auto-saves.
   */
  const exploreSelects = async (scope: string | null) => {
    const screen = rec.screen(currentScreen);
    const root = scope ? page.locator(scope).last() : page;
    const sels = root.locator(".ant-select:not(.ant-select-disabled)");
    const n = Math.min(await sels.count().catch(() => 0), 30);
    const selLabels = ((await page.evaluate(selectLabelsJs(scope)).catch(() => [])) ?? []) as string[];
    for (let i = 0; i < n && Date.now() < screenDeadline; i++) {
      const sel = sels.nth(i);
      if (!(await sel.isVisible().catch(() => false))) continue;
      const label = selLabels[i] || `select#${i}`;
      if (screen.selects.some((x) => x.label === label)) continue;
      lastTrigger = `select:${label}`;
      await sel.click({ timeout: 3000 }).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => undefined);
      await sleep(jitter([700, 1500]));
      const options = ((await page.evaluate(OPEN_SELECT_OPTIONS_JS).catch(() => null)) ?? []) as string[];
      const entry: SelectInfo = { label, count: options.length };
      // Options only for a KNOWN label that is a system enum (status, type…):
      // unlabeled dropdowns can list vendors / people.
      const named = options.filter((o) => !/^-?\d+$/.test(o));
      if (selLabels[i] && isSystemEnumField(label) && named.length && named.every(isSafeEnumLabel)) entry.options = named;
      screen.selects.push(entry);
      await page.keyboard.press("Escape").catch(() => undefined);
      await checkSession();
    }
  };

  const overlayCount = async () => ((await page.evaluate(OVERLAY_COUNT_JS).catch(() => 0)) ?? 0) as number;

  const closeOverlays = async (target: number, pageUrl: string) => {
    for (let i = 0; i < 3 && (await overlayCount()) > target; i++) {
      await page.keyboard.press("Escape").catch(() => undefined);
      await sleep(500);
      const x = page.locator(".ant-modal-close, .ant-drawer-close").last();
      if ((await overlayCount()) > target && (await x.isVisible().catch(() => false))) {
        await x.click({ timeout: 2000 }).catch(() => undefined);
        await sleep(500);
      }
    }
    if ((await overlayCount()) > target) await reload(pageUrl);
  };

  const reload = async (pageUrl: string) => {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
  };

  const buttonIn = (scope: string | null, label: string) => {
    const root = scope ? page.locator(scope).last() : page;
    return root
      .locator(`button, [role=button], .ant-dropdown-trigger, [aria-label="${label.replace(/"/g, "")}"], [title="${label.replace(/"/g, "")}"]`)
      .filter({ hasText: label })
      .first()
      .or(root.locator(`[aria-label="${label.replace(/"/g, "")}"], [title="${label.replace(/"/g, "")}"]`).first())
      .first();
  };

  /** After a click: follow navigation, or explore the modal / drawer it opened. */
  const handleOpened = async (label: string, before: string, overlaysBefore: number, pageUrl: string, depth: number) => {
    if (page.url() !== before) {
      // Back of the queue: menu and inventory routes come first.
      enqueue(page.url());
      await reload(pageUrl);
      return;
    }
    if ((await overlayCount()) > overlaysBefore && depth < 2) {
      const prev = currentScreen;
      currentScreen = `${prev} ⧉ ${label}`;
      rec.screen(currentScreen).visits += 1;
      await recordFields(OVERLAY_SELECTOR);
      await exploreTabs(OVERLAY_SELECTOR);
      await exploreSelects(OVERLAY_SELECTOR);
      await exploreButtons(OVERLAY_SELECTOR, pageUrl, depth + 1);
      currentScreen = prev;
    }
    await closeOverlays(overlaysBefore, pageUrl);
  };

  /**
   * Every control in a scope. All labels are recorded as actions (write
   * actions included: they are capture targets); only safe ones are clicked.
   */
  const exploreButtons = async (scope: string | null, pageUrl: string, depth = 0) => {
    const screen = rec.screen(currentScreen);
    const labels = ((await page.evaluate(buttonLabelsJs(scope)).catch(() => [])) ?? []) as string[];
    for (const l of labels.map(templateActionLabel)) if (!screen.actions.includes(l)) screen.actions.push(l);
    const clickable = labels.filter((l) => isSafeTabLabel(l) || isSafeNewFormLabel(l));
    for (const label of clickable.slice(0, 20)) {
      if (Date.now() > screenDeadline) return;
      if (screen.clicked.includes(label)) continue;
      const btn = buttonIn(scope, label);
      if (!(await btn.isVisible().catch(() => false))) continue;
      screen.clicked.push(label);
      const before = page.url();
      const overlaysBefore = await overlayCount();
      await safeClick(`btn:${label}`, btn);
      // "…" / split buttons open an action menu: list every item, open safe ones.
      const items = ((await page.evaluate(OPEN_MENU_ITEMS_JS).catch(() => [])) ?? []) as string[];
      if (items.length) {
        for (const it of items) {
          const a = templateActionLabel(`${label} › ${it}`);
          if (!screen.actions.includes(a)) screen.actions.push(a);
        }
        await page.keyboard.press("Escape").catch(() => undefined);
        for (const it of items.filter(isSafeTabLabel).slice(0, 8)) {
          if (Date.now() > screenDeadline) break;
          await safeClick(`btn:${label}`, buttonIn(scope, label));
          const item = page.locator(".ant-dropdown:not(.ant-dropdown-hidden) [role=menuitem], .ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item").filter({ hasText: it }).first();
          const b2 = page.url();
          const o2 = await overlayCount();
          screen.clicked.push(`${label} › ${it}`);
          await safeClick(`btn:${label}›${it}`, item);
          await handleOpened(`${label} › ${it}`, b2, o2, pageUrl, depth);
        }
        continue;
      }
      await handleOpened(label, before, overlaysBefore, pageUrl, depth);
    }
  };

  /** Open every main-nav dropdown (they render their links only when open). */
  const discoverMenu = async () => {
    const subs = page.locator(".ant-menu-submenu-title");
    const n = Math.min(await subs.count().catch(() => 0), 40);
    for (let i = 0; i < n; i++) {
      await subs.nth(i).click({ timeout: 3000 }).catch(() => undefined);
      await sleep(1200);
      await collectLinks();
      await page.keyboard.press("Escape").catch(() => undefined);
      await sleep(400);
    }
  };

  /**
   * Select a job by clicking it in the sidebar picker, as a person would. The
   * web app keeps the selection client-side (no SetJobPickerData request), so
   * success = the "No job selected" banner goes away.
   */
  const selectJob = async () => {
    lastTrigger = "select-job";
    const rows = page.locator(".JobPickerReact div.rounded-md.cursor-pointer").filter({ hasText: /\d{2,6} - / });
    const row = opts.jobText ? rows.filter({ hasText: opts.jobText }).first() : rows.first();
    if (!(await row.isVisible().catch(() => false))) {
      console.error("JOB not selected (no job row visible)");
      return;
    }
    const rowText = ((await row.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
    await row.click({ timeout: 4000 }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    await sleep(2000);
    const unselected = await page.locator("text=No job selected").count().catch(() => 1);
    // Job id for route seeds: match the clicked row against the existing-job list.
    const existing = await page.evaluate(getJs("/api/jobpicker/GetExistingJobList")).catch(() => null);
    const jobs = asRecord(unwrapData(existing)).jobs;
    const match = (Array.isArray(jobs) ? jobs : [])
      .map(asRecord)
      .find((r) => typeof r.jobName === "string" && r.jobName && rowText.includes(r.jobName));
    selectedJobId = match ? numberish(match.jobID ?? match.jobId) : undefined;
    console.error(`JOB ${unselected ? "not confirmed" : "selected"} id=${selectedJobId ? "known" : "unknown"}`);
  };

  /** Deep-explore whatever is open now (page + overlays) under the current screen key. */
  const exploreHere = async (pageUrl: string) => {
    await recordFields(null);
    await recordFields(OVERLAY_SELECTOR);
    await exploreTabs();
    await exploreTabs(OVERLAY_SELECTOR);
    await exploreSelects(null);
    await exploreButtons(null, pageUrl);
  };

  /**
   * Open the first row of a list grid and deep-explore the detail while it is
   * open (detail routes redirect to the list when visited cold).
   */
  const exploreFirstRow = async (pageUrl: string) => {
    const row = page.locator(".k-grid-table tr.k-master-row, .ant-table-tbody tr.ant-table-row").first();
    if (!(await row.isVisible().catch(() => false))) return;
    const before = page.url();
    const overlaysBefore = await overlayCount();
    const target = row.locator("td:not(.BTGridSelectCell) a, td:not(.BTGridSelectCell) .BTLink").first();
    const handle = (await target.isVisible().catch(() => false))
      ? target
      : row.locator("td:not(.BTGridSelectCell):not(.k-grid-content-sticky)").nth(1);
    await safeClick("row:first", handle);
    const opened = page.url() !== before || (await overlayCount()) > overlaysBefore;
    if (!opened) return;
    const listScreen = currentScreen;
    currentScreen = page.url() !== before ? screenKey(page.url()) : `${listScreen} ⧉ row`;
    const detail = rec.screen(currentScreen);
    detail.visits += 1;
    if (!detail.explored) {
      detail.explored = true;
      await sleep(2000);
      screenDeadline = Date.now() + opts.screenBudgetMs;
      await exploreHere(page.url());
    }
    currentScreen = listScreen;
    await page.keyboard.press("Escape").catch(() => undefined);
    await reload(pageUrl);
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
    let status = await sessionStatusFromPage(page).catch(() => null);
    if (!status?.authenticated) {
      if (opts.headless) throw new StopCrawl("needsToRelogin");
      // Sign-in happens in this same window (the auth cookie is session-only).
      signingIn = true;
      status = await waitForSignIn(page, 30 * 60_000);
      signingIn = false;
      if (!status) throw new StopCrawl("needsToRelogin");
      relogin = false;
      await sleep(10_000);
    }
    console.error(`SESSION ${statusLine(status)}`);
    if (!existsSync(join(opts.outDir, "inventory.json")) || opts.inventoryOnly) {
      signingIn = false;
      await buildInventory(page, opts.outDir);
      if (opts.inventoryOnly) throw new StopCrawl("inventory");
    }
    await selectJob();
    await discoverMenu();
    // Every route the app defines (from the bundle), after the menu routes.
    const invPath = join(opts.outDir, "inventory.json");
    if (existsSync(invPath)) {
      const inv = JSON.parse(await readFile(invPath, "utf8")) as Inventory;
      for (const url of routeSeeds(inv.routes, selectedJobId)) enqueue(url);
      console.error(`ROUTES queued from inventory: ${inv.routes.length}`);
    }

    while (cp.queue.length) {
      if (cp.pagesVisited >= opts.maxPages) throw new StopCrawl("maxPages");
      if (Date.now() > deadline) throw new StopCrawl("maxMinutes");
      const href = cp.queue[0]!;
      // Drop copies of a route already visited up to its cap (the cap is also
      // checked at enqueue, but many copies can queue before the first visit).
      const qTmpl = templateUrl(href).template;
      if ((cp.templateVisits[qTmpl] ?? 0) >= (qTmpl.includes("{") ? opts.perTemplate : 1)) {
        cp.queue.shift();
        queued.delete(href);
        continue;
      }
      cp.resumeFrom = href;
      await sleep(jitter(opts.navDelay));
      currentScreen = screenKey(href);
      lastTrigger = `nav:${currentScreen}`;
      // Quick-add / job-scoped routes use -1 for "no job": use the selected job.
      const target = selectedJobId ? href.replace(/\/-1(?=\/|$|\?)/g, `/${selectedJobId}`) : href;
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => undefined);
      await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
      try {
        await sleep(1500);
        await checkSession();
        // SPA may redirect; record under where we actually landed.
        if (page.url().startsWith(BT_ORIGIN)) currentScreen = screenKey(page.url());
        rec.screen(currentScreen).visits += 1;

        await collectLinks();
        screenDeadline = Date.now() + opts.screenBudgetMs;
        const firstVisit = !rec.screen(currentScreen).explored;
        rec.screen(currentScreen).explored = true;
        // Hard cap: the budget only stops new clicks, so allow it twice over.
        await withScreenTimeout(
          (async () => {
            await recordFields(null);
            if (firstVisit) await exploreHere(href);
            await exploreFirstRow(href);
          })(),
          opts.screenBudgetMs * 2 + 60_000,
        );
      } catch (err) {
        if (!(err instanceof SkipScreen)) throw err;
        if (err.message === "screen timeout") console.error(`TIMEOUT ${currentScreen}`);
      }

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

/**
 * Read every JS chunk the app can load (entry + import graph) and extract the
 * inventory. Static GETs of /app/static, throttled. Raw source is never saved.
 */
export async function buildInventory(page: Page, outDir: string, delay: [number, number] = [250, 700]): Promise<Inventory> {
  const inv = emptyInventory();
  const entry = (await page.evaluate(
    `[...document.scripts].map((s) => s.src).concat(performance.getEntriesByType("resource").map((e) => e.name)).filter((u) => u.includes("/app/static/") && u.includes(".js"))`,
  )) as string[];
  const queue = [...new Set(entry.map((u) => u.replace(/\?.*$/, "").split("/").pop()!))];
  const seen = new Set(queue);
  let n = 0;
  while (queue.length) {
    const name = queue.shift()!;
    const src = (await page
      .evaluate(`fetch(${JSON.stringify(`/app/static/${name}`)}).then((r) => (r.ok ? r.text() : ""))`)
      .catch(() => "")) as string;
    for (const child of addChunk(inv, name, src)) {
      if (!seen.has(child)) {
        seen.add(child);
        queue.push(child);
      }
    }
    if (++n % 50 === 0) {
      console.error(`INVENTORY chunks=${n} queue=${queue.length} apis=${inv.apis.length} routes=${inv.routes.length}`);
      await writeFile(join(outDir, "inventory.json"), JSON.stringify(inv, null, 1));
    }
    await sleep(jitter(delay));
  }
  inv.apis.sort((a, b) => a.path.localeCompare(b.path));
  inv.routes.sort();
  await writeFile(join(outDir, "inventory.json"), JSON.stringify(inv, null, 1));
  console.error(`INVENTORY done chunks=${n} apis=${inv.apis.length} routes=${inv.routes.length} enums=${inv.enums.length}`);
  return inv;
}

export function defaultCrawlDir(): string {
  const base = process.env.BT_GATEWAY_CRAWL_DIR ?? join(process.env.HOME ?? ".", "Library/Application Support/bt-gateway/crawl");
  return join(base, new Date().toISOString().slice(0, 10));
}
