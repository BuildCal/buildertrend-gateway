// Build docs/buildertrend-coverage-map.md module sections from a crawl run
// (endpoints / write-candidates / screens / inventory JSON). Output carries
// templated paths, keys, field labels and enum labels only.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { VERBS } from "../catalog.js";
import { pathKey, type Inventory } from "./inventory.js";
import { scoreCoverage } from "./report.js";
import { classifyRequest, templateActionLabel, templateFieldLabel } from "./policy.js";
import { isSafeEnumLabel, isSystemEnumField, templateKey } from "./shape.js";
import type { EndpointRecord, ScreenRecord, WriteCandidate } from "./state.js";

export interface ModuleDef {
  name: string;
  /** Matched against templated screen paths. */
  screen: RegExp;
  /** Matched against API paths. */
  api: RegExp;
  /** Gateway verb prefixes (e.g. `variations.`). */
  verbs: string[];
  /** Likely VIABUILD (construction-OS) tables. */
  viabuild: string;
}

// Order matters: first match wins.
export const MODULES: ModuleDef[] = [
  { name: "Change orders (variations)", screen: /ChangeOrder/i, api: /ChangeOrder|change-order/i, verbs: ["variations."], viabuild: "`variations`, `variation_line_items`, `variation_attachments`" },
  { name: "Owner invoices (progress claims)", screen: /OwnerInvoice|Invoic|payOnline|LineItemsToInvoice/i, api: /OwnerInvoice|\/Invoices?\b|invoice|Payments?\b|OnlinePayment|Deposit/i, verbs: ["invoices."], viabuild: "`progress_claims`, `claim_line_items`, `contracts` (retention, GST)" },
  { name: "Bills (AP)", screen: /\/Bills?\b|QuickAction\/Bill/i, api: /\/bills?\b|Bills?\//i, verbs: ["bills."], viabuild: "`invoices`, `invoice_line_items`, `invoice_po_matches`, `invoice_approval_log`" },
  { name: "Purchase orders", screen: /PurchaseOrder|POMapping/i, api: /PurchaseOrder|purchase-order/i, verbs: ["pos."], viabuild: "`purchase_orders`, `purchase_order_line_items`, `po_responses`, `purchase_order_documents`" },
  { name: "Bids", screen: /Bid/i, api: /Bid/i, verbs: [], viabuild: "`quote_packages`, `quote_requests`, `quote_responses`, `quote_response_items`" },
  { name: "Estimates / proposals", screen: /Estimate|Proposal/i, api: /Estimate|Proposal|Worksheet|estimate-line/i, verbs: ["estimates."], viabuild: "`estimates`, `estimate_sections`, `estimate_line_items`, `estimate_templates`" },
  { name: "Budget / job costing", screen: /JobCosting|Budget|JobFinancials/i, api: /JobCosting|Budget|CostCode|CostItem|CostType|Search$/i, verbs: ["costing."], viabuild: "`job_budgets`, `job_budget_lines`, `cost_codes`" },
  { name: "Schedule", screen: /Schedule/i, api: /Schedule|Phase|Gantt|Baseline|Workday/i, verbs: [], viabuild: "`schedule_phases`, `schedule_tasks`, `schedule_task_dependencies`, `schedule_templates`" },
  { name: "Daily logs", screen: /DailyLog/i, api: /DailyLog|Weather/i, verbs: [], viabuild: "`project_feed_entries` (+ `project_feed_media`, `project_feed_comments`) — closest; no dedicated site diary table" },
  { name: "Tasks / to-dos", screen: /\/tasks|ToDo/i, api: /Task|ToDo|Todo|Checklist/i, verbs: [], viabuild: "none (closest: `schedule_tasks`, `quick_actions`)" },
  { name: "Selections", screen: /Selection|Allowance/i, api: /Selection|Allowance/i, verbs: [], viabuild: "`selections`, `selection_options`" },
  { name: "Warranty", screen: /Warrant|Service/i, api: /Warrant|ServiceAppointment/i, verbs: [], viabuild: "`defects`" },
  { name: "RFIs", screen: /RFI/i, api: /RFI/i, verbs: [], viabuild: "none" },
  { name: "Submittals", screen: /Submittal/i, api: /Submittal/i, verbs: [], viabuild: "none (closest: `document_reviews`)" },
  { name: "Time clock", screen: /TimeClock|Shift|TimeCard/i, api: /TimeClock|Shift|TimeCard|TimeSheet/i, verbs: [], viabuild: "none (`labor_rates` only)" },
  { name: "Plans and specs", screen: /Plans|Specification/i, api: /Plan|Specification|Takeoff/i, verbs: [], viabuild: "`plans`, `plan_pages`, `plan_analysis`, `takeoffs`" },
  { name: "Client updates / owner portal", screen: /ClientUpdate|Owner\b|\/owner\//i, api: /ClientUpdate|Owner(?!Invoice)/i, verbs: [], viabuild: "`client_portal_access`, `client_portal_responses`, `project_feed_entries`" },
  { name: "Files (documents, photos, videos)", screen: /Documents|Photos|Videos|Media|Attachment|share/i, api: /Media|Document|\/files\b|Folder|Photo|Video|Annotation|Attachment/i, verbs: ["docs."], viabuild: "`documents`, `document_folders`, `document_versions`, `document_share_links`" },
  { name: "Messaging, comments, notifications", screen: /Message|Comment|Chat|Notification|Survey|Conversation/i, api: /Message|Comment|Chat|Notification|Survey|Conversation|Email/i, verbs: [], viabuild: "`email_sends`, `project_feed_comments`, `schedule_task_messages`, `notifications`" },
  { name: "Leads (sales)", screen: /lead/i, api: /Lead/i, verbs: ["leads."], viabuild: "none in construction-OS (HubSpot deals via `jobs.hubspot_deal_id`)" },
  { name: "Client contacts", screen: /\/Contacts|QuickAction\/Contact/i, api: /Contact|Customer/i, verbs: ["contacts."], viabuild: "`entities` (`is_client`), `entity_persons`, `job_entities`" },
  { name: "Subs / vendors", screen: /\/Sub\b|SubVendor|Subs\//i, api: /\/Subs?\b|Vendor|SubVendor|Certificate|Insurance/i, verbs: [], viabuild: "`entities` (`is_supplier`, `is_subcontractor`), `entity_compliance`, `supplier_contacts`" },
  { name: "Internal users and roles", screen: /InternalUser|MyUserDetails|Users/i, api: /InternalUser|\/Users?\b|Role|Permission/i, verbs: [], viabuild: "`profiles`, `custom_roles`, `job_role_assignments`" },
  { name: "Jobs", screen: /\/Jobs|JobPage|Jobsite|JobPicker|JobFromTemplate/i, api: /Jobsite|jobpicker|\/Jobs?\b|Accounting|LinkedEntity|Template/i, verbs: ["jobs.", "sync."], viabuild: "`jobs`, `contracts`, `job_entities`, `xero_sync_log`" },
  { name: "Reports", screen: /Report/i, api: /Report/i, verbs: [], viabuild: "`saved_reports`, `report_run_history`" },
  { name: "Company settings and setup", screen: /Settings|ImportWizard|MassImport|MassLink|admin/i, api: /Setting|Setup|TaxGroup|CustomField|Import|Integration|Xero|QuickBooks|Subscription/i, verbs: [], viabuild: "`organizations`, `gst_codes`, `cost_codes`, `xero_integration_settings`" },
  { name: "Landing, search and session", screen: /Landing|Summary|^\(startup\)|link|data/i, api: /./, verbs: ["session."], viabuild: "n/a (navigation)" },
];

export function moduleForScreen(screen: string): ModuleDef {
  return MODULES.find((m) => m.screen.test(screen)) ?? MODULES[MODULES.length - 1]!;
}

export function moduleForApi(path: string): ModuleDef {
  return MODULES.find((m) => m.api.test(path.split("?")[0]!)) ?? MODULES[MODULES.length - 1]!;
}

const WRITE_LABEL =
  /\b(save|send|submit|approve|decline|reject|delete|remove|release|notify|convert|void|pay|payment|archive|restore|publish|import|sync|share|invite|accept|lock|unlock|assign|mark|complete|clone|copy|duplicate|upload|create|add|new|generate|post|record|apply|link|attach|recall|reset)\b/i;

interface RunData {
  endpoints: EndpointRecord[];
  writes: WriteCandidate[];
  screens: ScreenRecord[];
  inventory?: Inventory;
}

export async function loadRun(dir: string): Promise<RunData> {
  const read = async <T>(name: string): Promise<T | undefined> =>
    existsSync(join(dir, name)) ? (JSON.parse(await readFile(join(dir, name), "utf8")) as T) : undefined;
  return {
    endpoints: (await read<EndpointRecord[]>("endpoints.json")) ?? [],
    writes: (await read<WriteCandidate[]>("write-candidates.json")) ?? [],
    screens: (await read<ScreenRecord[]>("screens.json")) ?? [],
    inventory: await read<Inventory>("inventory.json"),
  };
}

const esc = (s: string) => s.replace(/\|/g, "\\|");

/** Re-template stored key paths (older runs kept filter ids inside keys). */
export function scrubKeys(keys: string[]): string[] {
  const seg = (s: string) => (s.endsWith("[]") ? `${templateKey(s.slice(0, -2))}[]` : templateKey(s));
  return [...new Set(keys.map((k) => k.split(".").map(seg).join(".")))];
}
const code = (s: string) => "`" + s.replace(/`/g, "'") + "`";

/** Top-level-ish response keys: up to depth 3, at most `n`. */
function headlineKeys(keys: string[], n = 40): string {
  const short = keys
    .map((k) => k.replace(/^data\./, ""))
    .filter((k) => k.split(".").length <= 3 && !/^(success|message|needsToRelogin|metadata|forcedUpgrade|sessionJobInfo)/.test(k));
  const shown = short.slice(0, n).join(", ");
  return short.length > n ? `${shown}, … (+${short.length - n})` : shown || "—";
}

export function renderModuleSections(run: RunData): string {
  const out: string[] = [];
  const invApis = run.inventory?.apis ?? [];
  const seenKeys = new Set([...run.endpoints, ...run.writes].map((e) => pathKey(e.template)));

  for (const mod of MODULES) {
    const screens = run.screens.filter((s) => s.screen !== "(startup)" && moduleForScreen(s.screen.split(" ⧉ ")[0]!) === mod);
    const reads = run.endpoints.filter((e) => moduleForApi(e.template) === mod);
    const writes = run.writes.filter((w) => moduleForApi(w.template) === mod);
    const inv = invApis.filter((a) => moduleForApi(a.path) === mod);
    const invMissed = inv.filter((a) => !seenKeys.has(pathKey(a.path)));
    // Bundle writes = non-GET methods the read policy would not allow.
    const invWrites = inv.filter(isBundleWrite);
    const verbs = VERBS.filter((v) => mod.verbs.some((p) => v.verb.startsWith(p)));
    if (!screens.length && !reads.length && !writes.length && !inv.length) continue;

    out.push(`## ${mod.name}`, "");
    out.push(`- **VIABUILD equivalent:** ${mod.viabuild}`);
    out.push(
      `- **Gateway verbs:** ${
        verbs.length ? verbs.map((v) => `${code(v.verb)}${v.kind === "send" ? " (send, locked)" : v.captured ? "" : " (not_captured)"}`).join(", ") : "none"
      }`,
    );
    out.push(
      `- **Coverage:** ${screens.length} screens/modals · ${reads.length} read endpoints · ${writes.length} blocked writes · bundle APIs reached ${inv.length - invMissed.length}/${inv.length}`,
      "",
    );

    if (screens.length) {
      out.push("### Screens", "", "| Screen | Tabs | Fields | Write actions seen (not clicked) |", "| --- | --- | --- | --- |");
      for (const s of screens) {
        const writeActions = [...new Set((s.actions ?? []).map(templateActionLabel))].filter((a) => WRITE_LABEL.test(a));
        out.push(
          `| ${code(s.screen)} | ${esc(s.tabs.join(", ") || "—")} | ${s.fields?.length ?? 0} | ${esc(writeActions.slice(0, 25).join(", ") || "—")} |`,
        );
      }
      out.push("");
      const fields = new Map<string, string>();
      for (const s of screens) {
        for (const f of s.fields ?? []) {
          const label = templateFieldLabel(f.label);
          fields.set(`${label}|${f.type}`, `${label} (${f.type})`);
        }
      }
      if (fields.size) out.push("### Fields (UI)", "", [...fields.values()].sort().map(esc).join(" · "), "");
      const enums = new Map<string, string>();
      for (const s of screens) {
        for (const x of s.selects ?? []) {
          if (x.options?.length) enums.set(x.label, `${x.label}: ${x.options.join(" / ")}`);
        }
      }
      // Re-apply the privacy filter at render time (older runs recorded more).
      for (const e of reads) {
        for (const x of e.enums) {
          if (x.labels?.length && isSystemEnumField(x.path) && x.labels.every(isSafeEnumLabel)) {
            enums.set(x.path, `${x.path}: ${x.labels.join(" / ")}`);
          }
        }
      }
      if (enums.size) out.push("### Enums and dropdown options", "", ...[...enums.values()].sort().map((e) => `- ${esc(e)}`), "");
    }

    if (reads.length) {
      out.push("### Read endpoints (observed)", "", "| Method | Path | Request keys | Response keys |", "| --- | --- | --- | --- |");
      for (const e of reads) {
        out.push(
          `| ${e.method} | ${code(e.template)} | ${esc(scrubKeys(e.requestKeys).slice(0, 15).join(", ") || "—")} | ${esc(headlineKeys(scrubKeys(e.responseKeys)))} |`,
        );
      }
      out.push("");
    }

    if (writes.length || invWrites.length) {
      out.push("### Write endpoints", "", "| Method | Path | Source | Body keys / trigger |", "| --- | --- | --- | --- |");
      for (const w of writes) {
        out.push(
          `| ${w.method} | ${code(w.template)} | blocked during crawl | ${esc(scrubKeys(w.requestKeys).slice(0, 30).join(", ") || "—")}${w.triggers.length ? ` (via ${esc(w.triggers.slice(0, 2).join(", "))})` : ""} |`,
        );
      }
      const blocked = new Set(writes.map((w) => pathKey(w.template)));
      for (const a of invWrites) {
        if (blocked.has(pathKey(a.path))) continue;
        out.push(`| ${a.methods.filter((m) => m !== "GET").join("/")} | ${code(a.path)} | app bundle (not fired) | — |`);
      }
      out.push("");
    }

    const missedReads = invMissed.filter((a) => !invWrites.includes(a));
    if (missedReads.length) {
      out.push(
        "### Bundle read APIs not reached",
        "",
        missedReads.map((a) => code(`${a.methods.join("/") || "?"} ${a.path}`)).join(" · "),
        "",
      );
    }
  }
  return out.join("\n");
}

/** A non-GET the read policy would not let through: a write, never fired. */
function isBundleWrite(a: { path: string; methods: string[] }): boolean {
  return a.methods.some(
    (m) => m !== "GET" && classifyRequest({ method: m, url: `https://buildertrend.net${a.path.replace(/\{p\}/g, "1")}` }).action !== "allow",
  );
}

/** Totals, bundle coverage and a per-module table: the "did we get it all" view. */
export function renderCoverageSummary(run: RunData): string {
  const screens = run.screens.filter((s) => s.screen !== "(startup)");
  const fields = new Set(screens.flatMap((s) => (s.fields ?? []).map((f) => `${f.label}|${f.type}`)));
  const selects = screens.reduce((n, s) => n + (s.selects?.length ?? 0), 0);
  const out = ["## Coverage summary", ""];
  out.push(
    `- **Screens, rows and modals explored:** ${screens.filter((s) => s.explored).length}` +
      ` (${screens.filter((s) => s.screen.includes(" ⧉ ")).length} of them modals, drawers or row details)`,
    `- **Forbidden for this login** (bounced to sign-in or 401): ${screens.filter((s) => s.forbidden).length}`,
    `- **Distinct UI fields and grid columns:** ${fields.size} · **dropdowns opened:** ${selects}`,
    `- **Read endpoints observed:** ${run.endpoints.length} · **writes blocked:** ${run.writes.length}`,
  );
  const inv = run.inventory;
  if (inv) {
    const c = scoreCoverage(inv, run.endpoints, run.writes, run.screens);
    const reads = inv.apis.filter((a) => !isBundleWrite(a));
    const missed = new Set(c.apisMissed.map((a) => a.path));
    out.push(
      `- **App bundle:** ${inv.apis.length} API paths (${reads.length} reads, ${inv.apis.length - reads.length} writes) and ${c.routesTotal} routes`,
      `- **Bundle reads reached:** ${reads.filter((a) => !missed.has(a.path)).length} / ${reads.length} · **routes reached:** ${c.routesReached} / ${c.routesTotal}`,
      `- **Observed but not in the bundle** (paths built at run time): ${c.observedNotInInventory.length}`,
      "",
      "| Module | Screens | Fields | Reads seen | Writes blocked | Bundle reads reached | Bundle writes (never fired) |",
      "| --- | --- | --- | --- | --- | --- | --- |",
    );
    for (const mod of MODULES) {
      const ms = screens.filter((s) => moduleForScreen(s.screen.split(" ⧉ ")[0]!) === mod);
      const mf = new Set(ms.flatMap((s) => (s.fields ?? []).map((f) => `${f.label}|${f.type}`)));
      const mi = inv.apis.filter((a) => moduleForApi(a.path) === mod);
      const mr = mi.filter((a) => !isBundleWrite(a));
      const row = [
        mod.name,
        ms.length,
        mf.size,
        run.endpoints.filter((e) => moduleForApi(e.template) === mod).length,
        run.writes.filter((w) => moduleForApi(w.template) === mod).length,
        `${mr.filter((a) => !missed.has(a.path)).length} / ${mr.length}`,
        mi.length - mr.length,
      ];
      if (row.slice(1, 5).some((n) => n) || mi.length) out.push(`| ${row.join(" | ")} |`);
    }
    if (c.routesMissed.length) {
      out.push(
        "",
        "<details><summary>Routes defined by the app but not reached</summary>",
        "",
        c.routesMissed.map(code).join(" · "),
        "",
        "</details>",
      );
    }
  }
  out.push("");
  return out.join("\n");
}
