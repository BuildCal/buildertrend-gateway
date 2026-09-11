import { describe, expect, it } from "vitest";
import {
  BILL_CREATE_COST_TYPES,
  BILL_DRAFT_STATUS,
  BILL_ENTITY_DOCUMENT_TYPE,
  BILL_MAPPING_PATH,
  BILL_NONE_PO_ID,
  BILL_SAVE_DRAFT_COST_TYPES,
  BILL_TEMPFILE_FIELD,
  BILL_TEMPFILE_MEDIA_TYPE,
  billCreatePayload,
  billEntityDocsPayload,
  billMappingQuery,
  billSaveDraftPayload,
  mappingLineItems,
  seedFromDefaultInfo,
} from "../src/bills-payload.js";
import { parseVerbArgs } from "../src/schemas.js";

/** Captured 11 Sep 2026 — Cubbaroo draft GetBillMapping. Do not invent fields. */
const GET_BILL_MAPPING_CAPTURE = {
  success: true,
  message: "",
  needsToRelogin: false,
  sessionJobInfo: null,
  data: {
    purchaseOrderId: 76574248,
    builderId: 110310,
    jobId: 41648716,
    jobName: "0013 - 2 Cubbaroo St (Duplex)",
    canViewPrice: true,
    lineItems: {
      validators: null,
      value: [
        {
          amountBilled: 0.0,
          costCodeTitle: "1090 House Peg Survey",
          parentEntity: {
            id: 76574248,
            idString: null,
            title: "090: House Peg Survey",
            totalAmount: 3000.0,
            parentId: null,
            dateToFilter: null,
            subTitle: null,
            entityType: 0,
            attachedFiles: null,
            userName: null,
            hasOvertime: false,
          },
          grandparentEntity: null,
          lineItemType: 17,
          costTypes: [7],
          worksheetDisplayOrder: null,
          id: 132371670,
          costCode: 17072328,
          unitCost: 1500.0,
          unitPrice: 0.0,
          quantity: 2.0,
          unitType: "EA",
          markupType: 0,
          markupPercent: 0.0,
          markupPerUnit: 0.0,
          markupAmount: 0.0,
          margin: null,
          calculatedAmount: 0.0,
          ownerPrice: 0.0,
          description: "Setout Survey and Report",
          internalNotes: "",
          title: "[SURV040] House setout",
          varianceCode: 0,
          varianceCodeTitle: null,
          estimateId: null,
          relatedGeneralItemId: null,
          builderCost: 3000.0,
          excludeFromNewExpected: false,
          catalogItemId: 11207960,
          costCatalogUpdateType: null,
          pendingCostCatalogUpdateDate: null,
          isTBD: false,
          costTypeId: null,
          isCostCodeItem: false,
          costCodeItemId: 11207960,
          catalogsExist: false,
          selectionChoiceLineItemId: null,
          parentId: null,
          purchaseOrderId: 76574248,
          purchaseOrderLineItemId: 132371670,
          purchaseOrderPaymentLineItemId: null,
          billLineItemId: null,
          relatedTimeCardLineItemId: null,
          relatedChangeOrderLineItemId: null,
          relatedParentId: null,
          relatedParentTitle: null,
          relatedParentType: 0,
          relatedStackLinks: null,
          costGroupId: null,
          amountInvoiced: 0.0,
          markedAs: null,
          includeInCatalog: null,
          costCategoryId: null,
          relatedBidLineItemId: null,
          allowanceId: null,
          allowanceLineItemId: null,
          relatedAccountingCostId: null,
          globalProductCatalogId: null,
          vendorProductId: null,
          vendorType: null,
          productUrl: null,
          isDiscontinued: null,
          isDeleted: null,
          taxGroupId: null,
          builderId: 110310,
        },
      ],
    },
    lineItemPercentages: {},
  },
  metadata: null,
  forcedUpgrade: false,
};
import { CONTENT_JSON, unwrapData } from "../src/adapter.js";
import { VERBS } from "../src/catalog.js";
import { createHarness } from "./helpers.js";

const JOB_ID = 9;
const VENDOR_ID = 3;
const BILL_ID = 1001;
const LINE_ID = 501;
const BUILDER_ID = 99999;

function genericDefaultInfo() {
  return {
    success: true,
    data: {
      customFields: [
        {
          id: 1,
          name: "Test field",
          value: null,
          options: [{ id: 1, label: "Option A" }],
        },
      ],
      lienWaiverFormId: 42,
      assignedTo: {
        options: [{ id: VENDOR_ID, name: "AAA Test Sub Vendor", extraData: { userType: 2 } }],
      },
    },
  };
}

function createdBill(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      id: BILL_ID,
      billId: BILL_ID,
      billNumber: "TEST-1",
      billTitle: "Gateway capture",
      status: BILL_DRAFT_STATUS,
      billStatus: { status: BILL_DRAFT_STATUS, statusText: "Draft" },
      jobId: JOB_ID,
      customFields: genericDefaultInfo().data.customFields,
      lienWaiverFormId: 42,
      lineItems: [
        {
          id: LINE_ID,
          title: "",
          unitCost: 0,
          builderCost: 0,
          costTypes: [],
          pageTypeEnum: 17,
          costCodeId: 88,
        },
      ],
      ...overrides,
    },
  };
}

function tempDoc() {
  return {
    id: 7001,
    documentInstanceId: 8001,
    title: "test-invoice-1.pdf",
    extension: "pdf",
    fileSize: 2048,
    docPath: "/tmp/test-invoice-1.pdf",
    tempId: "temp-1",
  };
}

const createArgs = {
  jobId: JOB_ID,
  vendorId: VENDOR_ID,
  billNumber: "TEST-1",
  billTitle: "Gateway capture",
  invoiceDate: "2026-09-02T00:00:00",
  dry_run: false,
  lineItems: [
    {
      title: "Gateway capture line",
      costCodeId: 88,
      unitCost: 1,
      builderCost: 1,
    },
  ],
};

describe("bill payload builder (captured 2 Sep 2026)", () => {
  it("POST create uses status 9, saveAsDraft false, empty attach, PO none, amounts 0", () => {
    const body = billCreatePayload(createArgs, JOB_ID, genericDefaultInfo());
    expect(body.status).toBe(9);
    expect(body.saveAsDraft).toBe(false);
    expect(body.saveDraftToJob).toBe(false);
    expect(body.purchaseOrderId).toBe(-1);
    expect(body.isCreateNewFromPO).toBe(false);
    expect(body.billId).toBe(0);
    expect(body.attachedFiles).toEqual({ removeDocs: [], attachDocs: [], updateDocs: [] });
    expect(body.performingUserType).toBe(2);
    expect(body.priceType).toBe(2);
    expect(body.customFields).toEqual(genericDefaultInfo().data.customFields);
    expect(body.lienWaiverFormId).toBe(42);
    const line = (body.lineItems as Record<string, unknown>[])[0]!;
    expect(line.id).toBe(0);
    expect(line.pageTypeEnum).toBe(17);
    expect(line.costTypes).toEqual(BILL_CREATE_COST_TYPES);
    expect(line.costTypes).toEqual([]);
    expect(line.markedAs).toBe(-1);
    expect(line.unitCost).toBe(0);
    expect(line.builderCost).toBe(0);
    expect(line.costCodeId).toBe(88);
    for (const flag of [
      "readyForPayment",
      "payInFull",
      "payOnline",
      "sendToAccounting",
      "syncUpdatesToAccounting",
      "sendForApproval",
      "approveBill",
      "billToOwner",
    ]) {
      expect(body[flag]).toBe(false);
    }
  });

  it("PUT save-draft sets saveAsDraft true and exclusive amounts", () => {
    const body = billSaveDraftPayload(createArgs, createdBill(), BILL_ID);
    expect(body.saveAsDraft).toBe(true);
    expect(body.status).toBe(9);
    expect(body.saveDraftToJob).toBe(false);
    expect(body.billId).toBe(BILL_ID);
    expect(body.purchaseOrderId).toBe(-1);
    expect(body.isCreateNewFromPO).toBe(false);
    expect(body.attachedFiles).toEqual({ removeDocs: [], attachDocs: [], updateDocs: [] });
    expect(body.invoiceDate).toBe("2026-09-02T00:00:00");
    const line = (body.lineItems as Record<string, unknown>[])[0]!;
    expect(line.id).toBe(LINE_ID);
    expect(line.unitCost).toBe(1);
    expect(line.builderCost).toBe(1);
    expect(line.costTypes).toEqual([...BILL_SAVE_DRAFT_COST_TYPES]);
    expect(line.title).toBe("Gateway capture line");
    expect(body.readyForPayment).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/taxGroup|4000 GST/);
  });

  it("PUT save-draft accepts a real purchaseOrderId after GetBillMapping", () => {
    const poId = 76574248;
    const body = billSaveDraftPayload(
      {
        ...createArgs,
        purchaseOrderId: poId,
        lineItems: [
          {
            title: "[SURV040] House setout",
            unitCost: 1500,
            builderCost: 3000,
            quantity: 2,
            purchaseOrderLineItemId: 132371670,
          },
        ],
      },
      createdBill(),
      BILL_ID,
    );
    expect(body.purchaseOrderId).toBe(poId);
    expect(body.isCreateNewFromPO).toBe(false);
    expect(body.saveAsDraft).toBe(true);
    expect(body.status).toBe(9);
    expect(body.readyForPayment).toBe(false);
    const line = (body.lineItems as Record<string, unknown>[])[0]!;
    expect(line.purchaseOrderLineItemId).toBe(132371670);
    expect(line.unitCost).toBe(1500);
    expect(line.quantity).toBe(2);
  });

  it("builds GetBillMapping query with billId default 0", () => {
    expect(
      billMappingQuery({ purchaseOrderId: 76574248, jobId: 41648716 }),
    ).toEqual({ purchaseOrderId: 76574248, jobId: 41648716, billId: 0 });
    expect(
      billMappingQuery({ purchaseOrderId: 76574248, jobId: 41648716, billId: 124540604 }),
    ).toEqual({ purchaseOrderId: 76574248, jobId: 41648716, billId: 124540604 });
    expect(() => billMappingQuery({ jobId: 41648716 })).toThrow(/purchaseOrderId/);
    expect(() => billMappingQuery({ purchaseOrderId: 76574248 })).toThrow(/jobId/);
    expect(() => billMappingQuery({ purchaseOrderId: -1, jobId: 41648716 })).toThrow(
      /purchaseOrderId/,
    );
  });

  it("unwraps mapping lineItems.value", () => {
    const lines = mappingLineItems(GET_BILL_MAPPING_CAPTURE.data);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      title: "[SURV040] House setout",
      builderCost: 3000,
      purchaseOrderLineItemId: 132371670,
    });
  });

  it("EntityDocs uses documentType 58 and one attachDocs entry", () => {
    const doc = tempDoc();
    const body = billEntityDocsPayload({
      builderId: BUILDER_ID,
      jobId: JOB_ID,
      billId: BILL_ID,
      tempDoc: doc,
    });
    expect(body.documentType).toBe(BILL_ENTITY_DOCUMENT_TYPE);
    expect(body.documentType).toBe(58);
    expect(body.id).toEqual([BILL_ID]);
    expect(body.notifyBuilder).toBe(false);
    expect(body.notifyOwner).toBe(false);
    expect(body.notifySubs).toBe(false);
    const attached = (body.attachedFiles as { attachDocs: unknown[] }).attachDocs;
    expect(attached).toHaveLength(1);
    expect(attached[0]).toEqual(doc);
  });

  it("rejects send/pay flags and a real PO id on create", () => {
    expect(() => billCreatePayload({ ...createArgs, readyForPayment: true }, JOB_ID)).toThrow(
      /locked/,
    );
    expect(() => billCreatePayload({ ...createArgs, purchaseOrderId: 77 }, JOB_ID)).toThrow(
      /isCreateNewFromPO/,
    );
    expect(() =>
      billCreatePayload(
        {
          ...createArgs,
          lineItems: [{ title: "4000 GST", unitCost: 1 }],
        },
        JOB_ID,
      ),
    ).toThrow(/exclusive GST/);
  });

  it("copies customFields from defaultinfo rather than hard-coding them", () => {
    const seed = seedFromDefaultInfo(genericDefaultInfo());
    expect(seed.customFields).toEqual(genericDefaultInfo().data.customFields);
    const body = billCreatePayload(createArgs, JOB_ID, { data: { customFields: [{ id: 99 }] } });
    expect(body.customFields).toEqual([{ id: 99 }]);
  });
});

describe("bill verbs (scripted adapter, no live network)", () => {
  it("marks create, update, attach, and PO link as captured", () => {
    expect(VERBS.find((v) => v.verb === "bills.create")?.captured).toBe(true);
    expect(VERBS.find((v) => v.verb === "bills.update")?.captured).toBe(true);
    expect(VERBS.find((v) => v.verb === "bills.attach")?.captured).toBe(true);
    expect(VERBS.find((v) => v.verb === "bills.linkPurchaseOrder")?.captured).toBe(true);
    expect(VERBS.find((v) => v.verb === "bills.markReadyForPayment")?.kind).toBe("send");
    expect(VERBS.find((v) => v.verb === "docs.upload")?.captured).toBe(false);
  });

  it("dry_run does not HTTP-write", async () => {
    const { calls, invoke } = createHarness(undefined, { sandbox: true });
    const result = await invoke("bills.create", { ...createArgs, dry_run: true });
    expect(result.dry_run).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("replays GET defaultinfo → POST create → PUT save-draft", async () => {
    const { calls, invoke } = createHarness(async (req) => {
      if (req.path === "/api/v1/bills/defaultinfo") {
        return { status: 200, contentType: CONTENT_JSON, json: genericDefaultInfo() };
      }
      if (req.method === "POST" && req.path === "/api/v1/bills") {
        return { status: 200, contentType: CONTENT_JSON, json: createdBill() };
      }
      if (req.method === "PUT" && req.path === `/api/v1/bills/${BILL_ID}`) {
        return { status: 200, contentType: CONTENT_JSON, json: createdBill({ billTitle: "saved" }) };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
    }, { sandbox: true });

    const result = await invoke("bills.create", createArgs);
    expect(result.ok).toBe(true);

    const defaults = calls.find((c) => c.path === "/api/v1/bills/defaultinfo");
    expect(defaults?.method).toBe("GET");
    expect(defaults?.query).toMatchObject({ jobId: JOB_ID, isBillRemainingAction: false });

    const create = calls.find((c) => c.method === "POST" && c.path === "/api/v1/bills");
    expect(create?.query).toMatchObject({ jobId: JOB_ID });
    const createBody = create?.json as Record<string, unknown>;
    expect(createBody.status).toBe(9);
    expect(createBody.saveAsDraft).toBe(false);
    expect(createBody.saveDraftToJob).toBe(false);
    expect(createBody.purchaseOrderId).toBe(BILL_NONE_PO_ID);
    expect((createBody.lineItems as { unitCost: number }[])[0]!.unitCost).toBe(0);
    expect(createBody.attachedFiles).toEqual({ removeDocs: [], attachDocs: [], updateDocs: [] });

    const save = calls.find((c) => c.method === "PUT" && c.path === `/api/v1/bills/${BILL_ID}`);
    const saveBody = save?.json as Record<string, unknown>;
    expect(saveBody.saveAsDraft).toBe(true);
    expect(saveBody.status).toBe(9);
    expect((saveBody.lineItems as { id: number; unitCost: number; builderCost: number }[])[0]).toMatchObject({
      id: LINE_ID,
      unitCost: 1,
      builderCost: 1,
    });
    expect(calls.some((c) => c.path.includes("ocr-upload"))).toBe(false);
    expect(calls.some((c) => c.path.toLowerCase().includes("markreadyforpayment"))).toBe(false);
  });

  it("attaches one PDF via tempFile + EntityDocs and never ocr-upload", async () => {
    const pdf = Buffer.from("%PDF-1.4 invoice-sized fixture").toString("base64");
    const { calls, invoke } = createHarness(async (req) => {
      if (req.path.includes("/tempFile")) {
        return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: tempDoc() } };
      }
      if (req.path === "/api/Documents/EntityDocs") {
        return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: { ok: true } } };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
    });

    await invoke("bills.attach", {
      billId: BILL_ID,
      jobId: JOB_ID,
      filename: "test-invoice-1.pdf",
      contentBase64: pdf,
      dry_run: false,
    });

    const temp = calls.find((c) => c.path === `/api/documents/${BILL_TEMPFILE_MEDIA_TYPE}/tempFile`);
    expect(temp?.method).toBe("POST");
    expect(temp?.query).toMatchObject({ jobId: JOB_ID, uploadFullResPhoto: true });
    expect(temp?.multipart).toHaveLength(1);
    expect(temp?.multipart?.[0]?.fieldName).toBe(BILL_TEMPFILE_FIELD);
    expect(temp?.multipart?.[0]?.filename).toBe("test-invoice-1.pdf");

    const entity = calls.find((c) => c.path === "/api/Documents/EntityDocs");
    const entityBody = entity?.json as {
      documentType: number;
      id: number[];
      attachedFiles: { attachDocs: unknown[] };
      notifyBuilder: boolean;
    };
    expect(entityBody.documentType).toBe(58);
    expect(entityBody.id).toEqual([BILL_ID]);
    expect(entityBody.attachedFiles.attachDocs).toHaveLength(1);
    expect(entityBody.notifyBuilder).toBe(false);
    expect(calls.filter((c) => c.path === "/api/Documents/EntityDocs")).toHaveLength(1);
    expect(calls.some((c) => c.path.includes("ocr-upload"))).toBe(false);
    expect(JSON.stringify(calls.map((c) => c.path))).not.toMatch(/ocr-upload/i);
  });

  it("bills.update PUTs save-draft with exclusive amounts", async () => {
    const { calls, invoke } = createHarness(async (req) => {
      if (req.method === "GET" && req.path === `/api/v1/bills/${BILL_ID}`) {
        return { status: 200, contentType: CONTENT_JSON, json: createdBill() };
      }
      return { status: 200, contentType: CONTENT_JSON, json: createdBill({ billTitle: "edited" }) };
    });
    await invoke("bills.update", {
      billId: BILL_ID,
      jobId: JOB_ID,
      billTitle: "edited",
      invoiceDate: "2026-09-02T00:00:00",
      dry_run: false,
      lineItems: [{ title: "Gateway capture line", costCodeId: 88, unitCost: 1 }],
    });
    const put = calls.find((c) => c.method === "PUT");
    expect(put?.path).toBe(`/api/v1/bills/${BILL_ID}`);
    expect((put?.json as { saveAsDraft: boolean }).saveAsDraft).toBe(true);
    expect((put?.json as { purchaseOrderId: number }).purchaseOrderId).toBe(BILL_NONE_PO_ID);
    expect((put?.json as { attachedFiles: { attachDocs: unknown[] } }).attachedFiles.attachDocs).toEqual(
      [],
    );
  });

  it("bills.update PUTs a real purchaseOrderId from GetBillMapping", async () => {
    const poId = 76574248;
    const { calls, invoke } = createHarness(async (req) => {
      if (req.method === "GET" && req.path === `/api/v1/bills/${BILL_ID}`) {
        return { status: 200, contentType: CONTENT_JSON, json: createdBill() };
      }
      return { status: 200, contentType: CONTENT_JSON, json: createdBill() };
    });
    await invoke("bills.update", {
      billId: BILL_ID,
      jobId: JOB_ID,
      purchaseOrderId: poId,
      dry_run: false,
      lineItems: [
        {
          title: "[SURV040] House setout",
          unitCost: 1500,
          quantity: 2,
          purchaseOrderLineItemId: 132371670,
        },
      ],
    });
    const put = calls.find((c) => c.method === "PUT");
    const body = put?.json as {
      purchaseOrderId: number;
      isCreateNewFromPO: boolean;
      readyForPayment: boolean;
      saveAsDraft: boolean;
    };
    expect(body.purchaseOrderId).toBe(poId);
    expect(body.isCreateNewFromPO).toBe(false);
    expect(body.readyForPayment).toBe(false);
    expect(body.saveAsDraft).toBe(true);
  });

  it("fails closed on send/pay flags and create-from-PO", async () => {
    const { calls, invoke } = createHarness(undefined, { sandbox: true });
    await expect(
      invoke("bills.create", { ...createArgs, readyForPayment: true }),
    ).rejects.toMatchObject({ code: "send_disabled" });
    await expect(
      invoke("bills.create", { ...createArgs, purchaseOrderId: 44 }),
    ).rejects.toMatchObject({ code: "not_captured" });
    await expect(
      invoke("bills.linkPurchaseOrder", {
        jobId: JOB_ID,
        purchaseOrderId: 44,
        readyForPayment: true,
        dry_run: false,
      }),
    ).rejects.toMatchObject({ code: "send_disabled" });
    await expect(
      invoke("bills.markReadyForPayment", { billId: BILL_ID, dry_run: false }),
    ).rejects.toMatchObject({ code: "send_disabled" });
    expect(calls).toHaveLength(0);
  });

  it("GET GetBillMapping with po/job and billId default 0", async () => {
    const poId = 76574248;
    const jobId = 41648716;
    const { calls, invoke } = createHarness(async (req) => {
      expect(req.method).toBe("GET");
      expect(req.path).toBe(BILL_MAPPING_PATH);
      return {
        status: 200,
        contentType: CONTENT_JSON,
        json: GET_BILL_MAPPING_CAPTURE,
      };
    });

    const result = await invoke("bills.linkPurchaseOrder", {
      purchaseOrderId: poId,
      jobId,
      dry_run: false,
    });
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe("GET");
    expect(calls[0]!.path).toBe("/api/v1/Bills/GetBillMapping");
    expect(calls[0]!.query).toEqual({ purchaseOrderId: poId, jobId, billId: 0 });
    expect(result.data).toEqual(unwrapData(GET_BILL_MAPPING_CAPTURE));
    const data = result.data as {
      purchaseOrderId: number;
      jobId: number;
      jobName: string;
      lineItems: { validators: null; value: Record<string, unknown>[] };
      lineItemPercentages: Record<string, unknown>;
    };
    expect(data.purchaseOrderId).toBe(76574248);
    expect(data.jobId).toBe(41648716);
    expect(data.jobName).toBe("0013 - 2 Cubbaroo St (Duplex)");
    expect(data.lineItemPercentages).toEqual({});
    expect(data.lineItems.validators).toBeNull();
    expect(data.lineItems.value[0]).toMatchObject({
      title: "[SURV040] House setout",
      description: "Setout Survey and Report",
      amountBilled: 0,
      costCodeTitle: "1090 House Peg Survey",
      costCode: 17072328,
      unitCost: 1500,
      quantity: 2,
      unitType: "EA",
      builderCost: 3000,
      costTypes: [7],
      lineItemType: 17,
      id: 132371670,
      purchaseOrderLineItemId: 132371670,
      purchaseOrderId: 76574248,
      catalogItemId: 11207960,
      costCodeItemId: 11207960,
      taxGroupId: null,
    });
    expect(JSON.stringify(result.data)).not.toMatch(/isCreateNewFromPO/);
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
    expect(calls.some((c) => c.path.toLowerCase().includes("markreadyforpayment"))).toBe(false);
  });

  it("rejects missing purchaseOrderId or jobId on link", async () => {
    const { calls, invoke } = createHarness();
    await expect(
      invoke("bills.linkPurchaseOrder", { jobId: JOB_ID, dry_run: false }),
    ).rejects.toMatchObject({ code: "validation" });
    await expect(
      invoke("bills.linkPurchaseOrder", { purchaseOrderId: 76574248, dry_run: false }),
    ).rejects.toMatchObject({ code: "validation" });
    expect(() => parseVerbArgs("bills.linkPurchaseOrder", { jobId: JOB_ID })).toThrow(
      /number|Required/i,
    );
    expect(() => parseVerbArgs("bills.linkPurchaseOrder", { purchaseOrderId: 76574248 })).toThrow(
      /number|Required/i,
    );
    expect(calls).toHaveLength(0);
  });

  it("lists available POs as a read helper", async () => {
    const { calls, invoke } = createHarness(async (req) => {
      expect(req.path).toBe(`/apix/v2/Bills/get-available-purchase-orders/${VENDOR_ID}/2/${JOB_ID}`);
      return {
        status: 200,
        contentType: CONTENT_JSON,
        json: { id: -1, name: "-- None Selected --" },
      };
    });
    const result = await invoke("bills.availablePurchaseOrders", {
      vendorId: VENDOR_ID,
      jobId: JOB_ID,
    });
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.method).toBe("GET");
  });
});
