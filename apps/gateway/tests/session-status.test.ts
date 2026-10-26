import { describe, expect, it } from "vitest";
import { CONTENT_JSON } from "../src/adapter.js";
import {
  assertSessionStatusSafe,
  findSecretShapedValues,
  projectSessionStatus,
  SESSION_STATUS_ALLOWLIST,
} from "../src/session-status.js";
import { createHarness } from "./helpers.js";
import {
  FAKE_BASE64_TOKEN,
  FAKE_DATADOG_TOKEN,
  FAKE_GLOBAL_INFO_WITH_SECRETS,
  FAKE_GOOGLE_MAPS_KEY,
  FAKE_HEX_TOKEN,
  FAKE_INIT_WITH_SECRETS,
  FAKE_JWT,
  FAKE_LICENSE_KEY,
  FAKE_SALESFORCE_PEM,
} from "./fixtures/session-status-secrets.js";

const SECRET_SHAPED = [
  FAKE_SALESFORCE_PEM,
  FAKE_GOOGLE_MAPS_KEY,
  FAKE_DATADOG_TOKEN,
  FAKE_LICENSE_KEY,
  FAKE_JWT,
  FAKE_HEX_TOKEN,
  FAKE_BASE64_TOKEN,
];

function sessionHandler() {
  return async (req: { path: string }) => {
    if (req.path === "/apix/v2/context/init") {
      return { status: 200, contentType: CONTENT_JSON, json: FAKE_INIT_WITH_SECRETS };
    }
    if (req.path === "/api/AccountInfo/GlobalInfo") {
      return { status: 200, contentType: CONTENT_JSON, json: FAKE_GLOBAL_INFO_WITH_SECRETS };
    }
    return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
  };
}

describe("session.status allowlist", () => {
  it("returns only allowlisted session fields and strips client settings", async () => {
    const { invoke, calls } = createHarness(sessionHandler());
    const result = await invoke("session.status");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;

    expect(Object.keys(data).sort()).toEqual(
      Object.keys(data)
        .filter((key) => SESSION_STATUS_ALLOWLIST.includes(key as (typeof SESSION_STATUS_ALLOWLIST)[number]))
        .sort(),
    );
    expect(data).not.toHaveProperty("init");
    expect(data).not.toHaveProperty("globalInfo");
    expect(data).not.toHaveProperty("clientSettings");
    expect(data).not.toHaveProperty("appSettings");
    expect(data).not.toHaveProperty("settings");

    expect(data.authenticated).toBe(true);
    expect(data.needsToRelogin).toBe(false);
    expect(data.builderId).toBe(99999);
    expect(data.builderName).toBe("Example Homes");
    expect(data.userId).toBe(4242);
    expect(data.userName).toBe("Pat Builder");
    expect(data.loginName).toBe("pat.builder");
    expect(data.email).toBe("pat@example.test");
    expect(data.currentJob).toEqual({
      jobId: 200001,
      jobName: "Sandbox Job",
      jobNumber: "SB-1",
    });
    expect(data.expiresAt).toBe("2026-10-15T04:00:00.000Z");
    expect(data.issuedAt).toBe("2026-10-14T04:00:00.000Z");
    expect(typeof data.sessionAgeSeconds).toBe("number");

    expect(calls.some((c) => c.path === "/apix/v2/context/init")).toBe(true);
    expect(calls.some((c) => c.path === "/api/AccountInfo/GlobalInfo")).toBe(true);
  });

  it("fails if any key- or token-shaped value appears in bt_session_status output", async () => {
    const { invoke } = createHarness(sessionHandler());
    const result = await invoke("session.status");
    const serialized = JSON.stringify(result.data);

    for (const secret of SECRET_SHAPED) {
      expect(serialized).not.toContain(secret);
    }
    expect(serialized).not.toMatch(/-----BEGIN [A-Z ]{0,40}KEY-----/);
    expect(serialized).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);

    const findings = findSecretShapedValues(result.data);
    expect(findings).toEqual([]);
  });

  it("detects secrets if they are passed through (scanner contract)", () => {
    const leaked = {
      authenticated: true,
      needsToRelogin: false,
      currentJob: null,
      googleMapsApiKey: FAKE_GOOGLE_MAPS_KEY,
      salesforcePrivateKey: FAKE_SALESFORCE_PEM,
    };
    const findings = findSecretShapedValues(leaked);
    const shapes = findings.map((f) => f.shape).sort();
    expect(shapes).toContain("google_api_key");
    expect(shapes).toContain("pem");
    expect(shapes).toContain("field_name");
    expect(() =>
      assertSessionStatusSafe(leaked as never),
    ).toThrow(/non-allowlisted|token-shaped/i);
  });

  it("would fail the secret scan on the old raw init/globalInfo passthrough", () => {
    const legacy = {
      authenticated: true,
      builderId: 99999,
      init: FAKE_INIT_WITH_SECRETS,
      globalInfo: FAKE_GLOBAL_INFO_WITH_SECRETS.data,
    };
    const findings = findSecretShapedValues(legacy);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.shape === "pem")).toBe(true);
    expect(findings.some((f) => f.shape === "google_api_key")).toBe(true);
    expect(findings.some((f) => f.shape === "jwt")).toBe(true);
    expect(findings.some((f) => f.shape === "field_name")).toBe(true);
  });

  it("never copies raw settings objects from init or GlobalInfo", () => {
    const status = projectSessionStatus(FAKE_INIT_WITH_SECRETS, FAKE_GLOBAL_INFO_WITH_SECRETS);
    expect(findSecretShapedValues(status)).toEqual([]);
    expect(JSON.stringify(status)).not.toMatch(/clientSettings|appSettings|"settings"/);
    expect(assertSessionStatusSafe(status).builderId).toBe(99999);
  });
});
