import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { bodyKeys, isSafeEnumLabel, shapeOf } from "../src/crawl/shape.js";
import { CrawlRecorder } from "../src/crawl/state.js";

describe("crawl payload shapes", () => {
  it("records keys, never values", () => {
    const shape = shapeOf({
      data: {
        title: "Jane Citizen kitchen",
        ownerEmail: "jane@example.com",
        lineItems: [{ id: 5, unitCost: 10, costCode: 99 }],
        "100001": { x: 1 },
        apiKey: { nested: "SECRET" },
      },
    });
    expect(shape.keys).toContain("data.title");
    expect(shape.keys).toContain("data.lineItems[].unitCost");
    expect(shape.keys).toContain("data.{id}.x");
    expect(shapeOf({ filters: { "['9',477399,3]": 1 } }).keys).toEqual(["filters", "filters.{key}"]);
    expect(shape.keys).toContain("data.apiKey");
    expect(shape.keys).not.toContain("data.apiKey.nested");
    const text = JSON.stringify(shape);
    expect(text).not.toMatch(/Jane|example\.com|100001|SECRET/);
  });

  it("keeps labels for system enums only", () => {
    const shape = shapeOf({
      statusOptions: [
        { id: 0, name: "Draft" },
        { id: 1, name: "Approved" },
      ],
      assignedUsers: [
        { id: 7, name: "Jane Citizen" },
        { id: 8, name: "John Example" },
      ],
      vendorOptions: [{ value: 1, text: "Acme Plumbing Pty Ltd" }],
    });
    const byPath = Object.fromEntries(shape.enums.map((e) => [e.path, e]));
    expect(byPath.statusOptions?.labels).toEqual(["Draft", "Approved"]);
    expect(byPath.assignedUsers?.labels).toBeUndefined();
    expect(byPath.assignedUsers?.count).toBe(2);
    expect(byPath.vendorOptions?.labels).toBeUndefined();
    expect(JSON.stringify(shape)).not.toMatch(/Jane|John|Acme/);
  });

  it("keeps option labels only for system-enum field names", async () => {
    const { isSystemEnumField } = await import("../src/crawl/shape.js");
    for (const ok of ["Status", "Type", "Bill type", "PO Status", "Columns", "Cost type", "Priority", "Unit"]) {
      expect(isSystemEnumField(ok), ok).toBe(true);
    }
    expect(isSystemEnumField("data.discussions.comments.notificationUsers.options[].options")).toBe(false);
    expect(isSystemEnumField("data.lineItems.defaults.costTypes.options[].options")).toBe(true);
    expect(isSystemEnumField("data.statusOptions")).toBe(true);
    for (const bad of ["Pay to", "Purchase Order", "Job", "Assigned to", "Client", "select#6", "", "Vendor", "Required Approvers", "Contact type name"]) {
      expect(isSystemEnumField(bad), bad).toBe(false);
    }
  });

  it("rejects contact-shaped labels", () => {
    expect(isSafeEnumLabel("Draft")).toBe(true);
    expect(isSafeEnumLabel("a@b.com")).toBe(false);
    expect(isSafeEnumLabel("0412 345 678")).toBe(false);
    expect(isSafeEnumLabel("12 Example Street")).toBe(false);
  });

  it("reads request body keys from JSON and form bodies", () => {
    expect(bodyKeys('{"jobId":1,"lines":[{"qty":2}]}').keys).toEqual(["jobId", "lines", "lines[].qty"]);
    expect(bodyKeys("a=1&b=two").keys).toEqual(["a", "b"]);
    expect(bodyKeys(null).kind).toBe("empty");
  });
});

describe("crawl checkpoint", () => {
  it("round-trips records and resume point", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bt-crawl-"));
    const rec = new CrawlRecorder(dir);
    rec.recordEndpoint({
      method: "GET",
      template: "/api/Leads/Defaults",
      requestContentType: "",
      requestKeys: [],
      responseContentType: "application/json",
      responseKeys: ["data.title"],
      enums: [],
      decision: "read",
      status: 200,
      screen: "/app/Leads",
    });
    rec.recordWrite({
      method: "POST",
      template: "/api/Leads",
      requestContentType: "application/json",
      requestKeys: ["title"],
      reason: "write POST",
      screen: "/app/Leads/Lead/0",
      trigger: "new:New Lead",
    });
    rec.checkpoint.queue = ["https://buildertrend.net/app/Bills"];
    rec.checkpoint.stoppedReason = "needsToRelogin";
    rec.checkpoint.resumeFrom = "https://buildertrend.net/app/Bills";
    await rec.save();

    const again = await CrawlRecorder.load(dir);
    expect(again.checkpoint.stoppedReason).toBe("needsToRelogin");
    expect(again.checkpoint.queue).toEqual(["https://buildertrend.net/app/Bills"]);
    expect(again.endpoints.get("GET /api/Leads/Defaults")?.screens).toEqual(["/app/Leads"]);
    expect(again.writes.get("POST /api/Leads")?.triggers).toEqual(["new:New Lead"]);
    expect(await readFile(join(dir, "write-candidates.json"), "utf8")).not.toMatch(/cookie/i);
  });
});
