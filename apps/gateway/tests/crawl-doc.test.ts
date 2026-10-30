import { describe, expect, it } from "vitest";
import { moduleForApi, moduleForScreen, renderModuleSections } from "../src/crawl/coverage-doc.js";

describe("coverage doc", () => {
  it("routes screens and APIs to modules", () => {
    expect(moduleForScreen("/app/ChangeOrders/{id}/{id}/Details").name).toMatch(/Change orders/);
    expect(moduleForApi("/api/v1/bills/grid").name).toMatch(/Bills/);
    expect(moduleForApi("/api/PurchaseOrders/{id}").name).toMatch(/Purchase orders/);
    expect(moduleForApi("/api/OwnerInvoices/Grid").name).toMatch(/Owner invoices/);
    expect(moduleForApi("/api/Leads/Defaults").name).toMatch(/Leads/);
    expect(moduleForScreen("/app/DailyLogs").name).toMatch(/Daily logs/);
  });

  it("renders fields, writes and unreached bundle APIs per module", () => {
    const md = renderModuleSections({
      screens: [
        {
          screen: "/app/ChangeOrders/{id}/{id}/Details",
          visits: 1,
          tabs: ["Details"],
          newForms: [],
          fields: [{ label: "Title", type: "text" }],
          selects: [{ label: "Status", count: 2, options: ["Draft", "Approved"] }],
          actions: ["Save", "Approve", "Print"],
          clicked: [],
          endpoints: [],
          writeCandidates: [],
        },
      ],
      endpoints: [
        {
          method: "GET",
          template: "/api/ChangeOrders/{id}/changeOrder?presentingScreen=",
          requestContentType: "",
          requestKeys: [],
          responseContentType: "application/json",
          statuses: [200],
          responseKeys: ["data.title", "data.lineItems[].unitCost"],
          enums: [],
          screens: [],
          decision: "read",
          count: 1,
        },
      ],
      writes: [
        {
          method: "PUT",
          template: "/api/ChangeOrders/{id}/Update",
          requestContentType: "application/json",
          requestKeys: ["title"],
          reason: "write PUT",
          screens: [],
          triggers: ["btn:Save"],
          count: 1,
        },
      ],
      inventory: {
        generatedAt: "",
        chunks: [],
        routes: [],
        enums: [],
        fields: {},
        apis: [
          { path: "/apix/v2/ChangeOrders/{p}/notify-owners", methods: ["POST"], chunks: [] },
          { path: "/apix/v2/ChangeOrders/{p}/draft-preview", methods: ["GET"], chunks: [] },
        ],
      },
    });
    expect(md).toContain("## Change orders (variations)");
    expect(md).toContain("`variations`");
    expect(md).toContain("Title (text)");
    expect(md).toContain("Status: Draft / Approved");
    expect(md).toContain("Save, Approve");
    expect(md).toContain("`/api/ChangeOrders/{id}/Update` | blocked during crawl");
    expect(md).toContain("`/apix/v2/ChangeOrders/{p}/notify-owners` | app bundle (not fired)");
    expect(md).toContain("GET /apix/v2/ChangeOrders/{p}/draft-preview");
  });
});
