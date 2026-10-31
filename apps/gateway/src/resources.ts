// Resource registry: every Buildertrend record type the gateway can read and
// sync, built from the read-only coverage map (docs/buildertrend-coverage-map.md)
// and checked live. Generic on purpose: no app-specific mapping lives here.
//
// Grid lists share one body shape (see grids.ts). What differs per grid is the
// `emptyStateEntity` number the web app sends and whether it is job-scoped.

import { asRecord, numberish } from "./grids.js";

export type ListSpec =
  | {
      kind: "grid";
      path: string;
      /** gridRequest.emptyStateEntity the web app sends for this grid (0 = none). */
      entity: number;
      query?: Record<string, string | number>;
      /** Sends every job id; without it Buildertrend lists only the picker's job. */
      jobScoped: boolean;
    }
  | {
      kind: "post";
      path: string;
      /** Request body for the given job ids. */
      body: (jobIds: number[]) => unknown;
      /** Key of the row array inside `data`. */
      rowsAt: string;
      jobScoped: boolean;
    }
  | {
      kind: "get";
      path: string;
      query?: Record<string, string | number>;
      rowsAt: string;
      jobScoped: false;
    };

export interface GetSpec {
  /** Path with `{id}`. */
  path: string;
  /** Extra query; `jobId` in the value list is filled from the record's job. */
  query?: Record<string, string | number | "{jobId}" | "{id}">;
}

export interface ResourceDef {
  /** Sync type name, singular: `scheduleItem`. */
  type: string;
  /** Verb prefix: `schedule` → `schedule.list`, `schedule.get`. */
  prefix: string;
  label: string;
  /** Section of the coverage map this comes from. */
  module: string;
  list: ListSpec;
  get?: GetSpec;
  /** "New" form: field defaults and dropdown options, the shape a create will need. */
  defaults?: GetSpec;
  /** Module settings and custom field definitions. */
  setup?: string;
  /** Row → stable Buildertrend id. */
  id: (row: Record<string, unknown>) => string | undefined;
  /** Row → job id, when the record belongs to a job. */
  jobId?: (row: Record<string, unknown>) => number | undefined;
  /** Include in `sync.run` by default. Large or per-user lists opt out. */
  syncDefault: boolean;
}

const byKey =
  (...keys: string[]) =>
  (row: Record<string, unknown>): string | undefined => {
    for (const key of keys) {
      const value = scalar(row[key]);
      if (value != null && value !== "" && value !== 0) return String(value);
    }
    return undefined;
  };

const jobFrom =
  (...keys: string[]) =>
  (row: Record<string, unknown>): number | undefined => {
    for (const key of keys) {
      const value = numberish(scalar(row[key]));
      if (value) return value;
    }
    return undefined;
  };

const defaultJob = jobFrom("jobId", "jobsiteId", "jobID");

/** Grid cells are often `{ title, value, … }` objects; reduce to the plain value. */
export function scalar(value: unknown): unknown {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return value;
  const obj = asRecord(value);
  for (const key of ["value", "title", "name", "date", "text", "id"]) {
    if (obj[key] != null && typeof obj[key] !== "object") return obj[key];
  }
  return undefined;
}

const grid = (path: string, entity: number, jobScoped = true, query?: Record<string, string | number>): ListSpec => ({
  kind: "grid",
  path,
  entity,
  jobScoped,
  query,
});

export const RESOURCES: ResourceDef[] = [
  {
    type: "job",
    prefix: "jobs",
    label: "Jobs",
    module: "Jobs",
    list: grid("/api/Jobsites/Grid", 0, false),
    get: { path: "/api/jobsites/{id}" },
    defaults: { path: "/api/jobsites/DefaultInfo" },
    setup: "/api/Jobsites/Setup",
    id: byKey("jobId", "id"),
    jobId: jobFrom("jobId", "id"),
    syncDefault: true,
  },
  {
    type: "jobTemplate",
    prefix: "jobTemplates",
    label: "Job templates",
    module: "Jobs",
    list: grid("/api/Templates/Grid", 0, false),
    defaults: { path: "/api/Templates/DefaultInfo" },
    id: byKey("id"),
    syncDefault: false,
  },
  {
    type: "lead",
    prefix: "leads",
    label: "Lead opportunities",
    module: "Leads (sales)",
    list: grid("/api/Leads/Grid", 0, false),
    get: { path: "/api/Leads/{id}" },
    defaults: { path: "/api/Leads/Defaults" },
    setup: "/api/Leads/Setup",
    id: byKey("id", "leadId"),
    syncDefault: true,
  },
  {
    type: "leadActivity",
    prefix: "leadActivities",
    label: "Lead activities",
    module: "Leads (sales)",
    list: grid("/api/LeadActivities/Grid", 0, false),
    get: { path: "/api/LeadActivities/{id}" },
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "proposal",
    prefix: "proposals",
    label: "Estimates / proposals",
    module: "Estimates / proposals",
    list: grid("/api/LeadProposal/Grid", 0, false),
    get: { path: "/api/LeadProposal/{id}" },
    setup: "/api/Estimates/Setup",
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "contact",
    prefix: "contacts",
    label: "Client contacts",
    module: "Client contacts",
    list: grid("/api/Contacts/Grid", 2, false),
    get: { path: "/api/Contacts/{id}/Details" },
    defaults: { path: "/api/Contacts/0/Details" },
    setup: "/api/Contacts/Setup",
    id: byKey("id", "contactId"),
    syncDefault: true,
  },
  {
    type: "sub",
    prefix: "subs",
    label: "Subs / vendors",
    module: "Subs / vendors",
    list: grid("/api/Subs/Grid", 0, false),
    get: { path: "/api/Subs/{id}" },
    defaults: { path: "/api/Subs/DefaultInfo" },
    setup: "/api/Subs/Setup",
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "internalUser",
    prefix: "users",
    label: "Internal users",
    module: "Internal users and roles",
    list: grid("/api/InternalUsers/Grid", 0, false),
    get: { path: "/api/InternalUsers/{id}" },
    defaults: { path: "/api/InternalUsers/Defaults" },
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "variation",
    prefix: "variations",
    label: "Change orders (variations)",
    module: "Change orders (variations)",
    list: grid("/api/ChangeOrders/Grid", 4),
    get: { path: "/api/ChangeOrders/{id}/changeOrder", query: { presentingScreen: 0, isMobile: "false" } },
    setup: "/api/ChangeOrders/Setup",
    id: byKey("id", "changeOrderId"),
    syncDefault: true,
  },
  {
    type: "invoice",
    prefix: "invoices",
    label: "Owner invoices (progress claims)",
    module: "Owner invoices (progress claims)",
    list: grid("/api/OwnerInvoices/Grid", 22),
    get: { path: "/apix/v3/Invoices/get-invoice", query: { invoiceId: "{id}", job: "{jobId}" } },
    defaults: { path: "/apix/v3/Invoices/get-new-invoice", query: { job: "{jobId}" } },
    setup: "/api/OwnerPayments/Setup",
    id: byKey("id", "invoiceId"),
    syncDefault: true,
  },
  {
    type: "invoicePayment",
    prefix: "invoicePayments",
    label: "Owner invoice payments",
    module: "Owner invoices (progress claims)",
    list: grid("/api/InvoicePayments/Grid", 22),
    get: { path: "/api/InvoicePayments/{id}" },
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "creditMemo",
    prefix: "creditMemos",
    label: "Credit memos",
    module: "Owner invoices (progress claims)",
    list: grid("/api/CreditMemos/Grid", 22),
    get: { path: "/api/CreditMemos/{id}" },
    defaults: { path: "/api/CreditMemos/DefaultInfo" },
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "bill",
    prefix: "bills",
    label: "Bills (AP)",
    module: "Bills (AP)",
    list: grid("/api/v1/bills/grid", 58),
    get: { path: "/api/v1/bills/{id}" },
    defaults: { path: "/api/v1/bills/defaultinfo", query: { jobId: "{jobId}" } },
    id: byKey("id", "billId"),
    syncDefault: true,
  },
  {
    type: "purchaseOrder",
    prefix: "pos",
    label: "Purchase orders",
    module: "Purchase orders",
    list: grid("/api/PurchaseOrders/Grid", 13),
    get: { path: "/api/PurchaseOrders/{id}", query: { isViewingFromAmendment: "false" } },
    defaults: { path: "/api/PurchaseOrders/DefaultInfo", query: { jobId: "{jobId}" } },
    id: byKey("id", "purchaseOrderId"),
    syncDefault: true,
  },
  {
    type: "bidPackage",
    prefix: "bids",
    label: "Bid packages",
    module: "Bids",
    list: grid("/api/BidPackages/Grid", 16),
    get: { path: "/api/BidPackages/{id}", query: { jobId: "{jobId}" } },
    defaults: { path: "/api/BidPackages/DefaultInfo", query: { jobId: "{jobId}" } },
    setup: "/api/Bids/Setup",
    id: byKey("bidPackageId", "id"),
    syncDefault: true,
  },
  {
    type: "scheduleItem",
    prefix: "schedule",
    label: "Schedule items",
    module: "Schedule",
    list: grid("/apix/v2/Schedules/grid", 9),
    get: { path: "/api/calendar/{id}" },
    defaults: { path: "/api/calendar/DefaultInfo", query: { jobId: "{jobId}" } },
    setup: "/api/Calendar/Setup",
    id: (row) => byKey("scheduleItemId", "id")({ ...row, scheduleItemId: asRecord(row.title).scheduleItemId ?? row.scheduleItemId }),
    jobId: (row) => numberish(asRecord(row.title).jobId) ?? defaultJob(row),
    syncDefault: true,
  },
  {
    type: "dailyLog",
    prefix: "dailyLogs",
    label: "Daily logs",
    module: "Daily logs",
    list: grid("/apix/v2/DailyLogs/grid", 18),
    get: { path: "/apix/v2/DailyLogs/{id}", query: { jobId: "{jobId}" } },
    defaults: { path: "/api/Logs/DefaultInfo", query: { jobId: "{jobId}" } },
    setup: "/api/Logs/Setup",
    id: byKey("dailyLogId", "id"),
    syncDefault: true,
  },
  {
    type: "rfi",
    prefix: "rfis",
    label: "RFIs",
    module: "RFIs",
    list: grid("/api/RfI/Grid", 27),
    get: { path: "/api/Rfi/{id}", query: { jobsiteId: "{jobId}" } },
    setup: "/api/RFI/Setup",
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "warrantyClaim",
    prefix: "warranty",
    label: "Warranty claims",
    module: "Warranty",
    list: grid("/api/Warranty/Grid", 10),
    get: { path: "/api/Warranty/{id}" },
    defaults: { path: "/api/Warranty/DefaultInfo", query: { jobId: "{jobId}" } },
    setup: "/api/Warranty/Setup",
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "selection",
    prefix: "selections",
    label: "Selections",
    module: "Selections",
    list: grid("/api/Selections/Grid", 11, true, { selectedTab: 4 }),
    get: { path: "/api/Selections/{id}" },
    defaults: { path: "/api/Selections/DefaultInfo", query: { jobId: "{jobId}" } },
    setup: "/api/Selections/Setup",
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "task",
    prefix: "tasks",
    label: "Tasks / to-dos",
    module: "Tasks / to-dos",
    list: {
      kind: "post",
      path: "/apix/v2/Tasks/list",
      body: (jobIds) => ({ jobIds, filters: { filterTree: { groups: [] } }, includeDeleted: false }),
      rowsAt: "tasks",
      jobScoped: true,
    },
    id: byKey("taskId", "id"),
    syncDefault: true,
  },
  {
    type: "submittal",
    prefix: "submittals",
    label: "Submittals",
    module: "Submittals",
    list: {
      kind: "post",
      path: "/apix/v2/Submittals/list",
      body: (jobIds) => ({
        jobIds,
        pagingData: { pageNumber: 1, pageSize: 1000, firstRow: 1, lastRow: 1000, currentPage: 1 },
        gridRequest: { sortColumn: "SubmittalId", sortDirection: "asc" },
      }),
      rowsAt: "submittals",
      jobScoped: true,
    },
    defaults: { path: "/apix/v2/Submittals/defaults", query: { job: "{jobId}" } },
    id: byKey("submittalId", "id"),
    syncDefault: true,
  },
  {
    type: "comment",
    prefix: "comments",
    label: "Comments",
    module: "Messaging, comments, notifications",
    list: grid("/api/Comments/Grid", 36),
    id: byKey("commentId", "id"),
    syncDefault: true,
  },
  {
    type: "costItem",
    prefix: "costItems",
    label: "Cost catalog items",
    module: "Budget / job costing",
    list: grid("/api/CostCodeItems/Grid", 0, false),
    get: { path: "/api/CostCodeItems/{id}" },
    defaults: { path: "/api/CostCodeItems/DefaultInfo" },
    id: byKey("id"),
    syncDefault: true,
  },
  {
    type: "costCode",
    prefix: "costCodes",
    label: "Cost codes",
    module: "Budget / job costing",
    list: { kind: "get", path: "/apix/v2/CostCodes/list", query: { Status: 1, Type: 0 }, rowsAt: "codes", jobScoped: false },
    id: byKey("id", "costCodeId"),
    syncDefault: true,
  },
];

export const RESOURCE_BY_TYPE = new Map(RESOURCES.map((r) => [r.type, r]));
export const RESOURCE_BY_PREFIX = new Map(RESOURCES.map((r) => [r.prefix, r]));

export function resourceJobId(def: ResourceDef, row: Record<string, unknown>): number | undefined {
  return (def.jobId ?? defaultJob)(row);
}

/** Fill `{id}` in the path and `{id}` / `{jobId}` in the query. Unknown job → key dropped. */
export function resolveGet(
  spec: GetSpec,
  id: string | number | undefined,
  jobId: number | undefined,
): { path: string; query: Record<string, string | number> } {
  const query: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(spec.query ?? {})) {
    if (value === "{jobId}") {
      if (jobId != null) query[key] = jobId;
    } else if (value === "{id}") {
      if (id != null) query[key] = id;
    } else {
      query[key] = value;
    }
  }
  return { path: spec.path.replace("{id}", encodeURIComponent(String(id ?? ""))), query };
}
