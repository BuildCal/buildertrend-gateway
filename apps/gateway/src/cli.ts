#!/usr/bin/env node
import { serve } from "@hono/node-server";
import { createAdapter, logAdapterRequest } from "./adapter.js";
import { loadConfig } from "./config.js";
import { createHttpApp } from "./http.js";
import { startStdioMcp } from "./mcp.js";
import { createStore } from "./store.js";
import { runCaptureHarness } from "./capture.js";
import { DEFAULT_SEEDS, defaultCrawlDir, runCrawl, runLogin } from "./crawl/runner.js";
import { writeCrawlReport } from "./crawl/report.js";
import { readFileSync } from "node:fs";
import "./verbs.js";

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return fallback;
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "serve";

  // Crawl commands drive the dedicated Chrome profile only; no adapter/store.
  if (command === "crawl-login" || command === "crawl") {
    const profile = arg("profile", process.env.BT_GATEWAY_PROFILE);
    if (!profile) throw new Error(`${command} needs --profile or BT_GATEWAY_PROFILE (dedicated gateway profile)`);
    if (command === "crawl-login") {
      await runLogin(profile);
      return;
    }
    const seedsFile = arg("seeds");
    const seeds = seedsFile
      ? readFileSync(seedsFile, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
      : DEFAULT_SEEDS;
    const rec = await runCrawl({
      profileDir: profile,
      outDir: arg("out", defaultCrawlDir())!,
      seeds,
      maxPages: Number(arg("max-pages", "800")),
      maxMinutes: Number(arg("max-minutes", "540")),
      perTemplate: Number(arg("per-template", "2")),
      navDelay: [Number(arg("nav-min-ms", "6000")), Number(arg("nav-max-ms", "14000"))],
      clickDelay: [2500, 5000],
      headless: process.argv.includes("--headless"),
    });
    console.error(`REPORT ${await writeCrawlReport(rec.outDir)}`);
    const stopped = rec.checkpoint.stoppedReason;
    if (stopped === "needsToRelogin") process.exitCode = 3;
    return;
  }

  const config = loadConfig();
  const adapter = createAdapter(config, logAdapterRequest);
  const store = await createStore(config.databaseUrl);

  if (command === "mcp") {
    await startStdioMcp(config, adapter, store);
    return;
  }

  if (command === "serve") {
    if (!config.gatewayToken?.trim()) {
      throw new Error("BT_GATEWAY_TOKEN is required. HTTP /v1 fails closed.");
    }
    const app = createHttpApp(config, adapter, store);
    serve({ fetch: app.fetch, port: config.port }, (info) => {
      console.error(`Buildertrend Gateway HTTP on :${info.port} (send=${config.enableSend})`);
    });
    return;
  }

  if (command === "capture") {
    const url = arg("url", "https://buildertrend.net/app/Landing");
    const profile = arg("profile", config.chromeProfilePath);
    if (!url || !profile) {
      throw new Error("capture needs --url and --profile (or BT_GATEWAY_PROFILE)");
    }
    await runCaptureHarness({
      url,
      profileDir: profile,
      mapPath: arg("map", "buildertrend-api-map.md")!,
      outJson: arg("out", "bt-api-capture/last.json"),
    });
    return;
  }

  console.error("Usage: bt-gateway <serve|mcp|capture|crawl-login|crawl>");
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
