# Integrating an app with Buildertrend through the gateway

The model: **your app is where people work; Buildertrend is the record.** The
gateway is the only process that talks to `buildertrend.net`. It keeps a mirror
of every Buildertrend record type it can read, tells your app what changed, and
pushes your app's records back as **drafts**.

```
 Your app (VIABUILD, or anything else)
   │  HTTP /v1 (token)  or  MCP tools (bt_*)
   ▼
 Buildertrend Gateway
   ├─ reads: 25 record types (jobs … submittals)    ── live from Buildertrend
   ├─ sync:  mirror + change log + webhooks          ── SQLite file, no server
   ├─ links: your id ⇄ Buildertrend id
   └─ push:  create / update as Draft, dry_run first ── captured writes only
   ▼
 buildertrend.net (one signed-in session, dedicated profile)
```

Unofficial. Your own Buildertrend account only. Send, notify, pay and approve
stay locked (`BT_GATEWAY_ENABLE_SEND=false`).

## 1. Run it

Same machine, simplest setup (the `profile` transport uses the dedicated
gateway Chrome profile; no sidecar, no Postgres):

```bash
cp apps/gateway/.env.example apps/gateway/.env
# set: BT_TRANSPORT=profile
#      BT_GATEWAY_PROFILE=<path containing bt-gateway>
#      BT_GATEWAY_TOKEN=$(openssl rand -base64 32)
pnpm --filter gateway login     # a window opens: sign in to buildertrend.net once
pnpm --filter gateway serve     # HTTP :8787
```

The Buildertrend sign-in cookie is session-only, but the Auth0 single sign-on
behind it lasts much longer, and the gateway lets the app renew itself through
it. If that ever fails the gateway answers `auth_required` and stops polling;
run `login` again. It never types or stores a password.

Chrome lets only one process use a profile at a time, so with the `profile`
transport run **one** gateway process (`serve`, or a single `mcp`) and point
every app at it. For several processes at once, use the `sidecar` transport.

Set `BT_SYNC_INTERVAL_SEC=300` to poll every five minutes, and
`BT_WEBHOOK_URL` + `BT_WEBHOOK_SECRET` to have changes pushed to your app.
For an app that should only ever read, set `BT_GATEWAY_READ_ONLY=true`: every
request that could change Buildertrend is refused before it leaves the gateway.

Every HTTP call needs `x-bt-gateway-token: $BT_GATEWAY_TOKEN` (or
`Authorization: Bearer …`). `GET /v1/catalog` lists every verb.

## 2. First load: read everything

```http
POST /v1/sync/run            {}                       # every default type
POST /v1/sync/run            {"types": "bill,purchaseOrder", "hydrate": true}
GET  /v1/records/list?type=purchaseOrder&jobId=123    # from the mirror, instant
GET  /v1/records/get?type=bill&id=456&fresh=true      # full record, live
```

`sync.run` pages through every list across **all jobs**, stores each row and
returns per-type counts. `hydrate` also fetches the full record for every new
or changed row (slower; capped by `maxHydrate`, default 200 per run).

Each mirrored record has the same summary fields whatever its type, plus the
row exactly as Buildertrend sent it:

```json
{ "type": "purchaseOrder", "id": "123", "jobId": 45, "title": "Framing",
  "number": "PO-0012", "status": "Approved", "amount": 18400,
  "updatedAt": "…", "data": { …row… }, "detail": { …full record, if hydrated… } }
```

## 3. Stay in sync: changes

```http
GET /v1/changes/list?since=0&limit=500
→ { "events": [ { "seq": 1, "type": "bill", "id": "456", "jobId": 45,
                  "action": "created" | "updated" | "removed",
                  "changedFields": ["status"], "record": { …summary… } } ],
    "cursor": 1, "hasMore": false }
```

Store `cursor`, ask again with `since=<cursor>`. Or receive the same events by
webhook: `POST BT_WEBHOOK_URL` with `{ source, events, cursor }` and header
`x-bt-gateway-signature: sha256=<HMAC-SHA256(BT_WEBHOOK_SECRET, raw body)>`.
Verify the signature, answer 2xx; the gateway re-sends from the last
acknowledged cursor otherwise.

- `updated` fires when any list field changes; fields that change merely by
  viewing a record are ignored.
- `removed` means the record is no longer in Buildertrend's lists: deleted,
  or its job was closed or archived. Only a full pass that the list itself
  confirms finished can report it, and a pass that would remove more than
  half of a type is treated as a bad read (the type's result carries a
  `removal guard` error instead).
- One sync runs at a time per sync file (a lease in the file), so several
  gateway processes sharing it cannot interleave runs or re-send webhooks.
- Buildertrend has no change feed or webhooks of its own, so this is polling.
  It is gentle: one request at a time, a pause between pages.

## 4. Write back: links and push

Your app keeps its own ids. A **link** pairs one of your records with a
Buildertrend record:

```http
POST /v1/links/set   {"app":"viabuild","appType":"claim","appId":"c_91","btType":"invoice","btId":"7781"}
GET  /v1/links/get?btType=invoice&btId=7781
```

`push` does create-or-update in one call: unlinked → the type's create verb,
linked → its update verb with the Buildertrend id filled in. A real create
saves the link, so the next push updates instead of duplicating.

```http
POST /v1/push
{"app":"viabuild","appType":"bill","appId":"inv_55","btType":"bill",
 "args":{"jobId":45,"vendorId":9, …bills.create args…}}
→ dry run: { "op":"create", "verb":"bills.create", "result":{"dry_run":true, …} }

POST /v1/push  {…same…, "dry_run": false}     # real Draft in Buildertrend
```

Writes are **dry runs unless you send `dry_run: false`**, land as Draft / Not
sent, refuse to overwrite a record that changed in Buildertrend since your last
read (`conflict`), and never send, notify, pay or approve.

Duplicates are guarded twice. Only one push per app record runs at a time.
And a real create that fails part-way (it may have reached Buildertrend)
leaves the record **pending**: the next push answers `conflict` until you
check Buildertrend and either `links.set` the record it made or
`links.delete` to clear. A push through a link to a different Buildertrend
type is refused.

## 5. What you can and cannot do today

Checked live against a real account (read-only): a full sync mirrored
48,000+ records across every type below in under two minutes, and an
immediate second pass reported zero changes. Every `.list`, `.get`,
`.defaults` and `.setup` verb answered.

| Buildertrend type | Read (list + record) | Create | Update |
| --- | --- | --- | --- |
| Bills | yes | **yes** (`bills.create`) | **yes** (`bills.update`, attach, link PO) |
| Purchase orders | yes | not captured | **yes** (`pos.update`) |
| Change orders (variations) | yes | not captured | **yes**: header, lines, GST (`variations.*`) on an existing draft |
| Jobs, client contacts, leads | yes | not captured | not captured |
| Owner invoices (progress claims) | yes, incl. payments and credit memos | not captured | not captured |
| Estimates / proposals, cost catalog, cost codes, budget | yes | not captured | not captured |
| Schedule, daily logs, RFIs, warranty, selections, bids, tasks / to-dos, submittals, comments, subs / vendors, users | yes | not captured | not captured |

"Not captured" means nobody has yet watched Buildertrend save that record, so
the gateway does not know the exact request and will not guess. Push returns
`not_captured` with the click needed. Each capture is one supervised draft
save on a sandbox job (`pnpm --filter gateway capture`), then the verb is
implemented and replayed `dry_run`. The prioritised list is in
[buildertrend-coverage-map.md](buildertrend-coverage-map.md#write-captures-still-needed-prioritised).

Every type also has `<type>.defaults` where the app exposes a "new" form: the
default values and dropdown options a create will need. `GET /v1/resources/list`
returns the full registry: types, verbs, Buildertrend endpoints, write routes.

## 6. Reads by type

`<prefix>.list` (POST, `page`, `pageSize`, optional `jobId` / `jobIds`),
`<prefix>.get` (`id`, optional `jobId`), `<prefix>.defaults`, `<prefix>.setup`.
Field names per type are in [buildertrend-coverage-map.md](buildertrend-coverage-map.md).

| Type (`btType`) | Verb prefix | Notes |
| --- | --- | --- |
| `job` | `jobs` | |
| `jobTemplate` | `jobTemplates` | not synced by default |
| `lead`, `leadActivity` | `leads`, `leadActivities` | |
| `proposal` | `proposals` | estimates / proposals |
| `contact` | `contacts` | client contacts |
| `sub` | `subs` | subs / vendors |
| `internalUser` | `users` | |
| `variation` | `variations` | change orders |
| `invoice`, `invoicePayment`, `creditMemo` | `invoices`, `invoicePayments`, `creditMemos` | owner invoices |
| `bill` | `bills` | |
| `purchaseOrder` | `pos` | |
| `bidPackage` | `bids` | |
| `scheduleItem` | `schedule` | |
| `dailyLog` | `dailyLogs` | |
| `rfi` | `rfis` | |
| `warrantyClaim` | `warranty` | |
| `selection` | `selections` | |
| `task` | `tasks` | tasks, to-dos, punch list |
| `submittal` | `submittals` | |
| `comment` | `comments` | |
| `costItem`, `costCode` | `costItems`, `costCodes` | cost catalog |

The hand-written verbs from earlier slices (`jobs.picker.*`, `costing.*`,
`docs.*`, `estimates.worksheet`, `invoices.changes`, …) are unchanged.

## MCP

`pnpm --filter gateway mcp` exposes the same verbs as tools (`bt_sync_run`,
`bt_changes_list`, `bt_subs_list`, `bt_push`, …) for agents. `bt_catalog`
lists them with capture status.

## Errors

`auth_required` · `not_captured` · `send_disabled` (send lock or read-only
mode) · `conflict` · `sandbox_required` · `validation` · `not_found` ·
`bt_error`. HTTP status follows the code; the body is
`{ ok: false, error, message, … }`.
