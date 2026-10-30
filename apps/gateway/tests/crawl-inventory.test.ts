import { describe, expect, it } from "vitest";
import {
  addChunk,
  apiRefs,
  chunkRefs,
  emptyInventory,
  enumRefs,
  normaliseApiPath,
  pathKey,
  routeRefs,
} from "../src/crawl/inventory.js";

const SAMPLE = `
import{a as e}from"./ChangeOrders.api.handler-AbC12345.js";
const l=()=>import("./OwnerInvoice.api.types-Zz9_xY12.js");
var s;(function(t){t[t.Draft=0]="Draft",t[t.Pending=1]="Pending",t[t.Approved=2]="Approved"})(s||(s={}));
const u=r=>e.get(\`/api/ChangeOrders/\${r}/changeOrder\`),
 c=(r,n)=>fetch(\`/api/ChangeOrders/\${r}/Update\`,{method:"PUT",body:n}),
 d=()=>e.post("/apix/v2/LineItems/add-change-order-line-items",{}),
 g="/app/ChangeOrders/ChangeOrder/\${id}/\${jobId}";
const routes=[{path:"/Warranties/:warrantyId/:jobId"}];
`;

describe("bundle inventory extractors", () => {
  it("finds chunk references", () => {
    expect(chunkRefs(SAMPLE).sort()).toEqual([
      "ChangeOrders.api.handler-AbC12345.js",
      "OwnerInvoice.api.types-Zz9_xY12.js",
    ]);
  });

  it("finds API paths with methods", () => {
    const apis = Object.fromEntries(apiRefs(SAMPLE).map((a) => [a.path, a.methods]));
    expect(apis["/api/ChangeOrders/{p}/changeOrder"]).toEqual(["GET"]);
    expect(apis["/api/ChangeOrders/{p}/Update"]).toEqual(["PUT"]);
    expect(apis["/apix/v2/LineItems/add-change-order-line-items"]).toEqual(["POST"]);
  });

  it("finds routes and compiled enums", () => {
    expect(routeRefs(SAMPLE)).toEqual(["/Warranties/:warrantyId/:jobId", "/app/ChangeOrders/ChangeOrder/:p/:p"]);
    expect(enumRefs(SAMPLE)).toEqual([
      [
        { name: "Draft", value: 0 },
        { name: "Pending", value: 1 },
        { name: "Approved", value: 2 },
      ],
    ]);
  });

  it("normalises and matches paths against observed templates", () => {
    expect(normaliseApiPath("api/Leads/123?x=1")).toBe("/api/Leads/{p}");
    expect(pathKey("/api/ChangeOrders/{p}/Update")).toBe(pathKey("/api/changeorders/{id}/Update?useSession="));
    expect(pathKey("/app/Warranties/:warrantyId/:jobId")).toBe(pathKey("/app/Warranties/{id}/{id}"));
  });

  it("folds a chunk into the inventory and returns its children", () => {
    const inv = emptyInventory();
    const next = addChunk(inv, "ChangeOrders.api.handler-AbC12345.js", SAMPLE);
    expect(next.length).toBe(2);
    expect(inv.apis.length).toBe(3);
    expect(inv.enums.length).toBe(1);
    expect(Object.keys(inv.fields)).toEqual(["ChangeOrders.api.handler"]);
  });
});

describe("coverage score", () => {
  it("lists what the crawl did not reach", async () => {
    const { scoreCoverage } = await import("../src/crawl/report.js");
    const inv = emptyInventory();
    inv.apis = [
      { path: "/api/Leads/{p}", methods: ["GET"], chunks: [] },
      { path: "/api/Leads", methods: ["POST"], chunks: [] },
      { path: "/api/Warranty/Grid", methods: ["POST"], chunks: [] },
    ];
    inv.routes = ["/app/Leads/:id", "/app/Warranties"];
    const c = scoreCoverage(
      inv,
      [{ template: "/api/Leads/{id}" }, { template: "/api/Other/Thing" }],
      [{ template: "/api/Leads" }],
      [{ screen: "/app/Leads/{id}" }],
    );
    expect(c.apisReached).toBe(2);
    expect(c.apisMissed.map((a) => a.path)).toEqual(["/api/Warranty/Grid"]);
    expect(c.routesMissed).toEqual(["/app/Warranties"]);
    expect(c.observedNotInInventory).toEqual(["/api/other/thing"]);
  });
});
