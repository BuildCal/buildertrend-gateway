import { describe, expect, it } from "vitest";
import { CONTENT_JSON } from "../src/adapter.js";
import { VERBS } from "../src/catalog.js";
import {
  PO_CAPTURED_PUT_KEYS,
  PO_SAFE_DRAFT_KEYS,
  poSaveDraftPayload,
  seedFromPoGet,
} from "../src/pos-payload.js";
import { createHarness } from "./helpers.js";

const PO_ID = 76899300;
const JOB_ID = 43320680;

function existingPo(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      id: PO_ID,
      purchaseOrderId: PO_ID,
      jobId: JOB_ID,
      title: "NMC0008-0001",
      purchaseOrderName: "NMC0008-0001",
      status: "Draft",
      statusText: "Draft",
      saveAndRelease: false,
      materialsOnly: false,
      internalNotes: "",
      scopeOfWork: "",
      disclaimer: "",
      customFields: [],
      attachedFiles: { removeDocs: [], attachDocs: [], updateDocs: [] },
      attachedFilesPostApproval: [],
      lineItems: [
        {
          id: 11,
          title: "Project material",
          unitCost: 13,
          builderCost: 13,
          quantity: 1,
        },
      ],
      purchaseOrderLineItems: [
        {
          id: 11,
          title: "Project material",
          unitCost: 13,
          builderCost: 13,
          quantity: 1,
        },
      ],
      priceType: 2,
      isVariance: false,
      isEntirePoVariance: false,
      varianceCode: 0,
      relatedPOs: [],
      relatedCO: null,
      hasLineItemCustomerVariance: false,
      relatedCOsToRemove: [],
      skipVarianceValidation: false,
      performingUserId: 1,
      performingUserName: "Gateway",
      performingUserType: 1,
      statusChangeComments: "",
      containerIsValid: true,
      varianceCount: 0,
      unifiedDeadlineRequest: { dueDate: null },
      unlinkedBids: [],
      linkedBids: [],
      availableBids: [],
      ...overrides,
    },
  };
}

describe("PO payload builder (captured 7 Sep 2026)", () => {
  it("starts from GET and overlays safe draft fields only", () => {
    const body = poSaveDraftPayload(
      {
        purchaseOrderId: PO_ID,
        title: "NMC0008-0001 draft",
        internalNotes: "sandbox note",
        lineItems: [{ id: 11, title: "Project material", unitCost: 14, builderCost: 14, quantity: 1 }],
      },
      existingPo(),
      PO_ID,
    );
    expect(body.id).toBe(PO_ID);
    expect(body.purchaseOrderId).toBe(PO_ID);
    expect(body.title).toBe("NMC0008-0001 draft");
    expect(body.internalNotes).toBe("sandbox note");
    expect(body.purchaseOrderName).toBe("NMC0008-0001");
    expect(body.performingUserId).toBe(1);
    expect(body.priceType).toBe(2);
    expect((body.lineItems as { unitCost: number }[])[0]!.unitCost).toBe(14);
    expect(body.saveAndRelease).toBe(false);
    expect(body.status).toBe("Draft");
    for (const key of ["title", "internalNotes", "lineItems", "saveAndRelease"] as const) {
      expect(PO_CAPTURED_PUT_KEYS).toContain(key);
    }
    expect(PO_SAFE_DRAFT_KEYS).toContain("title");
    expect(PO_SAFE_DRAFT_KEYS).not.toContain("saveAndRelease");
  });

  it("forces saveAndRelease false even when GET or args say otherwise", () => {
    expect(() =>
      poSaveDraftPayload({ purchaseOrderId: PO_ID, saveAndRelease: true }, existingPo(), PO_ID),
    ).toThrow(/saveAndRelease|locked/);
    const body = poSaveDraftPayload(
      { purchaseOrderId: PO_ID, title: "still draft" },
      existingPo({ saveAndRelease: true, status: "Draft", statusText: "Draft" }),
      PO_ID,
    );
    expect(body.saveAndRelease).toBe(false);
  });

  it("refuses send/approve/pay flags and non-draft POs", () => {
    expect(() =>
      poSaveDraftPayload({ purchaseOrderId: PO_ID, readyForPayment: true }, existingPo(), PO_ID),
    ).toThrow(/locked/);
    expect(() =>
      poSaveDraftPayload({ purchaseOrderId: PO_ID, approve: true }, existingPo(), PO_ID),
    ).toThrow(/locked/);
    expect(() =>
      poSaveDraftPayload(
        { purchaseOrderId: PO_ID, title: "nope" },
        existingPo({ status: "Approved", statusText: "Approved" }),
        PO_ID,
      ),
    ).toThrow(/Draft/);
  });

  it("rejects workers comp / tax / payroll titles", () => {
    expect(() =>
      poSaveDraftPayload(
        { purchaseOrderId: PO_ID, title: "Workers comp premium" },
        existingPo(),
        PO_ID,
      ),
    ).toThrow(/project expenses only/);
    expect(() =>
      poSaveDraftPayload(
        { purchaseOrderId: PO_ID, title: "ok" },
        existingPo({ title: "Payroll tax" }),
        PO_ID,
      ),
    ).toThrow(/project expenses only/);
  });

  it("unwraps GET envelopes the same way bills do", () => {
    const seed = seedFromPoGet(existingPo());
    expect(seed.id).toBe(PO_ID);
    expect(seed.purchaseOrderName).toBe("NMC0008-0001");
  });
});

describe("pos.update verb (scripted adapter, no live network)", () => {
  it("marks update captured and create still not_captured", () => {
    expect(VERBS.find((v) => v.verb === "pos.update")?.captured).toBe(true);
    expect(VERBS.find((v) => v.verb === "pos.create")?.captured).toBe(false);
    expect(VERBS.find((v) => v.verb === "pos.update")?.description).toMatch(/PUT \/api\/PurchaseOrders/);
  });

  it("dry_run does not HTTP-write", async () => {
    const { calls, invoke } = createHarness();
    const result = await invoke("pos.update", {
      purchaseOrderId: PO_ID,
      title: "Should not send",
      dry_run: true,
    });
    expect(result.dry_run).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("replays GET existing then PUT /api/PurchaseOrders/{id} as application/json", async () => {
    const { calls, invoke } = createHarness(async (req) => {
      if (req.method === "GET" && req.path === `/api/PurchaseOrders/${PO_ID}`) {
        return { status: 200, contentType: CONTENT_JSON, json: existingPo() };
      }
      if (req.method === "PUT" && req.path === `/api/PurchaseOrders/${PO_ID}`) {
        return {
          status: 200,
          contentType: CONTENT_JSON,
          json: existingPo({ title: "NMC0008-0001 $14", lineItems: [{ id: 11, unitCost: 14 }] }),
        };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
    });

    const result = await invoke("pos.update", {
      purchaseOrderId: PO_ID,
      title: "NMC0008-0001 $14",
      dry_run: false,
      lineItems: [{ id: 11, title: "Project material", unitCost: 14, builderCost: 14, quantity: 1 }],
    });
    expect(result.ok).toBe(true);

    const get = calls.find((c) => c.method === "GET");
    expect(get?.path).toBe(`/api/PurchaseOrders/${PO_ID}`);

    const put = calls.find((c) => c.method === "PUT");
    expect(put?.path).toBe(`/api/PurchaseOrders/${PO_ID}`);
    expect(put?.contentType ?? CONTENT_JSON).toBe(CONTENT_JSON);
    const body = put?.json as Record<string, unknown>;
    expect(body.saveAndRelease).toBe(false);
    expect(body.status).toBe("Draft");
    expect(body.title).toBe("NMC0008-0001 $14");
    expect((body.lineItems as { unitCost: number }[])[0]!.unitCost).toBe(14);
    expect(body.performingUserId).toBe(1);
    expect(calls.some((c) => c.path.toLowerCase().includes("markreadyforpayment"))).toBe(false);
    expect(calls.some((c) => c.method === "POST" && c.path === "/api/PurchaseOrders")).toBe(false);
  });

  it("fails closed on saveAndRelease / readyForPayment and leaves create not_captured", async () => {
    const { calls, invoke } = createHarness();
    await expect(
      invoke("pos.update", { purchaseOrderId: PO_ID, saveAndRelease: true, dry_run: false }),
    ).rejects.toMatchObject({ code: "send_disabled" });
    await expect(
      invoke("pos.update", { purchaseOrderId: PO_ID, readyForPayment: true, dry_run: false }),
    ).rejects.toMatchObject({ code: "send_disabled" });
    await expect(
      invoke("pos.create", { jobId: JOB_ID, dry_run: false }),
    ).rejects.toMatchObject({ code: "not_captured" });
    expect(calls).toHaveLength(0);
  });

  it("does not write when the last pulled hash does not match current GET", async () => {
    const { store, invoke, calls } = createHarness(async (req) => {
      if (req.method === "GET") {
        return { status: 200, contentType: CONTENT_JSON, json: existingPo({ title: "changed-in-bt" }) };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
    });
    await store.setSyncState({
      entityType: "po",
      externalId: String(PO_ID),
      lastPulledHash: "old-hash",
    });
    await expect(
      invoke("pos.update", { purchaseOrderId: PO_ID, title: "should not send", dry_run: false }),
    ).rejects.toMatchObject({ code: "conflict" });
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
  });
});
