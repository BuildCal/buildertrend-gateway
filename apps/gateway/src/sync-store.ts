// Durable state for the sync engine: the record mirror, the change log apps
// read from (cursor = `seq`), id links between an app and Buildertrend, and
// small key/value cursors (webhook delivery). Memory for tests; SQLite file
// (node:sqlite) for real use, so a laptop install needs no database server.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface SyncRecord {
  type: string;
  id: string;
  jobId?: number;
  title?: string;
  number?: string;
  status?: string;
  amount?: number;
  updatedAt?: string;
  /** Not seen in the last full list pass (deleted, closed job, or filtered out). */
  removed?: boolean;
  hash: string;
  /** Sanitised list row: field names as Buildertrend sends them. */
  data: Record<string, unknown>;
  /** Sanitised record detail, when hydrated. */
  detail?: unknown;
  firstSeenAt: string;
  lastSeenAt: string;
}

export type ChangeAction = "created" | "updated" | "removed";

export interface ChangeEvent {
  seq: number;
  type: string;
  id: string;
  jobId?: number;
  action: ChangeAction;
  /** Top-level row fields whose values changed (updated only). */
  changedFields?: string[];
  at: string;
}

export interface Link {
  app: string;
  appType: string;
  appId: string;
  btType: string;
  btId: string;
  createdAt: string;
}

export interface RecordQuery {
  type: string;
  jobId?: number;
  includeRemoved?: boolean;
  limit?: number;
  offset?: number;
}

export interface SyncStore {
  getRecord(type: string, id: string): Promise<SyncRecord | null>;
  putRecord(record: SyncRecord): Promise<void>;
  listRecords(query: RecordQuery): Promise<SyncRecord[]>;
  recordIds(type: string): Promise<string[]>;
  countRecords(): Promise<Record<string, number>>;
  appendChange(event: Omit<ChangeEvent, "seq">): Promise<ChangeEvent>;
  changesSince(since: number, limit: number, types?: string[]): Promise<ChangeEvent[]>;
  lastSeq(): Promise<number>;
  putLink(link: Link): Promise<void>;
  findLinkByApp(app: string, appType: string, appId: string): Promise<Link | null>;
  findLinksByBt(btType: string, btId: string): Promise<Link[]>;
  listLinks(app?: string, appType?: string): Promise<Link[]>;
  deleteLink(app: string, appType: string, appId: string): Promise<boolean>;
  getCursor(name: string): Promise<string | undefined>;
  setCursor(name: string, value: string): Promise<void>;
  deleteCursor(name: string): Promise<void>;
  /** Set only if the cursor still holds `expected` (undefined = absent). False when another writer moved it. */
  compareAndSetCursor(name: string, expected: string | undefined, value: string): Promise<boolean>;
  /** Cross-process lease: true when `holder` now owns `name` until ttl expires. */
  acquireLease(name: string, holder: string, ttlMs: number): Promise<boolean>;
  releaseLease(name: string, holder: string): Promise<void>;
}

export class MemorySyncStore implements SyncStore {
  private readonly records = new Map<string, SyncRecord>();
  private readonly changes: ChangeEvent[] = [];
  private readonly links: Link[] = [];
  private readonly cursors = new Map<string, string>();

  async getRecord(type: string, id: string): Promise<SyncRecord | null> {
    return this.records.get(`${type}:${id}`) ?? null;
  }

  async putRecord(record: SyncRecord): Promise<void> {
    this.records.set(`${record.type}:${record.id}`, record);
  }

  async listRecords(query: RecordQuery): Promise<SyncRecord[]> {
    const rows = [...this.records.values()].filter(
      (r) =>
        r.type === query.type &&
        (query.jobId == null || r.jobId === query.jobId) &&
        (query.includeRemoved || !r.removed),
    );
    const offset = query.offset ?? 0;
    return rows.slice(offset, offset + (query.limit ?? rows.length));
  }

  async recordIds(type: string): Promise<string[]> {
    return [...this.records.values()].filter((r) => r.type === type && !r.removed).map((r) => r.id);
  }

  async countRecords(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const r of this.records.values()) if (!r.removed) counts[r.type] = (counts[r.type] ?? 0) + 1;
    return counts;
  }

  async appendChange(event: Omit<ChangeEvent, "seq">): Promise<ChangeEvent> {
    const row = { ...event, seq: this.changes.length + 1 };
    this.changes.push(row);
    return row;
  }

  async changesSince(since: number, limit: number, types?: string[]): Promise<ChangeEvent[]> {
    return this.changes.filter((c) => c.seq > since && (!types?.length || types.includes(c.type))).slice(0, limit);
  }

  async lastSeq(): Promise<number> {
    return this.changes.length;
  }

  async putLink(link: Link): Promise<void> {
    const at = this.links.findIndex((l) => l.app === link.app && l.appType === link.appType && l.appId === link.appId);
    if (at >= 0) this.links[at] = link;
    else this.links.push(link);
  }

  async findLinkByApp(app: string, appType: string, appId: string): Promise<Link | null> {
    return this.links.find((l) => l.app === app && l.appType === appType && l.appId === appId) ?? null;
  }

  async findLinksByBt(btType: string, btId: string): Promise<Link[]> {
    return this.links.filter((l) => l.btType === btType && l.btId === btId);
  }

  async listLinks(app?: string, appType?: string): Promise<Link[]> {
    return this.links.filter((l) => (!app || l.app === app) && (!appType || l.appType === appType));
  }

  async deleteLink(app: string, appType: string, appId: string): Promise<boolean> {
    const at = this.links.findIndex((l) => l.app === app && l.appType === appType && l.appId === appId);
    if (at < 0) return false;
    this.links.splice(at, 1);
    return true;
  }

  async getCursor(name: string): Promise<string | undefined> {
    return this.cursors.get(name);
  }

  async setCursor(name: string, value: string): Promise<void> {
    this.cursors.set(name, value);
  }

  async deleteCursor(name: string): Promise<void> {
    this.cursors.delete(name);
  }

  async compareAndSetCursor(name: string, expected: string | undefined, value: string): Promise<boolean> {
    if (this.cursors.get(name) !== expected) return false;
    this.cursors.set(name, value);
    return true;
  }

  private readonly leases = new Map<string, { holder: string; until: number }>();

  async acquireLease(name: string, holder: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const lease = this.leases.get(name);
    if (lease && lease.holder !== holder && lease.until > now) return false;
    this.leases.set(name, { holder, until: now + ttlMs });
    return true;
  }

  async releaseLease(name: string, holder: string): Promise<void> {
    if (this.leases.get(name)?.holder === holder) this.leases.delete(name);
  }
}

type SqliteDb = {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number | bigint };
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  };
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bt_records (
  type TEXT NOT NULL, id TEXT NOT NULL, job_id INTEGER, removed INTEGER NOT NULL DEFAULT 0,
  hash TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (type, id));
CREATE INDEX IF NOT EXISTS bt_records_job ON bt_records (type, job_id);
CREATE TABLE IF NOT EXISTS bt_changes (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, id TEXT NOT NULL, job_id INTEGER,
  action TEXT NOT NULL, changed_fields TEXT, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bt_links (
  app TEXT NOT NULL, app_type TEXT NOT NULL, app_id TEXT NOT NULL, bt_type TEXT NOT NULL,
  bt_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (app, app_type, app_id));
CREATE INDEX IF NOT EXISTS bt_links_bt ON bt_links (bt_type, bt_id);
CREATE TABLE IF NOT EXISTS bt_cursors (name TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bt_leases (name TEXT PRIMARY KEY, holder TEXT NOT NULL, until INTEGER NOT NULL);
`;

export class SqliteSyncStore implements SyncStore {
  constructor(private readonly db: SqliteDb) {
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(SCHEMA);
  }

  static async open(path: string): Promise<SqliteSyncStore> {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    const { DatabaseSync } = await import("node:sqlite");
    return new SqliteSyncStore(new DatabaseSync(path) as unknown as SqliteDb);
  }

  async getRecord(type: string, id: string): Promise<SyncRecord | null> {
    const row = this.db.prepare("SELECT body FROM bt_records WHERE type = ? AND id = ?").get(type, id);
    return row ? (JSON.parse(String(row.body)) as SyncRecord) : null;
  }

  async putRecord(record: SyncRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO bt_records (type, id, job_id, removed, hash, body) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (type, id) DO UPDATE SET job_id = excluded.job_id, removed = excluded.removed,
           hash = excluded.hash, body = excluded.body`,
      )
      .run(record.type, record.id, record.jobId ?? null, record.removed ? 1 : 0, record.hash, JSON.stringify(record));
  }

  async listRecords(query: RecordQuery): Promise<SyncRecord[]> {
    const where = ["type = ?"];
    const params: unknown[] = [query.type];
    if (query.jobId != null) {
      where.push("job_id = ?");
      params.push(query.jobId);
    }
    if (!query.includeRemoved) where.push("removed = 0");
    params.push(query.limit ?? -1, query.offset ?? 0);
    return this.db
      .prepare(`SELECT body FROM bt_records WHERE ${where.join(" AND ")} ORDER BY rowid LIMIT ? OFFSET ?`)
      .all(...params)
      .map((row) => JSON.parse(String(row.body)) as SyncRecord);
  }

  async recordIds(type: string): Promise<string[]> {
    return this.db
      .prepare("SELECT id FROM bt_records WHERE type = ? AND removed = 0")
      .all(type)
      .map((row) => String(row.id));
  }

  async countRecords(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const row of this.db.prepare("SELECT type, COUNT(*) AS n FROM bt_records WHERE removed = 0 GROUP BY type").all()) {
      counts[String(row.type)] = Number(row.n);
    }
    return counts;
  }

  async appendChange(event: Omit<ChangeEvent, "seq">): Promise<ChangeEvent> {
    const result = this.db
      .prepare("INSERT INTO bt_changes (type, id, job_id, action, changed_fields, at) VALUES (?, ?, ?, ?, ?, ?) RETURNING seq")
      .get(
        event.type,
        event.id,
        event.jobId ?? null,
        event.action,
        event.changedFields ? JSON.stringify(event.changedFields) : null,
        event.at,
      );
    return { ...event, seq: Number(result?.seq) };
  }

  async changesSince(since: number, limit: number, types?: string[]): Promise<ChangeEvent[]> {
    const params: unknown[] = [since];
    let typeClause = "";
    if (types?.length) {
      typeClause = ` AND type IN (${types.map(() => "?").join(", ")})`;
      params.push(...types);
    }
    params.push(limit);
    return this.db
      .prepare(`SELECT * FROM bt_changes WHERE seq > ?${typeClause} ORDER BY seq LIMIT ?`)
      .all(...params)
      .map((row) => ({
        seq: Number(row.seq),
        type: String(row.type),
        id: String(row.id),
        jobId: row.job_id == null ? undefined : Number(row.job_id),
        action: row.action as ChangeAction,
        changedFields: row.changed_fields ? (JSON.parse(String(row.changed_fields)) as string[]) : undefined,
        at: String(row.at),
      }));
  }

  async lastSeq(): Promise<number> {
    return Number(this.db.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM bt_changes").get()?.seq ?? 0);
  }

  async putLink(link: Link): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO bt_links (app, app_type, app_id, bt_type, bt_id, created_at) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (app, app_type, app_id) DO UPDATE SET bt_type = excluded.bt_type, bt_id = excluded.bt_id`,
      )
      .run(link.app, link.appType, link.appId, link.btType, link.btId, link.createdAt);
  }

  async findLinkByApp(app: string, appType: string, appId: string): Promise<Link | null> {
    const row = this.db
      .prepare("SELECT * FROM bt_links WHERE app = ? AND app_type = ? AND app_id = ?")
      .get(app, appType, appId);
    return row ? linkFromRow(row) : null;
  }

  async findLinksByBt(btType: string, btId: string): Promise<Link[]> {
    return this.db.prepare("SELECT * FROM bt_links WHERE bt_type = ? AND bt_id = ?").all(btType, btId).map(linkFromRow);
  }

  async listLinks(app?: string, appType?: string): Promise<Link[]> {
    return this.db
      .prepare("SELECT * FROM bt_links WHERE (? IS NULL OR app = ?) AND (? IS NULL OR app_type = ?) ORDER BY created_at")
      .all(app ?? null, app ?? null, appType ?? null, appType ?? null)
      .map(linkFromRow);
  }

  async deleteLink(app: string, appType: string, appId: string): Promise<boolean> {
    const result = this.db
      .prepare("DELETE FROM bt_links WHERE app = ? AND app_type = ? AND app_id = ?")
      .run(app, appType, appId);
    return Number(result.changes) > 0;
  }

  async getCursor(name: string): Promise<string | undefined> {
    const row = this.db.prepare("SELECT value FROM bt_cursors WHERE name = ?").get(name);
    return row ? String(row.value) : undefined;
  }

  async setCursor(name: string, value: string): Promise<void> {
    this.db
      .prepare("INSERT INTO bt_cursors (name, value) VALUES (?, ?) ON CONFLICT (name) DO UPDATE SET value = excluded.value")
      .run(name, value);
  }

  async deleteCursor(name: string): Promise<void> {
    this.db.prepare("DELETE FROM bt_cursors WHERE name = ?").run(name);
  }

  async compareAndSetCursor(name: string, expected: string | undefined, value: string): Promise<boolean> {
    const result =
      expected === undefined
        ? this.db.prepare("INSERT INTO bt_cursors (name, value) VALUES (?, ?) ON CONFLICT (name) DO NOTHING").run(name, value)
        : this.db.prepare("UPDATE bt_cursors SET value = ? WHERE name = ? AND value = ?").run(value, name, expected);
    return Number(result.changes) > 0;
  }

  async acquireLease(name: string, holder: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const result = this.db
      .prepare(
        `INSERT INTO bt_leases (name, holder, until) VALUES (?, ?, ?)
         ON CONFLICT (name) DO UPDATE SET holder = excluded.holder, until = excluded.until
         WHERE bt_leases.until <= ? OR bt_leases.holder = excluded.holder`,
      )
      .run(name, holder, now + ttlMs, now);
    return Number(result.changes) > 0;
  }

  async releaseLease(name: string, holder: string): Promise<void> {
    this.db.prepare("DELETE FROM bt_leases WHERE name = ? AND holder = ?").run(name, holder);
  }
}

function linkFromRow(row: Record<string, unknown>): Link {
  return {
    app: String(row.app),
    appType: String(row.app_type),
    appId: String(row.app_id),
    btType: String(row.bt_type),
    btId: String(row.bt_id),
    createdAt: String(row.created_at),
  };
}

export async function createSyncStore(path: string | undefined): Promise<SyncStore> {
  if (!path || path === "memory") return new MemorySyncStore();
  return SqliteSyncStore.open(path);
}
