import type { VerbSpec } from "./catalog.js";
import { RESOURCES } from "./resources.js";

const snake = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

function spec(verb: string, httpMethod: "GET" | "POST", kind: VerbSpec["kind"], description: string): VerbSpec {
  return {
    verb,
    tool: `bt_${verb.split(".").map(snake).join("_")}`,
    httpPath: `/v1/${verb.split(".").map(kebab).join("/")}`,
    httpMethod,
    kind,
    captured: true,
    description,
  };
}

/** Read verbs for every registry resource, skipping names a hand-written verb already owns. */
export function resourceVerbSpecs(existing: Set<string>): VerbSpec[] {
  const out: VerbSpec[] = [];
  const add = (s: VerbSpec) => {
    if (!existing.has(s.verb)) out.push(s);
  };
  for (const def of RESOURCES) {
    const scope = def.list.jobScoped ? " Across all jobs unless jobId / jobIds is given." : "";
    add(spec(`${def.prefix}.list`, "POST", "read", `${def.label}: list rows (page, pageSize).${scope} Secret-shaped fields redacted.`));
    if (def.get) add(spec(`${def.prefix}.get`, "GET", "read", `${def.label}: one full record by id.`));
    if (def.defaults) {
      add(spec(`${def.prefix}.defaults`, "GET", "read", `${def.label}: new-form defaults and dropdown options (the shape a create needs).`));
    }
    if (def.setup) add(spec(`${def.prefix}.setup`, "GET", "read", `${def.label}: module settings and custom field definitions.`));
  }
  return out;
}

export const SYNC_VERB_SPECS: VerbSpec[] = [
  spec("resources.list", "GET", "read", "Every record type the gateway can read and sync, with its verbs and Buildertrend endpoints."),
  spec(
    "sync.run",
    "POST",
    "read",
    "Pull every resource list from Buildertrend into the mirror and record created / updated / removed changes. Read-only. Optional types, jobIds, hydrate.",
  ),
  spec("changes.list", "GET", "read", "Change events after a cursor (since=seq). Apps store the returned cursor and ask again."),
  spec("records.list", "GET", "read", "Mirrored records of one type from the last sync (no Buildertrend call). Filter by jobId."),
  spec("records.get", "GET", "read", "One mirrored record. fresh=true re-reads the full record from Buildertrend first."),
  spec("links.set", "POST", "session", "Link an app record id to a Buildertrend id (no Buildertrend call)."),
  spec("links.get", "GET", "read", "Find a link by app id (app, appType, appId) or by Buildertrend id (btType, btId)."),
  spec("links.list", "GET", "read", "List links, optionally for one app / appType."),
  spec("links.delete", "POST", "session", "Remove a link (no Buildertrend call)."),
  spec(
    "push",
    "POST",
    "session",
    "Send an app record to Buildertrend: creates it when unlinked, updates the linked record otherwise, then saves the link. Routes to the captured write verb; dry_run by default; not_captured when Buildertrend's save request has not been captured yet.",
  ),
  spec("webhooks.deliver", "POST", "read", "Send pending change events to BT_WEBHOOK_URL now (signed with BT_WEBHOOK_SECRET)."),
];
