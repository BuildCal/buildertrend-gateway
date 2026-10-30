import { describe, expect, it } from "vitest";
import {
  classifyRequest,
  isSafeNewFormLabel,
  isSafeTabLabel,
  looksLikeLoginUrl,
  pathLooksMutating,
  payloadNeedsRelogin,
  screenKey,
  templateUrl,
} from "../src/crawl/policy.js";
import { installWriteBlocker, SESSION_PROBE_JS } from "../src/crawl/runner.js";

const BT = "https://buildertrend.net";
const decide = (method: string, path: string, resourceType = "xhr") =>
  classifyRequest({ method, url: path.startsWith("http") ? path : `${BT}${path}`, resourceType }).action;

describe("crawl write-blocker policy", () => {
  it("allows GET reads, Defaults and new-form detail GETs", () => {
    for (const path of [
      "/api/Leads/Defaults",
      "/api/Contacts/0/Details",
      "/api/jobsites/DefaultInfo",
      "/api/v1/bills/defaultinfo?jobId=1&isBillRemainingAction=false",
      "/api/ChangeOrders/12/changeOrder?presentingScreen=0&isMobile=false",
      "/apix/v3/Invoices/get-invoice?invoiceId=1&job=2",
      "/api/v1/Bills/GetBillMapping?purchaseOrderId=1&jobId=2&billId=0",
      "/api/PurchaseOrders/9/EntityApprovals",
      "/api/Accounting/9/LinkedEntityInfo",
      "/apix/v2/EntityChangeTracking/entity-changes",
      "/apix/v2/EntityRecords/linked-entities/3f2504e0-4f89-11d3-9a0c-0305e82c3301/batch?targetEntityTypes=1",
      "/api/AccountInfo/GlobalInfo",
      "/api/files/emailSignatures?id=1&rowVersion=2",
      "/apix/v2/Bills/approval-users/5",
      "/app/OwnerInvoices/OwnerInvoice/0/5/false",
    ]) {
      expect(decide("GET", path), path).toBe("allow");
    }
  });

  it("allows only the known read-only POSTs", () => {
    for (const path of [
      "/api/Jobsites/Grid",
      "/api/ChangeOrders/Grid",
      "/api/v1/bills/grid",
      "/apix/v2/Bills/tab-counts",
      "/apix/v2/Landing",
      "/api/LeadProposal/GridTemplate",
      "/api/calendar/CalendarList",
      "/api/LeadActivities/Calendar",
      "/api/ActivityFeed",
      "/apix/v2/TimeClock/summary",
      "/apix/v2/Tasks/workday-exceptions/list",
      "/api/jobpicker/GetJobPickerData",
      "/api/jobpicker/SetJobPickerData",
      "/api/Search?limit=10",
      "/apix/v2/JobCostingBudget",
      "/apix/v2/JobCostingBudget/line-items",
    ]) {
      expect(decide("POST", path), path).toBe("allow");
    }
  });

  it("blocks every captured or likely write, whatever the method", () => {
    const writes: [string, string][] = [
      ["PUT", "/api/ChangeOrders/12/Update"],
      ["PUT", "/apix/v2/LineItems/update-change-order-line-item"],
      ["POST", "/apix/v2/LineItems/add-change-order-line-items"],
      ["DELETE", "/apix/v2/LineItems/delete-change-order-line-items"],
      ["PUT", "/api/PurchaseOrders/100001"],
      ["POST", "/api/PurchaseOrders"],
      ["POST", "/api/v1/bills?jobId=1"],
      ["PUT", "/api/v1/bills/5"],
      ["POST", "/api/documents/61/tempFile?jobId=1&uploadFullResPhoto=true"],
      ["POST", "/api/Documents/EntityDocs"],
      ["POST", "/apix/v2/ChangeOrders/1/create-draft"],
      ["POST", "/apix/v2/ChangeOrders/1/notify-owners"],
      ["POST", "/api/Leads"],
      ["PATCH", "/apix/v2/Something/1"],
      ["POST", "/api/jobsites/Add"],
      ["POST", "/api/Grid/Delete"],
      ["POST", "/api/Foo/GetAndDelete"],
      ["POST", "/api/Foo/ListUpdate"],
      ["POST", "/api/Foo/GetOrCreate"],
      ["POST", "/api/Grid/DeleteList"],
      ["POST", "/api/Calendar/SaveCalendar"],
      ["POST", "/api/Feed/Add"],
      ["POST", "/apix/v2/Tasks/delete-tasks/list"],
      ["PUT", "/api/Payroll/RefreshPayPeriods"],
      ["POST", "/api/Unknown/Thing"],
    ];
    for (const [method, path] of writes) {
      expect(decide(method, path), `${method} ${path}`).toBe("block");
    }
  });

  it("blocks GETs whose path names a mutation", () => {
    for (const path of [
      "/api/Messages/5/Delete",
      "/api/ChangeOrders/5/Approve",
      "/api/OwnerInvoices/5/send",
      "/apix/v2/Leads/convert-to-job?id=1",
      "/api/Bills/MarkReadyForPayment?id=1",
      "/api/Schedule/Release",
    ]) {
      expect(decide("GET", path), path).toBe("block");
    }
    expect(pathLooksMutating("/api/accounting/GetEntityAccountingStatus")).toBe(false);
    expect(pathLooksMutating("/api/Users/GetSendHistory")).toBe(true);
  });

  it("blocks third-party writes and drops telemetry / sockets / beacons", () => {
    expect(decide("POST", "https://api.example.com/collect")).toBe("block");
    expect(decide("GET", "https://cdn.example.com/app.js", "script")).toBe("allow");
    expect(decide("POST", "https://o1.ingest.sentry.io/api/1/envelope/")).toBe("drop");
    expect(decide("POST", "https://browser-intake-datadoghq.com/api/v2/rum")).toBe("drop");
    expect(decide("POST", `${BT}/signalr/negotiate`)).toBe("drop");
    expect(decide("POST", `${BT}/api/PushRegistration`)).toBe("drop");
    expect(decide("POST", `${BT}/analytics/mp-proxy/track?_=1`)).toBe("drop");
    expect(decide("POST", `${BT}/sawmill-client-ingestion`)).toBe("drop");
    expect(decide("POST", "https://x.buildertrend.net/a1B2c3D4e5F6g7H8i9J0k1L2m3")).toBe("drop");
    expect(decide("GET", "wss://buildertrend.net/hub", "websocket")).toBe("drop");
    expect(decide("POST", `${BT}/api/x`, "ping")).toBe("drop");
  });

  it("guards UI labels", () => {
    for (const ok of ["Lines", "Files", "Related Items", "Job Info", "Overview"]) expect(isSafeTabLabel(ok), ok).toBe(true);
    for (const bad of ["Save", "Save & Close", "Send", "Approve", "Delete", "Release", "Notify Owner", "Convert to Job", "Submit", "Pay Online", "Recall", "More › Recall", "Withdraw", "Revert", "Like", "Mark as read", "0", "12", "Rename", "More › Create QR code"]) {
      expect(isSafeTabLabel(bad), bad).toBe(false);
      expect(isSafeNewFormLabel(bad), bad).toBe(false);
    }
    expect(isSafeNewFormLabel("+ New Change Order")).toBe(true);
    expect(isSafeNewFormLabel("Add")).toBe(true);
    expect(isSafeNewFormLabel("New")).toBe(true);
    expect(isSafeNewFormLabel("Add & Send")).toBe(false);
    expect(isSafeNewFormLabel("Create and Release")).toBe(false);
    expect(isSafeNewFormLabel("Lines")).toBe(false);
  });
});

describe("crawl templating", () => {
  it("templates ids, guids and emails, keeps query keys only", () => {
    const t = templateUrl(`${BT}/api/v1/Bills/GetBillMapping?purchaseOrderId=100001&jobId=200001&billId=0`);
    expect(t.template).toBe("/api/v1/Bills/GetBillMapping?billId=&jobId=&purchaseOrderId=");
    expect(t.template).not.toMatch(/100001|200001/);
    expect(templateUrl(`${BT}/app/OwnerInvoices/OwnerInvoice/0/123/false`).path).toBe(
      "/app/OwnerInvoices/OwnerInvoice/0/{id}/false",
    );
    expect(templateUrl(`${BT}/api/x/3f2504e0-4f89-11d3-9a0c-0305e82c3301`).path).toBe("/api/x/{guid}");
    expect(templateUrl(`${BT}/api/x/someone%40example.com`).path).toBe("/api/x/{email}");
    expect(templateUrl(`${BT}/api/Search?search=Jane%20Citizen`).template).toBe("/api/Search?search=");
    expect(screenKey(`${BT}/app/ChangeOrders/ChangeOrder/77/88?x=1`)).toBe("/app/ChangeOrders/ChangeOrder/{id}/{id}");
  });

  it("detects a dead session", () => {
    expect(payloadNeedsRelogin({ needsToRelogin: true })).toBe(true);
    expect(payloadNeedsRelogin({ data: {} })).toBe(false);
    expect(looksLikeLoginUrl("https://buildertrend.net/app/Login")).toBe(true);
    expect(looksLikeLoginUrl("https://auth.buildertrend.net/u/login")).toBe(true);
    expect(looksLikeLoginUrl("https://buildertrend.net/app/Landing")).toBe(false);
  });
});

describe("installWriteBlocker (network layer)", () => {
  function fakeContext() {
    let handler: ((route: unknown) => Promise<void>) | undefined;
    const ctx = {
      route: async (_pattern: string, h: (route: unknown) => Promise<void>) => {
        handler = h;
      },
      routeWebSocket: async () => undefined,
    };
    const fire = async (method: string, url: string, resourceType = "xhr", postData: string | null = null) => {
      const outcome: string[] = [];
      const request = {
        method: () => method,
        url: () => url,
        resourceType: () => resourceType,
        postData: () => postData,
        headers: () => ({ "content-type": "application/json", cookie: "SECRET" }),
      };
      await handler!({
        request: () => request,
        continue: async () => void outcome.push("continue"),
        abort: async () => void outcome.push("abort"),
      });
      return outcome[0];
    };
    return { ctx, fire };
  }

  it("aborts writes before they leave the browser and reports them", async () => {
    const { ctx, fire } = fakeContext();
    const blocked: string[] = [];
    let dropped = 0;
    await installWriteBlocker(
      ctx as never,
      (req, reason) => blocked.push(`${req.method()} ${reason}`),
      () => (dropped += 1),
    );
    expect(await fire("PUT", `${BT}/api/ChangeOrders/1/Update`, "xhr", '{"title":"x"}')).toBe("abort");
    expect(await fire("POST", `${BT}/api/v1/bills?jobId=1`)).toBe("abort");
    expect(await fire("DELETE", `${BT}/apix/v2/LineItems/delete-change-order-line-items`)).toBe("abort");
    expect(await fire("GET", `${BT}/api/Leads/Defaults`)).toBe("continue");
    expect(await fire("POST", `${BT}/api/Jobsites/Grid`)).toBe("continue");
    expect(await fire("POST", "https://o1.ingest.sentry.io/api/1/envelope/")).toBe("abort");
    expect(blocked).toEqual(["PUT write PUT", "POST write POST", "DELETE write DELETE"]);
    expect(dropped).toBe(1);
  });
});

describe("in-page probe", () => {
  it("is plain JS with no bundler helpers (tsx __name breaks page.evaluate)", () => {
    expect(typeof SESSION_PROBE_JS).toBe("string");
    expect(SESSION_PROBE_JS).not.toMatch(/__name/);
    expect(SESSION_PROBE_JS).toContain("portaltype");
    expect(() => new Function(`return ${SESSION_PROBE_JS}`)).not.toThrow();
  });
});

describe("in-page DOM readers", () => {
  it("are plain JS strings that parse", async () => {
    const dom = await import("../src/crawl/dom.js");
    for (const js of [
      dom.fieldsJs(null),
      dom.fieldsJs(dom.OVERLAY_SELECTOR),
      dom.buttonLabelsJs(null),
      dom.selectLabelsJs(dom.OVERLAY_SELECTOR),
      dom.OPEN_SELECT_OPTIONS_JS,
      dom.OPEN_MENU_ITEMS_JS,
      dom.OVERLAY_COUNT_JS,
    ]) {
      expect(js).not.toMatch(/__name/);
      expect(() => new Function(`return ${js}`)).not.toThrow();
    }
    // Field reader never touches .value.
    expect(dom.fieldsJs(null)).not.toMatch(/\.value\b/);
  });
});

describe("action label templating", () => {
  it("drops people and numbers from control labels", async () => {
    const { templateActionLabel } = await import("../src/crawl/policy.js");
    expect(templateActionLabel("Email Jane Citizen")).toBe("Email {person}");
    expect(templateActionLabel("Purchase Order: PO-305")).toBe("Purchase Order: {value}");
    expect(templateActionLabel("Inbox 20")).toBe("Inbox {n}");
    expect(templateActionLabel("Open Filter Settings")).toBe("Open Filter Settings");
    expect(templateActionLabel("EN Eli Nash")).toBe("{avatar}");
    expect(templateActionLabel("AT AAA Test Sub Vendor (expired cert)")).toBe("{avatar}");
    expect(templateActionLabel("M Misc")).toBe("{avatar}");
    expect(templateActionLabel("PO Status")).toBe("PO Status");
    expect(templateActionLabel("Add New Saved View")).toBe("Add New Saved View");
    expect(templateActionLabel("Freeze Bill # column")).toBe("Freeze Bill # column");
  });
});

describe("crawl print guard", () => {
  it("stubs window.print so print views cannot block the tab", async () => {
    const { NO_PRINT_JS } = await import("../src/crawl/runner.js");
    const win: { print: () => unknown } = { print: () => "dialog" };
    new Function("window", NO_PRINT_JS)(win);
    expect(win.print()).toBeUndefined();
  });
});

describe("crawl field labels", () => {
  it("templates people named inside form labels", async () => {
    const { templateFieldLabel } = await import("../src/crawl/policy.js");
    expect(templateFieldLabel("Grant Jane automatic access to new jobs and templates")).toBe(
      "Grant {person} automatic access to new jobs and templates",
    );
    expect(templateFieldLabel("Column with Header Selection")).toBe("Column with Header Selection");
    expect(templateFieldLabel("First Name")).toBe("First Name");
    const { templateActionLabel } = await import("../src/crawl/policy.js");
    expect(templateActionLabel("3. Sales Add Jan 5, 2026, 4:12 PM Jan 6, 2026, 1:00 PM")).toBe("{row}");
    expect(templateFieldLabel("GL Account")).toBe("GL Account");
    expect(templateFieldLabel("Require location and track when Jane clocks in or out")).toBe(
      "Require location and track when {person} clocks in or out",
    );
    expect(templateFieldLabel("Show in Buildertrend app")).toBe("Show in Buildertrend app");
    expect(templateFieldLabel("Mark as a Variance PO")).toBe("Mark as a Variance PO");
  });
});

describe("crawl portal routes", () => {
  it("never opens client/sub portal or account-linking routes as the builder", async () => {
    const { isOtherPortalRoute } = await import("../src/crawl/policy.js");
    for (const bad of [
      "https://buildertrend.net/app/Owner/ChangeOrders/0/1/Request",
      "/app/Owner/AccountNotConnected/0",
      "/app/ownerPortalRedirect/1/false",
      "/app/Sub/Bids/1",
      "/app/MagicMobileLogin/0",
    ]) {
      expect(isOtherPortalRoute(bad), bad).toBe(true);
    }
    for (const ok of ["/app/Subs", "/app/OwnerInvoices", "/app/ChangeOrders/1/2/Details", "/app/DepositExternal/0"]) {
      expect(isOtherPortalRoute(ok), ok).toBe(false);
    }
  });
});

describe("crawl session refresh", () => {
  it("lets the app refresh its own sign-in but still blocks login logging", async () => {
    const { classifyRequest } = await import("../src/crawl/policy.js");
    expect(classifyRequest({ method: "POST", url: "https://buildertrend.net/api/login/Auth0Callback" }).action).toBe("allow");
    expect(classifyRequest({ method: "POST", url: "https://buildertrend.net/api/Login/LogAuth" }).action).toBe("block");
  });
});
