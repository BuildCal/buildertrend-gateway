export type TransportKind = "sidecar" | "direct" | "profile";

export interface GatewayConfig {
  builderId: number;
  baseUrl: string;
  enableSend: boolean;
  sandbox: boolean;
  /** Refuse every request that would change Buildertrend (mirror-only integrations). */
  readOnly: boolean;
  defaultDryRun: boolean;
  port: number;
  gatewayToken: string | undefined;
  transport: TransportKind;
  serviceUrl: string | undefined;
  serviceToken: string | undefined;
  cookieJarPath: string | undefined;
  chromeProfilePath: string | undefined;
  profileHeadless: boolean;
  humanProfilePath: string | undefined;
  databaseUrl: string | undefined;
  userAgent: string;
  /** SQLite file for the sync mirror, change log and links ("memory" for none). */
  syncDbPath: string;
  /** Poll Buildertrend every N seconds inside serve / mcp (0 = only on sync.run). */
  syncIntervalSec: number;
  /** Fetch full records for created / updated rows during polling. */
  syncHydrate: boolean;
  /** Pause between list pages, to stay gentle on Buildertrend. */
  syncDelayMs: number;
  webhookUrl: string | undefined;
  webhookSecret: string | undefined;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return /^(1|true|yes|on)$/i.test(raw);
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  const rawTransport = process.env.BT_TRANSPORT ?? "sidecar";
  const transport: TransportKind =
    rawTransport === "direct" || rawTransport === "profile" ? rawTransport : "sidecar";
  return {
    builderId: intEnv("BT_BUILDER_ID", 0),
    baseUrl: (process.env.BT_BASE_URL ?? "https://buildertrend.net").replace(/\/$/, ""),
    enableSend: boolEnv("BT_GATEWAY_ENABLE_SEND", false),
    sandbox: boolEnv("BT_GATEWAY_SANDBOX", false),
    readOnly: boolEnv("BT_GATEWAY_READ_ONLY", false),
    defaultDryRun: boolEnv("BT_GATEWAY_DEFAULT_DRY_RUN", true),
    port: intEnv("BT_GATEWAY_PORT", 8787),
    gatewayToken: process.env.BT_GATEWAY_TOKEN,
    transport,
    serviceUrl: process.env.BT_SERVICE_URL,
    serviceToken: process.env.BT_SERVICE_INTERNAL_TOKEN ?? process.env.INTERNAL_API_TOKEN,
    cookieJarPath: process.env.BT_COOKIE_JAR,
    chromeProfilePath: process.env.BT_GATEWAY_PROFILE,
    profileHeadless: boolEnv("BT_PROFILE_HEADLESS", true),
    humanProfilePath: process.env.BT_GATEWAY_HUMAN_PROFILE,
    databaseUrl: process.env.DATABASE_URL,
    userAgent:
      process.env.BT_USER_AGENT ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    syncDbPath: process.env.BT_SYNC_DB ?? defaultSyncDb(),
    syncIntervalSec: intEnv("BT_SYNC_INTERVAL_SEC", 0),
    syncHydrate: boolEnv("BT_SYNC_HYDRATE", false),
    syncDelayMs: intEnv("BT_SYNC_DELAY_MS", 300),
    webhookUrl: process.env.BT_WEBHOOK_URL || undefined,
    webhookSecret: process.env.BT_WEBHOOK_SECRET || undefined,
    ...overrides,
  };
}

function defaultSyncDb(): string {
  const home = process.env.HOME ?? ".";
  return process.platform === "darwin"
    ? `${home}/Library/Application Support/bt-gateway/sync.db`
    : `${home}/.bt-gateway/sync.db`;
}

export const GST_LINE_TITLE = "[GST001] GST on Total Owner Price";
export const GST_UNIT_COST = 0.1;
export const GST_PAGE_TYPE_ENUM = 6;
export const DRAFT_APPROVAL_STATUS = 0;
