import { asRecord, numberish } from "./grids.js";
import { GatewayError } from "./errors.js";
import { unwrapData } from "./adapter.js";

/** Keys that may appear on the `session.status` / `bt_session_status` payload. */
export const SESSION_STATUS_ALLOWLIST = [
  "authenticated",
  "needsToRelogin",
  "builderId",
  "builderName",
  "userId",
  "userName",
  "loginName",
  "email",
  "currentJob",
  "expiresAt",
  "issuedAt",
  "sessionAgeSeconds",
] as const;

export type SessionStatusField = (typeof SESSION_STATUS_ALLOWLIST)[number];

export interface SessionJobContext {
  jobId?: number;
  jobName?: string;
  jobNumber?: string;
}

export interface SessionStatus {
  authenticated: boolean;
  needsToRelogin: boolean;
  builderId?: number;
  builderName?: string;
  userId?: number;
  userName?: string;
  loginName?: string;
  email?: string;
  currentJob: SessionJobContext | null;
  expiresAt?: string;
  issuedAt?: string;
  sessionAgeSeconds?: number;
}

const CURRENT_JOB_ALLOWLIST = ["jobId", "jobName", "jobNumber"] as const;

/** Field names that must never appear in session.status output. */
export const SECRET_FIELD_NAME =
  /key|token|secret|password|license|licence|private/i;

const PEM_BLOCK = /-----BEGIN [A-Z ]{0,40}KEY-----/;
const GOOGLE_API_KEY = /AIza[0-9A-Za-z_-]{20,}/;
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
const HEX_TOKEN = /^[0-9a-fA-F]{24,}$/;
const BASE64_TOKEN = /^[A-Za-z0-9+/]{24,}={0,2}$/;

function stringish(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const num = numberish(value);
    if (num != null) return num;
  }
  return undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = stringish(value);
    if (text) return text;
  }
  return undefined;
}

function projectJobContext(value: unknown): SessionJobContext | null {
  const rec = asRecord(value);
  const jobId = firstNumber(rec.jobId, rec.jobID, rec.jobsiteId, rec.id, rec.selectedJobId);
  const jobName = firstString(rec.jobName, rec.selectedJobName, rec.name, rec.title);
  const jobNumber = firstString(rec.jobNumber, rec.jobNo);
  if (jobId == null && !jobName && !jobNumber) return null;
  if (jobName && /please select a job/i.test(jobName) && (jobId == null || jobId <= 0)) {
    return null;
  }
  const out: SessionJobContext = {};
  if (jobId != null && jobId > 0) out.jobId = jobId;
  if (jobName && !/please select a job/i.test(jobName)) out.jobName = jobName;
  if (jobNumber) out.jobNumber = jobNumber;
  return Object.keys(out).length ? out : null;
}

function userRecord(source: Record<string, unknown>): Record<string, unknown> {
  return asRecord(source.user ?? source.account ?? source.login);
}

function builderRecord(source: Record<string, unknown>): Record<string, unknown> {
  return asRecord(source.builder ?? source.organization ?? source.org);
}

function displayName(source: Record<string, unknown>): string | undefined {
  const combined = [stringish(source.firstName), stringish(source.lastName)]
    .filter(Boolean)
    .join(" ");
  return firstString(source.userName, source.name, source.fullName, combined || undefined);
}

function isoTimestamp(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms).toISOString();
  }
  return undefined;
}

function sessionAgeSeconds(issuedAt: string | undefined, nowMs: number): number | undefined {
  if (!issuedAt) return undefined;
  const issued = Date.parse(issuedAt);
  if (!Number.isFinite(issued)) return undefined;
  return Math.max(0, Math.floor((nowMs - issued) / 1000));
}

/**
 * Project session-status fields from Buildertrend init + GlobalInfo.
 * Only named paths are read. Raw settings objects are never copied.
 */
export function projectSessionStatus(
  initPayload: unknown,
  globalInfoPayload: unknown,
  nowMs = Date.now(),
): SessionStatus {
  const initEnvelope = asRecord(initPayload);
  const init = asRecord(unwrapData(initPayload) ?? initPayload);
  const globalEnvelope = asRecord(globalInfoPayload);
  const globalInfo = asRecord(unwrapData(globalInfoPayload) ?? globalInfoPayload);

  const initUser = userRecord(init);
  const initBuilder = builderRecord(init);
  const globalUser = userRecord(globalInfo);

  const builderId = firstNumber(
    globalInfo.builderId,
    globalInfo.BuilderId,
    initBuilder.builderId,
    initBuilder.id,
    init.builderId,
  );
  const builderName = firstString(
    globalInfo.builderName,
    globalInfo.BuilderName,
    initBuilder.builderName,
    initBuilder.name,
    init.builderName,
  );
  const userId = firstNumber(
    globalInfo.globalUserId,
    globalInfo.GlobalUserId,
    globalInfo.userId,
    globalInfo.loginId,
    globalInfo.LoginId,
    globalUser.id,
    globalUser.userId,
    initUser.globalUserId,
    initUser.userId,
    initUser.id,
    init.userId,
  );
  const userName = firstString(
    displayName(globalInfo),
    displayName(globalUser),
    displayName(initUser),
    displayName(init),
  );
  const loginName = firstString(
    globalInfo.loginName,
    globalUser.loginName,
    initUser.loginName,
    init.loginName,
  );
  const email = firstString(
    globalInfo.email,
    globalInfo.emailAddress,
    globalUser.email,
    initUser.email,
    init.email,
  );
  const currentJob =
    projectJobContext(globalEnvelope.sessionJobInfo) ??
    projectJobContext(globalInfo.sessionJobInfo) ??
    projectJobContext(init.currentJob) ??
    projectJobContext(init.selectedJob) ??
    projectJobContext(init.sessionJob) ??
    projectJobContext(init.sessionJobInfo) ??
    projectJobContext(initEnvelope.sessionJobInfo);

  const expiresAt = isoTimestamp(
    firstString(
      globalInfo.sessionExpiration,
      globalInfo.expirationDate,
      globalInfo.expiresAt,
      globalEnvelope.sessionExpiration,
      init.sessionExpiration,
      init.expiresAt,
    ),
  );
  const issuedAt = isoTimestamp(
    firstString(
      globalInfo.loginTime,
      globalInfo.lastLoginDate,
      globalInfo.sessionStart,
      globalInfo.issuedAt,
      globalInfo.createdDate,
      init.loginTime,
      init.sessionStart,
      init.issuedAt,
    ),
  );

  const status: SessionStatus = {
    authenticated: globalEnvelope.needsToRelogin !== true && initEnvelope.needsToRelogin !== true,
    needsToRelogin: globalEnvelope.needsToRelogin === true || initEnvelope.needsToRelogin === true,
    currentJob,
  };
  if (builderId != null) status.builderId = builderId;
  if (builderName) status.builderName = builderName;
  if (userId != null) status.userId = userId;
  if (userName) status.userName = userName;
  if (loginName) status.loginName = loginName;
  if (email) status.email = email;
  if (expiresAt) status.expiresAt = expiresAt;
  if (issuedAt) status.issuedAt = issuedAt;
  const age = sessionAgeSeconds(issuedAt, nowMs);
  if (age != null) status.sessionAgeSeconds = age;

  return status;
}

export interface SecretFinding {
  path: string;
  reason: string;
  /** Never the secret itself — only a short shape label. */
  shape: string;
}

function valueShape(value: string): string | undefined {
  if (PEM_BLOCK.test(value)) return "pem";
  if (GOOGLE_API_KEY.test(value)) return "google_api_key";
  if (JWT.test(value)) return "jwt";
  const trimmed = value.trim();
  if (HEX_TOKEN.test(trimmed)) return "hex_token";
  if (BASE64_TOKEN.test(trimmed)) return "base64_token";
  return undefined;
}

/**
 * Walk a session.status payload and report token-shaped values or secret-named keys.
 * Findings never include the secret text.
 */
export function findSecretShapedValues(value: unknown, path = "$"): SecretFinding[] {
  const findings: SecretFinding[] = [];
  walk(value, path, findings);
  return findings;
}

function walk(value: unknown, path: string, findings: SecretFinding[]): void {
  if (value == null) return;
  if (typeof value === "string") {
    const shape = valueShape(value);
    if (shape) findings.push({ path, reason: "token-shaped string", shape });
    return;
  }
  if (typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, findings));
    return;
  }
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    const child = `${path}.${key}`;
    if (SECRET_FIELD_NAME.test(key)) {
      findings.push({ path: child, reason: "secret-named field", shape: "field_name" });
    }
    walk(inner, child, findings);
  }
}

export function assertSessionStatusSafe(status: SessionStatus): SessionStatus {
  const keys = Object.keys(status);
  const extra = keys.filter((key) => !SESSION_STATUS_ALLOWLIST.includes(key as SessionStatusField));
  if (extra.length) {
    throw new GatewayError("bt_error", "session.status produced non-allowlisted fields", {
      fields: extra,
    });
  }
  const jobKeys = status.currentJob ? Object.keys(status.currentJob) : [];
  const extraJob = jobKeys.filter((key) => !CURRENT_JOB_ALLOWLIST.includes(key as (typeof CURRENT_JOB_ALLOWLIST)[number]));
  if (extraJob.length) {
    throw new GatewayError("bt_error", "session.status currentJob produced non-allowlisted fields", {
      fields: extraJob,
    });
  }
  const findings = findSecretShapedValues(status);
  if (findings.length) {
    throw new GatewayError("bt_error", "session.status blocked a token-shaped value", {
      findings: findings.map((f) => ({ path: f.path, shape: f.shape })),
    });
  }
  return status;
}
