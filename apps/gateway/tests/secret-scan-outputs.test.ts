import { describe, expect, it } from "vitest";
import { CONTENT_JSON } from "../src/adapter.js";
import { GatewayError } from "../src/errors.js";
import {
  assertNoTokenShapedStrings,
  findSecretShapedValues,
  redactSecretShapedValues,
  REDACTED_SECRET,
  sanitizeReadOutput,
} from "../src/secret-scan.js";
import { createHarness } from "./helpers.js";
import {
  FAKE_BILLS_DEFAULTS_WITH_SECRETS,
  FAKE_EXISTING_JOBS_WITH_SECRETS,
  FAKE_GOOGLE_MAPS_KEY,
  FAKE_JOB_GET_WITH_SECRETS,
  FAKE_JOBS_GRID_WITH_SECRETS,
  FAKE_JWT,
  FAKE_LEADS_DEFAULTS_WITH_SECRETS,
  FAKE_LIST_ROW_WITH_SECRETS,
  FAKE_PICKER_LIST_WITH_SECRETS,
  FAKE_SALESFORCE_PEM,
  FAKE_SECRET_STRINGS,
} from "./fixtures/verb-output-secrets.js";

function jsonHandler(routes: Record<string, unknown>) {
  return async (req: { path: string }) => {
    for (const [path, json] of Object.entries(routes)) {
      if (req.path === path) {
        return { status: 200, contentType: CONTENT_JSON, json };
      }
    }
    return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
  };
}

function assertNoSecretText(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const secret of FAKE_SECRET_STRINGS) {
    expect(serialized).not.toContain(secret);
  }
  expect(serialized).not.toMatch(/-----BEGIN [A-Z ]{0,40}KEY-----/);
  expect(serialized).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
  expect(
    findSecretShapedValues(value).filter((finding) => finding.reason === "token-shaped string"),
  ).toEqual([]);
}

function expectRedactedSecrets(record: Record<string, unknown>): void {
  expect(record.googleMapsApiKey).toBe(REDACTED_SECRET);
  expect(record.salesforcePrivateKey).toBe(REDACTED_SECRET);
  expect(record.datadogClientToken).toBe(REDACTED_SECRET);
  expect(record.licenceKey).toBe(REDACTED_SECRET);
  expect(record.mixpanelToken).toBe(REDACTED_SECRET);
  expect(record.apiToken).toBe(REDACTED_SECRET);
  expect(record.jwt).toBe(REDACTED_SECRET);
  expect(record.password).toBe(REDACTED_SECRET);
  expect(record.secret).toBe(REDACTED_SECRET);
  expect(record.note).toBe(REDACTED_SECRET);
  expect(record.extra).toBe(REDACTED_SECRET);
  expect(record.hexBlob).toBe(REDACTED_SECRET);
  expect(record.b64Blob).toBe(REDACTED_SECRET);
  expect(record.mapsHint).toBe(REDACTED_SECRET);
}

describe("secret-scan helper (list/get + form defaults)", () => {
  it("flags PEM, Google key, JWT, hex/base64, and secret-named fields on a raw row", () => {
    const findings = findSecretShapedValues(FAKE_LIST_ROW_WITH_SECRETS);
    const shapes = findings.map((finding) => finding.shape);
    expect(shapes).toContain("pem");
    expect(shapes).toContain("google_api_key");
    expect(shapes).toContain("jwt");
    expect(shapes).toContain("hex_token");
    expect(shapes).toContain("base64_token");
    expect(shapes).toContain("field_name");
    expect(findings.some((finding) => finding.path.endsWith(".note"))).toBe(true);
    expect(findings.some((finding) => finding.path.endsWith(".password"))).toBe(true);
    expect(JSON.stringify(findings)).not.toContain(FAKE_SALESFORCE_PEM);
    expect(JSON.stringify(findings)).not.toContain(FAKE_GOOGLE_MAPS_KEY);
  });

  it("redacts offending fields and keeps the rest of a legit row", () => {
    const redacted = redactSecretShapedValues(FAKE_LIST_ROW_WITH_SECRETS) as Record<string, unknown>;
    expect(redacted.id).toBe(101);
    expect(redacted.jobName).toBe("Sample job");
    expect(redacted.jobNumber).toBe("SJ-1");
    expect(redacted.status).toBe("Open");
    expect(redacted.title).toBe("Sample row");
    expectRedactedSecrets(redacted);
    assertNoSecretText(redacted);
    expect(findSecretShapedValues(redacted)).toEqual([]);
  });

  it("sanitizeReadOutput redacts token-shaped values on ordinary field names", () => {
    const clean = sanitizeReadOutput({
      raw: FAKE_LIST_ROW_WITH_SECRETS,
      rows: [FAKE_LIST_ROW_WITH_SECRETS],
    }) as { raw: Record<string, unknown>; rows: Record<string, unknown>[] };
    expect(clean.raw.id).toBe(101);
    expect(clean.rows[0]!.jobName).toBe("Sample job");
    assertNoSecretText(clean);
    const embedded = sanitizeReadOutput({
      note: `prefix ${FAKE_JWT} suffix`,
      keep: "Sample job",
    }) as { note: string; keep: string };
    expect(embedded.keep).toBe("Sample job");
    expect(embedded.note).toBe(REDACTED_SECRET);
  });

  it("fails closed if a token-shaped string is still present (leftover guard)", () => {
    expect(() =>
      assertNoTokenShapedStrings(FAKE_LIST_ROW_WITH_SECRETS, "token-shaped value after redaction"),
    ).toThrow(GatewayError);
    expect(() =>
      assertNoTokenShapedStrings(FAKE_LIST_ROW_WITH_SECRETS, "token-shaped value after redaction"),
    ).toThrow(/token-shaped value after redaction/);
    expect(() => assertNoTokenShapedStrings({ id: 101, jobName: "Sample job" }, "should not fire")).not.toThrow();
  });
});

describe("list/get { raw, rows } secret redaction", () => {
  it("jobs.list redacts secrets in raw and rows and keeps job fields", async () => {
    const { invoke } = createHarness(jsonHandler({ "/api/Jobsites/Grid": FAKE_JOBS_GRID_WITH_SECRETS }));
    const result = await invoke("jobs.list", { filters: {} });
    expect(result.ok).toBe(true);
    const data = result.data as { raw: { rows: Record<string, unknown>[] }; rows: Record<string, unknown>[] };
    expect(data.rows).toHaveLength(1);
    expect(data.rows[0]!.id).toBe(101);
    expect(data.rows[0]!.jobName).toBe("Sample job");
    expectRedactedSecrets(data.rows[0]!);
    expectRedactedSecrets((data.raw.rows ?? data.raw)[0] as Record<string, unknown>);
    assertNoSecretText(result.data);
  });

  it("jobs.picker.list redacts secrets in raw and rows", async () => {
    const { invoke } = createHarness(
      jsonHandler({ "/api/jobpicker/GetJobPickerData": FAKE_PICKER_LIST_WITH_SECRETS }),
    );
    const result = await invoke("jobs.picker.list");
    expect(result.ok).toBe(true);
    const data = result.data as { raw: { rows: Record<string, unknown>[] }; rows: Record<string, unknown>[] };
    expect(data.rows[0]!.jobNumber).toBe("SJ-1");
    expectRedactedSecrets(data.rows[0]!);
    assertNoSecretText(result.data);
  });

  it("jobs.picker.existing redacts secrets in raw and jobs", async () => {
    const { invoke } = createHarness(
      jsonHandler({ "/api/jobpicker/GetExistingJobList": FAKE_EXISTING_JOBS_WITH_SECRETS }),
    );
    const result = await invoke("jobs.picker.existing");
    expect(result.ok).toBe(true);
    const data = result.data as { raw: { jobs: Record<string, unknown>[] }; jobs: Record<string, unknown>[] };
    expect(data.jobs[0]!.title).toBe("Sample row");
    expectRedactedSecrets(data.jobs[0]!);
    assertNoSecretText(result.data);
  });

  it("jobs.get redacts secrets on the record and keeps identifiers", async () => {
    const { invoke } = createHarness(jsonHandler({ "/api/jobsites/101": FAKE_JOB_GET_WITH_SECRETS }));
    const result = await invoke("jobs.get", { jobId: 101 });
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.id).toBe(101);
    expect(data.jobName).toBe("Sample job");
    expectRedactedSecrets(data);
    assertNoSecretText(result.data);
  });

  it("contacts.list redacts secrets in raw and rows", async () => {
    const { invoke } = createHarness(
      jsonHandler({
        "/api/Contacts/Grid": {
          success: true,
          data: { rows: [{ id: 202, name: "Sample contact", ...FAKE_LIST_ROW_WITH_SECRETS }] },
        },
      }),
    );
    const result = await invoke("contacts.list");
    expect(result.ok).toBe(true);
    const data = result.data as { rows: Record<string, unknown>[] };
    expect(data.rows[0]!.name).toBe("Sample contact");
    expectRedactedSecrets(data.rows[0]!);
    assertNoSecretText(result.data);
  });
});

describe("form-defaults secret redaction", () => {
  it("leads.defaults redacts secrets and keeps form seed fields", async () => {
    const { invoke } = createHarness(jsonHandler({ "/api/Leads/Defaults": FAKE_LEADS_DEFAULTS_WITH_SECRETS }));
    const result = await invoke("leads.defaults");
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.defaultStatus).toBe("New");
    expect(data.assignedTo).toEqual({ options: [{ id: 7, name: "Sample user" }] });
    expectRedactedSecrets(data);
    assertNoSecretText(result.data);
  });

  it("bills.defaults redacts secrets and keeps form seed fields", async () => {
    const { invoke } = createHarness(
      jsonHandler({ "/api/v1/bills/defaultinfo": FAKE_BILLS_DEFAULTS_WITH_SECRETS }),
    );
    const result = await invoke("bills.defaults", { jobId: 101 });
    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.lienWaiverFormId).toBe(42);
    expect(data.customFields).toEqual([{ id: 1, name: "Sample field", value: null }]);
    expectRedactedSecrets(data);
    assertNoSecretText(result.data);
  });
});
