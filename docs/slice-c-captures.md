# Slice C — remaining writes to capture

These verbs exist as MCP tools and HTTP routes. They return `not_captured` until a dedicated-profile capture lands. Do **not** invent the URL.

Use the gateway Chrome profile only. One draft save each. Leave **Not sent**.

| Verb | UI | Exact click | Expected path (hint only) |
| --- | --- | --- | --- |
| `invoices.saveDraft` | `/app/OwnerInvoices/OwnerInvoice/{invoiceId}/{jobId}/false` | Open a sandbox owner-invoice draft. Re-read the custom invoice # (the input is flaky). Click **Save**, not Send. | Prior notes mentioned “some invoice save PUT” — unstable. Capture it. |
| `invoices.addLines` | Same draft | Add one line or attachment, Save (not Send). | JS: `/api/LineItems/EntityAttachmentsToInvoice` |
| `leads.create` / `leads.update` | Lead Opportunities add form from `GET /api/Leads/Defaults` | Fill Defaults, save a clearly fake sandbox lead. **Do not** submit leftover `/Lead/0` tabs. | Likely `POST`/`PUT /api/Leads` or `PUT /api/Leads/{id}` |
| `contacts.create` / `contacts.update` | Contacts add form (`GET /api/Contacts/0/Details`) | Add one sandbox contact. | Unknown POST/PUT |
| `variations.createDraft` | Change Orders → add new on a sandbox job | Open new CO so Defaults + create-draft fire. Leave Draft. | `GET /api/ChangeOrders/Defaults`, `/apix/v2/ChangeOrders/{id}/create-draft` |
| `pos.create` | Purchase Orders on a sandbox job | Create a draft PO for a **project** expense, Save. Do not approve. Never workers comp / tax / payroll. | Hypothesis only: `POST /api/PurchaseOrders` or PUT with a new id. **not_captured** — do not invent |
| `pos.update` | Purchase order detail | **Captured** 7 Sep 2026: `PUT /api/PurchaseOrders/{id}` `application/json`. GET existing, merge safe draft fields, force Draft / `saveAndRelease` false. | `/api/PurchaseOrders/{id}` |
| `bills.linkPurchaseOrder` | Bill — Purchase Order dropdown | **Captured** 11 Sep 2026: `GET /api/v1/Bills/GetBillMapping?purchaseOrderId=&jobId=&billId=0`. Leave Draft. Do not mark ready for payment. | Mapping returns PO line items (`lineItems.value`). Apply via `bills.update`. Never `isCreateNewFromPO: true`. |
| `estimates.updateLine` / `estimates.addLines` | Worksheet on an **unlocked** job | Edit or add one line, Save. Do not send to budget (`isSentToBudget`). | JS: `/apix/v2/LineItems/update-estimate-line-item`, `add-estimate-line-items` |
| `docs.upload` | Job documents, sandbox folder | Upload a tiny test file. | `/api/files`, `/api/MediaFolders` |
| `jobs.create` / `jobs.update` | `/app/JobPage/0/1?openCondensed=true` | Fake sandbox job, or dummy-field save then revert. Never guess the PUT body. | JS backlog: `/api/jobsites/Add`, `/api/jobsites/DefaultInfo` |

## Send tools (exist, locked)

`invoices.send` · `variations.notifyOwners` · `leads.convertToJob` · `bills.markReadyForPayment` · `estimates.sendToBudget`

These return `send_disabled` unless `BT_GATEWAY_ENABLE_SEND=true` **and** that named tool is enabled. Default stays off.

## After each capture

1. Append lands on `buildertrend-api-map.md` (no cookies).
2. Implement the verb from the capture (replace the `not_captured` stub).
3. Replay once with `dry_run`, then one real draft.
4. GET to verify. Leave Not sent.
