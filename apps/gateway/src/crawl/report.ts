// Render crawl output (endpoints / write-candidates / screens JSON) as a raw
// markdown appendix grouped by API module. The curated coverage map in
// docs/buildertrend-coverage-map.md is written from this, then scrubbed.

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { VERBS } from "../catalog.js";
import type { EndpointRecord, ScreenRecord, WriteCandidate } from "./state.js";

/** `/api/v1/bills/grid` → `bills`; `/apix/v2/LineItems/x` → `lineitems`. */
export function apiModule(template: string): string {
  const parts = template.split("?")[0]!.split("/").filter(Boolean);
  const rest = parts.slice(1).filter((p) => !/^v\d+$/i.test(p));
  return (rest[0] ?? "(root)").toLowerCase();
}

/** Gateway verbs whose catalog description or discovery hints mention this path. */
export function verbsForTemplate(template: string): string[] {
  const path = template.split("?")[0]!.toLowerCase();
  const loose = path.replace(/\{id\}/g, "");
  return VERBS.filter((v) => {
    const hay = [v.description, ...(v.discovery?.expectedPaths ?? [])].join(" ").toLowerCase();
    return hay.includes(path) || (loose.length > 12 && hay.includes(loose));
  }).map((v) => v.verb);
}

export async function renderCrawlReport(outDir: string): Promise<string> {
  const read = async <T>(name: string) => JSON.parse(await readFile(join(outDir, name), "utf8")) as T[];
  const endpoints = await read<EndpointRecord>("endpoints.json");
  const writes = await read<WriteCandidate>("write-candidates.json");
  const screens = await read<ScreenRecord>("screens.json");

  const modules = new Map<string, { reads: EndpointRecord[]; writes: WriteCandidate[] }>();
  const bucket = (m: string) => {
    if (!modules.has(m)) modules.set(m, { reads: [], writes: [] });
    return modules.get(m)!;
  };
  for (const e of endpoints) bucket(apiModule(e.template)).reads.push(e);
  for (const w of writes) bucket(apiModule(w.template)).writes.push(w);

  const lines = [`# Crawl report (raw)`, "", `Screens: ${screens.length} · read endpoints: ${endpoints.length} · write candidates: ${writes.length}`, ""];
  for (const [mod, { reads, writes: ws }] of [...modules.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${mod}`, "");
    if (reads.length) {
      lines.push("| Method | Path | Status | Screens | Response keys | Enums | Verb |", "| --- | --- | --- | --- | --- | --- | --- |");
      for (const e of reads) {
        const enums = e.enums.map((x) => (x.labels ? `${x.path}: ${x.labels.join(" / ")}` : `${x.path} (${x.count})`)).join("; ");
        lines.push(
          `| ${e.method} | \`${e.template}\` | ${e.statuses.join(",")} | ${e.screens.slice(0, 3).join(", ")} | ${e.responseKeys.length} | ${enums || "—"} | ${verbsForTemplate(e.template).join(", ") || "none"} |`,
        );
      }
      lines.push("");
    }
    if (ws.length) {
      lines.push("Blocked write candidates:", "");
      for (const w of ws) {
        lines.push(`- \`${w.method} ${w.template}\` (${w.reason}) via ${w.triggers.slice(0, 3).join(", ") || "load"} keys: ${w.requestKeys.slice(0, 40).join(", ") || "—"}`);
      }
      lines.push("");
    }
  }
  lines.push("## Screens", "");
  for (const s of screens) {
    lines.push(`- \`${s.screen}\` tabs: ${s.tabs.join(", ") || "—"}; new: ${s.newForms.join(", ") || "—"}; endpoints ${s.endpoints.length}; writes ${s.writeCandidates.length}`);
  }
  return lines.join("\n") + "\n";
}

export async function writeCrawlReport(outDir: string): Promise<string> {
  const path = join(outDir, "report.md");
  await writeFile(path, await renderCrawlReport(outDir));
  return path;
}
