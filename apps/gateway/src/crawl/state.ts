// Crawl records + resumable checkpoint. Everything here is keys and templated
// paths, except `queue` / `visited`, which hold concrete URLs so a stopped run
// can resume. Those files live in the output dir, never in the repo.

import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EnumOptions } from "./shape.js";
import type { FieldInfo } from "./dom.js";

export interface SelectInfo {
  /** Field label from the form. */
  label: string;
  count: number;
  /** Only for system enums (status, type, …), never people / vendors / jobs. */
  options?: string[];
}

export interface EndpointRecord {
  method: string;
  /** Templated path + query keys, e.g. `/api/Leads/{id}?jobId=`. */
  template: string;
  requestContentType: string;
  requestKeys: string[];
  responseContentType: string;
  statuses: number[];
  responseKeys: string[];
  enums: EnumOptions[];
  screens: string[];
  decision: string;
  count: number;
}

export interface WriteCandidate {
  method: string;
  template: string;
  requestContentType: string;
  requestKeys: string[];
  reason: string;
  screens: string[];
  /** Label of the control the crawler had just clicked, if any. */
  triggers: string[];
  count: number;
}

export interface ScreenRecord {
  /** Templated SPA path, e.g. `/app/ChangeOrders/ChangeOrder/{id}/{id}`. */
  screen: string;
  visits: number;
  tabs: string[];
  newForms: string[];
  /** Form controls seen on the screen or its modals (label + type). */
  fields: FieldInfo[];
  selects: SelectInfo[];
  /** Every control label seen, write actions included (never clicked). */
  actions: string[];
  /** Controls the crawler actually clicked. */
  clicked: string[];
  /** Deep exploration (tabs, dropdowns, buttons) already done for this screen. */
  explored?: boolean;
  endpoints: string[];
  writeCandidates: string[];
}

export interface CrawlCheckpoint {
  startedAt: string;
  updatedAt: string;
  queue: string[];
  visited: string[];
  templateVisits: Record<string, number>;
  pagesVisited: number;
  blockedCount: number;
  droppedCount: number;
  stoppedReason?: string;
  stoppedAt?: string;
  resumeFrom?: string;
}

export class CrawlRecorder {
  endpoints = new Map<string, EndpointRecord>();
  writes = new Map<string, WriteCandidate>();
  screens = new Map<string, ScreenRecord>();
  checkpoint: CrawlCheckpoint;

  constructor(readonly outDir: string, checkpoint?: CrawlCheckpoint) {
    const now = new Date().toISOString();
    this.checkpoint = checkpoint ?? {
      startedAt: now,
      updatedAt: now,
      queue: [],
      visited: [],
      templateVisits: {},
      pagesVisited: 0,
      blockedCount: 0,
      droppedCount: 0,
    };
  }

  screen(key: string): ScreenRecord {
    let rec = this.screens.get(key);
    if (!rec) {
      rec = {
        screen: key, visits: 0, tabs: [], newForms: [], fields: [], selects: [], actions: [], clicked: [],
        endpoints: [], writeCandidates: [],
      };
      this.screens.set(key, rec);
    }
    return rec;
  }

  recordEndpoint(input: Omit<EndpointRecord, "count" | "screens" | "statuses"> & { status: number; screen: string }): void {
    const id = `${input.method} ${input.template}`;
    const existing = this.endpoints.get(id);
    if (existing) {
      existing.count += 1;
      addUnique(existing.statuses, input.status);
      addUnique(existing.screens, input.screen);
      mergeKeys(existing.requestKeys, input.requestKeys);
      mergeKeys(existing.responseKeys, input.responseKeys);
      for (const e of input.enums) {
        if (!existing.enums.some((x) => x.path === e.path)) existing.enums.push(e);
      }
      if (!existing.responseContentType) existing.responseContentType = input.responseContentType;
    } else {
      const { status, screen, ...rest } = input;
      this.endpoints.set(id, { ...rest, statuses: [status], screens: [screen], count: 1 });
    }
    addUnique(this.screen(input.screen).endpoints, id);
  }

  recordWrite(input: Omit<WriteCandidate, "count" | "screens" | "triggers"> & { screen: string; trigger?: string }): void {
    const id = `${input.method} ${input.template}`;
    const existing = this.writes.get(id);
    if (existing) {
      existing.count += 1;
      addUnique(existing.screens, input.screen);
      if (input.trigger) addUnique(existing.triggers, input.trigger);
      mergeKeys(existing.requestKeys, input.requestKeys);
    } else {
      const { screen, trigger, ...rest } = input;
      this.writes.set(id, { ...rest, screens: [screen], triggers: trigger ? [trigger] : [], count: 1 });
    }
    addUnique(this.screen(input.screen).writeCandidates, id);
    this.checkpoint.blockedCount += 1;
  }

  async save(): Promise<void> {
    await mkdir(this.outDir, { recursive: true });
    this.checkpoint.updatedAt = new Date().toISOString();
    await atomicJson(join(this.outDir, "checkpoint.json"), this.checkpoint);
    await atomicJson(join(this.outDir, "endpoints.json"), sortedValues(this.endpoints));
    await atomicJson(join(this.outDir, "write-candidates.json"), sortedValues(this.writes));
    await atomicJson(join(this.outDir, "screens.json"), sortedValues(this.screens));
  }

  static async load(outDir: string): Promise<CrawlRecorder> {
    const path = join(outDir, "checkpoint.json");
    if (!existsSync(path)) return new CrawlRecorder(outDir);
    const rec = new CrawlRecorder(outDir, JSON.parse(await readFile(path, "utf8")) as CrawlCheckpoint);
    const load = async <T>(name: string): Promise<T[]> => {
      const p = join(outDir, name);
      return existsSync(p) ? (JSON.parse(await readFile(p, "utf8")) as T[]) : [];
    };
    for (const e of await load<EndpointRecord>("endpoints.json")) rec.endpoints.set(`${e.method} ${e.template}`, e);
    for (const w of await load<WriteCandidate>("write-candidates.json")) rec.writes.set(`${w.method} ${w.template}`, w);
    for (const s of await load<ScreenRecord>("screens.json")) rec.screens.set(s.screen, s);
    return rec;
  }
}

function addUnique<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value);
}

function mergeKeys(target: string[], extra: string[]): void {
  for (const k of extra) if (!target.includes(k)) target.push(k);
  target.sort();
}

function sortedValues<T>(map: Map<string, T>): T[] {
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

async function atomicJson(path: string, value: unknown): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2));
  await rename(tmp, path);
}
