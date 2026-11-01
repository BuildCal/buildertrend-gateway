/**
 * Write-capture driver for the dedicated gateway profile (dev tool, not shipped).
 *
 * Opens the gateway Chrome profile in a visible window and records every
 * Buildertrend /api and /apix call: method, path, redacted request body,
 * status and redacted response body, to <out>/<label>.jsonl. Cookies and
 * auth headers are never recorded. A small control server on 127.0.0.1 lets
 * an agent drive the window (goto, screenshot, click, type, eval) while the
 * human can also click in it.
 *
 *   npx tsx scripts/capture-driver.ts --profile <dir> --out <dir> [--port 8799]
 *
 * Only for the named sandbox job. Stop the gateway first (one process per profile).
 */

import { createServer } from "node:http";
import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { openGatewayProfile } from "../src/crawl/runner.js";
import { redactObject, redactUrl } from "../src/redact.js";

const arg = (k: string, d?: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const profile = arg("profile", process.env.BT_GATEWAY_PROFILE)!;
const out = resolve(arg("out", "bt-api-capture/driver")!);
const port = Number(arg("port", "8799"));
mkdirSync(out, { recursive: true });

let label = "unlabelled";
const json = (t: string) => { try { return JSON.parse(t); } catch { return t.length > 4000 ? `${t.slice(0, 4000)}…` : t; } };
const clip = (v: unknown, n: number) => { const s = JSON.stringify(v); return s && s.length > n ? `${s.slice(0, n)}…(${s.length})` : v; };

const ctx = await openGatewayProfile(profile, false);
const page = ctx.pages()[0] ?? (await ctx.newPage());

ctx.on("response", async (res) => {
  const req = res.request();
  const url = req.url();
  if (!/^https:\/\/buildertrend\.net\/api(x)?\//i.test(url)) return;
  const method = req.method();
  let body: unknown = null;
  try { body = json(await res.text()); } catch { /* streamed / binary */ }
  const rec = {
    at: new Date().toISOString(), label, method, path: redactUrl(url), status: res.status(),
    contentType: req.headers()["content-type"] ?? "",
    request: req.postData() ? redactObject(json(req.postData()!)) : null,
    response: clip(redactObject(body), method === "GET" ? 6000 : 40000),
  };
  appendFileSync(`${out}/${label}.jsonl`, `${JSON.stringify(rec)}\n`);
  if (method !== "GET") console.log(`[${label}] ${method} ${rec.path} → ${rec.status}`);
});

createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", "http://x");
  const q = (k: string) => u.searchParams.get(k) ?? "";
  try {
    let result: unknown = "ok";
    switch (u.pathname) {
      case "/label": label = q("name").replace(/[^a-z0-9_-]/gi, "_") || "unlabelled"; break;
      case "/goto": await page.goto(q("url"), { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500); break;
      case "/shot": await page.screenshot({ path: `${out}/${q("name") || "shot"}.png` }); result = `${out}/${q("name") || "shot"}.png`; break;
      case "/click": await page.mouse.click(Number(q("x")), Number(q("y"))); await page.waitForTimeout(1200); break;
      case "/clicksel": await page.locator(q("sel")).first().click(); await page.waitForTimeout(1200); break;
      case "/type": await page.keyboard.type(q("text"), { delay: 20 }); break;
      case "/key": await page.keyboard.press(q("key")); await page.waitForTimeout(800); break;
      case "/fill": await page.locator(q("sel")).first().fill(q("text")); break;
      case "/eval": result = await page.evaluate(q("js")); break;
      case "/url": result = page.url(); break;
      case "/wait": await page.waitForTimeout(Number(q("ms") || 1000)); break;
      default: res.statusCode = 404;
    }
    res.end(JSON.stringify(result));
  } catch (e) {
    res.statusCode = 500;
    res.end(String((e as Error).message));
  }
}).listen(port, "127.0.0.1", () => console.log(`capture driver on 127.0.0.1:${port}, writing ${out}`));
