# Buildertrend coverage map

Every Buildertrend screen, form, modal and data point the gateway could
reach, scored against the full list of what the Buildertrend web app
contains, plus the VIABUILD equivalent for each module.

**Unofficial.** Produced on the repo owner's own login, read-only.
Identifiers in this file (ids, names, emails, addresses) are placeholders.
No cookies, tokens or values were recorded.

## How this was produced

`pnpm --filter gateway crawl` drives the **dedicated** gateway Chrome profile
(`apps/gateway/src/crawl/`).

1. **Inventory (the denominator).** The crawl reads the JavaScript modules
   the web app ships to the signed-in browser and extracts identifiers only:
   every API path (with method where the call site shows it), every route,
   and every compiled enum. Nothing else from the bundle is stored.
2. **Discovery.** Start at `/app/Landing`, open every main-nav dropdown and
   the `+` quick-add menu, then queue every route from the inventory. `:jobId`
   params get the selected job; record ids get `0`, which opens the "new" form
   and fires its Defaults GET.
3. **Deep exploration** of each screen, its first list row (detail view), and
   every modal or drawer those open:
   - every form field, by label and type (never its value);
   - every grid and line-item column header;
   - every dropdown opened (never picked), with options recorded **only** for
     system-enum fields (status, type, unit, …), never people, vendors or jobs;
   - every button and action menu: write actions (Save, Send, Approve,
     Delete…) are **listed, never clicked**; the rest are clicked.
4. **Network write-blocker.** Every request passes `classifyRequest()`.
   GET reads and a short allowlist of read-only POSTs (grids, calendars,
   feeds, list/summary/search, job picker, costing reads) go through.
   Everything else is aborted inside the browser and logged as a
   **write candidate** (method, templated path, body keys). GETs whose
   path names a mutation (`…/Delete`, `notify-owners`) are blocked too.
   Telemetry, push and websockets are dropped.
5. Paced like a person (6–14 s per page, 1.5–3.5 s per click). Stops on
   `needsToRelogin` and checkpoints so a run can resume.

Re-run and regenerate the module sections:

```bash
pnpm --filter gateway crawl -- --out <run-dir>
pnpm --filter gateway crawl-doc -- --run <run-dir>
```

**Run:** 2026-10-30, 188 pages visited, crawl still in progress, 1321 queued URLs left (mostly repeats of templates already visited).

## Coverage summary

- **Screens, rows and modals explored:** 162 (82 of them modals, drawers or row details)
- **Forbidden for this login** (bounced to sign-in or 401): 15
- **Distinct UI fields and grid columns:** 417 · **dropdowns opened:** 581
- **Read endpoints observed:** 188 · **writes blocked:** 19
- **App bundle:** 1787 API paths (777 reads, 1010 writes) and 305 routes
- **Bundle reads reached:** 147 / 777 · **routes reached:** 104 / 305
- **Observed but not in the bundle** (paths built at run time): 7

| Module | Screens | Fields | Reads seen | Writes blocked | Bundle reads reached | Bundle writes (never fired) |
| --- | --- | --- | --- | --- | --- | --- |
| Change orders (variations) | 12 | 43 | 3 | 2 | 3 / 16 | 26 |
| Owner invoices (progress claims) | 8 | 36 | 6 | 0 | 5 / 86 | 130 |
| Bills (AP) | 8 | 33 | 6 | 1 | 5 / 13 | 33 |
| Purchase orders | 18 | 37 | 5 | 0 | 4 / 12 | 19 |
| Bids | 6 | 9 | 2 | 0 | 1 / 9 | 20 |
| Estimates / proposals | 14 | 60 | 7 | 0 | 6 / 29 | 51 |
| Budget / job costing | 7 | 17 | 9 | 0 | 9 / 31 | 37 |
| Schedule | 6 | 36 | 5 | 2 | 4 / 27 | 20 |
| Daily logs | 14 | 5 | 3 | 1 | 1 / 2 | 5 |
| Tasks / to-dos | 3 | 8 | 3 | 0 | 3 / 22 | 43 |
| Selections | 10 | 20 | 8 | 0 | 7 / 35 | 47 |
| Warranty | 6 | 9 | 3 | 0 | 3 / 7 | 11 |
| RFIs | 5 | 18 | 4 | 0 | 3 / 4 | 7 |
| Submittals | 1 | 11 | 1 | 0 | 1 / 11 | 26 |
| Time clock | 4 | 9 | 3 | 2 | 3 / 12 | 18 |
| Plans and specs | 3 | 5 | 6 | 0 | 5 / 31 | 35 |
| Client updates / owner portal | 4 | 3 | 3 | 1 | 2 / 9 | 18 |
| Files (documents, photos, videos) | 7 | 6 | 19 | 2 | 8 / 43 | 52 |
| Messaging, comments, notifications | 15 | 10 | 9 | 1 | 6 / 29 | 43 |
| Leads (sales) | 7 | 54 | 8 | 0 | 7 / 19 | 25 |
| Client contacts | 5 | 18 | 4 | 0 | 3 / 12 | 7 |
| Subs / vendors | 2 | 38 | 4 | 1 | 5 / 19 | 31 |
| Internal users and roles | 7 | 49 | 6 | 0 | 5 / 23 | 31 |
| Jobs | 14 | 76 | 13 | 0 | 10 / 64 | 52 |
| Reports | 1 | 3 | 0 | 0 | 0 / 7 | 0 |
| Company settings and setup | 21 | 2 | 4 | 0 | 4 / 35 | 42 |
| Landing, search and session | 56 | 57 | 44 | 6 | 34 / 170 | 181 |

<details><summary>Routes defined by the app but not reached</summary>

`/app/Lead/0` · `/app/LeadActivity/0/0/0` · `/app/LeadActivityColorChange/0` · `/app/LeadActivityDelete/0` · `/app/LeadActivityReassign/0` · `/app/LeadActivityReassign/0/0` · `/app/LeadActivityTemplate/0` · `/app/LeadPage/0` · `/app/LeadProposal/0/0/0` · `/app/LeadProposal/0/checkout` · `/app/LeadProposal/0/payOnlineMobile` · `/app/LeadProposal/Print/0` · `/app/LeadProposalMobilePreview/0` · `/app/LeadProposalMobilePreview/0/0` · `/app/LeadProposalTemplate/0` · `/app/LeadSource/0` · `/app/LeadToJob/0` · `/app/Leads/0` · `/app/Leads/EmailWizard/0` · `/app/LienWaiver/0/-1` · `/app/LienWaiverExternal/0/0` · `/app/LienWaiverForm/0` · `/app/LineItemsToInvoice` · `/app/LinkEntityToAccounting/0/0` · `/app/MagicMobileLogin/0` · `/app/ManageAccounting/0/0/0` · `/app/MassImportFromAccounting/0` · `/app/MassLinkToAccounting/0` · `/app/Media/Copy/-1` · `/app/Media/Details/0/-1/0/0/0` · `/app/Media/FolderDetails/0/-1` · `/app/Media/FolderEmailInfo/0/-1/0` · `/app/Media/FolderProperties/0/-1` · `/app/Media/FolderViewingPermissions/-1/0` · `/app/Media/Move/0/-1/0` · `/app/Media/Properties/0/-1/0/0/0/0/0` · `/app/Media/Replace/0/0/0/0/0` · `/app/Media/Shared/` · `/app/Media/Upload/0` · `/app/Media/ViewingPermissions/0/-1/0/0` · `/app/Message/0/0` · `/app/Message/Print/0/0` · `/app/Messages/0` · `/app/NotificationDetails/0/-1/0/0` · `/app/NotificationPanel` · `/app/OAuth/AuthRedirect/0/0` · `/app/OnlinePayment/0` · `/app/OnlinePaymentAccount/0/0` · `/app/Option/0` · `/app/OtherAccountingCost/0/0` · `/app/Owner/AccountNotConnected/0` · `/app/Owner/ChangeOrders/0/-1/Request` · `/app/Owner/Estimate` · `/app/Owner/Estimate/0/Proposals/0` · `/app/Owner/ProposalReview/0` · `/app/Owner/SelectionOption/0/-1` · `/app/Owner/Setup/-1` · `/app/Owner/Setup/-1/0` · `/app/Owner/Summary` · `/app/OwnerInvoice/0/-1` · `/app/OwnerInvoice/0/-1/checkout` · `/app/OwnerInvoice/0/-1/payOnlineMobile` · `/app/OwnerInvoice/Print/0/0/0/0/0` · `/app/POMapping` · `/app/PSPDFKit-3egkwt2aapw9v1bz73jwtgr311` · `/app/PaymentRequest/0/0` · `/app/PaymentServiceVerifyPaymentMethod/0` · `/app/PaymentServiceVerifyPaymentMethod/0/0/0` · `/app/PaymentTos/0` · `/app/Payments/0/ChangeOrderPayment` · `/app/PayrollSettings/0/0` · `/app/PhaseDetails/0` · `/app/Photo/Preview/0/-1` · `/app/Photos/0/0` · `/app/Plans/External/0` · `/app/Plans/Revisions/0` · `/app/Plans/Viewer/0` · `/app/Plans/Viewer/External/0` · `/app/PostDepositCheckout/0` · `/app/PreliminaryEstimate/0` · `/app/ProofOfPurchase/0` · `/app/Proposal/0/-1` · `/app/Proposal/Print/0` · `/app/Proposals/0/Print` · `/app/Proposals/0/Worksheet` · `/app/PurchaseOrder/0/-1` · `/app/PurchaseOrder/0/-1/ChangeOrder/0/-1` · `/app/Purchasing/0` · `/app/QuestionReport/0/-1` · `/app/QuickAction` · `/app/RFI/0/-1` · `/app/RFI/0/-1/0/0` · `/app/Rebate/0` · `/app/Receipt/0` · `/app/RecentComments` · `/app/RelatedRfi/0/0/0/-1` · `/app/RemoveSignatureRequest/0` · `/app/Reporting/BaselineVsActualDurationReport` · `/app/Reporting/BudgetedVsProjected/0` · `/app/Reporting/CashflowReport` · `/app/Reporting/ChangeOrderProfitReport` · `/app/Reporting/DailyLogCreationByJobReport` · `/app/Reporting/DailyLogsByUserReport/` · `/app/Reporting/HoursByEmployeeReport` · `/app/Reporting/HoursByJobReport` · `/app/Reporting/InvoicingReport/0` · `/app/Reporting/LaborActualsVsBudgetedReport` · `/app/Reporting/LeadActivitiesBySalespersonReport` · `/app/Reporting/LeadCountBySalespersonReport` · `/app/Reporting/LeadStatusBySourceReport` · `/app/Reporting/ProfitabilityReport/0` · `/app/Reporting/SchedulePercentCompleteByJob/` · `/app/Reporting/WIPReport/0` · `/app/RiskInsurance/BuilderProposalForm/0` · `/app/RiskInsurance/JobRequestForm/-1` · `/app/RiskInsurance/JobsiteRequestForm/-1` · `/app/RiskInsuranceSettings/0/0` · `/app/RoleManagement/Role/0/0` · `/app/SalesSettings/CustomField/0` · `/app/Schedule/0/-1` · `/app/ScheduleCopy/0/-1` · `/app/ScheduleHistory/-1` · `/app/ScheduleOfValues/-1` · `/app/ScheduleRFI/0/-1` · `/app/ScheduleWorkdayExceptions/0/-1` · `/app/Schedules/0/viewSettings` · `/app/Schedules/External/0/0` · `/app/Selection/0/-1` · `/app/SelectionInvoicingWizard` · `/app/SelectionOption/0/-1/0/0` · `/app/SelectionOptionsModal/0/-1/0/0` · `/app/SelectionQuickAdd/-1` · `/app/Selections/0/0` · `/app/Service/0/0` · `/app/Settlement/0` · `/app/Shift/0/-1` · `/app/SignDocument/0` · `/app/SignatureRequest/0` · `/app/SignatureRequest/0/-1` · `/app/SignatureRequest/0/-1/0` · `/app/Signups/0/0/0/0/0/0/0` · `/app/Signups/Pricing/0` · `/app/Signups/WhatsNext/0/0/0/0` · `/app/Specification/0/-1` · `/app/Specifications/0/-1/Conversation` · `/app/Specifications/Book/View/0` · `/app/Specifications/External/View/0` · `/app/Specifications/List/View/0` · `/app/SubBid/0/-1` · `/app/SubVendor/0/0` · `/app/Submittal/0/-1` · `/app/Subs/Selections/Conversation/0/0/0/-1` · `/app/Subs/Selections/Selection/0/-1` · `/app/Subs/Summary` · `/app/SubscriptionInactive` · `/app/SubscriptionManager/0/0` · `/app/SubscriptionSettings/0/0` · `/app/Supplier/0` · `/app/Survey/0` · `/app/Survey/0/-1/0` · `/app/SurveyDefinition/0` · `/app/SurveyQuestion/0` · `/app/Surveys/0` · `/app/Tag/0/0` · `/app/Tasks/external/task/0` · `/app/Tax/TaxGroup/0` · `/app/Tax/TaxRate/0` · `/app/Template/-1` · `/app/Template/CopyTemplateToOrg/0` · `/app/TemplateFromTemplate/-1` · `/app/TemplateImport/0/-1` · `/app/Templates/0` · `/app/TimeClock/0` · `/app/ToDo/0/-1/0` · `/app/ToDo/Assign/0` · `/app/ToDoBulkDelete/0/0/-1` · `/app/TradeAgreement/0/0` · `/app/TradeAgreement/Print/0` · `/app/VendorReceipt/0/0` · `/app/VendorStoreFinder/0` · `/app/Videos/0/0` · `/app/Warranty/0/-1` · `/app/Warranty/0/-1/Service/0/0` · `/app/WarrantyService/0/-1/0/0` · `/app/admin` · `/app/admin/` · `/app/auth/step-up-callback` · `/app/import-templates/0` · `/app/link` · `/app/link/` · `/app/owner/` · `/app/share` · `/app/share/` · `/app/share/0/builder/` · `/app/share/0/contact/` · `/app/share/0/owner/` · `/app/share/0/subs/` · `/app/static/connected-to-builder-BUYiQEhf.webp` · `/app/static/connected-to-project-BOgWkle_.webp` · `/app/static/connected-wherever-Bh6_6fw8.webp` · `/app/subs/`

</details>

## Change orders (variations)

- **VIABUILD equivalent:** `variations`, `variation_line_items`, `variation_attachments`
- **Gateway verbs:** `variations.list`, `variations.get`, `variations.saveDraftHeader`, `variations.saveDraft`, `variations.updateLine`, `variations.addLines`, `variations.deleteLines`, `variations.recomputeGst`, `variations.createDraft` (not_captured), `variations.notifyOwners` (send, locked)
- **Coverage:** 12 screens/modals · 3 read endpoints · 2 blocked writes · bundle APIs reached 5/42

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/ChangeOrder/0/{id}` | — | 0 | — |
| `/app/ChangeOrderDraft/{id}` | — | 0 | — |
| `/app/ChangeOrders` | — | 12 | Add Purchase Order, Apply filter |
| `/app/ChangeOrders ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/ChangeOrders/{id}/{id}/Details` | Details, Client preview | 25 | — |
| `/app/ChangeOrders/0/{id}/Details` | — | 0 | — |
| `/app/ChangeOrders/0/{id}/Request` | — | 12 | Add Purchase Order, Apply filter |
| `/app/ChangeOrders/0/{id}/Request ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/JobFinancials/ChangeOrder/{id}/{id}` | Details, Client preview | 25 | Copy share link, Add to, More › Recall, Add to › New Schedule Item, Add to › Purchase Order, Add to › Invoice |
| `/app/JobFinancials/ChangeOrder/{id}/{id} ⧉ Comments` | Internal ({n}), Clients, Subs/vendors | 0 | — |
| `/app/JobFinancials/ChangeOrder/{id}/{id} ⧉ More › Recall` | — | 0 | Recall |
| `/app/Landing/QuickAction/ChangeOrderDraft/{id}` | — | 0 | — |

### Fields (UI)

% Invoiced (column) · Amount (column) · Approval Deadline (date) · Builder Cost (column) · Builder cost (column) · CO ID# (column) · Choice (column) · Client (column) · Client Price (column) · Client notes (textarea) · Columns (select) · Comments (column) · Cost type (column) · Created date (column) · Date (column) · Description (column) · Files (column) · ID# (text) · Internal Notes (column) · Internal notes (textarea) · Invoice client upon approval (checkbox) · Items (column) · Margin (column) · Markup (column) · Payment type (column) · Price (column) · Profit (column) · Qty/Unit (column) · Quantity (column) · RFIs (column) · Related POs (column) · Required Approvers (select) · Status (column) · Status change date (column) · Sub/Vendor notes (textarea) · Tax (column) · Title (column) · Title (text) · Total price (column) · Unit (column) · Unit Price (column) · Unit cost (column) · customFields.0.value (number)

### Enums and dropdown options

- Columns: Check All / CO ID# / Title / RFIs / Comments / Client / Created date / Files / Builder cost / Total price / Status / Status change date / Related POs
- data.columnsList: Job / CO ID# / Title / RFIs / Comments / Client / Created date / Files / Builder cost / Total price / Status / Status change date / Related POs / Subtotal / PO builder variance / Total markup / PO customer variance / PO cost / Deadline / Client last viewed / Created by / Subs/Vendors / Related Invoices / % Invoiced / Related bid packages / Extension of Time (Days)
- data.displayFormatOptions.value.allColumns: Code / Description / Qty / unit / Builder unit cost / Builder total cost / Markup % / Markup amount / Unit price / Price / Total price / Total cost / Total markup / Item type / Item title / Cost type / Parent group price / Subgroup price
- data.formatData: Unassigned
- data.lineItems.defaults.costTypes.options[].options: None / Labor / Material / Equipment / Subcontractor / Other
- data.lineItems.defaults.taxGroups.options[].options: No Tax / GST

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/ChangeOrders/{id}/changeOrder?isMobile=&presentingScreen=` | — | data, addCostGroupButton, addCostGroupButton.buttonColor, addCostGroupButton.buttonName, approvalDate, approvalDetails, approvalDetails.comments, approvalDetails.comments.validators, approvalDetails.comments.value, approvalDetails.signature, approvalDetails.status, approvalDetails.statusText, approvalStatus, approvalStatus.actions, approvalStatus.actions[].buttonColor, approvalStatus.actions[].buttonName, approvalStatus.actions[].extraData, approvalStatus.actions[].id, approvalStatus.actions[].message, approvalStatus.actions[].signatureRequired, approvalStatus.extraData, approvalStatus.message, approvalStatus.name, approvalStatus.value, approvalStatusMessage, approvedBy, attachedFilesPostApproval, attachedFilesPostApproval.files, attachedFilesPostApproval.newFileOptions, attachedFilesPostApproval.newFileOptions.canEdit, attachedFilesPostApproval.newFileOptions.defaultValue, attachedFilesPostApproval.newFileOptions.fileOptionKey, attachedFilesPostApproval.newFileOptions.loginType, attachedFilesPostApproval.newFileOptions.options, attachedFilesPostApproval.newFileOptions.title, attachedFilesPostApproval.newFileOptions.visible, attachedFilesPostApproval.title, attachedFilesPostApproval.viewingPermissions, attachedFilesPostApproval.viewingPermissions.allAllowedExtensions, attachedFilesPostApproval.viewingPermissions.allowFullSizeImages, … (+561) |
| GET | `/apix/v2/ChangeOrders/recall-selection-options-preview?ids=&jobIds=` | — | hasInvoicedItems, selectionOptions |
| POST | `/api/ChangeOrders/Grid` | filters, filters.{key}, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow | data, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].added, data[].approvalStatus, data[].approvalStatus.approvalStatus, data[].approvalStatus.dateUpdated, data[].approvalStatus.message, data[].approvalStatus.updatedBy, data[].attachedFiles, data[].attachedFiles.docCount, data[].attachedFiles.entityId, data[].attachedFiles.entityType, data[].bidPackagesLinks, data[].builderCost, … (+99) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/apix/v2/ChangeOrders/{id}/create-draft` | blocked during crawl | — (via nav:/app/Landing/QuickAction/ChangeOrderDraft/{id}, row:first) |
| PUT | `/api/ChangeOrders/{id}/Update` | blocked during crawl | amountInvoiced, approvalComments, approvalDisclaimer, approvalStatus, attachedFiles, attachedFiles.attachDocs, attachedFiles.removeDocs, attachedFiles.updateDocs, changeOrderId, closingText, customFields, customFields[].associatedEntityID, customFields[].id, customFields[].onOwnerPortal, customFields[].title, customFields[].toolTipText, customFields[].type, customFields[].typeId, customFields[].validators, customFields[].validators[].errorMessage, customFields[].validators[].type, customFields[].validators[].value, customFields[].value, dataUrl, deadLine, displayFormatOptions, displayFormatOptions.allColumns, displayFormatOptions.allColumns[].id, displayFormatOptions.allColumns[].order, displayFormatOptions.allColumns[].pinned (via btn:Recall) |
| POST | `/api/ChangeOrders/Print` | app bundle (not fired) | — |
| PUT | `/api/ChangeOrders/Release` | app bundle (not fired) | — |
| PUT | `/api/ChangeOrders/Setup` | app bundle (not fired) | — |
| PUT | `/api/ChangeOrders/Unrelease` | app bundle (not fired) | — |
| POST | `/api/ChangeOrders/Update` | app bundle (not fired) | — |
| PUT | `/api/ChangeOrders/UpdateSubsOnChangeOrders` | app bundle (not fired) | — |
| DELETE | `/api/ChangeOrders/{p}` | app bundle (not fired) | — |
| POST | `/api/ChangeOrders/{p}/ResetStatus` | app bundle (not fired) | — |
| PUT | `/api/PurchaseOrders/UnlinkChangeOrder` | app bundle (not fired) | — |
| POST | `/api/bidPackages/NewBidPackageFromChangeOrderLineItems` | app bundle (not fired) | — |
| PUT | `/api/bids/ApproveBidsFromChangeOrder` | app bundle (not fired) | — |
| PUT | `/api/bids/DeclineBidsFromChangeOrder` | app bundle (not fired) | — |
| PUT | `/api/changeOrders/{p}/UpdateFromBid` | app bundle (not fired) | — |
| POST | `/apix/v2/Allowances/create-change-order-line-item-as-allowance` | app bundle (not fired) | — |
| POST | `/apix/v2/ChangeOrders/aia-reject` | app bundle (not fired) | — |
| POST | `/apix/v2/ChangeOrders/{p}/bulk-update-tax-rate` | app bundle (not fired) | — |
| POST | `/apix/v2/ChangeOrders/{p}/create-from-schedule-of-values` | app bundle (not fired) | — |
| POST | `/apix/v2/ChangeOrders/{p}/notify-owners` | app bundle (not fired) | — |
| POST | `/apix/v2/LineItems/add-change-order-line-items` | app bundle (not fired) | — |
| PUT | `/apix/v2/LineItems/change-order-format-items/bulk` | app bundle (not fired) | — |
| DELETE | `/apix/v2/LineItems/delete-change-order-line-items` | app bundle (not fired) | — |
| PUT | `/apix/v2/LineItems/update-change-order-line-item` | app bundle (not fired) | — |
| PUT | `/apix/v2/LineItems/update-change-order-line-item-profit` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/change-orders` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/ChangeOrders/ApprovedOwnerChangeOrders` · `GET /api/ChangeOrders/DeclinedOwnerChangeOrders` · `GET /api/ChangeOrders/Defaults` · `? /api/ChangeOrders/ExportToExcel` · `GET /api/ChangeOrders/GetChangeOrderLineItemIds` · `GET /api/ChangeOrders/PendingOwnerChangeOrders` · `GET /api/ChangeOrders/{p}/VarianceImport` · `GET /api/Payments/{p}/GetChangeOrderPaymentDetails` · `GET /api/changeOrders/LineItemsForBidMapping` · `GET /apix/v2/ChangeOrders/aia-approval-workflow` · `GET /apix/v2/ChangeOrders/{p}/draft-preview` · `GET /apix/v2/external/{p}/change-order/pdf-generation` · `GET /apix/v3/Reporting/change-order-profit`

## Owner invoices (progress claims)

- **VIABUILD equivalent:** `progress_claims`, `claim_line_items`, `contracts` (retention, GST)
- **Gateway verbs:** `invoices.list`, `invoices.get`, `invoices.accountingStatus`, `invoices.changes`, `invoices.saveDraft` (not_captured), `invoices.addLines` (not_captured), `invoices.send` (send, locked)
- **Coverage:** 8 screens/modals · 6 read endpoints · 0 blocked writes · bundle APIs reached 6/216

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/ApplyToInvoice/{id}/0` | — | 0 | — |
| `/app/ExistingOwnerInvoiceSelect` | — | 0 | — |
| `/app/Landing/QuickAction/OwnerInvoice/0/{id}/false` | Details, Client preview | 14 | Apply filter, Save, Send |
| `/app/Landing/QuickAction/OwnerInvoice/0/{id}/false ⧉ Give feedback` | — | 1 | — |
| `/app/OwnerInvoices` | Invoices, Payments, Credit memos | 19 | Apply filter |
| `/app/OwnerInvoices ⧉ Info` | — | 0 | — |
| `/app/OwnerInvoices/OwnerInvoice/{id}/{id}/false` | Invoices, Payments, Credit memos, Details, Client preview | 28 | Apply filter |
| `/app/OwnerInvoices/OwnerInvoice/{id}/{id}/false ⧉ Give feedback` | — | 1 | — |

### Fields (UI)

Amount (column) · Amount paid (column) · Balance due (column) · Builder cost (column) · Client price (column) · Comments (column) · Cost type (column) · Date (column) · Date paid (column) · Due (column) · Files (column) · ID # (text) · Invoice (column) · Invoice ID (column) · Invoice date (radio) · Items (column) · Job (column) · Markup (column) · Payment amount (column) · Payment method (column) · Quantity (column) · Recorded by (column) · Retainage (column) · Status (column) · Tax (column) · Title (column) · Title (text) · Total price (column) · Total tax (column) · Unit (column) · Unit Price (column) · Unit cost (column) · Viewed by Owner On (column) · Xero invoice (column) · feedbackText (textarea) · internalNotes (textarea)

### Enums and dropdown options

- data.columnsList: Job / Invoice ID / Title / Status / Total price / Total tax / Retainage / Amount paid / Balance due / Viewed by Owner On / Due / Date paid / Files / Comments / Xero invoice / Created by / Created date / Client / Transaction details / Date released / Amount refunded / Related change orders
- lineItemDefaults.costTypes.options[].options: None / Labor / Material / Equipment / Subcontractor / Other
- lineItemDefaults.taxGroups.options[].options: No Tax / GST
- taxInformation.taxGroups.options[].options: No Tax / GST
- taxInformation.taxMethod.options[].options: No Tax / Tax Exclusive / Tax Inclusive

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Deposits/0?jobId=` | — | reason |
| GET | `/api/Deposits/0/GetOnlinePaymentInfo` | — | reason |
| GET | `/apix/v3/Invoices/get-invoice?invoiceId=&job=` | — | accountingInfo, accountingInfo.accountingBalance, accountingInfo.accountingIntegrationName, accountingInfo.accountingSectionTitle, accountingInfo.accountingType, accountingInfo.balanceStatus, accountingInfo.canEditAccountingOnInvoice, accountingInfo.canGetLatestStatus, accountingInfo.createInvoiceChkbox, accountingInfo.invoiceOutstandingBalance, accountingInfo.invoiceStatus, accountingInfo.invoiceStatusText, accountingInfo.invoiceStatusValue, accountingInfo.invoiceTax, accountingInfo.invoicedBy, accountingInfo.isBilled, accountingInfo.isConnected, accountingInfo.isConnectedAndInvoiced, accountingInfo.paidLastSyncDate, accountingInfo.paymentStatus, accountingInfo.resetInvoiceMessage, accountingInfo.resetInvoiceTransactionsAlertMessage, accountingInfo.shouldValidateSalesTax, accountingInfo.showAccountsReceivable, accountingInfo.showCreateInvoiceButton, accountingInfo.taxAmount, accountingInfo.totalInvoice, accountingInfo.totalInvoiceAmount, accountingInfo.totalInvoiceAmountWithTaxes, accountingInfo.totalTax, accountingInfo.totalTaxAmount, addFromRelatedEntities, addFromRelatedEntities.showRelatedAccountingCosts, addFromRelatedEntities.showRelatedBillsAndPurchaseOrderPayments, addFromRelatedEntities.showRelatedChangeOrders, addFromRelatedEntities.showRelatedEstimates, addFromRelatedEntities.showRelatedSelectionChoices, addFromRelatedEntities.showRelatedTimeClockItems, addedBy, amount, … (+531) |
| GET | `/apix/v3/Invoices/get-new-invoice?job=` | — | accountingInfo, accountingInfo.accountingBalance, accountingInfo.accountingIntegrationName, accountingInfo.accountingSectionTitle, accountingInfo.accountingType, accountingInfo.balanceStatus, accountingInfo.canEditAccountingOnInvoice, accountingInfo.canGetLatestStatus, accountingInfo.createInvoiceChkbox, accountingInfo.invoiceOutstandingBalance, accountingInfo.invoiceStatus, accountingInfo.invoiceStatusText, accountingInfo.invoiceStatusValue, accountingInfo.invoiceTax, accountingInfo.invoicedBy, accountingInfo.isBilled, accountingInfo.isConnected, accountingInfo.isConnectedAndInvoiced, accountingInfo.paidLastSyncDate, accountingInfo.paymentStatus, accountingInfo.resetInvoiceMessage, accountingInfo.resetInvoiceTransactionsAlertMessage, accountingInfo.shouldValidateSalesTax, accountingInfo.showAccountsReceivable, accountingInfo.showCreateInvoiceButton, accountingInfo.taxAmount, accountingInfo.totalInvoice, accountingInfo.totalInvoiceAmount, accountingInfo.totalInvoiceAmountWithTaxes, accountingInfo.totalTax, accountingInfo.totalTaxAmount, addFromRelatedEntities, addFromRelatedEntities.showRelatedAccountingCosts, addFromRelatedEntities.showRelatedBillsAndPurchaseOrderPayments, addFromRelatedEntities.showRelatedChangeOrders, addFromRelatedEntities.showRelatedEstimates, addFromRelatedEntities.showRelatedSelectionChoices, addFromRelatedEntities.showRelatedTimeClockItems, addedBy, amount, … (+409) |
| POST | `/api/InvoicePayments/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, appliedCreditMemos, appliedDeposits, canAdd, canAddCreditMemo, canAddDeposit, canAddOwnerInvoice, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].builderId, data[].creditMemoID, data[].datePaid, data[].id, data[].invoiceId, data[].invoiceId.accountingType, data[].invoiceId.builderId, … (+44) |
| POST | `/api/OwnerInvoices/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, accountingIntegrationType, accountingReauthBannerMessage, accountingReauthBannerTitle, amountOverInvoiced, appliedCreditMemos, appliedDeposits, canAdd, canAddCreditMemo, canAddDeposit, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].accountingStatus, data[].allowCheck, data[].allowCredit, data[].amountPaid, … (+127) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/Accounting/LinkOnlinePayment` | app bundle (not fired) | — |
| POST | `/api/Accounting/SyncOwnerInvoices` | app bundle (not fired) | — |
| PUT | `/api/Accounting/{p}/ResetOnlinePaymentAccountingSync` | app bundle (not fired) | — |
| POST/PUT | `/api/Deposits` | app bundle (not fired) | — |
| POST | `/api/Deposits/Apply` | app bundle (not fired) | — |
| PUT | `/api/Deposits/PayDepositOnline` | app bundle (not fired) | — |
| PUT | `/api/Deposits/PayDepositOnlineExternal` | app bundle (not fired) | — |
| DELETE | `/api/Deposits/{p}` | app bundle (not fired) | — |
| PUT | `/api/Deposits/{p}/Cancel` | app bundle (not fired) | — |
| PUT | `/api/Deposits/{p}/RefreshAccounting` | app bundle (not fired) | — |
| POST | `/api/Deposits/{p}/ResetAccountingStatus` | app bundle (not fired) | — |
| POST | `/api/Deposits/{p}/SendToAccounting` | app bundle (not fired) | — |
| PUT | `/api/Deposits/{p}/Void` | app bundle (not fired) | — |
| POST | `/api/InvoicePayments` | app bundle (not fired) | — |
| PUT | `/api/InvoicePayments/{p}/Void` | app bundle (not fired) | — |
| PUT | `/api/LeadProposal/{p}/Payment` | app bundle (not fired) | — |
| POST | `/api/LineItems/InvoiceMappingValues` | app bundle (not fired) | — |
| DELETE | `/api/MerchantPayments/{p}/DeletePaymentMethod` | app bundle (not fired) | — |
| PUT | `/api/MerchantPayments/{p}/SetDefaultMethod` | app bundle (not fired) | — |
| POST | `/api/OnlinePayments/AddPaymentMethodFromPaymentService` | app bundle (not fired) | — |
| POST | `/api/OnlinePayments/AddPaymentMethodFromToken` | app bundle (not fired) | — |
| POST | `/api/OnlinePayments/CreateOutboundPaymentAccount` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/MakeOnlinePaymentExternal` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/MakeOnlinePaymentPush` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/PaymentMethodSetStartingCheckNumberExternal` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/PaymentMethodVerificationExternal` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/SaveOnlinePaymentSettings` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/SkipPayment` | app bundle (not fired) | — |
| POST | `/api/OnlinePayments/{p}/AddOutboundPaymentSubscription` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/{p}/PaymentMethodSetStartingCheckNumber` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/{p}/PaymentMethodVerification` | app bundle (not fired) | — |
| PUT | `/api/OnlinePayments/{p}/RefundPayment` | app bundle (not fired) | — |
| POST | `/api/OnlinePaymentsOnboarding/AcceptTermsAndConditions` | app bundle (not fired) | — |
| POST | `/api/OnlinePaymentsOnboarding/CreateAccountAndTriggerUnderwriting` | app bundle (not fired) | — |
| POST | `/api/OnlinePaymentsOnboarding/CreateInboundPaymentsAccount` | app bundle (not fired) | — |
| PUT | `/api/OnlinePaymentsOnboarding/CustomerVerificationSnapshot` | app bundle (not fired) | — |
| PUT | `/api/OwnerInvoices/SaveOwnerPreviewDisplayPreferences` | app bundle (not fired) | — |
| DELETE | `/api/OwnerPayments/PaymentMethod` | app bundle (not fired) | — |
| POST | `/api/OwnerPayments/SendBuilderPaymentInvitation` | app bundle (not fired) | — |
| PUT | `/api/OwnerPayments/Setup` | app bundle (not fired) | — |
| POST | `/api/POPayments/SubRequestPayment` | app bundle (not fired) | — |
| PUT | `/api/POPayments/{p}/SubRequestPayment` | app bundle (not fired) | — |
| POST | `/api/Payments` | app bundle (not fired) | — |
| PUT | `/api/Payments/SubmitDrawRequest` | app bundle (not fired) | — |
| POST | `/api/Payments/ValidateExternalId` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Payments/{p}` | app bundle (not fired) | — |
| POST | `/api/Payments/{p}/Invoice` | app bundle (not fired) | — |
| PUT | `/api/Payments/{p}/Notify` | app bundle (not fired) | — |
| PUT | `/api/Payments/{p}/ResetInvoice` | app bundle (not fired) | — |
| PUT | `/api/Payments/{p}/ResetToPending` | app bundle (not fired) | — |
| PUT | `/api/accounting/{p}/SyncInvoice` | app bundle (not fired) | — |
| PUT | `/api/billPayment/{p}/resendNotification` | app bundle (not fired) | — |
| PUT | `/api/billPayment/{p}/sendToAccounting` | app bundle (not fired) | — |
| PUT | `/api/billPayment/{p}/void` | app bundle (not fired) | — |
| PUT | `/api/payments/Handle3ds` | app bundle (not fired) | — |
| PUT | `/api/v1/bills/MarkReadyForPayment` | app bundle (not fired) | — |
| POST | `/apix/v1/OnlinePayments/{p}/downloadprintcheckexternal` | app bundle (not fired) | — |
| POST | `/apix/v1/OnlinePayments/{p}/receiveoutboundcheckexternal` | app bundle (not fired) | — |
| POST/PUT | `/apix/v2.0/admin/OnlinePaymentAccounts/limit-increase` | app bundle (not fired) | — |
| POST | `/apix/v2.0/admin/OnlinePayments/AddLoan` | app bundle (not fired) | — |
| POST | `/apix/v2.0/admin/OnlinePayments/EnableLending` | app bundle (not fired) | — |
| DELETE | `/apix/v2.0/admin/OnlinePayments/Loan` | app bundle (not fired) | — |
| PATCH | `/apix/v2.0/admin/OnlinePayments/UnderwritingAccount` | app bundle (not fired) | — |
| POST | `/apix/v2.0/admin/OnlinePayments/WalletDocument` | app bundle (not fired) | — |
| PUT | `/apix/v2.0/admin/onlinepayments/cancel/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/Deposits/refresh-accounting/{p}/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/Deposits/resend-request/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/Deposits/save-sync` | app bundle (not fired) | — |
| PUT | `/apix/v2/Invoices/retainage-product-service` | app bundle (not fired) | — |
| POST | `/apix/v2/OnlinePayments/mass-pay-online-info` | app bundle (not fired) | — |
| POST | `/apix/v2/OnlinePayments/release-retainage-online-info` | app bundle (not fired) | — |
| POST | `/apix/v2/OnlinePaymentsOnboarding/sign-tos` | app bundle (not fired) | — |
| PUT | `/apix/v2/OnlinePaymentsSettings/trusted-payments-users` | app bundle (not fired) | — |
| POST | `/apix/v2/PaymentMethods/sub/{p}/default-payment-method/clear` | app bundle (not fired) | — |
| POST | `/apix/v2/PaymentSchedule/create-invoices-from-payment-schedule` | app bundle (not fired) | — |
| DELETE | `/apix/v2/PaymentSchedule/delete-payment-schedule` | app bundle (not fired) | — |
| POST | `/apix/v2/PaymentSchedule/save-payment-schedule` | app bundle (not fired) | — |
| PUT | `/apix/v2/PaymentSchedule/share-payment-schedule` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/ach` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/bank-account` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/create-terminal-payment` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Payments/deactivate-method` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/fetch-short-payment-code` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/grouped-grid/excel` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/request-bank-setup` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/validate-external-invoice-code` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/verify-payment-phone-number` | app bundle (not fired) | — |
| POST | `/apix/v2/Payments/{p}/notify-owners` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/payments` | app bundle (not fired) | — |
| POST | `/apix/v2/Subs/bulk-enable-sms-payment-notifications` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/MerchantPayments/accountinformation` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/MerchantPayments/blacklist` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/MerchantPayments/business-information` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/MerchantPayments/disputestatus` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/MerchantPayments/exposure` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/MerchantPayments/exposuresimulate` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/MerchantPayments/pricinginformation` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/MerchantPayments/recovernegativebalance` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/MerchantPayments/refreshinboundpaymentstatus` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/MerchantPayments/reunderwrite` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/MerchantPayments/{p}/fix-stuck-payment` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/OnlinePaymentAccounts/approval` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/OnlinePaymentAccounts/snapshot` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/OnlinePayments/merchant-payments` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/OnlinePayments/merchant-payments/export` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/OnlinePayments/merchant-payments/{p}/refresh` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/OnlinePayments/online-payment-account-statuses` | app bundle (not fired) | — |
| PATCH | `/apix/v2/admin/OnlinePayments/reset-inbound-payments-application` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/OnlinePayments/{p}/setup-payments-onboarding` | app bundle (not fired) | — |
| PUT | `/apix/v3/BillPayment/{p}/send-to-accounting` | app bundle (not fired) | — |
| PUT | `/apix/v3/BillPayment/{p}/void` | app bundle (not fired) | — |
| POST | `/apix/v3/Invoices/aia-reject` | app bundle (not fired) | — |
| POST | `/apix/v3/Invoices/create-invoice` | app bundle (not fired) | — |
| DELETE | `/apix/v3/Invoices/delete-invoice` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/delete-schedule-date` | app bundle (not fired) | — |
| DELETE | `/apix/v3/Invoices/mass-delete` | app bundle (not fired) | — |
| POST | `/apix/v3/Invoices/recalculate-cost-code-overages` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/release-invoice` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/save-client-preview-display-settings` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/save-invoice` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/schedule-release` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/sync-to-accounting` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/unrelease-invoice` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/void-invoice` | app bundle (not fired) | — |
| PUT | `/apix/v3/Invoices/{p}/sync-now` | app bundle (not fired) | — |
| POST | `/apix/v3/Payments/request-bank-setup-bulk` | app bundle (not fired) | — |
| POST | `/apix/v3/Payments/request-bank-setup-bulk-preview` | app bundle (not fired) | — |
| POST | `/apix/v3/Payments/save-payment-contact-bulk` | app bundle (not fired) | — |
| POST | `/apix/v3/Payments/save-payment-contact-bulk-preview` | app bundle (not fired) | — |
| PATCH | `/apix/v3/external/{p}/invoice/reject` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Deposits/DefaultInfo` · `? /api/Deposits/ExportToExcel` · `GET /api/Deposits/External` · `GET /api/Deposits/GetOnlineDepositInfoExternal` · `POST /api/Deposits/Grid` · `GET /api/Deposits/PrintDepositExternal` · `GET /api/Deposits/{p}/ApplyToInvoice` · `GET /api/Deposits/{p}/Print` · `GET /api/InvoicePayments/Defaults` · `? /api/InvoicePayments/ExportToExcel` · `GET /api/LineItems/EntityAttachmentsToInvoice` · `GET /api/LineItems/EntityLineItemsToInvoice` · `? /api/OnlinePayments/AddPaymentMethodFromPaymentServiceExternal` · `? /api/OnlinePayments/AddPaymentMethodFromTokenExternal` · `GET /api/OnlinePayments/Details` · `? /api/OnlinePayments/ExportToExcel` · `GET /api/OnlinePayments/GetAccountingPaymentMethods` · `GET /api/OnlinePayments/GetPaymentServiceNewMethodData` · `? /api/OnlinePayments/GetPaymentServiceNewMethodDataExternal` · `POST /api/OnlinePayments/Grid` · `GET /api/OnlinePayments/Methods` · `GET /api/OnlinePayments/OnlinePaymentSettings` · `GET /api/OnlinePayments/OutboundPaymentExternal` · `GET /api/OnlinePayments/OutboundPaymentSetup` · `GET /api/OnlinePayments/ReviewLienWaivers` · `GET /api/OnlinePayments/ReviewLienWaiversExternal` · `GET /api/OnlinePayments/SetupMerchantPaymentMethods` · `GET /api/OnlinePayments/SetupPPSMerchantPaymentMethods` · `GET /api/OnlinePayments/UnverifiedBankAccountPaymentMethod` · `GET /api/OnlinePayments/{p}/PaymentTokenExternal` · `GET /api/OnlinePayments/{p}/ReceivePaymentOptionsExternal` · `GET /api/OnlinePayments/{p}/Settlement` · `GET /api/OnlinePaymentsOnboarding` · `GET /api/OnlinePaymentsOnboarding/GetAdyenTermsOfServiceTokens` · `? /api/OwnerInvoices/ExportToExcel` · `POST /api/OwnerInvoices/GridExternal` · `GET /api/OwnerPayments/GetRelatedInvoicesForLineItem` · `GET /api/POPayments/{p}/SubPurchaseOrderPaymentRequest` · `GET /api/Payments/Defaults` · `GET /api/Payments/GetOnlinePaymentInfoExternal` · `GET /api/Payments/GetOwnerInvoiceExternal` · `GET /api/Payments/GetUnstackedLineItems` · `? /api/Payments/PayOnline` · `? /api/Payments/PayOnlineExternal` · `? /api/Payments/PrintInvoice` · `? /api/Payments/PrintInvoiceExternal` · `GET /api/Payments/{p}/GetOnlinePaymentInfo` · `GET /api/SelectionChoices/{p}/RelatedInvoicedAllowance` · `GET /api/Subscription/PdfInvoice` · `GET /api/billPayment/{p}` · `GET /api/contacts/GetOwnerInvoicePayeeList` · `GET /apix/v1/OnlinePayments/{p}/receivecheckexternal` · `GET /apix/v2/Estimates/has-invoice-linked-estimates` · `GET /apix/v2/OnlinePaymentsOnboarding/org-owners` · `GET /apix/v2/OnlinePaymentsOnboarding/payments-overview` · `GET /apix/v2/OnlinePaymentsOnboarding/pending-tos` · `GET /apix/v2/PaymentMethods/payment-method-config` · `GET /apix/v2/PaymentSchedule/get-payment-schedule` · `GET /apix/v2/PaymentSchedule/get-payment-schedule-tracker` · `GET /apix/v2/Payments/account-setup` · `GET /apix/v2/Payments/available-owner-invoices` · `GET /apix/v2/Payments/card-present-terminals-available` · `POST /apix/v2/Payments/grouped-grid` · `GET /apix/v2/Payments/request-bank-setup-preview` · `GET /apix/v2/Selections/invoiceable-selections` · `GET /apix/v2/Subs/missing-payment-info` · `GET /apix/v2/admin/MerchantPayments/riskprofiles` · `GET /apix/v2/admin/MerchantPayments/{p}/exposure` · `GET /apix/v2/admin/OnlinePayments/merchant-payment-filters` · `GET /apix/v2/admin/OnlinePayments/merchant-payments/{p}/details` · `GET /apix/v2/admin/OnlinePayments/online-payment-account-status-filters` · `GET /apix/v2/admin/OnlinePayments/{p}/onboarding-status` · `GET /apix/v2/admin/RiskInsurance/chargebee-invoice-estimate/{p}` · `GET /apix/v3/BillPayment/{p}` · `GET /apix/v3/Bills/vendor-credit-payments/{p}` · `GET /apix/v3/Invoices/aia-approval-workflow` · `GET /apix/v3/Invoices/auto-fill-costs` · `GET /apix/v3/Invoices/next` · `GET /apix/v3/Invoices/selection-option-invoicing` · `GET /apix/v3/Payments/external/{p}/lien-waivers` · `GET /apix/v3/Payments/outbound-payment-share-token`

## Bills (AP)

- **VIABUILD equivalent:** `invoices`, `invoice_line_items`, `invoice_po_matches`, `invoice_approval_log`
- **Gateway verbs:** `bills.list`, `bills.tabCounts`, `bills.get`, `bills.file`, `bills.defaults`, `bills.availablePurchaseOrders`, `bills.create`, `bills.update`, `bills.attach`, `bills.linkPurchaseOrder`, `bills.markReadyForPayment` (send, locked)
- **Coverage:** 8 screens/modals · 6 read endpoints · 1 blocked writes · bundle APIs reached 7/46

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Bills` | Purchase Orders, Bills, Inbox {n}, In Review {n}, Paid {n}, All Bills {n} | 14 | Pay to, Freeze Pay to column, Apply filter, More › Reset, More › Save as new view |
| `/app/Bills ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/Landing/ActivityFeed/Bill/{id}/{id}` | Bill, Lien Waiver | 14 | Apply filter, Reset approvals, Link schedule item, Add from catalog, Add, Create new doc, Add to Invoice, Save & Close |
| `/app/Landing/ActivityFeed/Bill/{id}/{id} ⧉ Give feedback` | — | 1 | — |
| `/app/Landing/ActivityFeed/Bill/{id}/{id} ⧉ Info` | — | 0 | — |
| `/app/Landing/ActivityFeed/Bill/{id}/{id} ⧉ Item` | — | 0 | Add Line Item |
| `/app/Landing/QuickAction/Bill/0/{id}` | Bill, Lien Waiver | 16 | Apply filter, Link schedule item, Add from catalog, + Add approver, Add, Create new doc, Save draft, Save to Job, Mark Ready for Payment |
| `/app/Landing/QuickAction/Bill/0/{id} ⧉ Info` | — | 0 | — |

### Fields (UI)

Actions (column) · Amount paid (column) · Bill # (column) · Bill # (text) · Bill amount (column) · Bill title (column) · Builder cost (column) · Column with Header Selection (checkbox) · Columns (select) · Cost code (column) · Cost type (column) · Date paid (date) · Due date (date) · Invoice date (date) · Job (column) · Job (select) · Name (text) · PO # (column) · PO Status (column) · Pay to (column) · Pay to (select) · Press Space to toggle row selection (unchecked) (checkbox) · Purchase Order (select) · Quantity (column) · Remaining balance (column) · Send to Xero (checkbox) · Title (column) · Title (text) · Type (select) · Unit (column) · Unit cost (column) · Work Status (column) · feedbackText (textarea)

### Enums and dropdown options

- Type: Bill / Receipt / Vendor Credit
- data.columnsList: Job / Bill # / Bill title / Pay to / Bill amount / Amount paid / Remaining balance / Invoice date / Due date / Bill status / Approvers / Date paid / Paid by / Type / Source / Created date / Files / Comments / Variance codes / Cost codes / Related POs / Lien waivers / Xero status / Related invoices / Created by / Description / Linked item status / Name of Supervisor / Work Status? / Bill Status? / Referral (Estimator) / Franchisee
- data.lineItems.defaults.costTypes.options[].options: None / Labor / Material / Equipment / Subcontractor / Other
- data.lineItems.defaults.markupTypeOptions.value: % / $ / C/P / $/unit
- data.lineItems.defaults.varianceCodeOptions.value: --Please Select-- / 001 - Global Supply Chain Disruption / 005 - Variance TBC / 010 - Sales Error / 020 - Admin Error / 030 - Take-off error / 040 - Estimator Error / 050 - Supervisor Error / 060 - Drafting Error / 070 - Price Change / 080 - Maintenance / 090 - Site conditions / 100 - Trade Error/Damage / 110 - Vandalism /Theft / 120 - Public Relations / 130 - Promotion / 700 - Customer Change Order

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/v1/bills/{id}` | — | data, accountingInfo, accountingInfo.accountingSectionTitle, accountingInfo.accountingType, accountingInfo.allowAccountingBillCreation, accountingInfo.billSyncOption, accountingInfo.billToOwnerCheckbox, accountingInfo.billToOwnerCheckbox.title, accountingInfo.billToOwnerCheckbox.validators, accountingInfo.billToOwnerCheckbox.value, accountingInfo.billedStatus, accountingInfo.billedStatusValue, accountingInfo.canRefreshBilledStatus, accountingInfo.canResyncToAccounting, accountingInfo.canShowValidationSummary, accountingInfo.externalAccountingLink, accountingInfo.hasDeletableBills, accountingInfo.hasPendingBillEdits, accountingInfo.hideNegativeAccountingCheckbox, accountingInfo.isTaxPayable, accountingInfo.lastAccountingSyncDateText, accountingInfo.payOnlineButtonMessage, accountingInfo.resyncToAccountingBannerText, accountingInfo.resyncToAccountingMessageText, accountingInfo.sendToAccountingCheckbox, accountingInfo.shouldValidateSalesTax, accountingInfo.syncToAccountingOverride, accountingInfo.taxWarningMessage, accountingInfo.warningMessage, addedDate, allowBillEditSyncs, amountPaid, apRetainageProductServiceId, approvals, approvals[].approvalCommentData, approvals[].approvalId, approvals[].approverName, approvals[].globalUserId, approvals[].mode, approvals[].status, … (+488) |
| GET | `/api/v1/bills/defaultinfo?isBillRemainingAction=&jobId=` | — | data, accountingInfo, accountingInfo.accountingSectionTitle, accountingInfo.accountingType, accountingInfo.allowAccountingBillCreation, accountingInfo.billSyncOption, accountingInfo.billToOwnerCheckbox, accountingInfo.billedStatus, accountingInfo.billedStatusValue, accountingInfo.canRefreshBilledStatus, accountingInfo.canResyncToAccounting, accountingInfo.canShowValidationSummary, accountingInfo.externalAccountingLink, accountingInfo.hasDeletableBills, accountingInfo.hasPendingBillEdits, accountingInfo.hideNegativeAccountingCheckbox, accountingInfo.isTaxPayable, accountingInfo.lastAccountingSyncDateText, accountingInfo.payOnlineButtonMessage, accountingInfo.resyncToAccountingBannerText, accountingInfo.resyncToAccountingMessageText, accountingInfo.sendToAccountingCheckbox, accountingInfo.sendToAccountingCheckbox.title, accountingInfo.sendToAccountingCheckbox.validators, accountingInfo.sendToAccountingCheckbox.value, accountingInfo.shouldValidateSalesTax, accountingInfo.syncToAccountingOverride, accountingInfo.taxWarningMessage, accountingInfo.warningMessage, addedDate, allowBillEditSyncs, amountPaid, apRetainageProductServiceId, approvals, assignedTo, assignedTo.options, assignedTo.options[].name, assignedTo.options[].options, assignedTo.options[].type, assignedTo.title, … (+365) |
| GET | `/apix/v2/Bills/preferences/default-format` | — | defaultIsItemized |
| POST | `/api/v1/bills/grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, accountingIntegrationName, accountingIntegrationType, accountingReauthBannerMessage, accountingReauthBannerTitle, billSyncOption, billsToApproveCount, canAdd, canCreateOwnerInvoice, canDelete, canEmailLienWaivers, canMarkAsBillableToOwner, canMarkReadyForPayment, canPayInFull, canPayOnline, canPrintLienWaivers, canSendToAccounting, canUpdate, canUpdateAccountingStatus, canUpdateOwnerInvoice, canVoid, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, … (+135) |
| POST | `/apix/v2/Bills/grid-permissions` | jobIds | canPayInFull, canPayOnline, showPayOnlineMarketing |
| POST | `/apix/v2/Bills/tab-counts` | filters, filters.{key}, jobIds | draftBillsCount, inReviewBillsCount, otherBillsCount, paidBillsCount, paymentsSetupPromptBannerDefaultExpanded, readyForPaymentBillsCount, showPaymentsSetupPromptBanner, showReadyForPaymentBanner |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| GET | `/apix/v2/Bills/approval-users/{id}` | blocked during crawl | — (via btn:+ Add approver) |
| POST | `/api/Bills/ApplyLienWaiverInfo` | app bundle (not fired) | — |
| PUT | `/api/v1/Bills/RemapBillCost` | app bundle (not fired) | — |
| POST | `/api/v1/bills` | app bundle (not fired) | — |
| POST | `/api/v1/bills/ApplyLienWaiverInfo` | app bundle (not fired) | — |
| PUT | `/api/v1/bills/ApplyLienWaivers` | app bundle (not fired) | — |
| POST | `/api/v1/bills/CopyBills` | app bundle (not fired) | — |
| POST | `/api/v1/bills/GetMassVoidAlertInfo` | app bundle (not fired) | — |
| PUT | `/api/v1/bills/SyncAccountingStatus` | app bundle (not fired) | — |
| DELETE/PUT | `/api/v1/bills/{p}` | app bundle (not fired) | — |
| POST | `/api/v1/bills/{p}/updatebillingstatus` | app bundle (not fired) | — |
| PUT | `/api/v1/bills/{p}/void` | app bundle (not fired) | — |
| PUT | `/apix/v2/Bills/ap-retainage-product-service` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/approval-queue/grid` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Bills/bulk-delete` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/bulk-ocr-upload` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/bulk-void` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/dismiss-duplicated-bills` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/export-to-accounting` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/mass-pay-offline` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/mass-pay-offline-info` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/mass-pay-online` | app bundle (not fired) | — |
| PUT | `/apix/v2/Bills/mass-send-for-approval` | app bundle (not fired) | — |
| PUT | `/apix/v2/Bills/mass-update-approval-status` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/ocr-upload` | app bundle (not fired) | — |
| PUT | `/apix/v2/Bills/preferences/default-format` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/reassign-cost-codes` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/release-retainage` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/release-retainage-info` | app bundle (not fired) | — |
| POST | `/apix/v2/Bills/split-suggestion/rejection` | app bundle (not fired) | — |
| POST/PUT | `/apix/v2/Bills/{p}/split` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/bills` | app bundle (not fired) | — |
| POST | `/apix/v3/Bills/print` | app bundle (not fired) | — |
| PUT | `/apix/v3/Bills/{p}/sync-now` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/v1/Bills/GetBillMapping` · `? /api/v1/bills/ExportToExcel` · `GET /api/v1/bills/GetBillLineItemIds` · `GET /api/v1/bills/GetDocInstancesForLienWaivers` · `GET /apix/v2/Bills/bulk-ocr-upload/processing-status` · `GET /apix/v2/Bills/get-available-purchase-orders/{p}/{p}/{p}` · `GET /apix/v2/Bills/split-suggestion` · `GET /apix/v2/Bills/{p}/accounting-job-statuses`

## Purchase orders

- **VIABUILD equivalent:** `purchase_orders`, `purchase_order_line_items`, `po_responses`, `purchase_order_documents`
- **Gateway verbs:** `pos.list`, `pos.get`, `pos.linkedBills`, `pos.linkedBids`, `pos.approvals`, `pos.create` (not_captured), `pos.update`
- **Coverage:** 18 screens/modals · 5 read endpoints · 0 blocked writes · bundle APIs reached 5/31

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id}` | — | 17 | Apply filter, Add, Create new doc, Create RFI, Mark Work Complete, Recall |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id} ⧉ Info` | — | 0 | — |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs` | Plans, Specs | 0 | Add, Create new doc, Create RFI, Mark Work Complete, Recall |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs ⧉ Add` | — | 1 | Drop files here to upload, or browse for files Browse device, Create |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs ⧉ Create new doc` | — | 0 | — |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs ⧉ Info` | — | 0 | — |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs ⧉ Purchase order author info` | — | 0 | — |
| `/app/Landing/ActivityFeed/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs ⧉ View Plans and Specs` | Plans, Specs | 0 | Add, Create new doc, Create RFI, Mark Work Complete, Recall, More › Void, More › Delete |
| `/app/Landing/QuickAction/PurchaseOrder/0/{id}` | — | 13 | Apply filter, Add, Create new doc, Add From, New Bill, Save |
| `/app/Landing/QuickAction/PurchaseOrder/0/{id} ⧉ Add` | — | 1 | Drop files here to upload, or browse for files Browse device |
| `/app/Landing/QuickAction/PurchaseOrder/0/{id} ⧉ Create new doc` | — | 0 | — |
| `/app/Landing/QuickAction/PurchaseOrder/0/{id} ⧉ Info` | — | 0 | — |
| `/app/PurchaseOrders` | Purchase Orders, Bills | 14 | Pay to, Freeze Pay to column, Apply filter |
| `/app/PurchaseOrders/PurchaseOrder/{id}/{id}` | Purchase Orders, Bills | 21 | Apply filter, Add, Create new doc, Create RFI, Mark Work Complete, Recall |
| `/app/PurchaseOrders/PurchaseOrder/{id}/{id} ⧉ Info` | — | 0 | — |
| `/app/PurchaseOrders/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs` | Plans, Specs | 0 | Add, Create new doc, Create RFI, Mark Work Complete, Recall |
| `/app/PurchaseOrders/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs ⧉ Info` | — | 0 | — |
| `/app/PurchaseOrders/PurchaseOrder/{id}/{id} ⧉ View Plans and Specs ⧉ View Plans and Specs` | Plans, Specs | 0 | Add, Create new doc, Create RFI, Mark Work Complete, Recall |

### Fields (UI)

Actions (column) · Allow Subs / Vendors to view attached files. (checkbox) · Amount paid (column) · Assigned to (select) · Bill # (column) · Bill amount (column) · Bill title (column) · Billed Amount (column) · Billed Percent (column) · Builder Cost (column) · Choose date (radio) · Column with Header Selection (checkbox) · Cost type (column) · Date Paid (column) · Due Date (column) · ID# (column) · Internal Notes (textarea) · Invoice Date (column) · Items (column) · Job (column) · Linked To (column) · Mark as a Variance PO (checkbox) · Materials Only (checkbox) · PO # (column) · PO Status (column) · Paid By (column) · Pay to (column) · Press Space to toggle row selection (unchecked) (checkbox) · Purchase Order # (text) · Quantity (column) · Remaining balance (column) · Status (column) · Title (column) · Title (text) · Unit (column) · Unit cost (column) · Work Status (column)

### Enums and dropdown options

- data.columnsList: Actions / PO # / Title / PO Status / Work Status / Cost Codes / Paid / Variance Codes / Job / Cost / Amount Paid / Amount Remaining / Est. Complete / Created Date / Created By / From Estimate / RFIs / Comments / Files / Performed By / Lien Waivers / Related Bids / Related COs / Related Selections / % Paid / % Remaining / % Total Billed / PO Checklist / Supervisor Contact Detail
- data.lineItems.defaults.costTypes.options[].options: None / Labor / Material / Equipment / Subcontractor / Other
- data.lineItems.defaults.markupTypeOptions.value: % / $ / C/P / $/unit
- data.lineItems.defaults.varianceCodeOptions.value: --Please Select-- / 001 - Global Supply Chain Disruption / 005 - Variance TBC / 010 - Sales Error / 020 - Admin Error / 030 - Take-off error / 040 - Estimator Error / 050 - Supervisor Error / 060 - Drafting Error / 070 - Price Change / 080 - Maintenance / 090 - Site conditions / 100 - Trade Error/Damage / 110 - Vandalism /Theft / 120 - Public Relations / 130 - Promotion / 700 - Customer Change Order

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/PurchaseOrders/{id}?isViewingFromAmendment=` | — | data, accountingType, addCostGroupButton, addCostGroupButton.buttonColor, addCostGroupButton.buttonName, amountPaidOrSaved, amountRemaining, amountRemaining.validators, amountRemaining.validators[].errorMessage, amountRemaining.validators[].type, amountRemaining.validators[].value, amountRemaining.value, approvalDetails, approvalDetails.comments, approvalDetails.comments.validators, approvalDetails.comments.value, approvalDetails.signature, approvalDetails.status, approvalDetails.statusText, approvedDocInstanceId, approvedLienWaiverCount, assignedStatus, assignedStatus.actions, assignedStatus.actions[].buttonColor, assignedStatus.actions[].buttonName, assignedStatus.actions[].extraData, assignedStatus.actions[].id, assignedStatus.actions[].message, assignedStatus.actions[].signatureRequired, assignedStatus.extraData, assignedStatus.message, assignedStatus.name, assignedStatus.value, assignedTo, assignedTo.options, assignedTo.options[].name, assignedTo.options[].options, assignedTo.options[].type, assignedTo.title, assignedTo.type, … (+555) |
| GET | `/api/PurchaseOrders/{id}/LinkedBills` | — | data, accountingIconSrc, accountingIntegrationType, bills, bills[].amount, bills[].amount.scale, bills[].amount.value, bills[].billId, bills[].billNumber, bills[].billedStatus, bills[].billedStatusText, bills[].documentType, bills[].dueDate, bills[].hasPaidOrProcessingOnlinePayment, bills[].invoiceDate, bills[].isBilled, bills[].isInRequestedStatus, bills[].isSubRequested, bills[].isTemplateView, bills[].lienWaiverStatus, bills[].linkedScheduleTitle, bills[].paidByDate, bills[].paidByName, bills[].paidDate, bills[].paidToName, bills[].paymentMethodName, bills[].percentAmount, bills[].showPrompt, bills[].status, bills[].statusText, bills[].title, canCreateBill, canRequestNew, holdPaymentsMessage, onlinePaymentsEnabled, totalAmount, totalAmount.scale, totalAmount.value, totalPercentage |
| GET | `/api/PurchaseOrders/DefaultInfo?jobId=` | — | data, accountingType, addCostGroupButton, addCostGroupButton.buttonColor, addCostGroupButton.buttonName, amountRemaining, amountRemaining.validators, amountRemaining.validators[].errorMessage, amountRemaining.validators[].type, amountRemaining.validators[].value, amountRemaining.value, approvalDetails, approvalDetails.comments, approvalDetails.comments.validators, approvalDetails.comments.value, approvalDetails.signature, approvalDetails.status, approvalDetails.statusText, assignedStatus, assignedStatus.actions, assignedStatus.extraData, assignedStatus.message, assignedStatus.name, assignedStatus.value, assignedTo, assignedTo.options, assignedTo.options[].name, assignedTo.options[].options, assignedTo.options[].type, assignedTo.title, assignedTo.type, assignedTo.validators, assignedTo.validators[].errorMessage, assignedTo.validators[].type, assignedTo.validators[].value, assignedTo.value, attachedFilesPreApproval, attachedFilesPreApproval.files, attachedFilesPreApproval.newFileOptions, attachedFilesPreApproval.newFileOptions.canEdit, … (+362) |
| GET | `/apix/v2/PurchaseOrders/linked-bids?JobId=&PurchaseOrderId=` | — | availableBids, canLinkBids, linkedBids |
| POST | `/api/PurchaseOrders/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.selectedSystemFilter, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow | data, accountingReauthBannerMessage, accountingReauthBannerTitle, canAdd, canDelete, canPayInFull, canPayOnline, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].amountPaid, data[].amountRemaining, data[].approvalStatus, data[].approvalStatus.additionalInfo, data[].approvalStatus.approvalStatus, data[].approvalStatus.approvalStatusText, data[].approvalStatus.isRecalled, data[].approvalStatus.lastUpdatedDate, … (+100) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/PurchaseOrders` | app bundle (not fired) | — |
| DELETE | `/api/PurchaseOrders/BulkDeletePurchaseOrders` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/CopyPurchaseOrders` | app bundle (not fired) | — |
| PUT | `/api/PurchaseOrders/External` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/MapLineItemsToExistingPurchaseOrders` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/MapLineItemsToNewPurchaseOrders` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/MarkMultiple` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/MassBillRemaining` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/MassPayOnline` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/Print` | app bundle (not fired) | — |
| PUT | `/api/PurchaseOrders/UpdatePurchaseOrderStatuses` | app bundle (not fired) | — |
| DELETE/PUT | `/api/PurchaseOrders/{p}` | app bundle (not fired) | — |
| PUT | `/api/PurchaseOrders/{p}/ImportBids` | app bundle (not fired) | — |
| PUT | `/api/PurchaseOrders/{p}/ReviewAssignedStatus` | app bundle (not fired) | — |
| PUT | `/api/PurchaseOrders/{p}/ReviewCurrentStatus` | app bundle (not fired) | — |
| POST | `/api/PurchaseOrders/{p}/Void` | app bundle (not fired) | — |
| POST | `/apix/v2/PurchaseOrders/external/print` | app bundle (not fired) | — |
| PUT | `/apix/v2/PurchaseOrders/mass-approve` | app bundle (not fired) | — |
| POST | `/apix/v2/PurchaseOrders/purchase-order-amendment` | app bundle (not fired) | — |

### Bundle read APIs not reached

`? /api/PurchaseOrders/ExportToExcel` · `POST /api/PurchaseOrders/GetMassBillRemaining` · `POST /api/PurchaseOrders/GetPoMapping` · `GET /api/PurchaseOrders/GetPurchaseOrdersFromTitleMapping` · `? /api/PurchaseOrders/GetSubsWithNoEmail` · `GET /api/PurchaseOrders/ValidateAccountingForMassPay` · `GET /apix/v2/PurchaseOrders/available-users` · `GET /apix/v2/PurchaseOrders/linked-bids-import-data`

## Bids

- **VIABUILD equivalent:** `quote_packages`, `quote_requests`, `quote_responses`, `quote_response_items`
- **Gateway verbs:** none
- **Coverage:** 6 screens/modals · 2 read endpoints · 0 blocked writes · bundle APIs reached 2/29

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Bid/0` | — | 0 | — |
| `/app/Bid/0/{id}/0/0` | — | 0 | — |
| `/app/BidPackage/0` | — | 0 | — |
| `/app/BidPackage/0/{id}` | General, Requests | 9 | Save, Send |
| `/app/BidPackages` | — | 0 | — |
| `/app/Landing/QuickAction/BidPackage/0/{id}` | General, Requests | 9 | — |

### Fields (UI)

Allow multiple approved bids (checkbox) · Choose date (radio) · Cost type (column) · Items (column) · Quantity (column) · Title (text) · Unit (column) · alertDaysBeforeDeadline (number) · internalNotes (textarea)

### Enums and dropdown options

- data.lineItems.defaults.costTypes.options[].options: None / Labor / Material / Equipment / Subcontractor / Other
- data.lineItems.defaults.markupTypeOptions.value: % / $ / C/P / $/unit

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/BidPackages/DefaultInfo?jobId=` | — | data, alertDaysBeforeDeadline, allowMultipleBids, allowMultipleBids.validators, allowMultipleBids.validators[].errorMessage, allowMultipleBids.validators[].type, allowMultipleBids.validators[].value, allowMultipleBids.value, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, attachedFiles.viewingPermissions.maxFileSize, attachedFiles.viewingPermissions.maxFiles, attachedFiles.viewingPermissions.minFileSize, attachedFiles.viewingPermissions.videoDurationLimit, … (+250) |
| GET | `/api/Bids/0` | — | reason |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST/DELETE | `/api/BidPackages` | app bundle (not fired) | — |
| POST | `/api/BidPackages/Copy` | app bundle (not fired) | — |
| POST | `/api/BidPackages/Print` | app bundle (not fired) | — |
| PUT | `/api/BidPackages/release` | app bundle (not fired) | — |
| DELETE/PUT | `/api/BidPackages/{p}` | app bundle (not fired) | — |
| POST | `/api/BidPackages/{p}/BidStatus` | app bundle (not fired) | — |
| POST | `/api/BidPackages/{p}/Unrelease` | app bundle (not fired) | — |
| DELETE | `/api/Bids/DeleteBids` | app bundle (not fired) | — |
| DELETE | `/api/Bids/DeleteBidsByBidPackageId` | app bundle (not fired) | — |
| DELETE | `/api/Bids/DeleteDivision` | app bundle (not fired) | — |
| DELETE | `/api/Bids/DeleteDivisions` | app bundle (not fired) | — |
| DELETE | `/api/Bids/DeleteDivisionsByBidPackageId` | app bundle (not fired) | — |
| PUT | `/api/Bids/External` | app bundle (not fired) | — |
| PUT | `/api/Bids/Setup` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Bids/{p}` | app bundle (not fired) | — |
| POST | `/api/Bids/{p}/Review` | app bundle (not fired) | — |
| PUT | `/api/Proposals/SaveBidLineItemMarkup` | app bundle (not fired) | — |
| POST | `/apix/v2/Bids/bulk-resend-invite` | app bundle (not fired) | — |
| POST | `/apix/v2/Bids/{p}/approve` | app bundle (not fired) | — |
| POST | `/apix/v2/Bids/{p}/parse-quote` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/BidPackages/Divisions` · `? /api/BidPackages/ExportToExcel` · `POST /api/BidPackages/Grid` · `GET /api/BidPackages/SubDetails` · `POST /api/Bids/Grid` · `GET /api/Bids/Print` · `GET /apix/v2/BidPackages/sub-bid` · `GET /apix/v2/BidPackages/{p}/responses`

## Estimates / proposals

- **VIABUILD equivalent:** `estimates`, `estimate_sections`, `estimate_line_items`, `estimate_templates`
- **Gateway verbs:** `estimates.worksheet`, `estimates.updateLine` (not_captured), `estimates.addLines` (not_captured), `estimates.sendToBudget` (send, locked)
- **Coverage:** 14 screens/modals · 7 read endpoints · 0 blocked writes · bundle APIs reached 7/80

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Estimate` | — | 6 | More › Create bid package, More › Create purchase order, More › Add to existing purchase order, More › Create invoice, More › Add to existing invoice |
| `/app/Estimate ⧉ Collapse all` | — | 0 | — |
| `/app/Estimate/{id}/0/0` | — | 6 | More › Create bid package, More › Create purchase order, More › Add to existing purchase order, More › Create invoice, More › Add to existing invoice |
| `/app/Estimate/{id}/0/0 ⧉ Collapse all` | — | 0 | — |
| `/app/Estimate/0/BuildProposal` | Details, Client preview | 9 | — |
| `/app/Estimate/0/BuildProposal ⧉ Info` | — | 0 | — |
| `/app/Estimate/0/Print` | — | 0 | — |
| `/app/Estimate/0/Proposal/0` | Details, Client preview | 6 | — |
| `/app/Estimate/0/Proposal/0 ⧉ Info` | — | 0 | — |
| `/app/Estimate/0/Proposals/0` | — | 6 | More › Create bid package, More › Create purchase order, More › Add to existing purchase order, More › Create invoice, More › Add to existing invoice |
| `/app/Estimate/0/Proposals/0 ⧉ Collapse all` | — | 0 | — |
| `/app/Estimate/0/Proposals/0/Print` | — | 0 | — |
| `/app/Landing/QuickAction/Lead/{id}/LeadProposal/0` | — | 0 | Apply filter |
| `/app/leads/proposals` | List view, Activity view, Activity calendar, Activity templates, Lead proposals, Proposal templates, Map | 46 | Apply filter |

### Fields (UI)

Activity Links Clicked (column) · Age (column) · Approval deadline (date) · Cell Phone (column) · Centered (radio) · Client Contact (column) · Client Price (column) · Column (radio) · Column with Header Selection (checkbox) · Confidence (column) · Cost code (column) · Created Date (column) · Description (column) · Email Address (column) · Estimated Revenue (column) · Estimated Revenue Max (column) · Estimated Revenue Min (column) · Files (column) · First Name (column) · Include specsEmbed specifications directly within each estimate group. Double ch (checkbox) · Last Activity Link Click (column) · Last Contacted (column) · Last Name (column) · Lead Status (column) · Map (column) · Markup (column) · Next Activity (column) · Notes (column) · Oct 25 - Oct 31, 2026 (date) · Opportunity Title (column) · Phone (column) · Press Space to toggle row selection (unchecked) (checkbox) · Project Type (column) · Projected Sales Date (column) · Proposal Last Viewed (column) · Proposal Status (column) · Proposal Title (column) · Quantity (column) · Related Job (column) · Salesperson (column) · Select users to sign (select) · Show Address (checkbox) · Show Client Contact Name and Phone (checkbox) · Show Printout Information (checkbox) · Sold Date (column) · Source (column) · State (Contact) (column) · State (Opportunity) (column) · Street (Contact) (column) · Street (Opportunity) (column) · Suburb (Contact) (column) · Suburb (Opportunity) (column) · Tags (column) · Template Description (column) · Template Name (column) · Title (column) · Title (text) · Total Builder Cost (column) · Zip Code (Contact) (column) · Zip Code (Opportunity) (column)

### Enums and dropdown options

- data.columnsList: Template Name / Template Description / Total Builder Cost / Markup / Total Client Price / Created By / Created Date
- settings.columnsToDisplay.options[].options: Item title / Cost code / Description / Cost type / Marked as / Specs / Qty / unit / Builder unit cost / Builder total cost / Markup / Markup amount / Unit price / Price / Subgroup price / Parent group price / Total cost / Total markup / Total approved options / Subtotal / Total price / Tax / Tax status

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Proposals/{id}/Worksheet` | — | data, accountingIntegrationType, alreadyInvoicedAmount, assemblies, assemblies[].disableIndividualSelection, assemblies[].disabled, assemblies[].extraData, assemblies[].extraData.isDeleted, assemblies[].extraData.takeoffAssemblyId, assemblies[].id, assemblies[].key, assemblies[].name, assemblies[].secondaryName, assemblies[].selected, builderId, canAddAllowances, canAddSelections, canEditBudget, canLaunchTakeoff, canSendToHomeDepotCart, canUpdateOwnerInvoices, connectedTakeoffPartners, connectedTakeoffPartners[].id, connectedTakeoffPartners[].name, contractPrice, costCategories, costCategoriesWithParent, costCategoriesWithParent[].id, costCategoriesWithParent[].name, costCategories[].disableIndividualSelection, costCategories[].disabled, costCategories[].extraData, costCategories[].id, costCategories[].key, costCategories[].name, costCategories[].secondaryName, costCategories[].selected, costCodes, costCodes[].costCategoryId, costCodes[].id, … (+133) |
| GET | `/api/Proposals/0/PreviousDocs?forLead=` | — | data, listMetadata, listMetadata.emptyStatesMetadata, listMetadata.emptyStatesMetadata.hasDismissedAlert, listMetadata.emptyStatesMetadata.hasFilteredData, listMetadata.emptyStatesMetadata.helpLink, listMetadata.emptyStatesMetadata.isMissingRequiredParentEntities, listMetadata.emptyStatesMetadata.isNewToEntity, listMetadata.emptyStatesMetadata.isReadOnly, listMetadata.hasData, proposalDashboardItems, proposalHistoricalDocs |
| GET | `/apix/v2/Proposals/builder/{id}/job/{id}/proposal/{id}/proposal-review` | — | canSign, clientUserCountOnJob, currentDate, documentInstanceId, entitySignatureRequestId, hasEntitySignatureRequest, isSigningResolved, proposal, proposal.approvalDeadline, proposal.attachedFilesBase, proposal.attachedFilesBase.files, proposal.attachedFilesBase.newFileOptions, proposal.attachedFilesBase.title, proposal.attachedFilesBase.viewingPermissions, proposal.baseBuilderCost, proposal.baseMarkupAmount, proposal.baseOwnerPrice, proposal.baseSubtotal, proposal.baseTotalPriceWithTax, proposal.baseTotalTax, proposal.builderAddress, proposal.builderAddress.countryDropdown, proposal.builderAddress.countryDropdownId, proposal.builderAddress.fields, proposal.builderAddress.formattedAddressNoStreet, proposal.builderAddress.globalCountry, proposal.builderAddress.layout, proposal.builderAddress.location, proposal.builderAddress.stateDropdown, proposal.builderAddress.stateDropdownId, proposal.builderAddress.validators, proposal.builderId, proposal.builderInfo, proposal.builderInfo.additionalFields, proposal.builderInfo.companyName, proposal.builderInfo.fax, proposal.builderInfo.logo, proposal.builderInfo.phone, proposal.closingText, proposal.customerAddress, … (+84) |
| GET | `/apix/v2/Proposals/draft?jobId=` | — | jobInfo, jobInfo.builderId, jobInfo.canView, jobInfo.contractType, jobInfo.entityHasContact, jobInfo.id, jobInfo.isLegacyBudgetSunset, jobInfo.isStandaloneTemplate, jobInfo.jobStatus, jobInfo.name, jobInfo.ownerCell, jobInfo.ownerEmail, jobInfo.ownerName, jobInfo.ownerPhone, jobInfo.portal, jobInfo.userId, proposal, proposal.approvalDeadline, proposal.attachedFilesBase, proposal.attachedFilesBase.files, proposal.attachedFilesBase.newFileOptions, proposal.attachedFilesBase.title, proposal.attachedFilesBase.viewingPermissions, proposal.baseBuilderCost, proposal.baseMarkupAmount, proposal.baseOwnerPrice, proposal.baseSubtotal, proposal.baseTotalPriceWithTax, proposal.baseTotalTax, proposal.builderAddress, proposal.builderAddress.countryDropdown, proposal.builderAddress.countryDropdownId, proposal.builderAddress.fields, proposal.builderAddress.formattedAddressNoStreet, proposal.builderAddress.globalCountry, proposal.builderAddress.layout, proposal.builderAddress.location, proposal.builderAddress.stateDropdown, proposal.builderAddress.stateDropdownId, proposal.builderAddress.validators, … (+100) |
| GET | `/apix/v2/Proposals/job/{id}/worksheet/0/proposal/0/readonly` | — | reason |
| POST | `/api/LeadProposal/Grid` | gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize | data, canAdd, canDelete, canDownloadExcel, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].builderId, data[].createdBy, data[].createdDate, data[].customerContact, data[].id, data[].jobId, data[].lastViewed, data[].leadId, data[].opportunityStatus, data[].opportunityTitle, data[].opportunityTitle.leadId, … (+39) |
| POST | `/api/LeadProposal/GridTemplate` | gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll | data, canAdd, canDelete, canDownloadExcel, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].builderId, data[].createdBy, data[].createdDate, data[].description, data[].id, data[].jobId, data[].leadId, data[].markup, data[].markup.scale, data[].markup.value, data[].ownerPrice, … (+26) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| PUT | `/api/Estimates/Setup` | app bundle (not fired) | — |
| DELETE | `/api/LeadProposal` | app bundle (not fired) | — |
| PUT | `/api/LeadProposal/ExternalApprove` | app bundle (not fired) | — |
| PUT | `/api/LeadProposal/ExternalPayOnline` | app bundle (not fired) | — |
| POST | `/api/LeadProposal/GetImportConflicts` | app bundle (not fired) | — |
| PUT | `/api/LeadProposal/PayOnline` | app bundle (not fired) | — |
| DELETE/PUT | `/api/LeadProposal/{p}` | app bundle (not fired) | — |
| PUT | `/api/LeadProposal/{p}/ImportProposalTemplate` | app bundle (not fired) | — |
| PUT | `/api/LeadProposal/{p}/Review` | app bundle (not fired) | — |
| POST | `/api/Leads/ImportProposal` | app bundle (not fired) | — |
| POST | `/api/Leads/{p}/Proposal` | app bundle (not fired) | — |
| PUT | `/api/LineItems/UpdateEstimateLineItem` | app bundle (not fired) | — |
| DELETE | `/api/Proposals/DeleteExistingEstimates` | app bundle (not fired) | — |
| PUT | `/api/Proposals/SavePrintSettings` | app bundle (not fired) | — |
| POST | `/api/Proposals/{p}/ExportToExcel` | app bundle (not fired) | — |
| PUT | `/api/Proposals/{p}/Notify` | app bundle (not fired) | — |
| PUT | `/api/Proposals/{p}/SaveLineItemDisplayPreference` | app bundle (not fired) | — |
| PUT | `/api/Proposals/{p}/SaveWorksheetDisplayPreference` | app bundle (not fired) | — |
| PUT | `/api/Proposals/{p}/SetLockedStatus` | app bundle (not fired) | — |
| POST | `/api/RiskInsurance/BuilderProposalForm` | app bundle (not fired) | — |
| POST | `/apix/v2/AIEstimate/generations/{p}/rating` | app bundle (not fired) | — |
| POST | `/apix/v2/Allowances/convert-estimate-line-items-to-allowance` | app bundle (not fired) | — |
| POST | `/apix/v2/Contracts/prime/import-from-estimates` | app bundle (not fired) | — |
| PUT | `/apix/v2/Estimates/bulk-update-markup` | app bundle (not fired) | — |
| PUT | `/apix/v2/Estimates/bulk-update-taxable-status/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Estimates/compare-against-snapshot` | app bundle (not fired) | — |
| PUT | `/apix/v2/Estimates/copy-to-worksheet` | app bundle (not fired) | — |
| PUT | `/apix/v2/Estimates/proposal-template-to-estimate` | app bundle (not fired) | — |
| POST | `/apix/v2/LineItems/add-estimate-line-items` | app bundle (not fired) | — |
| PUT | `/apix/v2/LineItems/estimate-format-items/bulk` | app bundle (not fired) | — |
| PUT | `/apix/v2/LineItems/update-estimate-line-item` | app bundle (not fired) | — |
| POST | `/apix/v2/PreliminaryEstimate/bulk-delete` | app bundle (not fired) | — |
| POST | `/apix/v2/PreliminaryEstimate/generate` | app bundle (not fired) | — |
| POST | `/apix/v2/PreliminaryEstimate/save` | app bundle (not fired) | — |
| POST/PUT | `/apix/v2/Proposals/approve-decline` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/approve-decline-options` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/draft` | app bundle (not fired) | — |
| POST | `/apix/v2/Proposals/draft-pending-signature` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/print-settings` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/release` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/reminder` | app bundle (not fired) | — |
| POST | `/apix/v2/Proposals/snapshot-excel` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/unrelease` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/{p}/approve-decline-external` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/{p}/approve-decline-options-external` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Proposals/{p}/format-groups` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/{p}/preview-layout-options` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/{p}/recategorize-format` | app bundle (not fired) | — |
| PUT | `/apix/v2/Proposals/{p}/show-additional-print-info` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Subscription/estimate` | app bundle (not fired) | — |
| POST | `/apix/v3/Estimates/send-to-budget` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Estimates/GeneralItemsForMapping` · `GET /api/ImportWizard/GetAccountingEstimates` · `GET /api/LeadProposal/DefaultProposalTemplate` · `? /api/LeadProposal/ExportTemplatesToExcel` · `? /api/LeadProposal/ExportToExcel` · `GET /api/LeadProposal/External` · `GET /api/LeadProposal/ProposalTemplates` · `GET /api/LeadProposal/{p}/ExportToExcel` · `GET /api/LeadProposal/{p}/ReadOnly` · `GET /api/Leads/LeadsWithProposals` · `? /api/Proposals/GetPlanswiftPluginDownload` · `GET /api/RiskInsurance/{p}/BuilderProposalForm` · `POST /api/Subscription/GetEstimateForSubscription` · `GET /apix/v2/AIEstimate/recent-closed-jobs` · `GET /apix/v2/AIEstimate/templates` · `GET /apix/v2/PreliminaryEstimate/list` · `GET /apix/v2/PreliminaryEstimate/{p}` · `GET /apix/v2/Proposals/job/{p}/line-items/{p}` · `GET /apix/v2/Proposals/readonly` · `GET /apix/v2/Proposals/{p}/external` · `GET /apix/v2/Proposals/{p}/job-past-proposals` · `GET /apix/v2/Proposals/{p}/owner-past-proposals` · `GET /apix/v2/Proposals/{p}/worksheet/read-only`

## Budget / job costing

- **VIABUILD equivalent:** `job_budgets`, `job_budget_lines`, `cost_codes`
- **Gateway verbs:** `costing.header`, `costing.views`, `costing.lines`, `costing.searchCostCodes`
- **Coverage:** 7 screens/modals · 9 read endpoints · 0 blocked writes · bundle APIs reached 10/68

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/JobCostingBudget` | — | 11 | Apply filter |
| `/app/JobCostingBudget ⧉ Filter` | — | 0 | — |
| `/app/JobCostingBudget ⧉ Original budget costs` | — | 0 | — |
| `/app/JobCostingBudget ⧉ Projected profit info` | — | 0 | — |
| `/app/JobCostingBudget ⧉ Total revised price info` | — | 0 | — |
| `/app/JobFinancials` | — | 6 | — |
| `/app/JobFinancials ⧉ Info` | — | 0 | — |

### Fields (UI)

Actual costs (column) · Amount (column) · Choice (column) · Column with Header Selection (checkbox) · Committed costs (column) · Cost categories (column) · Cost codes (column) · Date (column) · Job costing (column) · Original budget costs (column) · Payment type (column) · Pending costs (column) · Press Space to toggle row selection (unchecked) (checkbox) · Price (column) · Revised budget costs (column) · Title (column) · View (select)

### Enums and dropdown options

- View: View options / Add new view / Full budget Default / Detailed View
- data.columnsList: Item / Cost Type / Marked As / Description / Unit Cost / Unit / Quantity / Builder Cost / Markup % / $/Unit / Markup / Client Price / Margin %
- data.costTypes.options[].options: None / Labor / Material / Equipment / Subcontractor / Other

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/CostCodeItems/DefaultInfo` | — | data, costCodes, costCodes[].disableIndividualSelection, costCodes[].disabled, costCodes[].extraData, costCodes[].extraData.costCategoryId, costCodes[].extraData.displayInactiveTag, costCodes[].extraData.flatRateCode, costCodes[].extraData.hasPurchaseTax, costCodes[].extraData.hasSalesTax, costCodes[].extraData.isActive, costCodes[].extraData.isTaxable, costCodes[].id, costCodes[].key, costCodes[].name, costCodes[].secondaryName, costCodes[].selected, costTypes, costTypes.options, costTypes.options[].name, costTypes.options[].options, costTypes.options[].type, costTypes.title, costTypes.type, costTypes.validators, costTypes.value, hasCostCodesFeature, markedAs, markedAs.options, markedAs.options[].name, markedAs.options[].options, markedAs.options[].type, markedAs.title, markedAs.type, markedAs.validators, markedAs.value |
| GET | `/api/CostCodeItems/GetPendingUpdateCountForEntities?entityIds=&entityType=&jobId=` | — | data, costItemUpdateMessage, hasPendingUpdates, pendingCostItemUpdates |
| GET | `/api/CostCodes/0/GetCostItems?formatType=` | — | data |
| GET | `/api/costCodes/AccountingLink` | — | data, accountingIntegrationTypeName, acctCostCodes, acctCostCodes[].disableIndividualSelection, acctCostCodes[].disabled, acctCostCodes[].extraData, acctCostCodes[].extraData.isActive, acctCostCodes[].extraData.isServiceItem, acctCostCodes[].extraData.markedForPurchasing, acctCostCodes[].extraData.stringId, acctCostCodes[].id, acctCostCodes[].key, acctCostCodes[].name, acctCostCodes[].secondaryName, acctCostCodes[].selected, btCostCodes, btCostCodes[].acctCostCodeLink, btCostCodes[].id, btCostCodes[].isActive, btCostCodes[].name, inactiveCostCodePostFix, noExpenseAccountAlertMessage |
| GET | `/apix/v2/JobCostingBudget/budget-cost-codes?jobId=` | — | costCodesWithBudget |
| GET | `/apix/v3/JobCostingBudget/{id}` | — | allGridColumns, allGridColumns[].align, allGridColumns[].columnType, allGridColumns[].customFieldMetadata, allGridColumns[].defaultWidth, allGridColumns[].enabled, allGridColumns[].id, allGridColumns[].isAlwaysIncluded, allGridColumns[].isAlwaysVisible, allGridColumns[].isCustomField, allGridColumns[].isExpandable, allGridColumns[].isFrozen, allGridColumns[].isHidden, allGridColumns[].isRemovableFromGrid, allGridColumns[].isResizeable, allGridColumns[].isSearchable, allGridColumns[].isSortable, allGridColumns[].jsonKey, allGridColumns[].name, allGridColumns[].order, allGridColumns[].toolTipHeader, allGridColumns[].type, allGridColumns[].width, defaultItem, defaultItem.addedByDate, defaultItem.addedById, defaultItem.builderId, defaultItem.canDelete, defaultItem.canEdit, defaultItem.canPrivate, defaultItem.columns, defaultItem.columns[].id, defaultItem.columns[].isFrozen, defaultItem.columns[].width, defaultItem.defaultPageSize, defaultItem.defaultViewId, defaultItem.globalUserId, defaultItem.gridSettings, defaultItem.gridType, defaultItem.gridView, … (+47) |
| POST | `/api/CostCodeItems/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, builderId, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].builderCost, data[].builderCost.scale, data[].builderCost.value, data[].builderId, data[].costCodeLink, data[].costItemCostTypes, data[].costItemLink, data[].costTitleAndCodeLink, data[].costTitleAndCodeLink.costCodeId, data[].costTitleAndCodeLink.costCodeTitle, data[].costTitleAndCodeLink.costItemId, … (+50) |
| POST | `/apix/v2/JobCostingBudget` | filter, jobId | accountingIntegrationType, accountingMethod, accountingName, budgetEmptyStateType, canUserUpgradeAccount, canViewLegacyBudget, costCategories, costCategories[].actualCosts, costCategories[].actualLaborHours, costCategories[].amountInvoiced, costCategories[].baselineCosts, costCategories[].builderVariance, costCategories[].committedCosts, costCategories[].costCodes, costCategories[].costCodes[].actualCosts, costCategories[].costCodes[].actualLaborHours, costCategories[].costCodes[].amountInvoiced, costCategories[].costCodes[].baselineCosts, costCategories[].costCodes[].builderVariance, costCategories[].costCodes[].committedCosts, costCategories[].costCodes[].costCategoryId, costCategories[].costCodes[].costToComplete, costCategories[].costCodes[].estimatedGrossProfit, costCategories[].costCodes[].hasAdjustments, costCategories[].costCodes[].id, costCategories[].costCodes[].isMarkedComplete, costCategories[].costCodes[].isProjectedCostAutoCalculated, costCategories[].costCodes[].jobId, costCategories[].costCodes[].originalBudgetCosts, costCategories[].costCodes[].originalBudgetQuantity, costCategories[].costCodes[].originalOwnerPrice, costCategories[].costCodes[].parentId, costCategories[].costCodes[].pendingCosts, costCategories[].costCodes[].percentInvoiced, costCategories[].costCodes[].profitPercentOverEstimated, costCategories[].costCodes[].projectedCostType, costCategories[].costCodes[].projectedCosts, costCategories[].costCodes[].projectedCostsWithoutAdjustments, costCategories[].costCodes[].projectedProfit, costCategories[].costCodes[].projectedProfitMargin, … (+127) |
| POST | `/apix/v2/JobCostingBudget/line-items` | costCodeIds, filter, jobId | approvedTimeClock, bids, bills, bills[].amount, bills[].customId, bills[].entityId, bills[].popover, bills[].title, budgetContractedProfits, budgetProjectedCostAdjustments, changeOrders, changeOrders[].amount, changeOrders[].customId, changeOrders[].entityId, changeOrders[].popover, changeOrders[].title, committedVarianceBills, creditMemos, otherAccountingCosts, otherAccountingCostsPaid, ownerInvoices, ownerInvoices[].amount, ownerInvoices[].customId, ownerInvoices[].entityId, ownerInvoices[].popover, ownerInvoices[].title, pendingPurchaseOrders, pendingPurchaseOrders[].amount, pendingPurchaseOrders[].customId, pendingPurchaseOrders[].entityId, pendingPurchaseOrders[].popover, pendingPurchaseOrders[].title, pendingTimeClock, postLockAllowances, postLockEstimates, postLockSelections, preLockAllowances, preLockEstimates, preLockEstimates[].amount, preLockEstimates[].customId, … (+64) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/Budget` | app bundle (not fired) | — |
| PUT | `/api/Budget/MarkComplete` | app bundle (not fired) | — |
| PUT | `/api/Budget/Setup` | app bundle (not fired) | — |
| DELETE | `/api/Budget/{p}/DeleteView` | app bundle (not fired) | — |
| POST | `/api/Budget/{p}/ExpectedBudgetLineItems` | app bundle (not fired) | — |
| PUT | `/api/Budget/{p}/SetDefaultView` | app bundle (not fired) | — |
| PUT | `/api/Budget/{p}/UpdateView` | app bundle (not fired) | — |
| POST | `/api/CostCatalog/ShouldBreakLinkToCostItem` | app bundle (not fired) | — |
| POST/PUT | `/api/CostCodeItems` | app bundle (not fired) | — |
| DELETE | `/api/CostCodeItems/DeleteCostCodeItems` | app bundle (not fired) | — |
| PUT | `/api/CostCodeItems/MassUpdate` | app bundle (not fired) | — |
| PUT | `/api/CostCodeItems/SetUpdateTypesForJob` | app bundle (not fired) | — |
| DELETE | `/api/CostCodeItems/{p}/DeleteByCostCode` | app bundle (not fired) | — |
| DELETE | `/api/CostCodeItems/{p}/DeleteCostCodeItem` | app bundle (not fired) | — |
| POST/PUT | `/api/CostCodes` | app bundle (not fired) | — |
| PUT | `/api/CostCodes/AccountingImport` | app bundle (not fired) | — |
| PUT | `/api/CostCodes/AccountingLink` | app bundle (not fired) | — |
| PUT | `/api/CostCodes/ActiveStatus` | app bundle (not fired) | — |
| DELETE | `/api/CostCodes/DefaultAction` | app bundle (not fired) | — |
| POST | `/api/ImportWizard/UpdateCostCodeAliases` | app bundle (not fired) | — |
| POST | `/api/LineItems/CreateCostItemFromLineItem` | app bundle (not fired) | — |
| PUT | `/api/TimeClock/IncludeTimeClockOnBudget` | app bundle (not fired) | — |
| PUT | `/api/receipts/MassEditCostCodes` | app bundle (not fired) | — |
| DELETE | `/apix/v2/CostCodes/bulk` | app bundle (not fired) | — |
| PUT | `/apix/v2/CostCodes/reassign` | app bundle (not fired) | — |
| DELETE | `/apix/v2/CostItems/bulk` | app bundle (not fired) | — |
| DELETE/POST | `/apix/v2/JobCostingBudget/adjustment` | app bundle (not fired) | — |
| PUT | `/apix/v2/JobCostingBudget/client-permissions` | app bundle (not fired) | — |
| PUT | `/apix/v2/JobCostingBudget/cost-code-projected-cost-calculation-type` | app bundle (not fired) | — |
| POST | `/apix/v2/JobCostingBudget/export` | app bundle (not fired) | — |
| POST | `/apix/v2/JobCostingBudget/multiple` | app bundle (not fired) | — |
| PUT | `/apix/v2/JobCostingBudget/save-job-funding-type` | app bundle (not fired) | — |
| PUT | `/apix/v2/JobCostingBudget/update-client-price` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/AdminBudgetCache/refresh` | app bundle (not fired) | — |
| DELETE | `/apix/v3/JobCostingBudget/deleteView/{p}/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v3/JobCostingBudget/setDefaultView/{p}/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v3/JobCostingBudget/updateView/{p}/{p}` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/CostCatalog/CostItemsForImport` · `? /api/CostCodeItems/ExportToExcel` · `GET /api/CostCodeItems/{p}` · `GET /api/CostCodeItems/{p}/GetLinkedCostCodeCount` · `GET /api/CostCodes/CostCodeConflict` · `? /api/CostCodes/ExcelExport` · `GET /api/CostCodes/SetupImport` · `POST /api/Search` · `GET /api/TimeClock/CostCodes` · `POST /apix/v1/admin/Products/search` · `GET /apix/v2.0/channels/search` · `GET /apix/v2/CostCodes/list` · `GET /apix/v2/CostCodes/reassignment-categories` · `GET /apix/v2/JobCostingBudget/budget-contracted-profit` · `POST /apix/v2/Products/search` · `POST /apix/v2/TaskDependencies/search` · `GET /apix/v2/Tasks/assignment-search` · `GET /apix/v2/admin/Builders/search` · `GET /apix/v2/admin/Users/username-search` · `GET /apix/v3/Reporting/budgeted` · `GET /apix/v3/Reporting/labor-actuals-vs-budgeted` · `? /apix/v3/admin/products/search`

## Schedule

- **VIABUILD equivalent:** `schedule_phases`, `schedule_tasks`, `schedule_task_dependencies`, `schedule_templates`
- **Gateway verbs:** none
- **Coverage:** 6 screens/modals · 5 read endpoints · 2 blocked writes · bundle APIs reached 6/47

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/DrawSchedule/{id}` | — | 0 | — |
| `/app/Landing/ActivityFeed/Schedule/{id}/{id}` | Schedule Item Details, Related Items, Predecessors & Links, Phases & Tags, Viewing, Notes, Shifts ({n} new), Files, RFIs, Confirmations ({n} new) | 26 | Apply filter |
| `/app/Landing/QuickAction/Schedule/0/{id}` | Predecessors & Links, Phases & Tags, Viewing, Notes, Files | 16 | — |
| `/app/Landing/Schedule/{id}/{id}` | Schedule Item Details, Related Items, Predecessors & Links, Phases & Tags, Viewing, Notes, Shifts ({n} new), Files, RFIs, Confirmations ({n} new) | 26 | Apply filter |
| `/app/Schedules/{id}` | Schedule, Baseline, Workday Exceptions | 11 | Apply filter |
| `/app/Schedules/0` | Schedule, Baseline, Workday Exceptions | 10 | — |

### Fields (UI)

(Base) End Date (column) · (Base) Start Date (column) · Actions (column) · Assigned Users Confirmation Status (column) · Assignees (select) · Category (column) · Complete (checkbox) · Display Color (select) · Duration (column) · End (column) · End Date (date) · Hourly (checkbox) · Jobs (column) · Notes (column) · Oct 25 - Oct 31, 2026 (date) · Phase (select) · Reason (column) · Recurrence (column) · Reminder (select) · Show Client (Phases Only) (checkbox) · Show on Gantt (checkbox) · Slip (Direct) (column) · Source (column) · Start (column) · Start Date (date) · Subs/Vendors (select) · Tags (select) · Title (column) · Title (text) · Type (column) · User (column) · allNotes (textarea) · duration (number) · percentComplete-input (number) · predecessors.0.lag (number) · shiftFilter (radio)

### Enums and dropdown options

- data.columnsList: Workday Exception Id / Title / Start / End / Duration / Recurrence / Type / Category / Notes / Jobs / Actions

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/WorkdayExceptions/{id}` | — | data, canAdd, canDelete, canEdit, category, category.validators, category.validators[].errorMessage, category.validators[].type, category.validators[].value, category.value, category.value[].disableIndividualSelection, category.value[].disabled, category.value[].extraData, category.value[].id, category.value[].key, category.value[].name, category.value[].secondaryName, category.value[].selected, endDate, endDate.validators, endDate.validators[].errorMessage, endDate.validators[].type, endDate.validators[].value, endDate.value, isOffline, jobsiteToggle, jobsiteToggle.leftText, jobsiteToggle.rightSelected, jobsiteToggle.rightText, jobsiteToggle.validators, jobsites, jobsites.options, jobsites.options[].name, jobsites.options[].options, jobsites.options[].type, jobsites.type, jobsites.validators, jobsites.validators[].errorMessage, jobsites.validators[].type, jobsites.value, … (+85) |
| GET | `/apix/v2/Schedules/range?End=&Start=` | — | scheduleItems, scheduleItems[].assignedUsers, scheduleItems[].builderId, scheduleItems[].description, scheduleItems[].endDateTime, scheduleItems[].externalId, scheduleItems[].isHourly, scheduleItems[].jobName, scheduleItems[].jobsiteId, scheduleItems[].markedCompleteDate, scheduleItems[].onOwnerCalendar, scheduleItems[].ownerDescription, scheduleItems[].scheduleId, scheduleItems[].startDateTime, scheduleItems[].title, users, users[].displayName, users[].id |
| POST | `/api/Calendar/BaselineGrid` | gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll, pagingData.totalRowsAllPages | data, canAdd, canDelete, canMarkComplete, canSetBaseline, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].actualDuration, data[].actualEndDate, data[].actualStartDate, data[].assignees, data[].builderId, data[].completed, data[].completedBy, data[].completedDate, data[].directShiftCount, data[].durationSlip, … (+72) |
| POST | `/api/WorkdayExceptions/Grid` | gridRequest, gridRequest.emptyStateEntity, gridRequest.hideMultiJobsColumns, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll, pagingData.totalRowsAllPages | data, builders, builders[].id, builders[].name, canAdd, canDelete, canSetBaseline, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].builderName, data[].category, data[].days, data[].endDate, data[].id, data[].jobs, data[].notes, data[].rowAction, … (+46) |
| POST | `/apix/v2/Tasks/workday-exceptions/list` | includeExceptionNames, jobIds | jobs, jobs[].exceptions, jobs[].exceptions[].effect, jobs[].exceptions[].endDate, jobs[].exceptions[].name, jobs[].exceptions[].repeatsAnnually, jobs[].exceptions[].startDate, jobs[].jobId, jobs[].workdayFlags |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/Calendar/GanttChart` | blocked during crawl | filters, jobIds, showBaseline, showJobs, showPhases (via nav:/app/Schedules/0) |
| POST | `/apix/v2/Tasks/workday-exceptions/list` | blocked during crawl | includeExceptionNames, jobIds (via btn:Tasks) |
| PUT | `/api/Calendar/Phase` | app bundle (not fired) | — |
| PUT | `/api/FeatureFlag/CancelScheduledAction` | app bundle (not fired) | — |
| POST/PUT | `/api/Phases` | app bundle (not fired) | — |
| DELETE | `/api/Phases/DefaultAction` | app bundle (not fired) | — |
| POST | `/api/WorkdayExceptions` | app bundle (not fired) | — |
| POST | `/api/WorkdayExceptions/Defaults` | app bundle (not fired) | — |
| DELETE/PUT | `/api/WorkdayExceptions/{p}` | app bundle (not fired) | — |
| DELETE | `/api/calendar/ScheduleItem` | app bundle (not fired) | — |
| PUT | `/apix/v2/Phases/bulk` | app bundle (not fired) | — |
| POST | `/apix/v2/ScheduleDrafts` | app bundle (not fired) | — |
| POST | `/apix/v2/ScheduleDrafts/{p}/end` | app bundle (not fired) | — |
| POST | `/apix/v2/ScheduleDrafts/{p}/start` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Schedules` | app bundle (not fired) | — |
| POST/PUT | `/apix/v2/Schedules/calendar-feed` | app bundle (not fired) | — |
| POST | `/apix/v2/Schedules/export` | app bundle (not fired) | — |
| PUT | `/apix/v2/Schedules/mark-complete` | app bundle (not fired) | — |
| POST | `/apix/v2/Schedules/recalculate` | app bundle (not fired) | — |
| DELETE/POST | `/apix/v2/Schedules/{p}/{p}/tasks/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/schedule` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Accounting/GetSyncSchedule` · `GET /api/ActivityFeed/{p}/ScheduleItems` · `? /api/Calendar/ExportBaselineToExcel` · `? /api/Calendar/GanttExport` · `GET /api/Calendar/RelatedSchedules` · `GET /api/Calendar/ScheduleItemsOnJob` · `? /api/Calendar/SetBaseline` · `GET /api/LinkedSchedules/{p}/LinkedSchedule` · `GET /api/Phases/Setup` · `GET /api/Subscription/GetSubscriptionWithScheduledChanges` · `? /api/WorkdayExceptions/ExportToExcel` · `GET /api/calendar/ScheduleConfirmationExternal` · `GET /apix/v2/ImportWizard/schedule-count` · `POST /apix/v2/ScheduleDrafts/preview` · `GET /apix/v2/ScheduleDrafts/{p}/user` · `POST /apix/v2/Schedules/grid` · `GET /apix/v2/Schedules/{p}/history` · `GET /apix/v2/Schedules/{p}/workday-exceptions` · `GET /apix/v2/Tasks/{p}/linked-schedules` · `GET /apix/v2/admin/ImportWizard/schedule-count` · `GET /apix/v2/admin/Subscription/subscription-with-scheduled-changes` · `GET /apix/v3/Reporting/baseline-vs-actual-duration-by-job` · `GET /apix/v3/Reporting/schedule-percent-complete-by-job`

## Daily logs

- **VIABUILD equivalent:** `project_feed_entries` (+ `project_feed_media`, `project_feed_comments`) — closest; no dedicated site diary table
- **Gateway verbs:** none
- **Coverage:** 14 screens/modals · 3 read endpoints · 1 blocked writes · bundle APIs reached 3/7

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/DailyLog/0/{id}` | — | 5 | Add, Create new doc |
| `/app/DailyLogAdd/{id}` | — | 5 | Add, Create new doc |
| `/app/DailyLogAdd/{id} ⧉ Create new doc` | — | 0 | — |
| `/app/DailyLogAdd/{id} ⧉ Info` | — | 0 | — |
| `/app/DailyLogs` | — | 1 | Publish info, Apply filter |
| `/app/DailyLogs ⧉ View all (3)` | — | 0 | — |
| `/app/DailyLogs ⧉ View all (36)` | — | 0 | — |
| `/app/DailyLogs ⧉ View all (39)` | — | 0 | — |
| `/app/DailyLogs ⧉ View all (4)` | — | 0 | — |
| `/app/DailyLogs ⧉ View all (5)` | — | 0 | — |
| `/app/DailyLogs ⧉ View all (6)` | — | 0 | — |
| `/app/DailyLogView/{id}/{id}/none` | — | 1 | Add |
| `/app/DailyLogView/{id}/{id}/none ⧉ 0` | — | 0 | — |
| `/app/DailyLogView/0/{id}/0` | — | 0 | — |

### Fields (UI)

Client Meeting? (checkbox) · Date (date) · Job (select) · Tags (select) · notes (textarea)

### Enums and dropdown options

- columnsList: Log Date / Log Title / Added By / Job / Comments / Log Notes / Weather Information / Related Items / Tags / Map / Viewable By / Weather Notes / Client Meeting? / Photo/Document Uploaded? / Subs Onsite

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/apix/v2/DailyLogs/{id}?jobId=` | — | builderId, canAddToDos, canDelete, canEdit, customFields, customFields.customFieldAssociatedType, customFields.customFieldOptions, customFields.customFieldOptions.subs, customFields.customFieldOptions.subsMultiSelectOptions, customFields.customFieldOptions.users, customFields.customFieldOptions.usersMultiSelectOptions, customFields.customFieldOptions.{key}, customFields.customFields, customFields.customFieldsCanConfigure, customFields.customFields[].associatedEntityID, customFields.customFields[].id, customFields.customFields[].onOwnerPortal, customFields.customFields[].optionsKey, customFields.customFields[].title, customFields.customFields[].toolTipText, customFields.customFields[].type, customFields.customFields[].typeId, customFields.customFields[].validators, customFields.customFields[].value, customFields.showNoCustomFieldsMessage, dailyLogUserInfo, dailyLogUserInfo.addedByUserDate, dailyLogUserInfo.addedByUserId, dailyLogUserInfo.addedByUserName, dailyLogUserInfo.publishedByUserDate, dailyLogUserInfo.publishedByUserId, dailyLogUserInfo.publishedByUserName, dailyLogUserInfo.updatedByUserDate, dailyLogUserInfo.updatedByUserName, discussions, discussions.channelId, discussions.comments, discussions.comments.channelId, discussions.comments.comments, discussions.comments.linkedTypeResponse, … (+187) |
| GET | `/apix/v2/DailyLogs/{id}/user-interactions` | — | — |
| POST | `/apix/v2/DailyLogs/grid` | filters, filters.{key}, gridRequest, gridRequest.emptyStateEntity, gridRequest.hideMultiJobsColumns, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll, pagingData.totalRowsAllPages | canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].addedBy, data[].addedByDateUtc, data[].addedById, data[].attachedFiles, data[].attachedFiles.files, data[].attachedFiles.newFileOptions, data[].attachedFiles.title, data[].attachedFiles.viewingPermissions, data[].builderId, data[].canEdit, data[].coordinate, data[].coordinate.latitude, data[].coordinate.longitude, … (+127) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| PUT | `/apix/v2/DailyLogs/{id}/user-interactions` | blocked during crawl | allowNotifications, builderId, entityId, entityType, interactionType, reactDateUtc, readDateUtc, userId, userName (via btn:0) |
| PUT | `/apix/v2/DailyLogs/read-receipts` | app bundle (not fired) | — |
| DELETE/PATCH | `/apix/v2/DailyLogs/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/DailyLogs/{p}/tags` | app bundle (not fired) | — |
| PUT | `/apix/v2/DailyLogs/{p}/weather` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Weather/JobObserved`

## Tasks / to-dos

- **VIABUILD equivalent:** none (closest: `schedule_tasks`, `quick_actions`)
- **Gateway verbs:** none
- **Coverage:** 3 screens/modals · 3 read endpoints · 0 blocked writes · bundle APIs reached 3/65

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/tasks` | — | 0 | — |
| `/app/tasks/all` | My tasks, All tasks, Punch list | 8 | Remove Status filter, Add task… |
| `/app/tasks/my-tasks` | My tasks, All tasks, Punch list | 8 | Remove Status filter, Add task… |

### Fields (UI)

Assignees (column) · Column with Header Selection (checkbox) · Description (column) · Due date (column) · Press Space to toggle row selection (unchecked) (checkbox) · Tags (column) · Task (column) · Type (column)

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/apix/v2/Tasks/tags` | — | {key}[].tagId, {key}[].tagTitle |
| GET | `/apix/v3/Tasks/by-related-entity?EntityId=&EntityType=` | — | hasLinks, tasks |
| POST | `/apix/v2/Tasks/list` | filters, filters.filterTree, filters.filterTree.groups, filters.filterTree.groups[].booleanOperator, filters.filterTree.groups[].filters, filters.filterTree.groups[].filters[].field, filters.filterTree.groups[].filters[].isLocked, filters.filterTree.groups[].filters[].operator, filters.filterTree.groups[].filters[].value, includeDeleted, jobIds | dependencies, jobs, jobs[].builderId, jobs[].jobId, jobs[].name, taskComments, taskComments.{key}, taskComments.{key}.hasComment, taskComments.{key}.hasUnread, tasks, tasks[].addedByDate, tasks[].addedByDateUtc, tasks[].addedById, tasks[].addedByName, tasks[].ancestorId, tasks[].assignments, tasks[].assignments[].acknowledgedDateUtc, tasks[].assignments[].acknowledgedStatus, tasks[].assignments[].assignedDateUtc, tasks[].assignments[].assignedToId, tasks[].assignments[].builderId, tasks[].assignments[].disabledDateUtc, tasks[].assignments[].isOnJob, tasks[].assignments[].jobId, tasks[].assignments[].loginType, tasks[].assignments[].name, tasks[].assignments[].taskId, tasks[].baseEndDate, tasks[].baseEndDateTimeCalculated, tasks[].baseEndTime, tasks[].baseStartDate, tasks[].baseStartDateTimeCalculated, tasks[].baseStartTime, tasks[].builderId, tasks[].constraintDate, tasks[].constraintType, tasks[].customFieldValues, tasks[].description, tasks[].descriptionPlainText, tasks[].endDate, … (+46) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/Churn/CreateCancellationTask` | app bundle (not fired) | — |
| DELETE | `/api/ToDos/BulkDeleteTodos` | app bundle (not fired) | — |
| POST | `/api/ToDos/CopyMultipleTodos` | app bundle (not fired) | — |
| POST | `/api/ToDos/CreateFromGrid` | app bundle (not fired) | — |
| PUT | `/api/ToDos/MassAssign` | app bundle (not fired) | — |
| PUT | `/api/ToDos/MultipleComplete` | app bundle (not fired) | — |
| PUT | `/api/ToDos/{p}/Complete` | app bundle (not fired) | — |
| POST | `/api/Todos` | app bundle (not fired) | — |
| POST | `/api/Todos/Copy` | app bundle (not fired) | — |
| PUT | `/api/Todos/Setup` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Todos/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/TaskAssistant/apply` | app bundle (not fired) | — |
| POST | `/apix/v2/TaskAssistant/understand` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/bulk-create` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/bulk-delete` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/bulk-restore` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/copy-to-job` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/from-related-entity` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/import-from-file` | app bundle (not fired) | — |
| PUT | `/apix/v2/Tasks/mass-edit` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/mass-edit-options` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/move-to-job` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/print/token` | app bundle (not fired) | — |
| PUT | `/apix/v2/Tasks/setup` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/share/token` | app bundle (not fired) | — |
| PUT | `/apix/v2/Tasks/status/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/Tasks/watchers/bulk` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Tasks/{p}` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Tasks/{p}/assignments` | app bundle (not fired) | — |
| POST | `/apix/v2/Tasks/{p}/inline-media` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Tasks/{p}/permanent` | app bundle (not fired) | — |
| PUT | `/apix/v2/Tasks/{p}/reorder` | app bundle (not fired) | — |
| PUT | `/apix/v2/Tasks/{p}/watchers` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Tasks/import-from-file` | app bundle (not fired) | — |
| POST | `/apix/v2/external/{p}/Tasks/list` | app bundle (not fired) | — |
| PUT | `/apix/v2/external/{p}/Tasks/{p}/status` | app bundle (not fired) | — |
| POST | `/apix/v2/tasks/{p}/dependencies` | app bundle (not fired) | — |
| DELETE/PATCH | `/apix/v2/tasks/{p}/dependencies/{p}/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/users/{p}/tasks/share-token` | app bundle (not fired) | — |
| PATCH | `/apix/v3/Tasks/bulk-patch` | app bundle (not fired) | — |
| PUT | `/apix/v3/Tasks/{p}/tags` | app bundle (not fired) | — |
| PATCH | `/apix/v3/external/{p}/Tasks/bulk-patch` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/ToDos/AssignList` · `? /api/ToDos/ExportToExcel` · `POST /api/ToDos/Grid` · `GET /api/ToDos/{p}/Notify` · `GET /api/Todos/Defaults` · `GET /api/Todos/GetRelatedItems` · `GET /api/Todos/Print` · `? /api/Todos/{p}${s` · `GET /apix/v2/Tasks/assignable-users` · `GET /apix/v2/Tasks/print` · `GET /apix/v2/Tasks/print/by-token` · `GET /apix/v2/Tasks/{p}/attachments` · `GET /apix/v2/Tasks/{p}/sub-tasks` · `GET /apix/v2/Tasks/{p}/watchers/eligible` · `GET /apix/v2/Todos/quick-add-defaults` · `GET /apix/v2/external/{p}/Tasks/{p}` · `GET /apix/v2/external/{p}/Tasks/{p}/attachments` · `GET /apix/v2/external/{p}/Tasks/{p}/print` · `GET /apix/v2/external/{p}/Tasks/{p}/sub-tasks`

## Selections

- **VIABUILD equivalent:** `selections`, `selection_options`
- **Gateway verbs:** none
- **Coverage:** 10 screens/modals · 8 read endpoints · 0 blocked writes · bundle APIs reached 7/82

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Allowance/0/{id}` | — | 12 | Save, Save and new, Save and close |
| `/app/Allowance/0/{id} ⧉ Info` | — | 0 | — |
| `/app/Allowance/New/{id}` | — | 0 | — |
| `/app/CopyChoicesFromSelection/0/{id}` | — | 0 | — |
| `/app/DependentSelections/0/{id}` | — | 0 | — |
| `/app/Landing/QuickAction/Selection/0/{id}` | Choices, Description, Files, Participation | 9 | Apply filter, Add, Send, Save, Don't save |
| `/app/Landing/QuickAction/SelectionQuickAdd/{id}` | — | 0 | — |
| `/app/Selections/Default` | Card View, List, Hierarchy | 0 | Import, New selection, Add a Selection, Apply filter |
| `/app/Selections/Default ⧉ Filter (1)` | — | 0 | Apply filter |
| `/app/Selections/Default ⧉ Filter (1) ⧉ Open Filter Settings` | — | 0 | Add new saved filter, Add a new saved filter |

### Fields (UI)

Allowance (column) · Approve Choices Only (radio) · Builder cost (column) · Category (select) · Choose date (radio) · Cost type (column) · Installers (select) · Items (column) · Location (select) · Margin (column) · Markup (column) · Notes (textarea) · Quantity (column) · Require client to make a selection (checkbox) · Selections (select) · Title (text) · Unit (column) · Unit cost (column) · Vendors (select) · Viewing/Price Requests Only (radio)

### Enums and dropdown options

- Category: Unassigned / ** A VARIATION REQUIRED ** / APPLIANCES / BENCHTOP & SPLASHBACK / BRICKWORK / CABINETS & JOINERY / CARPET & VINYL PLANK / CLADDING / CONCRETE / DECK & BALCONY
- data.columnsList: Title / Comments / Category / Location / Price / Deadline / Status / Files / Choices / Subs / Vendors / Installers
- data.lineItems.defaults.costTypes.options[].options: None / Labor / Material / Equipment / Subcontractor / Other
- data.lineItems.defaults.markupTypeOptions.value: % / $ / C/P / $/unit

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Allowances/Defaults?jobId=` | — | data, allowanceAmount, allowanceAmount.currencyIdentifier, allowanceAmount.currencySeparator, allowanceAmount.currencyThousandsSeparator, allowanceAmount.maxValue, allowanceAmount.minValue, allowanceAmount.validators, allowanceAmount.value, allowanceTitle, allowanceTitle.validators, allowanceTitle.validators[].errorMessage, allowanceTitle.validators[].type, allowanceTitle.validators[].value, allowanceTitle.value, approvedSelection, approvedSelection.currencyIdentifier, approvedSelection.currencySeparator, approvedSelection.currencyThousandsSeparator, approvedSelection.maxValue, approvedSelection.minValue, approvedSelection.validators, approvedSelection.validators[].errorMessage, approvedSelection.validators[].type, approvedSelection.validators[].value, approvedSelection.value, builderCost, builderCost.currencyIdentifier, builderCost.currencySeparator, builderCost.currencyThousandsSeparator, builderCost.maxValue, builderCost.minValue, builderCost.validators, builderCost.value, canAdd, canDelete, canEdit, canViewGeneralItems, generalItemCount, hasCostCodesFeature, … (+88) |
| GET | `/api/Allowances/NaN?isMobileRequest=` | — | reason |
| GET | `/api/SelectionChoices/PotentialDependentSelections?choiceId=` | — | reason |
| GET | `/api/selectionconditions/0/GetDependents?builderId=&jobId=&nonPendingOnly=` | — | data, selections |
| GET | `/api/Selections/Config?jobId=` | — | data, defaultBuilderTab, defaultOwnerTab, isSelectionsReimaginedJob, jobIncludesAllowances, newJobsUseSelectionsReimagined, ownerCanViewLockedSelections, selectionPermissions, selectionPermissions.canAdd, selectionPermissions.canDelete, selectionPermissions.canUpdate, selectionPermissions.canView, shouldExpandCategoryLocationGroups |
| GET | `/api/Selections/DefaultInfo?jobId=` | — | data, allowMultipleChoices, allowMultipleChoices.validators, allowMultipleChoices.validators[].errorMessage, allowMultipleChoices.validators[].type, allowMultipleChoices.validators[].value, allowMultipleChoices.value, approvalMessage, approvalMessagePlainText, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, attachedFiles.viewingPermissions.maxFileSize, attachedFiles.viewingPermissions.maxFiles, attachedFiles.viewingPermissions.minFileSize, … (+226) |
| GET | `/api/Selections/Hierarchy?jobId=&pagingData.currentPage=&pagingData.firstRow=&pagingData.lastRow=&pagingData.pageNumber=&pagingData.pageSize=&pagingData.resetScroll=&pagingData.totalRowsAllPages=` | — | data, canAdd, canDelete, canUpdate, listMetaData, listMetaData.emptyStatesMetadata, listMetaData.emptyStatesMetadata.hasDismissedAlert, listMetaData.emptyStatesMetadata.hasFilteredData, listMetaData.emptyStatesMetadata.helpLink, listMetaData.emptyStatesMetadata.isMissingRequiredParentEntities, listMetaData.emptyStatesMetadata.isNewToEntity, listMetaData.emptyStatesMetadata.isReadOnly, listMetaData.hasData, page, pageSize, records, selections, totalPages |
| POST | `/api/Selections/Grid?selectedTab=` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, canAdd, canDelete, canUpdate, canViewSelectionPrices, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, disclaimerMessage, doesJobIncludeAllowances, footerData, footerData[].customFields, footerData[].price, footerData[].price.scale, footerData[].price.value, hasMoreRows, infiniteScrollStatus, isLoaded, isRecordCountCapped, … (+31) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/Allowances` | app bundle (not fired) | — |
| PUT | `/api/Allowances/ReassignSelections` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Allowances/{p}` | app bundle (not fired) | — |
| POST | `/api/SelectionChoices` | app bundle (not fired) | — |
| PUT | `/api/SelectionChoices/Copy` | app bundle (not fired) | — |
| POST | `/api/SelectionChoices/VerifyCanCopy` | app bundle (not fired) | — |
| DELETE/PUT | `/api/SelectionChoices/{p}` | app bundle (not fired) | — |
| PUT | `/api/SelectionChoices/{p}/FavoriteSelectionChoice` | app bundle (not fired) | — |
| PUT | `/api/SelectionChoices/{p}/RequestPrice` | app bundle (not fired) | — |
| PUT | `/api/SelectionChoices/{p}/Reset` | app bundle (not fired) | — |
| PUT | `/api/SelectionChoices/{p}/ResetPriceRequested` | app bundle (not fired) | — |
| PUT | `/api/SelectionChoices/{p}/Review` | app bundle (not fired) | — |
| PUT | `/api/SelectionChoices/{p}/UpdateAllUnselectedChoices` | app bundle (not fired) | — |
| PUT | `/api/SelectionConditions` | app bundle (not fired) | — |
| POST/DELETE | `/api/Selections` | app bundle (not fired) | — |
| POST | `/api/Selections/Choices` | app bundle (not fired) | — |
| POST | `/api/Selections/Copy` | app bundle (not fired) | — |
| PUT | `/api/Selections/MassUpdateSelectionReleaseStatus` | app bundle (not fired) | — |
| POST | `/api/Selections/Print` | app bundle (not fired) | — |
| PUT | `/api/Selections/Setup` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Selections/{p}` | app bundle (not fired) | — |
| PUT | `/api/Selections/{p}/Reset` | app bundle (not fired) | — |
| POST | `/apix/v2/Allowances/create-line-item-and-allowance` | app bundle (not fired) | — |
| PUT | `/apix/v2/Allowances/{p}/completion-status` | app bundle (not fired) | — |
| PUT | `/apix/v2/OwnerSelections/approve-choices` | app bundle (not fired) | — |
| POST | `/apix/v2/OwnerSelections/favorited` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionCatalog/add-items` | app bundle (not fired) | — |
| DELETE | `/apix/v2/SelectionCatalog/delete-items` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionCatalog/items` | app bundle (not fired) | — |
| PUT | `/apix/v2/SelectionCatalog/items/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionCatalog/save-items` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionOptionGroups` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/SelectionOptionGroups/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionOptions/copy-options` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionOptions/create-option` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionOptions/parse-documents` | app bundle (not fired) | — |
| POST | `/apix/v2/SelectionOptions/parse-from-urls` | app bundle (not fired) | — |
| PUT | `/apix/v2/SelectionOptions/selection-options/approve` | app bundle (not fired) | — |
| PUT | `/apix/v2/SelectionOptions/selection-options/decline` | app bundle (not fired) | — |
| DELETE | `/apix/v2/SelectionOptions/selection-options/mass-delete` | app bundle (not fired) | — |
| PUT | `/apix/v2/SelectionOptions/selection-options/mass-edit` | app bundle (not fired) | — |
| PUT | `/apix/v2/SelectionOptions/selection-options/reset` | app bundle (not fired) | — |
| PUT | `/apix/v2/SelectionOptions/selection-options/send` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/SelectionOptions/{p}` | app bundle (not fired) | — |
| DELETE | `/apix/v2/SelectionOptions/{p}/main-photo` | app bundle (not fired) | — |
| POST | `/apix/v2/Selections/sub-selections` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Subscription/subscription-from-selections` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Allowances/GetAssignableAllowances` · `GET /api/Allowances/GetUpdatedSelectionsList` · `POST /api/Allowances/Grid` · `GET /api/Allowances/Print` · `POST /api/Allowances/SelectionsList` · `GET /api/SelectionChoices/DefaultInfo` · `GET /api/SelectionChoices/PotentialKeyChoices` · `GET /api/SelectionChoices/SelectionChoiceCards` · `GET /api/SelectionConditions/GetReleasedDependentSelectionCount` · `GET /api/SelectionConditions/GetUnreleasedDependentSelectionCount` · `GET /api/Selections/GetSelectionChoiceLineItemIds` · `GET /api/Selections/{p}/PotentialKeySelections` · `GET /api/Selections/{p}/VendorList` · `POST /api/Subscription/GetSubscriptionFromSelections` · `GET /api/jobsites/WithSelections` · `? /api/selectionChoices` · `GET /api/selectionconditions/{p}/GetDependentsForChoice` · `GET /api/selections/ForChoiceCopy` · `GET /apix/v2/Allowances/{p}` · `GET /apix/v2/OwnerSelections/dashboard` · `GET /apix/v2/OwnerSelections/projected-total` · `GET /apix/v2/SelectionCatalog/items/defaults` · `GET /apix/v2/SelectionCatalog/items/{p}/attachments` · `GET /apix/v2/SelectionOptions` · `GET /apix/v2/SelectionOptions/allowance-library` · `GET /apix/v2/SelectionOptions/builder-library` · `GET /apix/v2/SelectionOptions/selection-option-defaults/{p}` · `GET /apix/v2/SelectionOptions/{p}/attachments`

## Warranty

- **VIABUILD equivalent:** `defects`
- **Gateway verbs:** none
- **Coverage:** 6 screens/modals · 3 read endpoints · 0 blocked writes · bundle APIs reached 3/18

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Landing/QuickAction/WarrantyAdd/{id}` | — | 0 | — |
| `/app/Warranties` | — | 0 | Add a Warranty Claim, Apply filter |
| `/app/Warranties ⧉ Open Filter Settings` | — | 0 | Add new saved filter, Add a new saved filter |
| `/app/WarrantyAdd/{id}` | Internal, Clients, Subs/vendors | 9 | Add, Create new doc |
| `/app/WarrantyAdd/{id} ⧉ Create new doc` | — | 0 | — |
| `/app/WarrantyAdd/{id} ⧉ Info` | — | 0 | — |

### Fields (UI)

Added cost (text) · Category (select) · Claim # (text) · Classification (select) · Internal comments (textarea) · Priority (select) · Problem description (textarea) · Service coordinator (select) · Show client? (checkbox)

### Enums and dropdown options

- Category: Unassigned / Appliances / Builder / Cabinets / Concrete / Countertops / Drywall / Electrical / Flooring / Foundation
- Classification: Please Select One / 11 Month / 12 Month / 30 Day / 60 Day / Holding Until / Needs Inspection / Pre-Close / Punch List / Other
- Priority: Low / Medium / High / Emergency
- data.category.value: Unassigned / Appliances / Builder / Cabinets / Concrete / Countertops / Drywall / Electrical / Flooring / Foundation / Framing / HVAC / Landscaping / Lighting / Low-Voltage / Masonry / Other / Painting / Plumbing / Roofing / Siding / Trim / Windows
- data.classification.value: Please Select One / 11 Month / 12 Month / 30 Day / 60 Day / Holding Until / Needs Inspection / Pre-Close / Punch List / Other / Meets Warranty Standards (closed) / Non-Warranty (closed) / Service Completed (closed)
- data.columnsList: Title / Job / Claim # / RFIs / Comments / Priority / Category / Created Date / Follow up / Class / Scheduling Information / Feedback / Added Cost / Notes / Claim Status / Description / Original Schedule Item / Original Schedule Assignee / Files / Service Coordinator / Created By
- data.priority.value: Low / Medium / High / Emergency

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Warranty/DefaultInfo?jobId=` | — | data, addedByDate, addedById, addedByName, addedByType, addedCost, addedCost.currencyIdentifier, addedCost.currencySeparator, addedCost.currencyThousandsSeparator, addedCost.maxValue, addedCost.minValue, addedCost.validators, addedCost.value, address, address.countryDropdown, address.countryDropdownId, address.fields, address.fields[].addressFieldType, address.fields[].inputType, address.fields[].order, address.fields[].title, address.fields[].validators, address.fields[].value, address.formattedAddressNoStreet, address.globalCountry, address.layout, address.location, address.location.mapPosition, address.location.mappingStatus, address.stateDropdown, address.stateDropdownId, address.validators, address.validators[].errorMessage, address.validators[].type, address.validators[].value, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, … (+191) |
| GET | `/api/Warranty/Permissions?jobId=` | — | data, canPrint, warrantyAvailableDate, warrantyPermissions, warrantyPermissions.canAdd, warrantyPermissions.canDelete, warrantyPermissions.canUpdate, warrantyPermissions.canView |
| POST | `/api/Warranty/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, footerData, footerData[].addedCost, footerData[].addedCost.scale, footerData[].addedCost.value, footerData[].customFields, hasMoreRows, infiniteScrollStatus, isLoaded, isRecordCountCapped, isTotalCountRemoved, listMetaData, listMetaData.emptyStatesMetadata, … (+11) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/Warranty` | app bundle (not fired) | — |
| PUT | `/api/Warranty/Setup` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Warranty/{p}` | app bundle (not fired) | — |
| POST | `/api/Warranty/{p}/ForceNotify` | app bundle (not fired) | — |
| DELETE | `/api/WarrantyService/Future` | app bundle (not fired) | — |
| PUT | `/api/WarrantyService/{p}` | app bundle (not fired) | — |
| POST | `/api/WarrantyService/{p}/UpdateStatus` | app bundle (not fired) | — |
| POST | `/api/warrantyService` | app bundle (not fired) | — |
| DELETE/PUT | `/api/warrantyService/{p}` | app bundle (not fired) | — |
| PUT | `/api/warrantyService/{p}/ManuallyAcceptAppointment` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/warranties` | app bundle (not fired) | — |

### Bundle read APIs not reached

`? /api/Warranty/ExportToExcel` · `GET /api/Warranty/Print` · `POST /api/WarrantyService/Grid` · `GET /api/warrantyService/DefaultInfo`

## RFIs

- **VIABUILD equivalent:** none
- **Gateway verbs:** none
- **Coverage:** 5 screens/modals · 4 read endpoints · 0 blocked writes · bundle APIs reached 4/11

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Landing/QuickAction/RFI/0/{id}` | — | 6 | — |
| `/app/RFIs` | — | 11 | Apply filter |
| `/app/RFIs ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/RFIs/RFI/{id}/{id}` | — | 12 | Apply filter |
| `/app/RFIs/RFI/{id}/{id} ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |

### Fields (UI)

Assigned To (column) · Assignee (select) · Choose date (radio) · Columns (select) · Created By (column) · Due (column) · ID # (text) · Job (column) · Question Files (column) · RFI # (column) · Related Items (column) · Reminder (select) · Response Files (column) · Responses (column) · Status (column) · Title (column) · Title (text) · Viewers (select)

### Enums and dropdown options

- Columns: Check All / RFI Is New / Job / RFI # / Title / Created By / Question Files / Assigned To / Status / Responses / Response Files / Due / Related Items
- data.columnsList: RFI Is New / Job / RFI # / Title / Created By / Question Files / Assigned To / Status / Responses / Response Files / Due / Related Items / Created Date
- data.linkedEntityType.value: Bid Package / Change Order / Document / Photo / Purchase Order / Schedule Item / Video / Warranty

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Rfi/{id}?jobsiteId=` | — | data, assignedToId, assignedToId.title, assignedToId.unselectedId, assignedToId.validators, assignedToId.validators[].errorMessage, assignedToId.validators[].type, assignedToId.validators[].value, assignedToId.value, assignedToId.value[].name, assignedToId.value[].options, assignedToId.value[].type, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, … (+241) |
| GET | `/api/Rfi/{id}/ResponseDefaults?loadAllSubsOverride=` | — | data, assignedToId, assignedToId.title, assignedToId.unselectedId, assignedToId.validators, assignedToId.validators[].errorMessage, assignedToId.validators[].type, assignedToId.validators[].value, assignedToId.value, assignedToId.value[].name, assignedToId.value[].options, assignedToId.value[].type, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, … (+17) |
| GET | `/api/Rfi/Defaults?jobsiteId=&linkedId=&linkedType=` | — | data, assignedToId, assignedToId.title, assignedToId.unselectedId, assignedToId.validators, assignedToId.validators[].errorMessage, assignedToId.validators[].type, assignedToId.validators[].value, assignedToId.value, assignedToId.value[].name, assignedToId.value[].options, assignedToId.value[].type, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, … (+224) |
| POST | `/api/RfI/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].assignedTo, data[].builderId, data[].createdBy, data[].createdDate, data[].customFields, data[].dueDate, data[].dueDate.canEdit, data[].dueDate.date, data[].dueDate.displayTime, data[].dueDate.id, data[].dueDate.isPastDue, data[].dueDate.linkedScheduleInfo, … (+54) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/RFI/Notify` | app bundle (not fired) | — |
| PUT | `/api/RFI/Setup` | app bundle (not fired) | — |
| POST | `/api/RFI/{p}/Response` | app bundle (not fired) | — |
| POST | `/api/Rfi` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Rfi/{p}` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Rfi/{p}/Response` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/rfis` | app bundle (not fired) | — |

### Bundle read APIs not reached

`? /api/RfI/ExportToExcel`

## Submittals

- **VIABUILD equivalent:** none (closest: `document_reviews`)
- **Gateway verbs:** none
- **Coverage:** 1 screens/modals · 1 read endpoints · 0 blocked writes · bundle APIs reached 1/37

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Submittals` | Submittal log, Packages | 11 | Apply filter |

### Fields (UI)

# (column) · Ball in court (column) · Column with Header Selection (checkbox) · Division (column) · Final due date (column) · Job (column) · Press Space to toggle row selection (unchecked) (checkbox) · Spec section (column) · Status (column) · Submittal type (column) · Title (column)

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| POST | `/apix/v2/Submittals/list` | gridRequest, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll, pagingData.totalRowsAllPages | canAdd, canDelete, canUpdate, columnsList, data, jobs, jobs[].jobId, jobs[].name, packages, packages[].submittalPackageId, packages[].title, submittals, submittals[].addedByDate, submittals[].addedById, submittals[].addedByName, submittals[].assignees, submittals[].assignees[].externalId, submittals[].assignees[].globalUserId, submittals[].assignees[].name, submittals[].builderId, submittals[].currentUserExternalId, submittals[].description, submittals[].divisionCode, submittals[].divisionCodeExternalId, submittals[].dueDate, submittals[].externalBuilderId, submittals[].externalId, submittals[].externalJobId, submittals[].hasActiveBluebeamSession, submittals[].isPublished, submittals[].jobId, submittals[].modifiedById, submittals[].modifiedDate, submittals[].packageId, submittals[].specSection, submittals[].status, submittals[].subTradePartnerId, submittals[].submittalId, submittals[].submittalManagerId, submittals[].submittalNumberDisplay, … (+14) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/apix/v2/SubSummary/submittals` | app bundle (not fired) | — |
| POST | `/apix/v2/SubmittalExtractions/submittal-extractions/process` | app bundle (not fired) | — |
| POST | `/apix/v2/SubmittalPackages` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/SubmittalPackages/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/bulk-delete` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Submittals/bulk-move-to-package` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/print/token` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/Submittals/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/document-upload-complete` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Submittals/{p}/forward-for-review` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/notify-shared` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/publish` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/request-changes` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Submittals/{p}/review` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/send-by-email` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/send-for-approval` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/share-token` | app bundle (not fired) | — |
| POST | `/apix/v2/Submittals/{p}/version` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Submittals/{p}/void` | app bundle (not fired) | — |
| DELETE | `/apix/v2/admin/SubmittalExtractions/submittal-extractions` | app bundle (not fired) | — |
| POST | `/apix/v2/external/{p}/submittals/attachments` | app bundle (not fired) | — |
| POST | `/apix/v2/external/{p}/submittals/document-upload-complete` | app bundle (not fired) | — |
| PATCH | `/apix/v2/external/{p}/submittals/forward-for-review` | app bundle (not fired) | — |
| PATCH | `/apix/v2/external/{p}/submittals/review` | app bundle (not fired) | — |
| POST | `/apix/v2/external/{p}/submittals/videos` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /apix/v2/SubmittalExtractions/submittal-extractions/{p}` · `POST /apix/v2/SubmittalPackages/list` · `GET /apix/v2/Submittals/defaults` · `GET /apix/v2/Submittals/export/by-token` · `GET /apix/v2/Submittals/print/by-token` · `GET /apix/v2/Submittals/{p}/attachments` · `? /apix/v2/Submittals/{p}/export-pdf` · `GET /apix/v2/Submittals/{p}/internal` · `? /apix/v2/admin/SubmittalExtractions/submittal-extractions/{p}/files/{p}` · `GET /apix/v2/external/{p}/submittals`

## Time clock

- **VIABUILD equivalent:** none (`labor_rates` only)
- **Gateway verbs:** none
- **Coverage:** 4 screens/modals · 3 read endpoints · 2 blocked writes · bundle APIs reached 4/30

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Landing/QuickAction/Shift/0/{id}` | — | 8 | Add, Save, Approve, Apply filter |
| `/app/Landing/QuickAction/Shift/0/{id} ⧉ Increase Value` | — | 0 | — |
| `/app/Landing/QuickAction/Shift/0/{id} ⧉ Split Hours` | — | 3 | Apply |
| `/app/TimeClock/Reports` | — | 0 | — |

### Fields (UI)

Cost code (select) · Job (select) · Notes (textarea) · Tags (select) · Users (select) · hours (number) · minutes (number) · shift-total-hours (number) · shift-total-minutes (number)

### Enums and dropdown options

- data.shiftType.value: Regular / PTO

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/TimeClock/ClockOutDefaults?id=` | — | reason |
| GET | `/api/TimeClock/DefaultInfo?jobsiteId=` | — | data, accountingTitle, accountingTitleShort, areUsersDisabled, breaks, builderTimeZone, calendarLocalTime, canAdd, canApprove, canDelete, canEdit, canSplitCostCodes, canViewCost, costCodeList, costCodeList.unselectedId, costCodeList.validators, costCodeList.validators[].errorMessage, costCodeList.validators[].type, costCodeList.validators[].value, costCodeList.value, costCodeList.value[].disableIndividualSelection, costCodeList.value[].disabled, costCodeList.value[].extraData, costCodeList.value[].id, costCodeList.value[].key, costCodeList.value[].name, costCodeList.value[].secondaryName, costCodeList.value[].selected, costCodesEnabled, createdByName, createdByUserId, createdOn, currentUserId, decimalSeparator, defaultMarkTimeActivityAsBillable, defaultUserRate, displayHMPQuantity, displayHoursInDecimal, externalBuilderId, externalId, … (+121) |
| POST | `/apix/v2/TimeClock/summary` | allJobsSelected, isGeneralJobSelected, jobIds | allJobsSelected, asOfTime, autoEndBreakLength, autoEndBreakTimeRemaining, breakAutoEndTime, breakStart, builderTimeZone, canAdd, canAdjustOthers, canEdit, canUpdate, canViewOthers, clockInTime, clockInTimeIso, costCodeTitle, currentBreakMinutes, currentBuilderTime, currentBuilderTimeIso, currentJobName, currentMinutes, currentShift, dailyBreakTimeTotal, dailyTotal, decimalSeparator, defaultMarkTimeActivityAsBillable, displayHoursInDecimal, id, isClockedIn, isOnBreak, isRoundingEnabled, jobID, jobLinkedToAccounting, jobName, jobSupportsBillableRate, maxDailyTimeBeforeOvertime, maxWeeklyTimeBeforeOvertime, otherUsersClockedInWhenCantClockOutSelf, otherUsersOnJob, previousDailyTotalTime, shiftStatusJsonKey, … (+6) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/TimeClock/0/Recalculate` | blocked during crawl | approvalStatus, breaks, breaksToDelete, builderTimeZone, jobsite, lineItems, lineItems[].billRate, lineItems[].billTotal, lineItems[].builderCost, lineItems[].costCodeId, lineItems[].id, lineItems[].minutes, lineItems[].rate, minuteDistributionType, minutes2OT, minutesOT, minutesReg, notes, payrollItems, shiftType, tags, timeIn, timeOut, totalBreakTime, userMinuteData, users (via btn:Increase Value) |
| POST | `/apix/v2/TimeClock/summary` | blocked during crawl | allJobsSelected, isGeneralJobSelected, jobIds (via btn:View time sheets) |
| POST | `/api/TimeClock` | app bundle (not fired) | — |
| POST | `/api/TimeClock/ClockIn` | app bundle (not fired) | — |
| POST | `/api/TimeClock/ClockOutMultiple` | app bundle (not fired) | — |
| PUT | `/api/TimeClock/IncludeTimeClockInCostColumns` | app bundle (not fired) | — |
| PUT | `/api/TimeClock/OverrideGeofenceStatus` | app bundle (not fired) | — |
| PUT | `/api/TimeClock/SendShiftToAccounting` | app bundle (not fired) | — |
| PUT | `/api/TimeClock/Setup` | app bundle (not fired) | — |
| DELETE/PUT | `/api/TimeClock/{p}` | app bundle (not fired) | — |
| POST | `/api/TimeClock/{p}/ClockOut` | app bundle (not fired) | — |
| PUT | `/api/TimeClock/{p}/EndBreak` | app bundle (not fired) | — |
| POST | `/api/TimeClock/{p}/StartBreak` | app bundle (not fired) | — |
| PUT | `/api/calendar/updateShiftReason` | app bundle (not fired) | — |
| POST | `/apix/v2/TimeClock/bulk-details` | app bundle (not fired) | — |
| POST | `/apix/v2/TimeClock/get-overlapping-shifts` | app bundle (not fired) | — |
| PUT | `/apix/v2/TimeClock/mass-edit` | app bundle (not fired) | — |
| POST | `/apix/v2/TimeClock/mass-edit-options` | app bundle (not fired) | — |
| PUT | `/apix/v2/TimeClock/reset-approval` | app bundle (not fired) | — |

### Bundle read APIs not reached

`? /api/TimeClock/ApproveShift` · `GET /api/TimeClock/CanSendToAccounting` · `GET /api/TimeClock/ClockInDefaults` · `GET /api/TimeClock/ClockInDefaultsMultiple` · `GET /api/TimeClock/ClockOutDefaultsMultiple` · `GET /api/TimeClock/CurrentPunches` · `? /api/TimeClock/ExportToExcel` · `POST /api/TimeClock/Grid` · `GET /api/TimeClock/JobUsers`

## Plans and specs

- **VIABUILD equivalent:** `plans`, `plan_pages`, `plan_analysis`, `takeoffs`
- **Gateway verbs:** none
- **Coverage:** 3 screens/modals · 6 read endpoints · 0 blocked writes · bundle APIs reached 6/66

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Plans` | — | 0 | — |
| `/app/Plans/{guid}` | Plans, Specs | 5 | Add column, Add column › Created by, Add column › Created Date, Add column › Modified by, Add column › Modified Date |
| `/app/Specifications/Book` | Plans, Specs | 5 | Add column, Add column › Created by, Add column › Created Date, Add column › Modified by, Add column › Modified Date |

### Fields (UI)

Column with Header Selection (checkbox) · Press Space to toggle row selection (unchecked) (checkbox) · Sharing (column) · Status (column) · Title (column)

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/apix/v2/Plans?jobId=` | — | notifyUsers, notifyUsers.options, notifyUsers.options[].name, notifyUsers.options[].options, notifyUsers.options[].type, notifyUsers.title, notifyUsers.type, notifyUsers.validators, notifyUsers.value, pageId, planPages, planPages[].createdByUserId, planPages[].createdDate, planPages[].fileName, planPages[].hasAnnotations, planPages[].jobId, planPages[].lexoRank, planPages[].organizationId, planPages[].pageId, planPages[].setId, planPages[].thumbnailUrl, planPages[].updatedByUserId, planPages[].updatedDate, planSets, planSets[].createdByUserName, planSets[].createdDate, planSets[].hasAnnotations, planSets[].jobId, planSets[].lexoRank, planSets[].name, planSets[].organizationId, planSets[].setId, planSets[].updatedByUserName, planSets[].updatedDate, setId |
| GET | `/apix/v2/Plans/revisions/active?jobId=&setId=` | — | draftId, pageCount |
| GET | `/apix/v2/Plans/thumbnail/{guid}/{id}?autorotate=&height=&jobId=&portalType=&width=` | — | — |
| GET | `/apix/v2/Specifications/defaults?jobId=` | — | attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, attachedFiles.viewingPermissions.maxFileSize, attachedFiles.viewingPermissions.maxFiles, attachedFiles.viewingPermissions.minFileSize, attachedFiles.viewingPermissions.videoDurationLimit, attachedFiles.viewingPermissions.videoMaxSizeMB, bidPackageBasicInfos, builderId, canAdd, canDelete, canEdit, canShare, canViewBidPackage, … (+40) |
| GET | `/apix/v2/Specifications/list?jobId=` | — | canAdd, canDelete, canShare, canUpdate, groups, specifications, specifications[].builderId, specifications[].createdByName, specifications[].createdDate, specifications[].externalId, specifications[].hasUnpublishedChanges, specifications[].id, specifications[].isTitleTruncated, specifications[].jobId, specifications[].ownerShareMode, specifications[].relatedItemCounts, specifications[].sharingText, specifications[].specificationGroupId, specifications[].status, specifications[].subShareMode, specifications[].title, specifications[].updatedByName, specifications[].updatedDate, specifications[].version |
| GET | `/apix/v2/Specifications/lookup-list?jobId=` | — | jobInfo, jobInfo.builderId, jobInfo.canView, jobInfo.contractType, jobInfo.entityHasContact, jobInfo.id, jobInfo.isLegacyBudgetSunset, jobInfo.isStandaloneTemplate, jobInfo.jobStatus, jobInfo.name, jobInfo.ownerCell, jobInfo.ownerEmail, jobInfo.ownerName, jobInfo.ownerPhone, jobInfo.portal, jobInfo.userId, specifications, specifications[].builderId, specifications[].externalId, specifications[].id, specifications[].jobId, specifications[].ownerShareMode, specifications[].status, specifications[].subShareMode, specifications[].title |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| DELETE/POST/PUT | `/api/Specifications` | app bundle (not fired) | — |
| PUT | `/api/Specifications/Share` | app bundle (not fired) | — |
| PUT | `/api/Subscription/changePlanForBuilderSubscription` | app bundle (not fired) | — |
| POST | `/api/Takeoffs/Launch` | app bundle (not fired) | — |
| POST | `/apix/v2/Plans/external/sets/{p}/download-set` | app bundle (not fired) | — |
| POST | `/apix/v2/Plans/process` | app bundle (not fired) | — |
| PUT | `/apix/v2/Plans/rename-page` | app bundle (not fired) | — |
| PUT | `/apix/v2/Plans/rename-set` | app bundle (not fired) | — |
| PUT | `/apix/v2/Plans/reorder-pages` | app bundle (not fired) | — |
| PUT | `/apix/v2/Plans/reorder-sets` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Plans/revisions/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Plans/revisions/{p}/commit` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Plans/set/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Plans/share` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Plans/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/Plans/{p}/annotations` | app bundle (not fired) | — |
| POST | `/apix/v2/Plans/{p}/download-set` | app bundle (not fired) | — |
| POST | `/apix/v2/Plans/{p}/notify` | app bundle (not fired) | — |
| POST | `/apix/v2/Plans/{p}/version` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/bulk` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/defaults` | app bundle (not fired) | — |
| PUT | `/apix/v2/Specifications/group` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/groups` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/Specifications/groups/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/import-from-catalog` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/print` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/save-to-catalog` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/sharetoken` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/unpublished-changes-info` | app bundle (not fired) | — |
| PUT | `/apix/v2/Specifications/{p}/group` | app bundle (not fired) | — |
| POST | `/apix/v2/Specifications/{p}/save-to-catalog` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/Plan/limit` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/Subscription/change-plan` | app bundle (not fired) | — |
| POST | `/apix/v3/Plans/revisions/process` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/ImportWizard/TakeoffDataForImport` · `GET /api/Subscription/GetAvailableAddonsForPlan` · `GET /api/Subscription/GetAvailableOptionsForPlan` · `GET /api/Subscription/GetAvailablePlansForBuilder` · `GET /api/Takeoffs` · `GET /api/Takeoffs/DefaultInfo` · `GET /apix/v2/Plans/external-annotations/{p}` · `GET /apix/v2/Plans/external-details/{p}` · `? /apix/v2/Plans/external-file/{p}` · `? /apix/v2/Plans/external-thumbnail/{p}/{p}` · `GET /apix/v2/Plans/external/{p}` · `GET /apix/v2/Plans/file/{p}` · `? /apix/v2/Plans/revisions/{p}/page/{p}/file` · `GET /apix/v2/Plans/{p}/history` · `GET /apix/v2/Specifications/entity/external/{p}` · `GET /apix/v2/Specifications/external/{p}/Specifications` · `GET /apix/v2/Specifications/external/{p}/Specifications/{p}` · `GET /apix/v2/Specifications/external/{p}/list` · `GET /apix/v2/Specifications/users-to-notify` · `GET /apix/v2/Specifications/{p}` · `GET /apix/v2/Specifications/{p}/snapshot/{p}` · `GET /apix/v2/admin/Plan/limits` · `GET /apix/v2/admin/Plan/plan` · `GET /apix/v2/admin/Subscription/available-plans` · `GET /apix/v3/Plans/external-details/{p}` · `GET /apix/v3/Plans/{p}`

## Client updates / owner portal

- **VIABUILD equivalent:** `client_portal_access`, `client_portal_responses`, `project_feed_entries`
- **Gateway verbs:** none
- **Coverage:** 4 screens/modals · 3 read endpoints · 1 blocked writes · bundle APIs reached 4/27

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/ClientUpdate/0` | — | 0 | — |
| `/app/ClientUpdates` | — | 0 | — |
| `/app/ClientUpdates/ClientUpdate/0` | — | 0 | Generate AI summary |
| `/app/ClientUpdates/ClientUpdate/0 ⧉ Related actions › Browse Buildertrend` | — | 3 | — |

### Fields (UI)

Modified On (column) · Name (column) · Size (column)

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/apix/v2/ClientUpdates/setup` | — | defaultNotes, defaultNotes.content, defaultNotes.content.content, defaultNotes.content.type, defaultNotes.schemaVersion, publishDay |
| GET | `/apix/v2/Summary/owner-updates?Limit=&NextCursor=&UpdateTypes=&jobId=&sort=` | — | data, data[].addedByDate, data[].addedByUserId, data[].addedByUserName, data[].clientUpdateId, data[].commentCount, data[].date, data[].description, data[].endDate, data[].files, data[].files[].breadCrumbs, data[].files[].file, data[].hasUnreadComments, data[].reactCount, data[].releasedByDate, data[].releasedByUserId, data[].releasedByUserName, data[].startDate, data[].title, data[].type, data[].userInteractions, nextCursor, previousCursor |
| GET | `/apix/v3/ClientUpdates/generated?includeRelatedEntities=&jobId=` | — | addedByDate, addedById, addedByName, builderId, canViewReadReceipts, commentCount, description, description.content, description.content.content, description.content.type, description.schemaVersion, discussions, discussions.channelId, discussions.comments, discussions.currentPortalType, discussions.entityTitle, discussions.hasAddCommentPermissions, discussions.hasAddRFIPermissions, discussions.jobId, discussions.jobName, discussions.linkedDiscussionEntities, discussions.linkedDiscussionEntities.commentLinkedId, discussions.linkedDiscussionEntities.commentLinkedType, discussions.linkedDiscussionEntities.rfiLinkedId, discussions.linkedDiscussionEntities.rfiLinkedType, discussions.oldestUnreadCommentId, discussions.restrictSubAccess, discussions.rfiButtonOverride, discussions.rfiButtonOverride.message, discussions.rfiButtonOverride.value, discussions.rfis, discussions.showCommentInfo, discussions.showComments, discussions.showDiscussions, discussions.showRfis, endDate, externalId, id, isTemplate, jobId, … (+27) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| PUT | `/api/jobpicker/setownersession?jobId=` | blocked during crawl | — (via nav:/app/ownerPortalRedirect/{id}/false) |
| PUT | `/api/Calendar/UpdateOwnerViewing` | app bundle (not fired) | — |
| PUT | `/api/Documents/{p}/OwnerViewed` | app bundle (not fired) | — |
| PUT | `/api/Owners/{p}/UpdateSetup` | app bundle (not fired) | — |
| PUT | `/api/videos/{p}/UpdateOwnerView` | app bundle (not fired) | — |
| POST | `/apix/v2/ClientUpdates/ai-description` | app bundle (not fired) | — |
| POST | `/apix/v2/ClientUpdates/read-receipts` | app bundle (not fired) | — |
| POST | `/apix/v2/ClientUpdates/related-items` | app bundle (not fired) | — |
| PUT | `/apix/v2/ClientUpdates/setup` | app bundle (not fired) | — |
| DELETE | `/apix/v2/ClientUpdates/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/ClientUpdates/{p}/user-interactions` | app bundle (not fired) | — |
| PUT | `/apix/v2/OwnerSurvey/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/Permissions/homeowner` | app bundle (not fired) | — |
| PUT | `/apix/v2/Permissions/homeowner/apply-to-all-jobs` | app bundle (not fired) | — |
| PUT | `/apix/v2/Permissions/homeowner/defaults` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/Users/role-assign-orgowner` | app bundle (not fired) | — |
| POST | `/apix/v3/ClientUpdates` | app bundle (not fired) | — |
| PATCH | `/apix/v3/ClientUpdates/{p}` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/OwnerSummary/Summary` · `GET /api/Owners/Setup` · `GET /api/Survey/GetOwnerSurvey` · `POST /api/Survey/OwnerGrid` · `GET /apix/v2/ClientUpdates/print` · `GET /apix/v2/ClientUpdates/{p}/read-receipts` · `GET /apix/v2/Permissions/homeowner/{p}`

## Files (documents, photos, videos)

- **VIABUILD equivalent:** `documents`, `document_folders`, `document_versions`, `document_share_links`
- **Gateway verbs:** `docs.root`, `docs.folder`, `docs.file`, `docs.upload` (not_captured)
- **Coverage:** 7 screens/modals · 19 read endpoints · 2 blocked writes · bundle APIs reached 11/95

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Attachment/0/0` | — | 0 | — |
| `/app/Documents/0/0` | — | 6 | Add |
| `/app/Documents/0/0 ⧉ More` | — | 0 | — |
| `/app/Documents/Standard/0` | — | 6 | Add |
| `/app/Documents/Standard/0 ⧉ More` | — | 0 | — |
| `/app/Photos/Standard/0` | — | 0 | — |
| `/app/Videos/Standard/0` | — | 0 | More › Copy share link, More › Create QR code, More › Delete |

### Fields (UI)

Actions (column) · Added (column) · Contents (column) · Modified (column) · Name (column) · Shared with (column)

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Documents?id=&mediaType=&selectedJobsiteID=&showUniqueDocsOnly=` | — | data, allowedFileExtensions, blacklistedFileExtensions, canComment, canCreateFolder, canEmail, canNotify, canUserUpload, defaultShowLogins, defaultShowLogins.validators, defaultShowLogins.value, defaultShowLogins.value[].disableIndividualSelection, defaultShowLogins.value[].disabled, defaultShowLogins.value[].extraData, defaultShowLogins.value[].id, defaultShowLogins.value[].key, defaultShowLogins.value[].name, defaultShowLogins.value[].secondaryName, defaultShowLogins.value[].selected, defaultShowOwner, defaultShowSubs, defaultShowSubs.validators, defaultShowSubs.value, durationLimit, files, files[].AttachedEntityPath, files[].addedBy, files[].annotatedDocPath, files[].annotatedDocPathWithBranding, files[].annotationCount, files[].annotationGroupId, files[].annotationLinkCount, files[].builderId, files[].commentCount, files[].dateAttached, files[].docPath, files[].docPathWithBranding, files[].documentInstanceId, files[].downloadAnnotatedDocPath, files[].downloadDocPath, … (+63) |
| GET | `/api/Documents/GetNewDocumentContextMenu?associatedEntityId=&docType=` | — | data, contextMenuItems, contextMenuItems[].downloadLink, contextMenuItems[].is360Media, contextMenuItems[].isMediaAvailable, contextMenuItems[].itemId, contextMenuItems[].itemName, contextMenuItems[].itemType, contextMenuItems[].jobId, contextMenuItems[].source, contextMenuItems[].videoId |
| GET | `/api/files/{id}?builderId=&fileName=&isAttachment=&jobId=&portalType=&rowVersion=` | — | — |
| GET | `/api/files/{id}?builderId=&isAttachment=&jobId=&portalType=&rowVersion=` | — | — |
| GET | `/api/files/{id}/preview?autorotate=&builderId=&height=&includeAnnotations=&jobId=&mode=&portalType=&rowVersion=&width=` | — | — |
| GET | `/api/files/{id}/preview?autorotate=&builderId=&height=&jobId=&mode=&portalType=&rowVersion=&width=` | — | — |
| GET | `/api/files/{id}/preview?autorotate=&builderId=&height=&jobId=&mode=&rowVersion=&width=` | — | — |
| GET | `/api/files/{id}/preview?autorotate=&builderId=&height=&jobId=&mode=&width=` | — | — |
| GET | `/api/files/{id}/preview?builderId=&height=&jobId=&width=` | — | — |
| GET | `/api/files/brandingLogo?autorotate=&height=&id=&imageType=&mode=&rowVersion=&width=` | — | — |
| GET | `/api/files/brandingLogo?id=&imageType=&rowVersion=` | — | — |
| GET | `/api/files/emailSignatures?id=&rowVersion=` | — | — |
| GET | `/api/MediaFolders/{id}?mediaType=` | — | data, availableFolders, availableFolders[].children, availableFolders[].folderId, availableFolders[].folderName, availableFolders[].isCurrentFolder, availableFolders[].showOwner, availableFolders[].showSubs, canAdd, canDelete, canEdit, canOwnerUpload, canOwnerUpload.title, canOwnerUpload.validators, canOwnerUpload.value, canSubUpload, canSubUpload.title, canSubUpload.validators, canSubUpload.value, emailInfo, emailInfo.mailToAddress, emailInfo.replyToAddress, emailInfo.replyToName, emailInfo.subjectLine, id, jobName, name, name.title, name.validators, name.validators[].errorMessage, name.validators[].type, name.validators[].value, name.value, ownerName, ownerViewingDisabledMessage, parentFolderId, showOwner, showOwner.title, showOwner.validators, showOwner.value, … (+10) |
| GET | `/api/MediaFolders/{id}/FolderDetails?jobId=&mediaType=` | — | data, builderId, dateAdded, dateModified, folderId, jobId, jobName, title, totalCommentCount, totalCompletedSignatureCount, totalFileCount, totalLayerCount, totalPendingSignatureCount, totalRfiCount, totalSizeInBytes, totalSubFolderCount |
| GET | `/api/MediaFolders/GetDirectoryDetails?associatedTypeId=&directoryType=&filters=&folderId=&jobId=&mediaType=` | — | data, allowSubOwnerUploads, allowedFileExtensions, breadCrumbInformation, breadCrumbInformation[].associatedType, breadCrumbInformation[].directoryType, breadCrumbInformation[].folderId, breadCrumbInformation[].title, builderId, canAdd, canAddFiles, canAddFolders, canDelete, canEditBids, canEditChangeOrders, canEditDailyLogs, canEditScheduleItems, canEditSelections, canEditToDos, canEditWarranties, canEmailFiles, canEmailFilesIn, canUpdate, currentFolderId, currentFolderTitle, extraData, extraData.userInfo, extraData.userInfo.builderName, extraData.userInfo.firstName, extraData.userInfo.lastName, files, folders, folders[].builderId, folders[].canDelete, folders[].canUpdate, folders[].canUpload, folders[].dateAdded, folders[].dateModified, folders[].directoryType, folders[].fileInfo, … (+26) |
| GET | `/api/MediaFolders/MainDirectory?associatedTypeId=&directoryType=&folderId=&jobId=&mediaType=` | — | data, allowSubOwnerUploads, allowedFileExtensions, breadCrumbInformation, builderId, canAdd, canAddFiles, canAddFolders, canDelete, canEditBids, canEditChangeOrders, canEditDailyLogs, canEditScheduleItems, canEditSelections, canEditToDos, canEditWarranties, canEmailFiles, canEmailFilesIn, canUpdate, currentFolderId, currentFolderTitle, extraData, extraData.userInfo, extraData.userInfo.builderName, extraData.userInfo.firstName, extraData.userInfo.lastName, files, folders, folders[].builderId, folders[].canDelete, folders[].canUpdate, folders[].canUpload, folders[].dateAdded, folders[].dateModified, folders[].directoryType, folders[].fileInfo, folders[].fileInfo.annotationCount, folders[].fileInfo.discussionCount, folders[].fileInfo.rfiCount, folders[].fileInfo.signatureRequestTotal, … (+22) |
| GET | `/api/messages/folders` | — | data, folders, folders[].canDelete, folders[].canForward, folders[].canMark, folders[].canMove, folders[].canReply, folders[].deleteIsPermanent, folders[].folderId, folders[].isDrafts, folders[].isEditable, folders[].isReadOnly, folders[].isSent, folders[].name, folders[].unreadCount, isOutOfOffice, isSearchEnabled, maxFolderNameLength |
| GET | `/apix/v2/Documents/{id}` | — | annotationLayers, associatedType, builderId, canAdd, canAnnotate, canDelete, canEdit, description, description.validators, description.value, discussions, docLocation, docPath, documentId, documentListItem, documentListItem.annotationCount, documentListItem.annotationLinkCount, documentListItem.annotationReqAlert, documentListItem.canAnnotate, documentListItem.canRequestSignatures, documentListItem.canViewAnnotation, documentListItem.hasAnnotationLinks, documentListItem.layerCount, documentListItem.pdfSigReqAlert, documentListItem.showSignButton, documentListItem.signatureId, documentListItem.signatureRequestStatus, documentListItem.signatureRequestVersion, documentListItem.signatureStatus, documentListItem.signatureStatusText, documentListItem.signatureUserStatus, documentName, documentName.validators, documentName.value, downloadUrl, extension, file, file.fileTypes, file.selectedFile, file.selectedFile.brandedUrl, … (+113) |
| GET | `/apix/v2/Documents/templates?builderId=` | — | canEdit, templateList |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| GET | `/api/files/emailSignatures?id=&rowVersion=` | blocked during crawl | — (via nav:/app/Landing/JobPickerActions/Compose/0/{id}, nav:/app/Landing/QuickAction/Compose/0/{id}) |
| PUT | `/api/MediaFolders/RenameFolder` | blocked during crawl | folderId, title (via btn:More) |
| DELETE | `/api/Documents` | app bundle (not fired) | — |
| POST | `/api/Documents/EntityDocs` | app bundle (not fired) | — |
| POST | `/api/Documents/FromTemplate` | app bundle (not fired) | — |
| POST | `/api/Documents/MainPhoto` | app bundle (not fired) | — |
| PUT | `/api/Documents/NotifyOnDocumentLinkPermissionChange` | app bundle (not fired) | — |
| PUT | `/api/Documents/Rename` | app bundle (not fired) | — |
| POST | `/api/Documents/TempDocuments` | app bundle (not fired) | — |
| POST | `/api/Documents/TempFilesFromExistingDocs` | app bundle (not fired) | — |
| POST | `/api/Documents/TempFilesFromExternalUrl` | app bundle (not fired) | — |
| POST | `/api/Documents/ToggleDocumentViewPermissions` | app bundle (not fired) | — |
| POST | `/api/Documents/UpdateSavedSignature` | app bundle (not fired) | — |
| POST | `/api/Documents/{p}/BreakDocumentLink` | app bundle (not fired) | — |
| POST | `/api/Documents/{p}/TempFile` | app bundle (not fired) | — |
| DELETE | `/api/Media` | app bundle (not fired) | — |
| POST | `/api/Media/CopyFolder` | app bundle (not fired) | — |
| POST | `/api/Media/DownloadZipOfAttachedDocs` | app bundle (not fired) | — |
| POST | `/api/Media/DownloadZipOfAttachedDocsForEntity` | app bundle (not fired) | — |
| DELETE | `/api/Media/External` | app bundle (not fired) | — |
| POST | `/api/Media/GetCopyData` | app bundle (not fired) | — |
| POST | `/api/Media/GetFolderMoveData` | app bundle (not fired) | — |
| PUT | `/api/Media/MassUpdateFolderPermissions` | app bundle (not fired) | — |
| PUT | `/api/Media/MassUpdatePermissions` | app bundle (not fired) | — |
| POST | `/api/Media/MoveDocumentsAndFolders` | app bundle (not fired) | — |
| PUT | `/api/Media/Setup` | app bundle (not fired) | — |
| DELETE | `/api/Media/ZohoDocumentSession` | app bundle (not fired) | — |
| POST | `/api/MediaFolders` | app bundle (not fired) | — |
| POST | `/api/MediaFolders/DownloadZipOfFolder` | app bundle (not fired) | — |
| PUT | `/api/MediaFolders/{p}` | app bundle (not fired) | — |
| PUT | `/api/Messages/UpdateFolders` | app bundle (not fired) | — |
| POST | `/api/Photos/SaveTempPhotos` | app bundle (not fired) | — |
| PUT | `/api/Photos/SetOrder` | app bundle (not fired) | — |
| PUT | `/api/Photos/{p}/Update` | app bundle (not fired) | — |
| PUT | `/api/Videos/Attach` | app bundle (not fired) | — |
| PUT | `/api/Videos/AttachExternal` | app bundle (not fired) | — |
| POST | `/api/Videos/CreateVideo` | app bundle (not fired) | — |
| PUT | `/api/Videos/{p}` | app bundle (not fired) | — |
| POST | `/api/documents/entityDocsExternal` | app bundle (not fired) | — |
| POST | `/api/files/{p}/sharetoken` | app bundle (not fired) | — |
| POST | `/apix/v2/Admin/FinancialDocumentsAdmin` | app bundle (not fired) | — |
| PUT | `/apix/v2/Admin/FinancialDocumentsAdmin/WithdrawDocument` | app bundle (not fired) | — |
| POST | `/apix/v2/AgentSessions/{p}/files` | app bundle (not fired) | — |
| DELETE | `/apix/v2/AgentSessions/{p}/files/{p}` | app bundle (not fired) | — |
| DELETE/POST | `/apix/v2/BuilderSetup/files` | app bundle (not fired) | — |
| POST | `/apix/v2/Documents/create-from-template` | app bundle (not fired) | — |
| PUT | `/apix/v2/Documents/document-properties/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Documents/temp-upload` | app bundle (not fired) | — |
| POST | `/apix/v2/Documents/upload-extracted-document` | app bundle (not fired) | — |
| POST | `/apix/v2/FinancialDocuments/RequestedDocuments/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/PdfSignature/sign-document/external` | app bundle (not fired) | — |
| POST | `/apix/v2/PdfSignature/{p}/sign-document/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/BuilderSetup/{p}/files-download` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Documents/GetLinkedDocumentInstances` · `POST /api/Documents/GetMetadataForProducts` · `GET /api/Documents/MediaForFeedItem` · `? /api/Documents/TempFileExternal` · `GET /api/Documents/Unread` · `GET /api/Documents/ViewDocInBrowser` · `? /api/Documents/{p}/TempFile${r` · `? /api/Documents/{p}/TempFile${s` · `GET /api/Media/FileUploader` · `GET /api/Media/MediaDetails` · `? /api/Media/VCardDownload` · `GET /api/Media/ViewingPermissions` · `GET /api/MediaFolders/Defaults` · `GET /api/MediaFolders/EmailInfo` · `GET /api/Photos/{p}` · `GET /api/Photos/{p}/Preview` · `GET /api/Videos/GetDownloadLinks` · `GET /api/documents/BulkUploadData` · `GET /api/documents/GetSavedSignature` · `? /api/documents/{p}/tempFile{p}` · `? /api/files/{p}${e.dangerousDownload` · `GET /api/videos/GetResumableTicket` · `? /apix/v2.0/channels/org/{p}/media` · `GET /apix/v2/Documents/default-properties` · `GET /apix/v2/Documents/temp-files-from-existing-entity` · `GET /apix/v2/Documents/{p}/associated-entity-counts` · `GET /apix/v2/Documents/{p}/attached-to` · `GET /apix/v2/FinancialDocuments/RequestedDocuments` · `GET /apix/v2/Media/external-file-details` · `GET /apix/v2/Media/{p}/history` · `GET /apix/v2/MediaFolders/{p}` · `GET /apix/v2/PdfSignature/unsigned-documents` · `GET /apix/v2/PdfSignature/unsigned-documents/all` · `GET /apix/v2/Subs/{p}/attachments` · `GET /apix/v2/admin/BuilderSetup/{p}/files`

## Messaging, comments, notifications

- **VIABUILD equivalent:** `email_sends`, `project_feed_comments`, `schedule_task_messages`, `notifications`
- **Gateway verbs:** none
- **Coverage:** 15 screens/modals · 9 read endpoints · 1 blocked writes · bundle APIs reached 10/72

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Admin/BuilderNotificationHistory/0` | — | 0 | — |
| `/app/Chat` | — | 0 | New chat |
| `/app/Chat/Search` | — | 1 | New chat |
| `/app/Chat/Search ⧉ Chat search` | — | 0 | — |
| `/app/Comments/0` | — | 0 | — |
| `/app/Comments/0/0/0/{id}` | — | 0 | — |
| `/app/Comments/Conversation` | Conversations, Comments | 0 | Apply filter |
| `/app/Conversation/0/0/0/{id}` | — | 0 | — |
| `/app/External/Message/0` | — | 0 | — |
| `/app/Messages/Inbox` | — | 3 | Apply filter |
| `/app/NotificationHistory` | — | 6 | Apply filter |
| `/app/NotificationHistory ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/NotificationHistory/NotificationDetails/{id}/{id}/2026-10-29T17:33:18Z/true` | — | 6 | Apply filter |
| `/app/NotificationHistory/NotificationDetails/{id}/{id}/2026-10-29T17:33:18Z/true ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/Surveys/Individual` | — | 0 | — |

### Fields (UI)

Columns (select) · Date Received (column) · Date Sent (column) · Delivery Method (column) · From (column) · Job (column) · Search (text) · Subject (column) · To (column) · Type (column)

### Enums and dropdown options

- Columns: Check All / To / Type / Subject / Job / Date Sent / Delivery Method
- data.columnsList: To / Type / Subject / Job / Date Sent / Delivery Method

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/discussions/commentparticipants?linkedId=&linkedType=` | — | data, clientParticipants, clientParticipants[].canNotify, clientParticipants[].name, clientParticipants[].userId, internalParticipants, internalParticipants[].canNotify, internalParticipants[].name, internalParticipants[].userId, internalUsers, owners, subParticipants, subs |
| GET | `/api/Messages?defaultRecipientId=&jobId=` | — | data, composeToken, contactList, contactList.builderName, contactList.builders, contactList.builders[].canRemove, contactList.builders[].emailAddress, contactList.builders[].globalUserId, contactList.builders[].name, contactList.builders[].selectedField, contactList.contacts, contactList.owners, contactList.owners[].canRemove, contactList.owners[].emailAddress, contactList.owners[].globalUserId, contactList.owners[].name, contactList.owners[].selectedField, contactList.subs, contactList.subs[].canRemove, contactList.subs[].emailAddress, contactList.subs[].globalUserId, contactList.subs[].name, contactList.subs[].selectedField, emailMessageItem, emailMessageItem.attachedFiles, emailMessageItem.attachedFiles.files, emailMessageItem.attachedFiles.newFileOptions, emailMessageItem.attachedFiles.title, emailMessageItem.attachedFiles.viewingPermissions, emailMessageItem.bccRecipients, emailMessageItem.body, emailMessageItem.builderId, emailMessageItem.ccRecipients, emailMessageItem.includeSignature, emailMessageItem.jobId, emailMessageItem.jobsite, emailMessageItem.previousMessageBody, emailMessageItem.signature, emailMessageItem.subject, emailMessageItem.toRecipients, … (+7) |
| GET | `/api/messages/0/messageDetailsExternal` | — | reason |
| GET | `/api/Notifications/DetailsDisplay?dateSent=&isArchive=&isLongTerm=&jobsiteId=&notificationId=` | — | data, html |
| GET | `/api/PushNotifications/toggle` | — | data, hasPushNotificationsOn, options, options[].name, options[].showMassUpdate, options[].values, options[].values[].id, options[].values[].isOn, options[].values[].name |
| GET | `/apix/v2/Notifications/panel-info` | — | hasNotificationsSinceLastOpened |
| POST | `/api/Comments/Grid` | filters, filters.{key}, gridRequest, gridRequest.emptyStateEntity, gridRequest.hideMultiJobsColumns, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll, pagingData.totalRowsAllPages | data, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].addedByID, data[].builderId, data[].canDelete, data[].commentCount, data[].commentDate, data[].commentDateUtc, data[].commentId, data[].commentJson, data[].commentJson.content, data[].commentJson.schemaVersion, data[].commentText, data[].documentInstanceId, … (+36) |
| POST | `/api/messages/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hideMultiJobsColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll, pagingData.totalRowsAllPages | data, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].attachedFiles, data[].attachedFiles.docCount, data[].attachedFiles.entityId, data[].attachedFiles.entityType, data[].body, data[].builderId, data[].emailMessageFolderId, data[].from, data[].id, data[].isForwarded, data[].isRead, data[].isReply, … (+26) |
| POST | `/api/Notifications/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, includeEntitiesNotAssociatedWithJob, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow | data, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].builderId, data[].dateSent, data[].deliveryMethod, data[].deliveryMethod.hasEmail, data[].deliveryMethod.hasPush, data[].deliveryMethod.hasText, data[].id, data[].jobId, data[].jobsiteName, data[].messageType, data[].messageType.canUnsubscribe, data[].messageType.messageType, … (+29) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/apix/v2.0/NotificationPreferences` | blocked during crawl | notificationType, users, users[].builderId, users[].entityId (via nav:/app/Chat, btn:Chat search) |
| POST | `/api/Channels/{p}/Messages` | app bundle (not fired) | — |
| PUT | `/api/Comments/Setup` | app bundle (not fired) | — |
| POST | `/api/LeadMessages` | app bundle (not fired) | — |
| POST | `/api/LeadMessages/EmailWizard` | app bundle (not fired) | — |
| PUT | `/api/LeadMessages/{p}/Attach` | app bundle (not fired) | — |
| POST | `/api/Messages` | app bundle (not fired) | — |
| POST | `/api/Messages/Delete` | app bundle (not fired) | — |
| POST | `/api/Messages/MarkAsReadOrUnread` | app bundle (not fired) | — |
| POST | `/api/Messages/Move` | app bundle (not fired) | — |
| POST | `/api/Notifications/EmailSampleInvite` | app bundle (not fired) | — |
| PUT | `/api/Notifications/UpdateNotificationPreferences` | app bundle (not fired) | — |
| PUT | `/api/Notifications/{p}/UnsubscribeFromEmailNotification` | app bundle (not fired) | — |
| POST | `/api/PushNotifications/registerBrowser` | app bundle (not fired) | — |
| PUT | `/api/PushNotifications/toggle` | app bundle (not fired) | — |
| PUT | `/api/PushNotifications/togglePreferences` | app bundle (not fired) | — |
| POST | `/api/Signup/SendConfirmationEmail` | app bundle (not fired) | — |
| PUT | `/api/Subs/AddInactiveSubEmail` | app bundle (not fired) | — |
| PUT | `/api/Survey` | app bundle (not fired) | — |
| DELETE/POST/PUT | `/api/Survey/Definition` | app bundle (not fired) | — |
| PUT | `/api/Survey/Setup` | app bundle (not fired) | — |
| PUT | `/api/Survey/SubmitSurvey` | app bundle (not fired) | — |
| POST | `/api/Survey/Survey` | app bundle (not fired) | — |
| DELETE | `/api/Survey/{p}` | app bundle (not fired) | — |
| DELETE | `/api/SurveyQuestions/SurveyQuestion` | app bundle (not fired) | — |
| POST/PUT | `/api/SurveyQuestions/SurveySetupQuestion` | app bundle (not fired) | — |
| PUT | `/api/comments/NotifyPermissionChange` | app bundle (not fired) | — |
| PUT | `/api/comments/Permissions` | app bundle (not fired) | — |
| DELETE/PUT | `/api/comments/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/AgentSessions/{p}/messages` | app bundle (not fired) | — |
| PUT | `/apix/v2/ChatMessages/{p}/user-interactions` | app bundle (not fired) | — |
| PUT | `/apix/v2/Notifications/grouped-notifications` | app bundle (not fired) | — |
| PUT | `/apix/v2/Notifications/mark-all-read` | app bundle (not fired) | — |
| PUT | `/apix/v2/Notifications/panel-info` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Notifications/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/messages/unread-count` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/AgentSessions/{p}/messages` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Builders/{p}/reset-notifications` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/InAppMessages` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/admin/InAppMessages/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/NotificationHistory` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/admin/NotificationTemplates/{p}` | app bundle (not fired) | — |
| DELETE/POST | `/apix/v2/admin/SpamEmailRemoval` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Channels/MessageableUsers` · `GET /api/Channels/{p}/MessageableUsers` · `GET /api/LeadMessages/{p}/OwnEmail` · `GET /api/Messages/JobsiteForwardAddress` · `? /api/Notifications/ExportToExcel` · `GET /api/Notifications/NotificationPreferences` · `GET /api/Survey/DefinitionEdit` · `GET /api/Survey/GetBuilderSurvey` · `GET /api/Survey/GetNewSurvey` · `GET /api/Survey/GetSurveyDefinitionsList` · `POST /api/Survey/GridGrouped` · `POST /api/Survey/GridIndividual` · `GET /api/Survey/Print` · `GET /api/Survey/QuestionsPrint` · `POST /api/SurveyQuestions/AnswerReportGrid` · `? /api/SurveyQuestions/ExportToExcel` · `POST /api/SurveyQuestions/Grid` · `GET /api/calendar/PendingNotifications` · `? /apix/v1/EmailLinkClicked` · `? /apix/v1/emaillinkclicked` · `GET /apix/v2.0/Channels/Events/Messages/{p}/Cursor` · `GET /apix/v2/NotificationTemplates/user-activation-invite` · `GET /apix/v2/admin/NotificationTemplates`

## Leads (sales)

- **VIABUILD equivalent:** none in construction-OS (HubSpot deals via `jobs.hubspot_deal_id`)
- **Gateway verbs:** `leads.list`, `leads.get`, `leads.defaults`, `leads.create` (not_captured), `leads.update` (not_captured), `leads.convertToJob` (send, locked)
- **Coverage:** 7 screens/modals · 8 read endpoints · 0 blocked writes · bundle APIs reached 8/44

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Landing/QuickAction/Lead/0` | General, Activities, Proposals | 7 | Import, Save, Apply filter |
| `/app/Landing/QuickAction/Lead/0 ⧉ Job` | General, Activities, Proposals | 7 | Import, Save |
| `/app/Landing/QuickAction/LeadActivity/0/0/0` | — | 1 | — |
| `/app/leads/activities` | List view, Activity view, Activity calendar, Activity templates, Lead proposals, Proposal templates, Map | 46 | Apply filter |
| `/app/leads/calendar` | List view, Activity view, Activity calendar, Activity templates, Lead proposals, Proposal templates, Map | 46 | Apply filter |
| `/app/leads/map` | List view, Activity view, Activity calendar, Activity templates, Lead proposals, Proposal templates, Map | 46 | Apply filter |
| `/app/leads/opportunities` | List view, Activity view, Activity calendar, Activity templates, Lead proposals, Proposal templates, Map | 46 | Apply filter |

### Fields (UI)

Activity Links Clicked (column) · Age (column) · Cell Phone (column) · Client Contact (column) · Client Price (column) · Confidence (column) · Created Date (column) · Email Address (column) · Estimated Revenue (column) · Estimated Revenue Max (column) · Estimated Revenue Min (column) · Files (column) · First Name (column) · Last Activity Link Click (column) · Last Contacted (column) · Last Name (column) · Lead Status (column) · Map (column) · Markup (column) · Next Activity (column) · Notes (column) · Oct 25 - Oct 31, 2026 (date) · Opportunity Title (column) · Phone (column) · Project Type (column) · Project type (select) · Projected Sales Date (column) · Projected sales date (date) · Proposal Last Viewed (column) · Proposal Status (column) · Proposal Title (column) · Related Job (column) · Salespeople (select) · Salesperson (column) · Select a Lead (select) · Sold Date (column) · Source (column) · Sources (select) · State (Contact) (column) · State (Opportunity) (column) · Status (select) · Street (Contact) (column) · Street (Opportunity) (column) · Suburb (Contact) (column) · Suburb (Opportunity) (column) · Tags (column) · Tags (select) · Template Description (column) · Template Name (column) · Title (column) · Title (text) · Total Builder Cost (column) · Zip Code (Contact) (column) · Zip Code (Opportunity) (column)

### Enums and dropdown options

- data.columnsList: Template Name / Template Description / # of Activities / Created By / Created Date / Next Activity
- data.general.contractType.value: Fixed Price / Open Book
- data.general.projectType.value: -- None -- / Acreage / Double Storey / Duplex / Single Storey / Split Level
- data.general.source.value: Contact Form / Google / Hubspot / Referral
- data.general.status.value: Open / In Progress / On Hold / Pending / Lost / Sold / No Opportunity

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Leads/{id}` | — | reason |
| GET | `/api/Leads/Defaults` | — | data, activityCount, builderId, canAdd, canAddLeadProposal, canConvertToJob, canDelete, canEdit, canReassign, canViewEstimate, contact, contact.activationConfirmed, contact.activationSent, contact.activationStatus, contact.additionalEmails, contact.additionalEmails.validators, contact.additionalEmails.value, contact.address, contact.address.countryDropdown, contact.address.countryDropdownId, contact.address.fields, contact.address.formattedAddressNoStreet, contact.address.globalCountry, contact.address.layout, contact.address.location, contact.address.stateDropdown, contact.address.stateDropdownId, contact.address.validators, contact.builderId, contact.canAdd, contact.canDelete, contact.canEdit, contact.canEditPrimaryEmail, contact.canEditProfilePicture, contact.canEmailInternally, contact.canSendLeadEmail, contact.cellEmail, contact.cellEmail.validators, contact.cellEmail.value, contact.cellEmailLookupLoadData, … (+203) |
| GET | `/api/leads/dropdown` | — | data, data[].id, data[].name |
| POST | `/api/LeadActivities/Calendar` | filters, startDate, view | builders, builders[].id, builders[].name, calendarItems, canAdd, canDelete, canMarkComplete, canSetBaseline, canUpdate, excludedCounts, exportHeader, isBaselineSet, isOffline, jobs, listMetadata, listMetadata.emptyStatesMetadata, listMetadata.emptyStatesMetadata.hasDismissedAlert, listMetadata.emptyStatesMetadata.hasFilteredData, listMetadata.emptyStatesMetadata.helpLink, listMetadata.emptyStatesMetadata.isMissingRequiredParentEntities, listMetadata.emptyStatesMetadata.isNewToEntity, listMetadata.emptyStatesMetadata.isReadOnly, listMetadata.hasData, phases, selectedJobsWorkdays, selectedJobsWorkdays.friday, selectedJobsWorkdays.monday, selectedJobsWorkdays.saturday, selectedJobsWorkdays.sunday, selectedJobsWorkdays.thursday, selectedJobsWorkdays.tuesday, selectedJobsWorkdays.wednesday, showJobNames, showTimestamps, startDate, workdayExceptions |
| POST | `/api/LeadActivities/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, builderId, canAdd, canDelete, canReassignSalesperson, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, footerData, hasMoreRows, infiniteScrollStatus, isLoaded, isRecordCountCapped, isTotalCountRemoved, listMetaData, listMetaData.emptyStatesMetadata, listMetaData.emptyStatesMetadata.hasDismissedAlert, listMetaData.emptyStatesMetadata.hasFilteredData, … (+9) |
| POST | `/api/LeadActivities/GridForLead` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hideMultiJobsColumns, gridRequest.sortColumn, gridRequest.sortDirection, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize, pagingData.resetScroll, pagingData.totalRowsAllPages | data, canAdd, canDelete, canUpdate, columnsList, data, footerData, hasMoreRows, infiniteScrollStatus, isLoaded, isRecordCountCapped, isTotalCountRemoved, listMetaData, listMetaData.emptyStatesMetadata, listMetaData.emptyStatesMetadata.hasDismissedAlert, listMetaData.emptyStatesMetadata.hasFilteredData, listMetaData.emptyStatesMetadata.helpLink, listMetaData.emptyStatesMetadata.isMissingRequiredParentEntities, listMetaData.emptyStatesMetadata.isNewToEntity, listMetaData.emptyStatesMetadata.isReadOnly, listMetaData.hasData, page, pageSize, records, totalPages |
| POST | `/api/LeadActivities/GridTemplate` | gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize | data, canAdd, canDelete, canDownloadExcel, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, footerData, hasMoreRows, infiniteScrollStatus, isLoaded, isRecordCountCapped, isTotalCountRemoved, listMetaData, listMetaData.emptyStatesMetadata, listMetaData.emptyStatesMetadata.hasDismissedAlert, listMetaData.emptyStatesMetadata.hasFilteredData, listMetaData.emptyStatesMetadata.helpLink, … (+8) |
| POST | `/api/Leads/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, gridType, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow | data, builderId, canAdd, canDelete, canDownloadExcel, canReassignSalesperson, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].age, data[].attachedFiles, data[].attachedFiles.docCount, data[].attachedFiles.entityId, data[].attachedFiles.entityType, data[].builderId, data[].cellPhone, data[].confidence, data[].contactCity, … (+118) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/LeadActivities` | app bundle (not fired) | — |
| DELETE | `/api/LeadActivities/BulkDeleteActivities` | app bundle (not fired) | — |
| POST | `/api/LeadActivities/BulkReassignActivities` | app bundle (not fired) | — |
| POST | `/api/LeadActivities/BulkUpdateColor` | app bundle (not fired) | — |
| POST | `/api/LeadActivities/CopyToTemplate` | app bundle (not fired) | — |
| POST | `/api/LeadActivities/ReassignFutureActivities` | app bundle (not fired) | — |
| DELETE/PUT | `/api/LeadActivities/{p}` | app bundle (not fired) | — |
| PUT | `/api/LeadActivities/{p}/Complete` | app bundle (not fired) | — |
| PUT | `/api/LeadContactForm` | app bundle (not fired) | — |
| PUT | `/api/LeadToJob/ExistingJob` | app bundle (not fired) | — |
| PUT | `/api/LeadToJob/{p}` | app bundle (not fired) | — |
| POST/DELETE | `/api/Leads` | app bundle (not fired) | — |
| POST | `/api/Leads/ActivityImportSetup` | app bundle (not fired) | — |
| POST/PUT | `/api/Leads/ActivityTemplate` | app bundle (not fired) | — |
| DELETE | `/api/Leads/BulkDeleteFutureActivities` | app bundle (not fired) | — |
| PUT | `/api/Leads/BulkUpdateLeads` | app bundle (not fired) | — |
| POST | `/api/Leads/ImportActivity` | app bundle (not fired) | — |
| PUT | `/api/Leads/Setup` | app bundle (not fired) | — |
| POST | `/api/Leads/UpdateStatus` | app bundle (not fired) | — |
| POST | `/api/Leads/UpdateStatusSetup` | app bundle (not fired) | — |
| PUT | `/api/Leads/{p}` | app bundle (not fired) | — |
| DELETE | `/api/Leads/{p}${t` | app bundle (not fired) | — |
| PUT | `/api/Signup/UploadLeadData` | app bundle (not fired) | — |
| PUT | `/apix/v2/Leads/resubscribe` | app bundle (not fired) | — |
| PUT | `/apix/v2/Leads/unsubscribe` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/LeadActivities/Defaults` · `? /api/LeadActivities/ExportTemplatesToExcel` · `? /api/LeadActivities/ExportToExcel` · `GET /api/LeadActivities/GetFutureActivitiesCount` · `GET /api/LeadActivities/GetFutureActivityIds` · `? /api/Leads/ExportToExcel` · `GET /api/Leads/Print` · `GET /api/Leads/WhatToCopy` · `GET /api/Login/GetLoginNameAndIdForLead` · `GET /apix/v3/Reporting/lead-activities-by-salesperson` · `GET /apix/v3/Reporting/lead-count-by-salesperson` · `GET /apix/v3/Reporting/lead-status-by-source`

## Client contacts

- **VIABUILD equivalent:** `entities` (`is_client`), `entity_persons`, `job_entities`
- **Gateway verbs:** `contacts.list`, `contacts.get`, `contacts.create` (not_captured), `contacts.update` (not_captured)
- **Coverage:** 5 screens/modals · 4 read endpoints · 0 blocked writes · bundle APIs reached 3/19

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Contacts` | — | 9 | Apply filter |
| `/app/Contacts ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/Contacts/Contact/{id}/false` | — | 17 | Apply filter |
| `/app/Contacts/Contact/{id}/false ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/Landing/QuickAction/Contact/0/false` | — | 0 | — |

### Fields (UI)

Activation Status (column) · Cell Phone (column) · Columns (select) · Created Date (column) · Display Name (column) · Job Name (column) · Jobs (column) · Lead Opportunities (column) · Postal Code (column) · Primary Phone (column) · Project Manager (column) · Salesperson (column) · Sold Date (column) · State (column) · Status (column) · Street Address (column) · Suburb (column) · Title (column)

### Enums and dropdown options

- Columns: Check All / Display Name / Activation Status / Primary Phone / Cell Phone / Street Address / State / Postal Code / Jobs / Lead Opportunities / Email / First Name / Last Name
- data.columnsList: Display Name / Activation Status / Primary Phone / Cell Phone / Street Address / State / Postal Code / Jobs / Lead Opportunities / Suburb / Email / First Name / Last Name

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Contacts/{id}/Details` | — | data, activationConfirmed, activationSent, activationStatus, additionalEmails, additionalEmails.validators, additionalEmails.validators[].errorMessage, additionalEmails.validators[].type, additionalEmails.validators[].value, additionalEmails.value, additionalEmails.value[].emailAddress, additionalEmails.value[].friendlyName, additionalEmails.value[].fullEmail, address, address.countryDropdown, address.countryDropdownId, address.fields, address.fields[].addressFieldType, address.fields[].inputType, address.fields[].order, address.fields[].title, address.fields[].validators, address.fields[].value, address.formattedAddressNoStreet, address.globalCountry, address.layout, address.location, address.location.mapPosition, address.location.mappingStatus, address.stateDropdown, address.stateDropdownId, address.validators, address.validators[].errorMessage, address.validators[].type, address.validators[].value, builderId, canAdd, canDelete, canEdit, canEditPrimaryEmail, … (+130) |
| GET | `/api/Contacts/0/Details` | — | data, activationConfirmed, activationSent, activationStatus, additionalEmails, additionalEmails.validators, additionalEmails.validators[].errorMessage, additionalEmails.validators[].type, additionalEmails.validators[].value, additionalEmails.value, address, address.countryDropdown, address.countryDropdownId, address.fields, address.fields[].addressFieldType, address.fields[].inputType, address.fields[].order, address.fields[].title, address.fields[].validators, address.fields[].value, address.formattedAddressNoStreet, address.globalCountry, address.layout, address.location, address.location.mapPosition, address.location.mappingStatus, address.stateDropdown, address.stateDropdownId, address.validators, address.validators[].errorMessage, address.validators[].type, address.validators[].value, builderId, canAdd, canDelete, canEdit, canEditPrimaryEmail, canEditProfilePicture, canEmailInternally, canSendLeadEmail, … (+102) |
| GET | `/api/support/ContactUs` | — | data, email, header, phoneNumber, timezone, workDays, workHours |
| POST | `/api/Contacts/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber, pagingData.pageSize | data, canAdd, canDelete, canDownloadExcel, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].activationStatusInfo, data[].activationStatusInfo.activationConfirmed, data[].activationStatusInfo.activationSent, data[].activationStatusInfo.activationStatus, data[].builderId, data[].cell, data[].city, data[].customFields, data[].displayName, data[].displayName.accountingType, data[].displayName.builderId, … (+44) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/Contacts` | app bundle (not fired) | — |
| POST | `/api/Contacts/MergeContacts` | app bundle (not fired) | — |
| POST | `/api/Contacts/UpdateSessionForContacts` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Contacts/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/ContactForm` | app bundle (not fired) | — |
| POST | `/apix/v2/Contacts` | app bundle (not fired) | — |
| PUT | `/apix/v2/Contacts/invite` | app bundle (not fired) | — |

### Bundle read APIs not reached

`? /api/Contacts/ExportToExcel` · `POST /api/Contacts/GetContactsByIds` · `GET /api/Contacts/Setup` · `? /api/Contacts/{p}/Usage` · `GET /api/Contacts/{p}/print` · `GET /apix/v2/Contacts/contacts/jobs/{p}/permissions` · `GET /apix/v2/Contacts/jobs/{p}/manage-clients` · `GET /apix/v2/Summary/job/{p}/builder-contact-info` · `GET /apix/v2/Summary/job/{p}/contact-info`

## Subs / vendors

- **VIABUILD equivalent:** `entities` (`is_supplier`, `is_subcontractor`), `entity_compliance`, `supplier_contacts`
- **Gateway verbs:** none
- **Coverage:** 2 screens/modals · 4 read endpoints · 1 blocked writes · bundle APIs reached 5/50

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Landing/QuickAction/SubVendor/0/{id}` | Additional information, Notifications, Job access, Accounting, Trade agreement | 38 | — |
| `/app/Sub` | — | 0 | — |

### Fields (UI)

ABN Details Received (checkbox) · Agreement/Info Pack Sent (checkbox) · Assign RFIs to other subs/vendors (checkbox) · Automatically permit access to new jobs (checkbox) · Blue Card Recd (checkbox) · Business phone (text) · Company name (text) · Contractors Licence Recd (checkbox) · Date opened (column) · Default payment email address (select) · Division/trade (select) · Email (column) · Expiration date (date) · Fax (text) · Hold payments to the sub/vendor (checkbox) · Job name (column) · Job status (column) · Maintenance Agree Signed (checkbox) · Notes (text) · Notify me when (checkbox) · Primary contact (first & last name) (text) · Public Liability Recd (checkbox) · Push (column) · Reminder limit (select) · SWMS Template Received (checkbox) · Share documents with client (checkbox) · Supplier Login BT Sent (checkbox) · Text (column) · View client information (checkbox) · WC Info Pack Signed (checkbox) · White Card Received (checkbox) · Workers Comp Received (checkbox) · additionalCert1.certReminderDays (number) · additionalCert2.certReminderDays (number) · conflictAlertThreshold (number) · generalLiabilityCert.certReminderDays (number) · notes (textarea) · workmansCompCert.certReminderDays (number)

### Enums and dropdown options

- data.certMaxReminderOptions.value: 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10
- data.columnsList: Company name / Primary contact / Email / Cell / Phone / Activation / Trade agreement status / Liability exp. / Worker's comp exp. / Sub/vendor divisions / License Details & Number / Trade/Supply Agreement / Discuss with owners / Hold payment / Auto access / Linked to Xero / Fax / Street address / State / Zip code / Suburb / Agreement/Info Pack Sent / Contractors Licence Recd / Workers Comp Received / Public Liability Recd / ABN Details Received / White Card Received / SWMS Template Received / Maintenance Agree Signed / WC Info Pack Signed / Supplier Login BT Sent / Blue Card Recd

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/RiskInsurance/Status?jobId=` | — | data, applicationDate, binderDocInstanceId, builderHasRiskInsuranceProposal, coverageText, currentBuilderId, currentJobsiteId, endorsementDocInstanceId, hasAdminViewPerms, hasInsuranceModifiedData, jobHasBriProviderUpdates, jobsiteBinderDownloadLink, jobsiteCoverageIsCanceled, jobsiteEndorsementDownloadLink, jobsiteHasBRIRequest, jobsiteIsCovered, jobsitePolicyDownloadLink, jobsiteRiskInsuranceBinderExpirationDateTime, jobsiteRiskInsuranceOriginalExpirationDate, jobsiteRiskInsuranceRequestDateTime, jobsiteRiskInuranceOriginalRequestDate, lastSuccessfulStage, originalCoveragePeriodText, paymentMethods, paymentStatusBT, paymentStatusSS, paymentsCaptured, policyDocInstanceId, policyHasBeenUpdated, policyModifiedBy, policyModifiedOn, reportClaimText, riskInsuranceCoverageStatus, riskInsurancePdfLocation, riskInsuranceStatus, shouldShowCoverageResponse, updatedCoveragePeriodText, updatedPolicyInfoText |
| GET | `/api/Subs/DefaultInfo` | — | data, activationStatus, additionalCert1, additionalCert1.allowedFileTypes, additionalCert1.certExpires, additionalCert1.certExpires.validators, additionalCert1.certExpires.value, additionalCert1.certMaxReminders, additionalCert1.certReminderBeforeAfter, additionalCert1.certReminderBeforeAfter.validators, additionalCert1.certReminderBeforeAfter.value, additionalCert1.certReminderDays, additionalCert1.certTitle, additionalCert1.deleteCert, additionalCert1.file, additionalCert1.previousFilesCount, additionalCert1.signatureImagePath, additionalCert2, additionalCert2.allowedFileTypes, additionalCert2.certExpires, additionalCert2.certExpires.validators, additionalCert2.certExpires.value, additionalCert2.certMaxReminders, additionalCert2.certReminderBeforeAfter, additionalCert2.certReminderBeforeAfter.validators, additionalCert2.certReminderBeforeAfter.value, additionalCert2.certReminderDays, additionalCert2.certTitle, additionalCert2.deleteCert, additionalCert2.file, additionalCert2.previousFilesCount, additionalCert2.signatureImagePath, additionalCertText, address, address.countryDropdown, address.countryDropdownId, address.fields, address.fields[].addressFieldType, address.fields[].inputType, address.fields[].order, … (+252) |
| GET | `/api/Subs/JobAccess?filter=&id=` | — | data, jobs, jobs[].dateCreated, jobs[].groupNames, jobs[].hasAccess, jobs[].jobId, jobs[].jobName, jobs[].jobStatus |
| POST | `/api/Subs/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.selectedSystemFilter, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow | data, accountingImportIntegrationName, canAdd, canDelete, canEditPaymentContactInfo, canManageSubscription, canRequestAchInfo, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, data[].additionalCertificate1ExpirationDate, data[].additionalCertificate1ExpirationDate.expirationDate, data[].additionalCertificate1ExpirationDate.isExpired, data[].additionalCertificate2ExpirationDate, data[].additionalCertificate2ExpirationDate.expirationDate, data[].additionalCertificate2ExpirationDate.isExpired, data[].builderId, data[].canDiscussWithOwners, … (+64) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| GET | `/api/Subs/CheckSendSubInvitePermission` | blocked during crawl | — (via btn:Sub Certificates, nav:/app/Sub) |
| PUT | `/api/Accounting/{p}/UpdateVendorLink` | app bundle (not fired) | — |
| POST | `/api/RiskInsurance/BuildJobsiteBinder` | app bundle (not fired) | — |
| POST | `/api/RiskInsurance/SubmitJobsiteRequest` | app bundle (not fired) | — |
| POST | `/api/Subs` | app bundle (not fired) | — |
| PUT | `/api/Subs/BulkInviteSubs` | app bundle (not fired) | — |
| PUT | `/api/Subs/Details` | app bundle (not fired) | — |
| PUT | `/api/Subs/SetSubEnabledStatus` | app bundle (not fired) | — |
| PUT | `/api/Subs/Setup` | app bundle (not fired) | — |
| POST | `/api/Subs/UpdateSubDivisions` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Subs/{p}` | app bundle (not fired) | — |
| PUT | `/api/Subs/{p}/ApproveCertificate` | app bundle (not fired) | — |
| POST | `/api/Subs/{p}/RequestCertificateApproval` | app bundle (not fired) | — |
| PUT | `/api/Subs/{p}/SyncAccountingVendor` | app bundle (not fired) | — |
| DELETE | `/api/VendorAccounts` | app bundle (not fired) | — |
| PUT | `/api/VendorAccounts/UpdateVendorAccountPreferences` | app bundle (not fired) | — |
| POST | `/api/VendorProducts/CanSendProductsToCart` | app bundle (not fired) | — |
| POST | `/api/VendorProducts/ImportToCatalog` | app bundle (not fired) | — |
| POST | `/api/VendorProducts/MarkProductsSeen` | app bundle (not fired) | — |
| POST | `/api/VendorProducts/SendToCart` | app bundle (not fired) | — |
| POST/DELETE | `/apix/v2/PaymentMethods/sub/{p}/bank-account` | app bundle (not fired) | — |
| DELETE/POST | `/apix/v2/PaymentMethods/sub/{p}/check-address` | app bundle (not fired) | — |
| POST | `/apix/v2/Subs/assignments/export` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Subs/bulk` | app bundle (not fired) | — |
| POST | `/apix/v2/Subs/replaceable-items/grid` | app bundle (not fired) | — |
| POST | `/apix/v2/Subs/send-sample-invitation` | app bundle (not fired) | — |
| POST | `/apix/v2/Subs/{p}/replace` | app bundle (not fired) | — |
| POST | `/apix/v2/VendorManualAccountLinks/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/AdminVendorManualAccountLinks/initiate-manual-link` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/AdminVendorManualAccountLinks/update-status` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/RiskInsurance/send-to-chargebee/{p}` | app bundle (not fired) | — |
| DELETE | `/apix/v2/admin/Users/subs` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/RiskInsurance/{p}/DefaultInfo` · `GET /api/Subs/AsSelectItems` · `GET /api/Subs/CertificateContextMenu` · `GET /api/Subs/Detail` · `? /api/Subs/ExportToExcel` · `GET /api/Subs/GetBuilderSubCategories` · `GET /api/VendorAccounts/Stores` · `GET /api/VendorAccounts/VendorRedirect` · `GET /api/VendorAccounts/VendorSettings` · `GET /api/VendorAccounts/VendorStoreFinder` · `GET /api/VendorProducts/ForImport` · `GET /api/VendorProducts/Inventory` · `GET /api/VendorPurchases/{p}` · `POST /apix/v2/Subs/assignments/grid`

## Internal users and roles

- **VIABUILD equivalent:** `profiles`, `custom_roles`, `job_role_assignments`
- **Gateway verbs:** none
- **Coverage:** 7 screens/modals · 6 read endpoints · 0 blocked writes · bundle APIs reached 6/54

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/InternalUser/0/0` | Overview, Permissions, Notifications, Messaging, Job Access ({n}), Security & Login, Other | 22 | Apply filter |
| `/app/InternalUsers` | — | 7 | Apply filter |
| `/app/InternalUsers ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/InternalUsers/InternalUser/{id}` | Overview, Permissions, Notifications, Messaging, Job Access ({n}), Security & Login, Other, Buildertrend Takeoff | 39 | Apply filter |
| `/app/InternalUsers/InternalUser/{id} ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/Landing/MyUserDetails` | Overview, Permissions, Notifications, Messaging, Job Access ({n}), Security & Login, Other, Buildertrend Takeoff | 36 | Apply filter |
| `/app/Landing/QuickAction/InternalUser/0` | Overview, Permissions, Notifications, Messaging, Job Access ({n}), Security & Login, Other | 22 | — |

### Fields (UI)

Access (column) · Accounting (column) · Active (checkbox) · Administrative (column) · Auto Access (column) · Columns (select) · Company Settings (column) · Contact Information (textarea) · Cost and/or price viewing (column) · Date opened (column) · Default billable rate (text) · Default labor cost (text) · Default labor cost code (select) · Email (column) · Files (column) · Financial (column) · First Name (text) · Grant access to all existing jobs and templates (checkbox) · Grant automatic access to new jobs and templates (checkbox) · Grant {person} automatic access to new jobs and templates (checkbox) · Group (column) · Job name (column) · Job status (column) · Last Name (text) · Lead Activities (select) · Login (column) · Messaging (column) · Name (column) · Notifications (column) · Notify me when (checkbox) · Pay online (column) · Phone (column) · Phone Number (text) · Project management (column) · Push (column) · Require location on mobile and track when clocks in or out beyond the geofence. (checkbox) · Require location on mobile and track when {person} clocks in or out beyond the geo (checkbox) · Require location on mobile and track when {person} clocks in or out beyond the geofe (checkbox) · Role (column) · Role (select) · Sales (column) · Schedule Items (select) · Set Out of Office Status (checkbox) · Tasks (select) · Text (column) · conflictAlertMaxCount (number) · customFields.3.value (textarea) · customFields.5.value (textarea)

### Enums and dropdown options

- Columns: Check All / Name / Role / Company Settings / Login / Auto Access / Email / Phone / Cell Email / Contact Info / *Custom Field - Birthdate / *Custom Field - Drivers Licence / *Custom Field - Employment Anniversary
- data.columnsList: Name / Role / Company Settings / Login / Auto Access / Email / Phone / Contact Info / Cell Email / Employment Anniversary / Birthdate / Partners Name / Kids Names / White Card / Trade Licences / Trade Licence Attachments / Drivers Licence / Orientation & Induction

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/InternalUsers/{id}` | — | data, canAdd, canChangeEmail, canDelete, canEdit, canEditJobAccess, canStartChatConversation, canView, canViewNotifications, continueEditing, hasCostCodesFeature, hasLinkedUsers, hasTimeClockCostViewing, internalUser, internalUser.accountConfirmationDate, internalUser.activationStatus, internalUser.activationStatus.statusId, internalUser.activationStatus.statusText, internalUser.addToAllExistingJobs, internalUser.additionalEmails, internalUser.additionalEmails.validators, internalUser.additionalEmails.value, internalUser.autoAddJobsites, internalUser.autoAddJobsites.title, internalUser.autoAddJobsites.validators, internalUser.autoAddJobsites.value, internalUser.builderId, internalUser.byCostCodeHourlyTracking, internalUser.calendarFeedSummaryViewModel, internalUser.calendarFeedSummaryViewModel.CalendarFeedItems, internalUser.calendarFeedSummaryViewModel.LeadActivityOptions, internalUser.calendarFeedSummaryViewModel.ScheduleItemOptions, internalUser.calendarFeedSummaryViewModel.TasksOptions, internalUser.calendarFeedSummaryViewModel.ToDosOptions, internalUser.canEmailInternally, internalUser.canModifyCustomFields, internalUser.cell, internalUser.cell.validators, internalUser.cell.value, internalUser.cellEmailLookupLoadData, … (+135) |
| GET | `/api/InternalUsers/Defaults` | — | data, canAdd, canChangeEmail, canDelete, canEdit, canEditJobAccess, canStartChatConversation, canView, canViewNotifications, continueEditing, hasCostCodesFeature, hasLinkedUsers, hasTimeClockCostViewing, internalUser, internalUser.accountConfirmationDate, internalUser.activationStatus, internalUser.addToAllExistingJobs, internalUser.addToAllExistingJobs.title, internalUser.addToAllExistingJobs.validators, internalUser.addToAllExistingJobs.value, internalUser.additionalEmails, internalUser.additionalEmails.validators, internalUser.additionalEmails.value, internalUser.autoAddJobsites, internalUser.autoAddJobsites.title, internalUser.autoAddJobsites.validators, internalUser.autoAddJobsites.value, internalUser.builderId, internalUser.byCostCodeHourlyTracking, internalUser.calendarFeedSummaryViewModel, internalUser.canEmailInternally, internalUser.canModifyCustomFields, internalUser.cell, internalUser.cell.validators, internalUser.cell.value, internalUser.cellEmailLookupLoadData, internalUser.cellEmailLookupLoadData.countryCode, internalUser.cellEmailLookupLoadData.serviceProviders, internalUser.cellPhoneNumber, internalUser.companyName, … (+112) |
| GET | `/api/InternalUsers/JobAccess?addToAllExistingJobs=&filter=&userId=` | — | data, jobs, jobs[].dateCreated, jobs[].groupNames, jobs[].hasAccess, jobs[].hasNotificationAccess, jobs[].jobId, jobs[].jobName, jobs[].jobStatus |
| GET | `/api/payroll/InternalUsersSettings?globalUserId=` | — | data, availableJobs, canUpdate, canView, payrollEmployeeId, payrollEmployees, payrollIntegratioName, payrollJobID, payrollLogoUrl, syncStatus |
| GET | `/api/Users/Profile?userId=` | — | data, canStartChatConversation, cellPhone, email, name, phone, primaryContact, title, userType |
| POST | `/api/InternalUsers/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, accountingImportIntegrationName, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, currentUserIsOrgOwner, currentUserLoginId, currentUsers, data, data[].activationStatus, data[].activationStatus.activationStatus, data[].activationStatus.lastReminderSent, data[].activationStatus.statusText, data[].adminAccess, data[].autoAccesss, data[].builderId, data[].cellEmail, … (+41) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| POST | `/api/InternalUsers/AddInternalUserReact` | app bundle (not fired) | — |
| PUT | `/api/InternalUsers/JobDescription` | app bundle (not fired) | — |
| PUT | `/api/InternalUsers/ReassignItemsForUserDeletion` | app bundle (not fired) | — |
| PUT | `/api/InternalUsers/ReassignJobsitesForUserDeletion` | app bundle (not fired) | — |
| DELETE | `/api/InternalUsers/{p}` | app bundle (not fired) | — |
| PUT | `/api/InternalUsers/{p}/UpdateInternalUserReact` | app bundle (not fired) | — |
| POST/PUT | `/api/Roles` | app bundle (not fired) | — |
| PUT | `/api/Roles/ReassignRole` | app bundle (not fired) | — |
| PUT | `/api/Roles/ToggleSystemRole` | app bundle (not fired) | — |
| DELETE | `/api/Roles/{p}` | app bundle (not fired) | — |
| PUT | `/api/Users/AcceptTermsAndPolicies` | app bundle (not fired) | — |
| POST | `/api/Users/FinalizeActivation` | app bundle (not fired) | — |
| PUT | `/api/Users/LinkExisting` | app bundle (not fired) | — |
| PUT | `/api/Users/MassEntityReassign` | app bundle (not fired) | — |
| POST | `/api/Users/MassInviteUsers` | app bundle (not fired) | — |
| POST | `/api/jobsites/JobPermissions` | app bundle (not fired) | — |
| PUT | `/api/jobsites/UpdateSubPermissions` | app bundle (not fired) | — |
| PUT | `/api/jobsites/UpdateUserPermissions` | app bundle (not fired) | — |
| PUT | `/api/jobsites/{p}/Users` | app bundle (not fired) | — |
| POST | `/apix/v2/Roles/bulk-assign` | app bundle (not fired) | — |
| DELETE | `/apix/v2/Users/bulk-delete` | app bundle (not fired) | — |
| POST | `/apix/v2/Users/bulk-invite` | app bundle (not fired) | — |
| POST | `/apix/v2/Users/me/mfa-enrollment` | app bundle (not fired) | — |
| POST | `/apix/v2/Users/me/request-password-reset` | app bundle (not fired) | — |
| POST | `/apix/v2/Users/opt-in` | app bundle (not fired) | — |
| POST | `/apix/v2/Users/phone-verify/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Users/sms-verify/{p}` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Users/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Users/invites/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Users/send-invitation` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Users/{p}/deactivate` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/InternalUsers/AsSelectItems` · `? /api/InternalUsers/ExportToExcel` · `GET /api/InternalUsers/Setup` · `GET /api/InternalUsers/{p}/InternalUserDeleteConflicts` · `GET /api/Roles/Defaults` · `? /api/Roles/GetRolesByIds` · `? /api/Users/Activation` · `GET /api/Users/TransferItemDetails` · `GET /api/Users/UsersList` · `GET /api/jobsites/GetJobsitePermissionsWizard` · `GET /apix/v2/EntityApprovals/entity/{p}/users` · `GET /apix/v2/Roles/assigned-users` · `GET /apix/v2/Users/activation/{p}` · `GET /apix/v2/Users/custom-fields` · `GET /apix/v2/admin/Users/OrgLinkUsers` · `GET /apix/v2/admin/Users/internal-users` · `GET /apix/v2/admin/Users/invites/{p}/has-deactivated-users` · `GET /apix/v3/Reporting/user-daily-logs`

## Jobs

- **VIABUILD equivalent:** `jobs`, `contracts`, `job_entities`, `xero_sync_log`
- **Gateway verbs:** `jobs.picker.list`, `jobs.picker.select`, `jobs.picker.existing`, `jobs.list`, `jobs.get`, `jobs.accountingLink`, `jobs.create` (not_captured), `jobs.update` (not_captured), `sync.pull`, `sync.status`
- **Coverage:** 14 screens/modals · 13 read endpoints · 0 blocked writes · bundle APIs reached 11/116

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/JobFromTemplate/0/0/0/0` | — | 7 | Add, Link job, Save |
| `/app/JobPage/{id}/{id}` | Job details, Clients, Internal users, Subs/vendors, Advanced settings | 46 | — |
| `/app/JobPage/{id}/{id} ⧉ Info` | — | 0 | — |
| `/app/JobPage/{id}/{id} ⧉ Preferences` | — | 0 | — |
| `/app/JobPage/{id}/0` | Job details, Clients, Internal users, Subs/vendors, Advanced settings | 46 | — |
| `/app/JobPage/{id}/0 ⧉ Preferences` | — | 0 | — |
| `/app/JobPage/0/{id}` | Job details, Clients, Internal users, Subs/vendors, Advanced settings | 47 | — |
| `/app/JobPage/0/{id} ⧉ Info` | — | 0 | — |
| `/app/JobPage/0/{id} ⧉ Preferences` | — | 0 | — |
| `/app/JobPickerActions` | — | 0 | — |
| `/app/Jobs/List` | List, Map | 17 | Apply filter |
| `/app/Jobs/Map` | List, Map | 17 | — |
| `/app/Landing/JobPickerActions/Compose/0/{id}` | — | 4 | — |
| `/app/Landing/QuickAction/JobFromTemplate/0/0/0/{id}` | — | 7 | Apply filter |

### Fields (UI)

Actual completion (date) · Actual start (date) · Allow creation of allowances (checkbox) · BCC (select) · Budget difference (checkbox) · CC (select) · Change Order requests (checkbox) · Client Email (column) · Client Phone (column) · Client Postal Code (column) · Client State (column) · Client Street Address (column) · Client Suburb (column) · Clients (column) · Contact (select) · Contract price (text) · Default labor cost (column) · Email (column) · Enable geofencing on Time Clock shifts (checkbox) · Fixed priceYou will set the contract price for the client (radio) · Include Time Clock labor in the Job Costing Budget (checkbox) · Individual Purchase Order limit (text) · Invoices (checkbox) · Jan 23, 2026 (date) · Job Color (column) · Job Costing Budget (checkbox) · Job Name (column) · Job Price Summary (checkbox) · Job billable rate (column) · Job type (select) · Locked selections (checkbox) · Lot info (textarea) · Make this job a working template (checkbox) · Map Status (column) · May 6, 2026 (date) · Name (column) · New Job name (text) · Notes for internal users (textarea) · Notes for subs/vendors (textarea) · Notifications (column) · Percentage (text) · Percentage type (select) · Permit number (text) · Postal Code (column) · Prefix (text) · Project Manager (column) · Project manager's phone number (checkbox) · Project managers (select) · Projected completion (date) · Projected start (date) · Projected start date (date) · Purchase Orders/Bills (checkbox) · Push (column) · Remaining Invoice Balance (checkbox) · Schedule Status (column) · Schedule color (select) · Schedule items (checkbox) · Schedule phases (checkbox) · Source Template (select) · Square meters (number) · State (column) · Status (select) · Status access (column) · Street Address (column) · Subject (text) · Suburb (column) · Text (column) · To (select) · Total Job Purchase Order limit (text) · Total Sqm (column) · Turn schedule online (checkbox) · Type (select) · Update actual dates based on Schedule (checkbox) · Warranty claims (checkbox) · Work days (select) · Yes (radio)

### Enums and dropdown options

- Job type: -- Please Select -- / Custom New Home / Modular / Multi-Family / Other - Residential Homebuilder / Production/Spec / Semi-Custom / Addition
- Percentage type: Markup / Margin
- data.contractTypes: Fixed Price / Open Book
- data.jobType: -- Please Select -- / Custom New Home
- data.linkingOptions: Customer
- data.taxGroups.options[].options: No Tax / GST

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Accounting/{id}/LinkedEntityInfo?loginType=` | — | data, accountingLinkedUser, accountingLinkedUser.accountingIntegrationType, accountingLinkedUser.accountingIntegrationTypeName, accountingLinkedUser.accountingNameForLogin, accountingLinkedUser.allowJobsUnderCustomer, accountingLinkedUser.canViewAccountingTab, accountingLinkedUser.clientAccountingName, accountingLinkedUser.contacts, accountingLinkedUser.contacts[].activationStatus, accountingLinkedUser.contacts[].contactId, accountingLinkedUser.contacts[].displayName, accountingLinkedUser.contacts[].email, accountingLinkedUser.contacts[].orgLinkId, accountingLinkedUser.contacts[].phoneCell, accountingLinkedUser.defaultPayrollItem, accountingLinkedUser.displayName, accountingLinkedUser.entityTerm, accountingLinkedUser.externalAccountingLink, accountingLinkedUser.hasInvoicedOtherAccountingCosts, accountingLinkedUser.includeOtherAccountingCostsInBudget, accountingLinkedUser.includeQBCostsInProjectedCostsCalculation, accountingLinkedUser.isAccountConnected, accountingLinkedUser.isEmployeePending, accountingLinkedUser.isUserLinked, accountingLinkedUser.jobLinkPreference, accountingLinkedUser.jobLinkType, accountingLinkedUser.linkedToAccountingSystemImage, accountingLinkedUser.otherAccountingCostToolTipMsg, accountingLinkedUser.payrollItems, accountingLinkedUser.primaryAccountingName, accountingLinkedUser.primaryAccountingTerm, accountingLinkedUser.projectsAccountingTerm, accountingLinkedUser.secondaryAccountingName, accountingLinkedUser.secondaryAccountingTerm, accountingLinkedUser.showOtherAccountingCosts, accountingLinkedUser.tertiaryAccountingTerm, canViewAccountingTab, createNewAccountingEntityOption, isAccountingIntegrationDegraded, … (+16) |
| GET | `/api/Accounting/0/LinkedEntityInfo?loginType=` | — | data, accountingLinkedUser, accountingLinkedUser.accountingIntegrationType, accountingLinkedUser.accountingIntegrationTypeName, accountingLinkedUser.accountingNameForLogin, accountingLinkedUser.allowJobsUnderCustomer, accountingLinkedUser.canViewAccountingTab, accountingLinkedUser.clientAccountingName, accountingLinkedUser.contacts, accountingLinkedUser.defaultPayrollItem, accountingLinkedUser.displayName, accountingLinkedUser.entityTerm, accountingLinkedUser.externalAccountingLink, accountingLinkedUser.hasInvoicedOtherAccountingCosts, accountingLinkedUser.includeOtherAccountingCostsInBudget, accountingLinkedUser.includeQBCostsInProjectedCostsCalculation, accountingLinkedUser.isAccountConnected, accountingLinkedUser.isEmployeePending, accountingLinkedUser.isUserLinked, accountingLinkedUser.jobLinkPreference, accountingLinkedUser.jobLinkType, accountingLinkedUser.linkedToAccountingSystemImage, accountingLinkedUser.otherAccountingCostToolTipMsg, accountingLinkedUser.payrollItems, accountingLinkedUser.primaryAccountingName, accountingLinkedUser.primaryAccountingTerm, accountingLinkedUser.projectsAccountingTerm, accountingLinkedUser.secondaryAccountingName, accountingLinkedUser.secondaryAccountingTerm, accountingLinkedUser.showOtherAccountingCosts, accountingLinkedUser.tertiaryAccountingTerm, canViewAccountingTab, createNewAccountingEntityOption, isAccountingIntegrationDegraded, linkingOptions, linkingOptions[].disableIndividualSelection, linkingOptions[].disabled, linkingOptions[].extraData, linkingOptions[].extraData.chooseMessage, linkingOptions[].extraData.createMessage, … (+10) |
| GET | `/api/accounting/GetEntityAccountingStatus?accountingEntityId=&accountingEntityType=&jobId=` | — | data, accountingImage, accountingIntegrationType, accountingTitle, accountsPayableTerm, accountsReceivableTerm, amountPaid, canReset, canSendToAccounting, creditMemoStatus, depositStatus, externalAccountingLink, externalAccountingLinkText, flatFeeTerm, hasExternalAccountingLink, helpMessageText, invoiceStatus, lastSync, linkedByName, outstandingBalanceText, paidDate, paidDateValue, resetButtonText, resetPopoverText, sendToAccountingText, showButton, showCheckbox, showDisabledInputs, supportsJobsiteIntegrationTypes, syncButtonText, syncStatus, syncStatusTooltipMessage, totalAmount, totalAmountText, totalTaxText |
| GET | `/api/jobpicker/GetExistingJobList` | — | data, footerData, infiniteScrollStatus, isLoaded, isTemplateMode, jobs, jobs[].NewJobName, jobs[].builderID, jobs[].jobID, jobs[].jobName, jobs[].jobStatus, records |
| GET | `/api/jobsites/{id}` | — | data, accountingIntegrationLogoImgSrc, accountingIntegrationType, accountingMessage, accountingTermForPrimaryJobEntity, accountingTermForSecondaryJobEntity, allowJobsUnderCustomer, billRateEnabledForJob, builderId, canAdd, canAddInternalUsers, canAddSubs, canDelete, canEdit, canRemoveAllowances, canSaveSelect, canViewAccounting, canViewChangeOrders, canViewPayments, canViewPrice, canViewPurchaseOrders, canViewRiskInsurance, canViewSchedule, canViewSelections, canViewTimeClock, canViewWarranty, createdJobCountForBuilder, customFieldOptions, customFieldsPrint, customFieldsPrint[].customFieldId, customFieldsPrint[].label, customFieldsPrint[].tooltipText, customFieldsPrint[].type, customFieldsPrint[].value, defaultBillApprovers, defaultBillApprovers.eligibleJobBillApprovers, defaultBillApprovers.eligibleJobBillApprovers[].disableIndividualSelection, defaultBillApprovers.eligibleJobBillApprovers[].disabled, defaultBillApprovers.eligibleJobBillApprovers[].extraData, defaultBillApprovers.eligibleJobBillApprovers[].id, … (+413) |
| GET | `/api/jobsites/DefaultInfo` | — | data, accountingIntegrationLogoImgSrc, accountingIntegrationType, accountingTermForPrimaryJobEntity, accountingTermForSecondaryJobEntity, allowJobsUnderCustomer, billRateEnabledForJob, builderId, canAdd, canAddInternalUsers, canAddSubs, canDelete, canEdit, canRemoveAllowances, canSaveSelect, canViewAccounting, canViewChangeOrders, canViewPayments, canViewPrice, canViewPurchaseOrders, canViewRiskInsurance, canViewSchedule, canViewSelections, canViewTimeClock, canViewWarranty, createNewAccountingJobOption, createdJobCountForBuilder, customFieldOptions, customFieldsPrint, customFieldsPrint[].customFieldId, customFieldsPrint[].label, customFieldsPrint[].tooltipText, customFieldsPrint[].type, customFieldsPrint[].value, effectiveTaxVersion, globalUserId, hasAdminPermissions, hasAllowances, hasBudgetAccess, hasDeletableContact, … (+364) |
| GET | `/api/Templates/{id}/Details` | — | data, calendarOnline, canCopyLegacySelections, contactsEnabled, defaultTaxGroupId, effectiveTaxVersion, groupedProjectType, id, isTemplateSelectionsReimagined, jobName, leadTitle, linkingOptions, newSubs, notifyProjectManager, permissions, projectManagers, selectionsCopyBlockedReason, startDate, whatToCopy, workDays |
| GET | `/api/Templates/List` | — | data, accountingIntegration, canImportEstimates, canLinkJobToAccounting, contactOptions, contactOptions[].disableIndividualSelection, contactOptions[].disabled, contactOptions[].extraData, contactOptions[].id, contactOptions[].key, contactOptions[].name, contactOptions[].secondaryName, contactOptions[].selected, contractTypes, contractTypes[].disableIndividualSelection, contractTypes[].disabled, contractTypes[].extraData, contractTypes[].id, contractTypes[].key, contractTypes[].name, contractTypes[].secondaryName, contractTypes[].selected, groupedJobType, groupedJobType[].name, groupedJobType[].options, groupedJobType[].options[].disableIndividualSelection, groupedJobType[].options[].disabled, groupedJobType[].options[].extraData, groupedJobType[].options[].id, groupedJobType[].options[].key, groupedJobType[].options[].name, groupedJobType[].options[].secondaryName, groupedJobType[].options[].selected, groupedJobType[].type, hasBidsAddPerm, hasEstimatesAddPerm, hasExistingEstimates, hasPOsAddPerm, hasScheduleEditPerms, isAsyncJobImportEnabled, … (+54) |
| GET | `/api/Templates/List?leadId=` | — | data, accountingIntegration, canImportEstimates, canLinkJobToAccounting, contactOptions, contactOptions[].disableIndividualSelection, contactOptions[].disabled, contactOptions[].extraData, contactOptions[].id, contactOptions[].key, contactOptions[].name, contactOptions[].secondaryName, contactOptions[].selected, contractTypes, contractTypes[].disableIndividualSelection, contractTypes[].disabled, contractTypes[].extraData, contractTypes[].id, contractTypes[].key, contractTypes[].name, contractTypes[].secondaryName, contractTypes[].selected, groupedJobType, groupedJobType[].name, groupedJobType[].options, groupedJobType[].options[].disableIndividualSelection, groupedJobType[].options[].disabled, groupedJobType[].options[].extraData, groupedJobType[].options[].id, groupedJobType[].options[].key, groupedJobType[].options[].name, groupedJobType[].options[].secondaryName, groupedJobType[].options[].selected, groupedJobType[].type, hasBidsAddPerm, hasEstimatesAddPerm, hasExistingEstimates, hasPOsAddPerm, hasScheduleEditPerms, isAsyncJobImportEnabled, … (+54) |
| GET | `/apix/v2/Jobsites/{id}/job-price-summary-print` | — | allowances, appliedCreditMemosTotal, basePrice, budgetDifferences, changeOrders, changeOrdersSubtotal, changeOrdersTotal, changeOrders[].approvalUpdatedDate, changeOrders[].changeOrderId, changeOrders[].ownerPrice, changeOrders[].tax, changeOrders[].title, customerInvoiceAmountPaidTotal, displayOption, displayOption.includesSelectionsInDeclinedOption, displayOption.showAllowanceTax, displayOption.showAllowances, displayOption.showChangeOrderTax, displayOption.showChangeOrders, displayOption.showCompanyName, displayOption.showCustomerInvoices, displayOption.showCustomerInvoicesFilterOption, displayOption.showSelectionOptions, displayOption.showSelectionTax, displayOption.showSelections, displayOption.showTotalTax, displayOption.sortSelectionBy, isSelectionsReimaginedJob, isWorksheetBudgeted, jobAddress, jobAddress.city, jobAddress.country, jobAddress.state, jobAddress.street, jobAddress.suburb, jobAddress.zip, jobContractType, jobLot, jobName, oldJpsResponse, … (+61) |
| GET | `/apix/v2/Jobsites/job-price-summary?jobId=` | — | allowances, appliedCreditMemosTotal, basePrice, budgetDifferences, changeOrders, changeOrdersSubtotal, changeOrdersTotal, changeOrders[].approvalUpdatedDate, changeOrders[].changeOrderId, changeOrders[].ownerPrice, changeOrders[].tax, changeOrders[].title, customerInvoiceAmountPaidTotal, displayOption, displayOption.includesSelectionsInDeclinedOption, displayOption.showAllowanceTax, displayOption.showAllowances, displayOption.showChangeOrderTax, displayOption.showChangeOrders, displayOption.showCompanyName, displayOption.showCustomerInvoices, displayOption.showCustomerInvoicesFilterOption, displayOption.showSelectionOptions, displayOption.showSelectionTax, displayOption.showSelections, displayOption.showTotalTax, displayOption.sortSelectionBy, isSelectionsReimaginedJob, isWorksheetBudgeted, jobContractType, jobName, oldJpsResponse, originalAllowanceTotal, originalPriceTotal, originalSelectionOptionsPriceTotal, originalSelectionTotal, paymentsReceived, paymentsReceivedTotal, paymentsReceived[].amount, paymentsReceived[].id, … (+26) |
| POST | `/api/jobpicker/GetJobPickerData` | allowGlobalJob, builderId, displayMode, filters, includeCounts, includeGeneralJob, isExpanded, jobSortChoice, selectMode, selectedJobId, templatesOnly, useJobInSession | data, availableAccounts, availableAccounts[].builderId, availableAccounts[].builderName, availableAccounts[].globalUserId, availableAccounts[].inSession, availableAccounts[].loginType, availableAccounts[].name, availableAccounts[].selected, fullJobCount, headerInfo, headerInfo.address, headerInfo.address.city, headerInfo.address.country, headerInfo.address.state, headerInfo.address.street, headerInfo.address.suburb, headerInfo.address.zip, headerInfo.builderId, headerInfo.builderName, headerInfo.fax, headerInfo.formattedAddress, headerInfo.jobRunningTotal, headerInfo.jobRunningTotal.areaUnit, headerInfo.jobRunningTotal.hasJobsitePermission, headerInfo.jobRunningTotal.hasRunningTotalPermission, headerInfo.jobRunningTotal.isWorksheetBudgeted, headerInfo.jobRunningTotal.jobContractType, headerInfo.jobRunningTotal.jobRunningTotal, headerInfo.jobRunningTotal.originalClientPrice, headerInfo.jobRunningTotal.pricePerUnitArea, headerInfo.jobRunningTotal.revisedClientPrice, headerInfo.jobRunningTotal.shouldUseNewClientPriceValues, headerInfo.linkedJobs, headerInfo.logoPath, headerInfo.mobileLogoPath, headerInfo.phone, headerInfo.projectManagers, isConnectedToAccounting, isListLimited, … (+67) |
| POST | `/api/Jobsites/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, accountingImportIntegrationName, canAdd, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, createdJobCountForBuilder, data, data[].accountingStatus, data[].achTransactionLimit, data[].actualCompletion, data[].actualStart, data[].allowanceDifference, data[].amountInvoiced, data[].appliedCreditMemos, data[].approvedCOPrice, data[].builderId, data[].builderName, … (+110) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| PUT | `/api/Accounting/AccountingEntity` | app bundle (not fired) | — |
| PUT | `/api/Accounting/BuilderApprovedUpgrade` | app bundle (not fired) | — |
| POST | `/api/Accounting/ClearCache` | app bundle (not fired) | — |
| POST | `/api/Accounting/ClearPendingSyncTransactions` | app bundle (not fired) | — |
| PUT | `/api/Accounting/CreateAccountingEntity` | app bundle (not fired) | — |
| DELETE | `/api/Accounting/DeleteAccountingBill` | app bundle (not fired) | — |
| POST | `/api/Accounting/Disconnect` | app bundle (not fired) | — |
| POST | `/api/Accounting/DisconnectSuspendedAccount` | app bundle (not fired) | — |
| PUT | `/api/Accounting/EstablishConnectionToAccounting` | app bundle (not fired) | — |
| PUT | `/api/Accounting/FinalizeConnectionToAccounting` | app bundle (not fired) | — |
| PUT | `/api/Accounting/GetAccountingOAuthUrl` | app bundle (not fired) | — |
| PUT | `/api/Accounting/SendEntitiesToAccounting` | app bundle (not fired) | — |
| PUT | `/api/Accounting/SetAccountingOptions` | app bundle (not fired) | — |
| PUT | `/api/Accounting/Setup` | app bundle (not fired) | — |
| POST | `/api/Accounting/SubmitInitialTaxOption` | app bundle (not fired) | — |
| PUT | `/api/Accounting/SyncAccountingMethod` | app bundle (not fired) | — |
| PUT | `/api/Accounting/{p}/SyncEmployee` | app bundle (not fired) | — |
| PUT | `/api/CreditMemos/{p}/ResetAccounting` | app bundle (not fired) | — |
| PUT | `/api/CreditMemos/{p}/SendToAccounting` | app bundle (not fired) | — |
| POST | `/api/ImportWizard/AccountingDataForImport` | app bundle (not fired) | — |
| PUT | `/api/Jobsites/AddUsersToJob` | app bundle (not fired) | — |
| POST | `/api/Jobsites/CopyToTemplate` | app bundle (not fired) | — |
| PUT | `/api/Jobsites/SendMassSubInvitationRequest` | app bundle (not fired) | — |
| PUT | `/api/Jobsites/Setup` | app bundle (not fired) | — |
| POST | `/api/Jobsites/UpdateContractPrice` | app bundle (not fired) | — |
| POST | `/api/Templates/Copy` | app bundle (not fired) | — |
| POST | `/api/Templates/CopyExternal` | app bundle (not fired) | — |
| POST | `/api/Templates/Import` | app bundle (not fired) | — |
| POST | `/api/Templates/Info` | app bundle (not fired) | — |
| POST | `/api/Templates/{p}` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Templates/{p}/Info` | app bundle (not fired) | — |
| PUT | `/api/jobpicker/setsort` | app bundle (not fired) | — |
| PUT | `/api/jobsites/Add` | app bundle (not fired) | — |
| PUT | `/api/jobsites/SendMassSubInvitationRequest` | app bundle (not fired) | — |
| PUT | `/api/jobsites/UnlinkJobsiteFromAccounting` | app bundle (not fired) | — |
| PUT | `/api/jobsites/UpdateAccountingJob` | app bundle (not fired) | — |
| DELETE/PUT | `/api/jobsites/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/Accounting/other-costs` | app bundle (not fired) | — |
| PUT | `/apix/v2/AccountingLinking/import-from-accounting` | app bundle (not fired) | — |
| PUT | `/apix/v2/AccountingLinking/mass-link-entity` | app bundle (not fired) | — |
| DELETE | `/apix/v2/AccountingService/disconnect` | app bundle (not fired) | — |
| PUT | `/apix/v2/AccountingService/settings` | app bundle (not fired) | — |
| PUT | `/apix/v2/AccountingSync/other-costs` | app bundle (not fired) | — |
| PUT | `/apix/v2/AccountingSync/other-costs-full` | app bundle (not fired) | — |
| PUT | `/apix/v2/Jobsites/MassEdit` | app bundle (not fired) | — |
| PUT | `/apix/v2/Jobsites/default-tax` | app bundle (not fired) | — |
| POST | `/apix/v2/Templates/org-to-org-copy` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Accounting/testing-webhooks` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Accounting/webhooks-hash` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Jobsites/{p}/restore` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Templates` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Templates/{p}/copy-to-builder` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/Accounting/AccountingLinkingType` · `GET /api/Accounting/CanSendEntitiesToAccounting` · `GET /api/Accounting/ExchangeAndUpdateXeroToken` · `GET /api/Accounting/GetAccountingSetupLoad` · `POST /api/Accounting/GetWebConnectorConfig` · `GET /api/Accounting/LinkJobOptions` · `GET /api/Accounting/ManualSyncRequest` · `GET /api/Accounting/PrimaryEntityOptions` · `GET /api/Accounting/QBDEntityThreshold` · `GET /api/Accounting/ShouldPromptPurchaseTaxValidation` · `GET /api/Accounting/ShouldPromptSalesTaxValidation` · `GET /api/Accounting/Token` · `? /api/Jobsites/ExportToExcel` · `GET /api/Jobsites/GetJobsiteListForCopy` · `GET /api/Jobsites/JobCostSummary` · `GET /api/Templates/ActionRequired` · `GET /api/Templates/DefaultInfo` · `GET /api/Templates/DefaultInfoCopy` · `? /api/Templates/ExportToExcel` · `GET /api/Templates/ExternalDetails` · `POST /api/Templates/Grid` · `GET /api/Templates/ImportConflicts` · `GET /api/Templates/ImportCounts` · `GET /api/Templates/ImportExternalCounts` · `GET /api/Templates/RecommendedTemplates` · `GET /api/Templates/RecommendedTemplatesForJob` · `GET /api/Templates/Summary` · `GET /api/accounting/IsValidEntity` · `POST /api/jobpicker/GetJobpickerMetadata` · `POST /api/jobpicker/SetJobPickerData` · `GET /api/jobsites/GetLinkedJobsListItems` · `GET /api/jobsites/{p}/JobRunningTotal` · `? /apix/btadmin/hangfire/jobs/details/{p}` · `GET /apix/v2/Accounting/ap-retainage-product-services` · `GET /apix/v2/Accounting/retainage-product-services` · `GET /apix/v2/AccountingLinking/accounting-import-options` · `GET /apix/v2/AccountingLinking/accounting-linking-options/{p}/{p}` · `GET /apix/v2/AccountingLinking/project-links/{p}/{p}/{p}` · `GET /apix/v2/AccountingService/bank-accounts` · `GET /apix/v2/AccountingService/connection` · `GET /apix/v2/AccountingService/general-ledger-accounts` · `GET /apix/v2/AccountingService/locations` · `GET /apix/v2/ImportWizard/jobs-and-templates` · `GET /apix/v2/Jobsites/closed-job-costs` · `GET /apix/v2/Jobsites/general` · `GET /apix/v2/Jobsites/{p}/financials-summary` · `GET /apix/v2/Jobsites/{p}/restore` · `GET /apix/v2/Summary/job/{p}/action-items/count` · `GET /apix/v2/Summary/job/{p}/communications/count` · `GET /apix/v2/Templates/actionrequired` · `GET /apix/v2/admin/Accounting/builder-record` · `GET /apix/v2/admin/ImportWizard/jobs-and-templates` · `GET /apix/v2/admin/Jobsites` · `GET /apix/v3/Jobsites`

## Reports

- **VIABUILD equivalent:** `saved_reports`, `report_run_history`
- **Gateway verbs:** none
- **Coverage:** 1 screens/modals · 0 read endpoints · 0 blocked writes · bundle APIs reached 0/7

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/Reporting` | All, Financial, Project Management, Sales | 3 | — |

### Fields (UI)

Category (column) · Description (column) · Report name (column)

### Bundle read APIs not reached

`GET /apix/v3/Reporting/cashflow` · `GET /apix/v3/Reporting/daily-log-creation-by-job` · `GET /apix/v3/Reporting/hours-worked-by-employee` · `GET /apix/v3/Reporting/hours-worked-by-job` · `GET /apix/v3/Reporting/invoicing` · `GET /apix/v3/Reporting/profitability` · `GET /apix/v3/Reporting/work-in-progress`

## Company settings and setup

- **VIABUILD equivalent:** `organizations`, `gst_codes`, `cost_codes`, `xero_integration_settings`
- **Gateway verbs:** none
- **Coverage:** 21 screens/modals · 4 read endpoints · 0 blocked writes · bundle APIs reached 4/77

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/AccountingSettings/SageIntacct/EntityLinks/0` | — | 0 | — |
| `/app/Admin/BuilderSetup/0` | — | 0 | — |
| `/app/Admin/Cancel/0/0` | — | 0 | — |
| `/app/Admin/ExcludeFromChurn/0` | — | 0 | — |
| `/app/Admin/FeatureFlag/Details/0` | — | 0 | — |
| `/app/Admin/Hawk/LineItem/0` | — | 0 | — |
| `/app/Admin/Hawk/Queue/0` | — | 0 | — |
| `/app/Admin/Hawk/Queue/0/LineItem/0` | — | 0 | — |
| `/app/Admin/Hawk/Queue/0/LineItem/0/Receipt` | — | 0 | — |
| `/app/Admin/MerchantPaymentList/0` | — | 0 | — |
| `/app/Admin/Partner/Details/0` | — | 0 | — |
| `/app/Admin/RebateHawk/Queue/0` | — | 0 | — |
| `/app/Admin/RebateHawk/Queue/0/Receipt/0` | — | 0 | — |
| `/app/Admin/RebateHawk/Receipts/0` | — | 0 | — |
| `/app/Admin/Subscription/0/0` | — | 0 | — |
| `/app/Admin/Suspend/0/0/0` | — | 0 | — |
| `/app/CostCodeSettings/ManageAccounting/0/0/0` | — | 2 | Edit Link, Save |
| `/app/ImportWizard/0` | — | 0 | — |
| `/app/ImportWizard/Info/0` | — | 0 | — |
| `/app/IntegrationsSettings/0` | — | 0 | Consent to Share Data |
| `/app/Settings` | — | 0 | — |

### Fields (UI)

Buildertrend Cost Codes (column) · Xero Products/Services (column)

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/Builder/Setup` | — | data, addressWithoutStreet, builderLogo, builderName, country, faxNumber, hasSetupInboundOrOutboundPayments, phoneNumber, settingsControl, settingsControl.accountSecurity, settingsControl.accountSecurity.disabled, settingsControl.accountSecurity.hidden, settingsControl.accountSecurity.iconImagePath, settingsControl.accountSecurity.jwt, settingsControl.accountSecurity.legacyPath, settingsControl.accountSecurity.tabPermission, settingsControl.accountSecurity.userId, settingsControl.accounting, settingsControl.accounting.disabled, settingsControl.accounting.hidden, settingsControl.accounting.iconImagePath, settingsControl.accounting.jwt, settingsControl.accounting.legacyPath, settingsControl.accounting.tabPermission, settingsControl.accounting.userId, settingsControl.bid, settingsControl.bid.disabled, settingsControl.bid.hidden, settingsControl.bid.iconImagePath, settingsControl.bid.jwt, settingsControl.bid.legacyPath, settingsControl.bid.tabPermission, settingsControl.bid.userId, settingsControl.bill, settingsControl.bill.disabled, settingsControl.bill.hidden, settingsControl.bill.iconImagePath, settingsControl.bill.jwt, settingsControl.bill.legacyPath, settingsControl.bill.tabPermission, … (+300) |
| GET | `/api/Subscription/GetSubscriptionsForBuilder?builderId=` | — | — |
| GET | `/apix/v2/admin/Subscription/cancellation-form?builderId=&subscriptionId=` | — | — |
| GET | `/apix/v2/CustomFields/{id}/definitions` | — | {key}[].builderId, {key}[].customFieldId, {key}[].dataType, {key}[].isRequired, {key}[].label, {key}[].onOwnerPortal, {key}[].onSubPortal, {key}[].options, {key}[].options[].id, {key}[].options[].sortOrder, {key}[].options[].text, {key}[].tooltipText |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| PUT | `/api/Calendar/Setup` | app bundle (not fired) | — |
| DELETE/POST/PUT | `/api/CostCategories/Setup` | app bundle (not fired) | — |
| DELETE/POST | `/api/CustomFields/{p}` | app bundle (not fired) | — |
| DELETE | `/api/CustomFields/{p}/DeleteLink` | app bundle (not fired) | — |
| POST | `/api/ImportWizard/ImportFileData` | app bundle (not fired) | — |
| POST | `/api/ImportWizard/ValidateColumnMappings` | app bundle (not fired) | — |
| PUT | `/api/Logs/Setup` | app bundle (not fired) | — |
| PUT | `/api/Subscription/AddOrUpdateSubscriptionItems` | app bundle (not fired) | — |
| PUT | `/api/Subscription/ApplyCouponToSubscription` | app bundle (not fired) | — |
| POST | `/api/Subscription/BulkQuickPay` | app bundle (not fired) | — |
| POST | `/api/Subscription/ChargebeeCreateSubscription` | app bundle (not fired) | — |
| POST | `/api/Subscription/SuspendBuilderSubscription` | app bundle (not fired) | — |
| PUT | `/api/Subscription/UpdateSubscriptionBuilderUserId` | app bundle (not fired) | — |
| POST | `/api/Subscription/{p}/CreatePaymentMethodWithJWTValidation` | app bundle (not fired) | — |
| POST | `/api/SubscriptionItem` | app bundle (not fired) | — |
| DELETE/PUT | `/api/SubscriptionItem/{p}` | app bundle (not fired) | — |
| DELETE/POST | `/api/TaxGroups` | app bundle (not fired) | — |
| PUT | `/api/TaxGroups/{p}` | app bundle (not fired) | — |
| PATCH | `/apix/v2/CustomFields/{p}/{p}/values` | app bundle (not fired) | — |
| POST | `/apix/v2/IntegrationsAuth/bluebeam/oauth/authorize-url` | app bundle (not fired) | — |
| POST | `/apix/v2/IntegrationsAuth/{p}/disconnect` | app bundle (not fired) | — |
| POST | `/apix/v2/MfaEnrollmentState/builder-settings/requirements/{p}/enable` | app bundle (not fired) | — |
| POST | `/apix/v2/PricingTable/cost-items/import-from-file` | app bundle (not fired) | — |
| POST | `/apix/v2/PricingTable/cost-items/import-skipped-rows/export` | app bundle (not fired) | — |
| POST | `/apix/v2/SageIntacctIntegration/connect` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/AppSettings/{p}/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/AutomatedCoreDataImport/imports/{p}/redispatch` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/AutomatedCoreDataImport/{p}/trigger` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/BuilderSetup/builders/{p}/custom-tab-names` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/BuilderSetup/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/BuilderSetup/{p}/RedirectToSetupExperience` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/BuilderSetup/{p}/step/status` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/ImportWizard/download-import-summary` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/ImportWizard/import-file-data` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/ImportWizard/map-lookups` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/ImportWizard/process-import-data` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/ImportWizard/update-cost-code-aliases` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/ImportWizard/validate-column-mappings` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Subscription/price-change-preview` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Subscription/submit-price-change` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/Subscription/subscription-items` | app bundle (not fired) | — |
| PUT | `/apix/v3/Rebates/rebate-settings-profile` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/CostCatalog/CostGroupsForImport` · `GET /api/CustomFields/GetSetup` · `? /api/ImportWizard/DownloadImportSummary` · `? /api/ImportWizard/MapLookups` · `? /api/ImportWizard/ProcessImportData` · `GET /api/PartnerAccounts/Settings` · `GET /api/Payroll/Settings` · `GET /api/Subscription/CancellationForm` · `GET /api/Subscription/GetAvailableCouponsForItems` · `GET /api/Subscription/NoAccessDetail` · `GET /api/SubscriptionItem/GetAllSubscriptionItems` · `GET /api/SubscriptionItem/GetSubscriptionItemFeatures` · `GET /api/TaxGroups/DefaultInfo` · `GET /api/TaxGroups/Dropdown` · `? /api/TaxGroups/ExportToExcel` · `POST /api/TaxGroups/Grid` · `GET /apix/v2/BuilderSetup/eligibility` · `GET /apix/v2/IntegrationsAuth/bluebeam/regions` · `GET /apix/v2/IntegrationsAuth/{p}/connection-status` · `GET /apix/v2/MfaEnrollmentState/builder-settings` · `? /apix/v2/Rebates/rebate-settings-profile` · `GET /apix/v2/admin/AppSettings` · `GET /apix/v2/admin/AutomatedCoreDataImport/{p}/entity-history` · `GET /apix/v2/admin/AutomatedCoreDataImport/{p}/status` · `GET /apix/v2/admin/BuilderSetup/{p}/group/{p}` · `GET /apix/v2/admin/Subscription/available-addons` · `GET /apix/v2/admin/Subscription/available-coupons` · `GET /apix/v2/admin/Subscription/available-options` · `GET /apix/v2/admin/Subscription/price-change-defaults` · `GET /apix/v2/admin/Subscription/subscription` · `GET /apix/v3/Rebates/rebate-settings-profile-setup`

## Landing, search and session

- **VIABUILD equivalent:** n/a (navigation)
- **Gateway verbs:** `session.status`
- **Coverage:** 56 screens/modals · 44 read endpoints · 6 blocked writes · bundle APIs reached 46/351

### Screens

| Screen | Tabs | Fields | Write actions seen (not clicked) |
| --- | --- | --- | --- |
| `/app/ActivityFeed` | — | 0 | — |
| `/app/BillAdd/{id}` | Bill, Lien Waiver | 17 | Link schedule item, Add from catalog, + Add approver, Add, Create new doc, Save draft, Save to Job, Mark Ready for Payment |
| `/app/BillAdd/{id} ⧉ Give feedback` | — | 1 | — |
| `/app/BillAdd/{id} ⧉ Info` | — | 0 | — |
| `/app/BillMapping/0/{id}/0` | — | 0 | — |
| `/app/BillMassPay/0/{id}` | — | 0 | — |
| `/app/BillPayment/0` | — | 0 | — |
| `/app/BillPayment/detail/0` | — | 0 | — |
| `/app/BuilderAccountChangeRequest/0/0` | — | 0 | — |
| `/app/Category/0/0` | — | 0 | — |
| `/app/Channel/0` | — | 0 | — |
| `/app/Channel/0/0/0` | — | 0 | — |
| `/app/ClockInClockOut/0/{id}/0/0` | — | 0 | — |
| `/app/Compose/0/{id}` | — | 4 | Add email, Add, Create new doc, Save, Send |
| `/app/Compose/0/{id} ⧉ Add` | — | 2 | Add email |
| `/app/Compose/0/{id} ⧉ Create new doc` | — | 0 | — |
| `/app/Contact/0/0` | — | 0 | — |
| `/app/Contact/0/0 ⧉ Info` | — | 0 | — |
| `/app/ContractedProfit/{id}` | — | 0 | — |
| `/app/Copy/0` | — | 0 | — |
| `/app/CostCatalog/CostCode/0` | — | 0 | — |
| `/app/CostCatalog/CostGroup/0` | — | 2 | Add, Create new doc, Cost Items ({n}) Add, Save and close, Related actions › Save, Related actions › Save and new |
| `/app/CostCatalog/CostGroup/0 ⧉ Add` | — | 0 | Drop files here to upload, or browse for files Browse device |
| `/app/CostCatalog/CostGroup/0 ⧉ Create new doc` | — | 0 | — |
| `/app/CostCatalog/CostItem/0` | — | 10 | Save and close, Related actions › Save, Related actions › Save and new |
| `/app/CostCatalog/CostItem/0 ⧉ Info` | — | 0 | — |
| `/app/CostCode/Code/0/0` | — | 0 | — |
| `/app/CostCode/Code/0/0/0` | — | 0 | — |
| `/app/CostCode/CostCodeMassReassign/0` | — | 0 | — |
| `/app/CostGroup/0` | — | 0 | — |
| `/app/CostItem/0` | — | 0 | — |
| `/app/CreateSignatureRequest/0/{id}` | — | 0 | — |
| `/app/CreditMemos/0/{id}` | Invoices, Payments, Credit memos | 19 | Apply filter |
| `/app/CreditMemos/0/{id} ⧉ Info` | — | 0 | — |
| `/app/CreditMemos/0/{id} ⧉ More › Manage saved views` | — | 1 | Apply View, Add New Saved View, Add a new saved view |
| `/app/CreditMemos/Print/0/{id}` | — | 0 | — |
| `/app/CustomField/0` | — | 0 | — |
| `/app/CustomFields/0/0` | — | 0 | — |
| `/app/Deposit/0/{id}` | — | 0 | — |
| `/app/Deposit/0/{id}/checkout` | — | 0 | — |
| `/app/Deposit/Print/0/{id}` | — | 0 | — |
| `/app/Deposit/printExternal/0/{id}` | — | 0 | — |
| `/app/DepositExternal/0` | — | 0 | — |
| `/app/EditOnline/0` | — | 0 | — |
| `/app/Error/NoAccess/0` | — | 0 | — |
| `/app/Job/{id}/0/0/0/0/0` | — | 0 | — |
| `/app/Job/JobGroupEditor/0` | — | 0 | — |
| `/app/JobPriceSummary/Print/{id}/0` | — | 6 | — |
| `/app/JobPriceSummaryPrint/{id}` | — | 0 | — |
| `/app/JobPrint/Print/{id}/0` | — | 0 | — |
| `/app/JobType/0` | — | 0 | — |
| `/app/Landing` | — | 0 | Apply filter |
| `/app/Landing ⧉ Filter` | — | 0 | — |
| `/app/Landing/ContactUs` | — | 0 | Apply filter |
| `/app/Landing/QuickAction/Compose/0/{id}` | — | 4 | — |
| `/app/ownerPortalRedirect/{id}/false` | — | 0 | — |

### Fields (UI)

Amount (column) · Amount paid (column) · BCC (select) · Balance due (column) · Bill # (text) · Builder cost (column) · CC (select) · Choice (column) · Column with Header Selection (checkbox) · Columns (select) · Comments (column) · Cost Code (select) · Cost Type (select) · Cost code (column) · Date (column) · Date paid (column) · Date paid (date) · Description (textarea) · Due (column) · Due date (date) · Email (text) · Files (column) · Include Client Price (checkbox) · Include Quantity (checkbox) · Internal Notes (textarea) · Invoice (column) · Invoice ID (column) · Invoice date (date) · Job (column) · Job (select) · Mark As (select) · Name (text) · Pay to (select) · Payment amount (column) · Payment method (column) · Payment type (column) · Press Space to toggle row selection (unchecked) (checkbox) · Price (column) · Purchase Order (select) · Recorded by (column) · Retainage (column) · Send to Xero (checkbox) · Status (column) · Subject (text) · Title (column) · Title (text) · To (select) · Total price (column) · Total tax (column) · Type (select) · Unit (text) · Unit Cost (text) · Unit cost (column) · Viewed by Owner On (column) · Xero invoice (column) · emailAddress[0].friendlyName (text) · feedbackText (textarea)

### Enums and dropdown options

- Cost Type: None / Labor / Material / Equipment / Subcontractor / Other
- data.allGridColumns: Company name / Primary contact / Email / Cell / Phone / Activation / Trade agreement status / Liability exp. / Worker's comp exp. / Sub/vendor divisions / License Details & Number / Trade/Supply Agreement / Discuss with owners / Hold payment / Auto access / Linked to Xero / Fax / Street address / State / Zip code / Suburb / Agreement/Info Pack Sent / Contractors Licence Recd / Workers Comp Received / Public Liability Recd / ABN Details Received / White Card Received / SWMS Template Received / Maintenance Agree Signed / WC Info Pack Signed / Supplier Login BT Sent / Blue Card Recd
- data.categories.options[].options: Allowances / Bid Packages / Bills / Change Orders / Client Contacts / Daily Logs / Documents / Internal Users / Invoices / Jobs / Leads / Messages / Photos / Purchase Orders / RFIs / Schedules / Selections / Specifications / Submittals / Subs / Vendors / Tasks / Videos / Warranties
- data.columnsList: ID# / Title / Created by / Created date / Status / Amount / Xero status / Apply to invoice / Client / Job / Amount remaining / Amount applied / Applied date / Comments / Files
- data.notify.shiftReason.value: -- None -- / Delayed product delivery

### Read endpoints (observed)

| Method | Path | Request keys | Response keys |
| --- | --- | --- | --- |
| GET | `/api/AccountInfo/GlobalInfo` | — | data, appDefaultInfo, appDefaultInfo.aGGridLicenseKey, appDefaultInfo.attachedFilesRemoveViewableByColumn, appDefaultInfo.billUploadTextDocumentsEnabled, appDefaultInfo.buildertrendLearningAcademyURL, appDefaultInfo.chameleonToken, appDefaultInfo.chatMainNavIndicatorPollingRateInSeconds, appDefaultInfo.chatPollingRateInMilliseconds, appDefaultInfo.communitiesCustomerRole, appDefaultInfo.communityURL, appDefaultInfo.coreSpaConfiguration, appDefaultInfo.coreSpaConfiguration.clientId, appDefaultInfo.coreSpaConfiguration.domain, appDefaultInfo.credentialUpgradeSkipDisabledDate, appDefaultInfo.dataDogApplicationId, appDefaultInfo.dataDogClientToken, appDefaultInfo.dataDogEnableTracing, appDefaultInfo.dataDogForceAiSearchReplay, appDefaultInfo.dataDogPremiumSampleRate, appDefaultInfo.dataDogRUM, appDefaultInfo.dataDogSessionReplaySampleRate, appDefaultInfo.dataDogSessionSampleRate, appDefaultInfo.dataDogSite, appDefaultInfo.dataDogTraceSampleRate, appDefaultInfo.dataDogTrackUserInteractions, appDefaultInfo.deployRefreshPromptWaitTime, appDefaultInfo.deployRefreshRedirectWaitTime, appDefaultInfo.dotNetSentryURL, appDefaultInfo.enableAchPaymentMethod, appDefaultInfo.enableAllowanceChangeTracking, appDefaultInfo.enableBidChangeTracking, appDefaultInfo.enableBillChangeTracking, appDefaultInfo.enableCaptchaForSignups, appDefaultInfo.enableCaptchaSitewide, appDefaultInfo.enableCardPaymentMethod, appDefaultInfo.enableChameleon, appDefaultInfo.enableChangeOrderChangeTracking, appDefaultInfo.enableChurnkey, appDefaultInfo.enableClamAVScansOnSignatures, … (+530) |
| GET | `/api/BuilderAccount/PopulateBuilderRequest?builderID=&linkID=` | — | data |
| GET | `/api/calendar/{id}` | — | data, affectedPredId, allNotes, allNotes.validators, allNotes.validators[].errorMessage, allNotes.validators[].type, allNotes.validators[].value, allNotes.value, assignedTo, assignedTo.validators, assignedTo.value, assignedTo.value[].name, assignedTo.value[].options, assignedTo.value[].type, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, … (+342) |
| GET | `/api/calendar/DefaultInfo?jobId=` | — | data, affectedPredId, allNotes, allNotes.validators, allNotes.validators[].errorMessage, allNotes.validators[].type, allNotes.validators[].value, allNotes.value, assignedTo, assignedTo.validators, assignedTo.value, assignedTo.value[].name, assignedTo.value[].options, assignedTo.value[].type, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, … (+264) |
| GET | `/api/Category/0?categoryType=` | — | data, canDelete, canEdit, categoryFriendlyName, categoryTitle, id, isAssociatedWithEntity, leadActivityColor, leadActivityIcons, onDeleteMessage, showLeadActivity |
| GET | `/api/Channels?channelTypes=&exactMatchesOnly=&includeReadOnly=&limit=` | — | data, data, data[].builderInfo, data[].builderInfo.accountFlags, data[].builderInfo.activityCalendarDefaultView, data[].builderInfo.builderId, data[].builderInfo.canUseExternalTemplates, data[].builderInfo.configFlags, data[].builderInfo.encryptedBuilderId, data[].builderInfo.flags, data[].builderInfo.hasJobGroups, data[].builderInfo.hasLegacySelectionsData, data[].builderInfo.isDemoAccount, data[].builderInfo.isFullySelectionsReimagined, data[].builderInfo.isInTaxesSupportedRegion, data[].builderInfo.locale, data[].builderInfo.loginsDisabled, data[].builderInfo.name, data[].builderInfo.newJobsUseSelectionsReimagined, data[].builderInfo.redirectToSetupExperience, data[].builderInfo.scheduleDefaultTabForCurrentPortal, data[].builderInfo.selectionDefaultBuilderView, data[].builderInfo.setupDate, data[].builderInfo.showAccountingBannerAd, data[].builderInfo.taxesEnabled, data[].builderInfo.taxesOptOut, data[].builderInfo.timeClockSettings, data[].builderInfo.useReactNativeDirectory, data[].builderInfo.weekStartDay, data[].channelId, data[].channelName, data[].channelType, data[].chatPreview, data[].chatPreview.eventDateTimeUtc, data[].chatPreview.eventId, data[].chatPreview.message, data[].chatPreview.type, data[].lastReadDateUtc, data[].latestMessageDateUtc, data[].participants, … (+6) |
| GET | `/api/Channels/Events?afterDateUtc=&dir=&limit=` | — | data, data, nextCursor, previousCursor |
| GET | `/api/CostCatalog?viewType=` | — | data, canAddCostGroups, canAddCostItems, canAddFromCatalog, hasCostCodesFeature, hasCostItemImport, showCostGroups, showCostItems, vendorCatalogInformation |
| GET | `/api/CostGroups/DefaultInfo` | — | data, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, attachedFiles.viewingPermissions.maxFileSize, attachedFiles.viewingPermissions.maxFiles, attachedFiles.viewingPermissions.minFileSize, attachedFiles.viewingPermissions.videoDurationLimit, attachedFiles.viewingPermissions.videoMaxSizeMB, builderId, canDelete, canEdit, costCodeItems, description, externalId, hasCostCodesFeature, … (+2) |
| GET | `/api/CreditMemos/Print?creditMemoId=&jobId=&showLineItems=` | — | data |
| GET | `/api/dynamicGrid/{id}?gridRequest=&infiniteScrollData=` | — | data, canAdd, canDelete, canUpdate, columnsList, data, data[].Email, data[].Select, data[].activationStatusInfo, data[].activationStatusInfo.activationConfirmed, data[].activationStatusInfo.activationSent, data[].activationStatusInfo.activationStatus, data[].contactID, data[].displayName, data[].phoneCell, data[].phonePrimary, data[].state, data[].street, data[].suburb, data[].zip, footerData, hasMoreRows, infiniteScrollStatus, isLoaded, isRecordCountCapped, isTotalCountRemoved, listMetaData, listMetaData.emptyStatesMetadata, listMetaData.hasData, page, pageSize, records, totalPages |
| GET | `/api/Filters/{id}?jobID=&useSession=` | — | data, builderIds, filters, filters[].allSelectedText, filters[].defaultValue, filters[].defaultValue.EndDate, filters[].defaultValue.KeywordSearchText, filters[].defaultValue.NumberValue, filters[].defaultValue.SelectedKeywordTypeIndex, filters[].defaultValue.SelectedValue, filters[].defaultValue.StartDate, filters[].disabledDescriptor, filters[].isVisible, filters[].jsonKey, filters[].noneSelectedText, filters[].options, filters[].serializeBehavior, filters[].showLabel, filters[].title, filters[].tooltipText, filters[].type, filters[].useCurrency, jobId, options, options.NumberValue, options.NumberValue[].extraData, options.NumberValue[].id, options.NumberValue[].name, options.checkbox, options.checkbox[].id, options.checkbox[].name, options.date, options.date[].extraData, options.date[].id, options.date[].name, options.subs, options.subsMultiSelectOptions, options.subsMultiSelectOptions[].extraData, options.subsMultiSelectOptions[].id, options.subsMultiSelectOptions[].name, … (+29) |
| GET | `/api/Filters/{id}?useSession=` | — | data, builderIds, filters, filters[].allSelectedText, filters[].defaultValue, filters[].defaultValue.NumberValue, filters[].defaultValue.SelectedValue, filters[].isVisible, filters[].jsonKey, filters[].noneSelectedText, filters[].options, filters[].serializeBehavior, filters[].showLabel, filters[].title, filters[].tooltipText, filters[].type, filters[].useCurrency, jobId, options, options.date, options.date[].extraData, options.date[].id, options.date[].name, options.{key}, options.{key}[].extraData, options.{key}[].id, options.{key}[].name, options.{key}[].options, savedFilters, savedFilters[].addedDate, savedFilters[].canEdit, savedFilters[].id, savedFilters[].isDefault, savedFilters[].isMobileDefault, savedFilters[].isOwner, savedFilters[].isPrivate, savedFilters[].name, savedFilters[].nameAndUpdatedBy, savedFilters[].value, systemFilters, … (+1) |
| GET | `/api/GridViews?id=&isInReact=` | — | data, allGridColumns, allGridColumns[].align, allGridColumns[].columnType, allGridColumns[].customFieldMetadata, allGridColumns[].defaultWidth, allGridColumns[].enabled, allGridColumns[].id, allGridColumns[].isAlwaysIncluded, allGridColumns[].isAlwaysVisible, allGridColumns[].isCustomField, allGridColumns[].isExpandable, allGridColumns[].isFrozen, allGridColumns[].isHidden, allGridColumns[].isRemovableFromGrid, allGridColumns[].isResizeable, allGridColumns[].isSearchable, allGridColumns[].isSortable, allGridColumns[].jsonKey, allGridColumns[].name, allGridColumns[].order, allGridColumns[].toolTipHeader, allGridColumns[].type, allGridColumns[].width, defaultItem, defaultItem.Selected, defaultItem.Text, defaultItem.Value, defaultItem.addedByDate, defaultItem.addedById, defaultItem.builderId, defaultItem.canDelete, defaultItem.canEdit, defaultItem.canPrivate, defaultItem.columns, defaultItem.columns[].id, defaultItem.columns[].isFrozen, defaultItem.columns[].width, defaultItem.defaultPageSize, defaultItem.defaultViewId, … (+48) |
| GET | `/api/LandingPage/Counts?countTypes=` | — | data, actionItems, actionItems.bidPackage, actionItems.bidRequest, actionItems.billsToApprove, actionItems.changeOrder, actionItems.estimate, actionItems.incompleteRfi, actionItems.ownerWarrantyRequests, actionItems.paymentsToAccept, actionItems.submittal, actionItems.unapprovedShifts, actionItems.unconfirmedSchedule, actionItems.unreadMessage, actionItems.warrantyFeedback, actionItems.warrantyReady, actionItems.warrantyReschedule, dueToday, dueToday.bidPackage, dueToday.changeOrder, dueToday.estimate, dueToday.leadActivity, dueToday.ownerInvoice, dueToday.poPayment, dueToday.purchaseOrder, dueToday.rfi, dueToday.schedule, dueToday.selection, dueToday.sub, dueToday.task, dueToday.taskTeam, dueToday.todo, pastDue, pastDue.bidPackage, pastDue.changeOrder, pastDue.estimate, pastDue.leadActivity, pastDue.ownerInvoice, pastDue.poPayment, pastDue.purchaseOrder, … (+7) |
| GET | `/api/Logs/{id}?jobId=` | — | data, addedById, attachedFiles, attachedFiles.files, attachedFiles.files[].AttachedEntityPath, attachedFiles.files[].addedBy, attachedFiles.files[].annotatedDocPath, attachedFiles.files[].annotatedDocPathWithBranding, attachedFiles.files[].annotationCount, attachedFiles.files[].annotationGroupId, attachedFiles.files[].annotationLinkCount, attachedFiles.files[].builderId, attachedFiles.files[].commentCount, attachedFiles.files[].dateAttached, attachedFiles.files[].docPath, attachedFiles.files[].docPathWithBranding, attachedFiles.files[].documentInstanceId, attachedFiles.files[].downloadAnnotatedDocPath, attachedFiles.files[].downloadDocPath, attachedFiles.files[].duration, attachedFiles.files[].entityId, attachedFiles.files[].extension, attachedFiles.files[].fileSize, attachedFiles.files[].fileSizeFormatted, attachedFiles.files[].folderType, attachedFiles.files[].hasAnnotationLinks, attachedFiles.files[].hasAnnotations, attachedFiles.files[].id, attachedFiles.files[].is360Media, attachedFiles.files[].isMacroEnabledExcelFile, attachedFiles.files[].isOriginalResolution, attachedFiles.files[].isPhoto, attachedFiles.files[].isTempFile, attachedFiles.files[].jobsiteId, attachedFiles.files[].lastModifiedOn, attachedFiles.files[].mediaType, attachedFiles.files[].permissions, attachedFiles.files[].previewAnnotatedDocPath, attachedFiles.files[].previewDocPath, attachedFiles.files[].rowVersion, … (+238) |
| GET | `/api/Logs/DefaultInfo?jobId=` | — | data, addedById, attachedFiles, attachedFiles.files, attachedFiles.newFileOptions, attachedFiles.newFileOptions.canEdit, attachedFiles.newFileOptions.defaultValue, attachedFiles.newFileOptions.fileOptionKey, attachedFiles.newFileOptions.loginType, attachedFiles.newFileOptions.options, attachedFiles.newFileOptions.title, attachedFiles.newFileOptions.visible, attachedFiles.title, attachedFiles.viewingPermissions, attachedFiles.viewingPermissions.allAllowedExtensions, attachedFiles.viewingPermissions.allowFullSizeImages, attachedFiles.viewingPermissions.allowedDocumentExtensions, attachedFiles.viewingPermissions.allowedPhotoExtensions, attachedFiles.viewingPermissions.allowedVideoExtensions, attachedFiles.viewingPermissions.blacklistedExtensions, attachedFiles.viewingPermissions.browseExistingDocs, attachedFiles.viewingPermissions.canAddFiles, attachedFiles.viewingPermissions.canUploadDocuments, attachedFiles.viewingPermissions.canUploadPhotos, attachedFiles.viewingPermissions.canUploadVideos, attachedFiles.viewingPermissions.documentListType, attachedFiles.viewingPermissions.ignoreBlacklist, attachedFiles.viewingPermissions.isFileReplaceMode, attachedFiles.viewingPermissions.jobsiteID, attachedFiles.viewingPermissions.leadId, attachedFiles.viewingPermissions.maxFileSize, attachedFiles.viewingPermissions.maxFiles, attachedFiles.viewingPermissions.minFileSize, attachedFiles.viewingPermissions.videoDurationLimit, attachedFiles.viewingPermissions.videoMaxSizeMB, builderId, canAdd, canDelete, canEdit, created, … (+185) |
| GET | `/api/Marketplace/GetParagonUserData` | — | data, orgLinkExternalID, user, user.consentDate, user.integrations, user.integrations.hubspot, user.integrations.pipedrive, user.integrations.salesforce, user.userId |
| GET | `/api/MarketplaceToken/IsTokenActive` | — | data, isActive |
| GET | `/api/menu` | — | data, builderId, builderIdUserIdLookup, builderIdUserIdLookup.{key}, canQuickAddCreditMemos, defaultViews, defaultViews.activityCalendarDefaultView, defaultViews.builderCalendarDefaultView, defaultViews.builderSelectionDefaultView, defaultViews.ownerCalendarDefaultView, defaultViews.ownerSelectionDefaultView, headerStyleInfo, headerStyleInfo.color, headerStyleInfo.darken, impersonatingUserCanEditPermissions, isChatEnabled, isSearchEnabled, manageSubscriptionToken, multipleBuildersSelected, tabs, tabs.files, tabs.files.documents, tabs.files.photos, tabs.files.title, tabs.files.videos, tabs.financial, tabs.financial.bids, tabs.financial.bills, tabs.financial.budget, tabs.financial.estimates, tabs.financial.jobCostingBudget, tabs.financial.onlinePaymentReport, tabs.financial.onlinePaymentSettings, tabs.financial.ownerInvoices, tabs.financial.purchaseOrders, tabs.financial.rebates, tabs.financial.receipts, tabs.financial.scheduleValues, tabs.financial.title, tabs.help, … (+71) |
| GET | `/api/Search/filters?requestedPage=` | — | data, availableJobs, availableJobs.options, availableJobs.options[].name, availableJobs.options[].options, availableJobs.options[].type, availableJobs.type, availableJobs.validators, availableJobs.value, categories, categories.options, categories.options[].name, categories.options[].options, categories.options[].type, categories.type, categories.validators, categories.value |
| GET | `/api/TradeAgreement/PastAgreements?subId=` | — | data, pastTradeAgreements |
| GET | `/apix/v1/AdminChurn/getexcludefromchurndata?builderID=` | — | — |
| GET | `/apix/v1/AdminPartners` | — | — |
| GET | `/apix/v1/BTAdminAccountInfo` | — | data |
| GET | `/apix/v2/admin/auth/login?lpr=` | — | — |
| GET | `/apix/v2/admin/auth/login?lpr=&reason=` | — | — |
| GET | `/apix/v2/BluebeamSessions/{id}/{guid}?job=` | — | canManage, canSync, canView, hadPreviousSession, hasSession, sessionInProgress, sessionUrl |
| GET | `/apix/v2/context/init` | — | analytics, analytics.mixpanel, analytics.mixpanel.apiHost, analytics.mixpanel.enabled, analytics.mixpanel.projectToken, analytics.sawmill, analytics.sawmill.batchThreshold, analytics.sawmill.enabled, analytics.sawmill.ingestionEndpoint, analytics.sawmill.maxCachedEvents, analytics.sawmill.maxPayloadSizeBytes, analytics.sawmill.tenantId, datadog, datadog.applicationId, datadog.clientToken, datadog.enableTracing, datadog.enabled, datadog.sessionReplaySampleRate, datadog.sessionSampleRate, datadog.site, datadog.traceSampleRate, datadog.trackUserInteractions, sentry, sentry.dsn, sentry.enabled, sentry.tracesSampleRate |
| GET | `/apix/v2/CostInboxMigration/status` | — | canOptIn, choice, eligibleReceiptCount, forcedMigrationTargetDate, hasOptedIn, isCountdownActive, isDraftBillsEffective, isForceMigrated, isMigrated, optInDate |
| GET | `/apix/v2/EntityApprovals/entity/{id}?associatedType=&job=` | — | documentInstanceId, users, users[].loginType, users[].reasonForAction, users[].status, users[].statusChangedDateUtc, users[].userId, users[].userName |
| GET | `/apix/v2/EntityChangeTracking/entity-changes?entityId=&entityType=&externalBuilderId=&externalEntityId=&externalJobId=` | — | changes |
| GET | `/apix/v2/EntityRecords/{guid}` | — | entityId, entityRecordResponseType, entityType, id, isDeleted, jobId, organizationId, status, title |
| GET | `/apix/v2/EntityRecords/available-on-job?entityType=&jobParam=` | — | entities, entities[].entityId, entities[].entityRecordResponseType, entities[].entityType, entities[].hasAnnotations, entities[].id, entities[].isDeleted, entities[].jobId, entities[].organizationId, entities[].status, entities[].title |
| GET | `/apix/v2/EntityRecords/linked-entities/{guid}/batch?targetEntityTypes=` | — | entitiesByType, entitiesByType[].entityRecords, entitiesByType[].entityType |
| GET | `/apix/v2/LegacyFilters/{id}` | — | builderIds, filters, filters[].defaultValue, filters[].defaultValue.EndDate, filters[].defaultValue.SelectedValue, filters[].defaultValue.StartDate, filters[].isVisible, filters[].jsonKey, filters[].options, filters[].showLabel, filters[].title, filters[].tooltipText, filters[].type, filters[].useCurrency, jobId, options, options.{key}, options.{key}[].extraData, options.{key}[].id, options.{key}[].name, savedFilters, savedFilters[].addedDate, savedFilters[].canEdit, savedFilters[].id, savedFilters[].isDefault, savedFilters[].isMobileDefault, savedFilters[].isOwner, savedFilters[].isPrivate, savedFilters[].name, savedFilters[].nameAndUpdatedBy, savedFilters[].value, systemFilters |
| GET | `/apix/v2/MfaEnrollmentState` | — | createdAt, forceMfa, graceDaysRemaining, graceWindowExpired, hasEveryLogin, hasFactor, impressionCount, isApplicable, lastNudgeAt, nudgeCapReached, requiresEnrollment, shouldNudge, updatedAt |
| GET | `/apix/v2/Views?viewType=` | — | totalCount, views, views[].configuration, views[].createdByUserId, views[].createdDate, views[].externalId, views[].filters, views[].isDefault, views[].isUserDefault, views[].modifiedByUserId, views[].modifiedDate, views[].name, views[].sortOrder, views[].systemViewId, views[].viewType, views[].visibility |
| GET | `/apix/v2/WhatsNew/latest` | — | latestPublishedDateUtc |
| POST | `/api/ActivityFeed` | filters, infiniteScrollData, infiniteScrollData.firstRow, infiniteScrollData.lastRow, infiniteScrollData.previousId | data, feedContent, feedContent[].date, feedContent[].dateIso, feedContent[].items, feedContent[].items[].action, feedContent[].items[].avatar, feedContent[].items[].builder, feedContent[].items[].builderId, feedContent[].items[].content, feedContent[].items[].id, feedContent[].items[].job, feedContent[].items[].jobId, feedContent[].items[].parentId, feedContent[].items[].performingUserId, feedContent[].items[].performingUserName, feedContent[].items[].subject, feedContent[].items[].time, feedContent[].items[].timeIso, infiniteScrollData, infiniteScrollData.hasLoadedAll, infiniteScrollData.infiniteScrollStatus |
| POST | `/api/calendar/CalendarList` | currentWeekOnly, filters, loadOtherItems, pagesLoaded, perDayLimit, selectedJobIds, startDate, view | data, builders, builders[].id, builders[].name, calendarItems, calendarItems[].assignedUsers, calendarItems[].assignedUsers[].disableIndividualSelection, calendarItems[].assignedUsers[].disabled, calendarItems[].assignedUsers[].extraData, calendarItems[].assignedUsers[].id, calendarItems[].assignedUsers[].key, calendarItems[].assignedUsers[].name, calendarItems[].assignedUsers[].secondaryName, calendarItems[].assignedUsers[].selected, calendarItems[].associatedId, calendarItems[].associatedType, calendarItems[].canOpenLead, calendarItems[].color, calendarItems[].completed, calendarItems[].contactName, calendarItems[].description, calendarItems[].duration, calendarItems[].endDate, calendarItems[].externalId, calendarItems[].extraType, calendarItems[].hasHourlyEnd, calendarItems[].hasHourlyStart, calendarItems[].hasPredecessor, calendarItems[].id, calendarItems[].isAllDay, calendarItems[].isPredecessor, calendarItems[].jobColor, calendarItems[].jobId, calendarItems[].jobTitle, calendarItems[].phaseId, calendarItems[].serviceId, calendarItems[].showTime, calendarItems[].startDate, calendarItems[].status, calendarItems[].title, … (+62) |
| POST | `/api/CreditMemos/Grid` | filters, gridRequest, gridRequest.emptyStateEntity, gridRequest.hasFooter, gridRequest.hideMultiJobsColumns, gridRequest.savedViewId, gridRequest.selectedColumns, gridRequest.sortColumn, gridRequest.sortDirection, jobIds, pagingData, pagingData.currentPage, pagingData.firstRow, pagingData.lastRow, pagingData.pageNumber | data, appliedCreditMemos, appliedDeposits, canAdd, canAddDeposit, canAddOwnerInvoice, canDelete, canUpdate, columnsList, columnsList[].align, columnsList[].columnType, columnsList[].customFieldMetadata, columnsList[].defaultWidth, columnsList[].enabled, columnsList[].id, columnsList[].isAlwaysIncluded, columnsList[].isAlwaysVisible, columnsList[].isCustomField, columnsList[].isExpandable, columnsList[].isFrozen, columnsList[].isHidden, columnsList[].isRemovableFromGrid, columnsList[].isResizeable, columnsList[].isSearchable, columnsList[].isSortable, columnsList[].jsonKey, columnsList[].name, columnsList[].order, columnsList[].toolTipHeader, columnsList[].type, columnsList[].width, data, footerData, footerData[].amount, footerData[].amount.scale, footerData[].amount.value, footerData[].amountApplied, footerData[].amountRemaining, footerData[].creditMemoId, hasMoreRows, … (+29) |
| POST | `/api/GridViews/GetGridViews` | isInReact, jobs, type | data, allGridColumns, allGridColumns[].align, allGridColumns[].columnType, allGridColumns[].customFieldMetadata, allGridColumns[].defaultWidth, allGridColumns[].enabled, allGridColumns[].id, allGridColumns[].isAlwaysIncluded, allGridColumns[].isAlwaysVisible, allGridColumns[].isCustomField, allGridColumns[].isExpandable, allGridColumns[].isFrozen, allGridColumns[].isHidden, allGridColumns[].isRemovableFromGrid, allGridColumns[].isResizeable, allGridColumns[].isSearchable, allGridColumns[].isSortable, allGridColumns[].jsonKey, allGridColumns[].name, allGridColumns[].order, allGridColumns[].toolTipHeader, allGridColumns[].type, allGridColumns[].width, defaultItem, defaultItem.Selected, defaultItem.Text, defaultItem.Value, defaultItem.addedByDate, defaultItem.addedById, defaultItem.builderId, defaultItem.canDelete, defaultItem.canEdit, defaultItem.canPrivate, defaultItem.columns, defaultItem.columns[].id, defaultItem.columns[].isFrozen, defaultItem.columns[].width, defaultItem.defaultPageSize, defaultItem.defaultViewId, … (+48) |
| POST | `/apix/v2/Landing` | jobs | acceptOnlinePayments, acceptedTC, canViewRiskInsurance, canViewSubPayments, hasCompletedSurveys, isOutOfOffice, jobInfo, jobInfo.contacts, jobInfo.contacts[].activationConfirmed, jobInfo.contacts[].activationSent, jobInfo.contacts[].activationStatus, jobInfo.contacts[].email, jobInfo.contacts[].id, jobInfo.contacts[].lastActiveDate, jobInfo.contacts[].name, jobInfo.contacts[].orglinkId, jobInfo.contacts[].phone, jobInfo.contacts[].recipientId, jobInfo.contacts[].thumbnail, jobInfo.jobAddress, jobInfo.jobAddress.countryDropdown, jobInfo.jobAddress.countryDropdownId, jobInfo.jobAddress.fields, jobInfo.jobAddress.formattedAddressNoStreet, jobInfo.jobAddress.globalCountry, jobInfo.jobAddress.layout, jobInfo.jobAddress.location, jobInfo.jobAddress.stateDropdown, jobInfo.jobAddress.stateDropdownId, jobInfo.jobAddress.validators, jobInfo.jobColor, jobInfo.jobId, jobInfo.jobName, jobInfo.projectManagers, jobInfo.projectManagers[].activationConfirmed, jobInfo.projectManagers[].activationSent, jobInfo.projectManagers[].activationStatus, jobInfo.projectManagers[].email, jobInfo.projectManagers[].id, jobInfo.projectManagers[].lastActiveDate, … (+99) |

### Write endpoints

| Method | Path | Source | Body keys / trigger |
| --- | --- | --- | --- |
| GET | `/apix/v2/Summary/update-insights?jobId=` | blocked during crawl | — (via select-job, nav:/app/Landing) |
| POST | `/api/channels/{id}/read` | blocked during crawl | — (via btn:Comments) |
| POST | `/api/EntityRecord` | blocked during crawl | entityType, id, jobId, organizationId (via btn:More›Create QR code) |
| POST | `/api/Login/LogAuth` | blocked during crawl | — (via btn:View time sheets, nav:/app/leads/opportunities) |
| POST | `/apix/v2/Views` | blocked during crawl | configuration, name, viewType, visibility (via btn:Add column›Created by, btn:Add column›Created Date) |
| PUT | `/api/Payroll/RefreshPayPeriods` | blocked during crawl | builderID (via btn:View time sheets, nav:/app/TimeClock/Reports) |
| POST | `/api/AccountInfo` | app bundle (not fired) | — |
| POST/PUT | `/api/Assemblies` | app bundle (not fired) | — |
| POST | `/api/Assemblies/BulkInsert` | app bundle (not fired) | — |
| DELETE | `/api/Assemblies/{p}` | app bundle (not fired) | — |
| PUT | `/api/Branding` | app bundle (not fired) | — |
| PUT | `/api/Builder/CompanyInformation` | app bundle (not fired) | — |
| PUT | `/api/Builder/UpdateAndConfirmCompanyAddress` | app bundle (not fired) | — |
| POST | `/api/BuilderAccount/SendChangeRequestLink` | app bundle (not fired) | — |
| POST | `/api/BuilderAccount/SubmitBuilderRequest` | app bundle (not fired) | — |
| PUT | `/api/BulkExport/CancelRequest` | app bundle (not fired) | — |
| PUT | `/api/BulkExport/DefaultAction` | app bundle (not fired) | — |
| PUT | `/api/BulkExport/DisconnectDropbox` | app bundle (not fired) | — |
| POST | `/api/Calendar/BulkCopy` | app bundle (not fired) | — |
| PUT | `/api/Calendar/ConflictTrackingAndCount` | app bundle (not fired) | — |
| DELETE | `/api/Calendar/DeleteAll` | app bundle (not fired) | — |
| DELETE | `/api/Calendar/DeleteCalendarFeed` | app bundle (not fired) | — |
| DELETE | `/api/Calendar/DeleteMultiple` | app bundle (not fired) | — |
| PUT | `/api/Calendar/HideConflicts` | app bundle (not fired) | — |
| POST | `/api/Calendar/MassAssign` | app bundle (not fired) | — |
| PUT | `/api/Calendar/Status` | app bundle (not fired) | — |
| POST | `/api/Calendar/UsersWithoutJobAccess` | app bundle (not fired) | — |
| POST | `/api/Calendar/{p}/Copy` | app bundle (not fired) | — |
| POST | `/api/Category` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Category/{p}` | app bundle (not fired) | — |
| POST | `/api/Channels` | app bundle (not fired) | — |
| DELETE | `/api/ClientObservableBackgroundJobs/ClearJobs` | app bundle (not fired) | — |
| POST | `/api/CostGroups` | app bundle (not fired) | — |
| DELETE/PUT | `/api/CostGroups/{p}` | app bundle (not fired) | — |
| POST | `/api/CreditMemos` | app bundle (not fired) | — |
| DELETE/PUT | `/api/CreditMemos/{p}` | app bundle (not fired) | — |
| PUT | `/api/CreditMemos/{p}/applycreditmemo` | app bundle (not fired) | — |
| POST | `/api/DataScienceInformation/SaveAllAnswers` | app bundle (not fired) | — |
| POST | `/api/EmptyOrInitialStateAlert/Dismiss` | app bundle (not fired) | — |
| POST | `/api/Exceptions/LogExceptionInSentry` | app bundle (not fired) | — |
| PUT | `/api/FeatureFlag/Disable` | app bundle (not fired) | — |
| PUT | `/api/FeatureFlag/DisableAll` | app bundle (not fired) | — |
| PUT | `/api/FeatureFlag/Enable` | app bundle (not fired) | — |
| PUT | `/api/FeatureFlag/EnableAll` | app bundle (not fired) | — |
| PUT | `/api/FeatureFlag/{p}` | app bundle (not fired) | — |
| POST | `/api/Filters/Saved` | app bundle (not fired) | — |
| DELETE/PUT | `/api/Filters/{p}/Saved` | app bundle (not fired) | — |
| PUT | `/api/Filters/{p}/SetUserDefault` | app bundle (not fired) | — |
| DELETE/POST/PUT | `/api/FormatGroups` | app bundle (not fired) | — |
| POST | `/api/GettingStartedGuide/NotifyProServiceTeam` | app bundle (not fired) | — |
| DELETE/PUT | `/api/GridViews/{p}` | app bundle (not fired) | — |
| PUT | `/api/GridViews/{p}/SetDefault` | app bundle (not fired) | — |
| PUT | `/api/LienWaivers/Approve` | app bundle (not fired) | — |
| PUT | `/api/LienWaivers/ApproveLienWaiverExternal` | app bundle (not fired) | — |
| PUT | `/api/LienWaivers/Decline` | app bundle (not fired) | — |
| PUT | `/api/LienWaivers/DeclineLienWaiverExternal` | app bundle (not fired) | — |
| PUT | `/api/LienWaivers/RefreshPdf` | app bundle (not fired) | — |
| DELETE/PUT | `/api/LienWaivers/{p}` | app bundle (not fired) | — |
| POST/PUT | `/api/LienWaiversForms` | app bundle (not fired) | — |
| DELETE | `/api/LienWaiversForms/{p}` | app bundle (not fired) | — |
| PUT | `/api/LineItems/AssignToAssembly` | app bundle (not fired) | — |
| DELETE | `/api/LineItems/DeleteLineItems` | app bundle (not fired) | — |
| PUT | `/api/LineItems/FormatLineItems` | app bundle (not fired) | — |
| POST | `/api/Login/ForgotUsername` | app bundle (not fired) | — |
| POST | `/api/Login/GenerateOauthCode` | app bundle (not fired) | — |
| POST | `/api/Login/OrgSelect` | app bundle (not fired) | — |
| POST | `/api/Login/SwitchLinkedLogin` | app bundle (not fired) | — |
| POST | `/api/Logout` | app bundle (not fired) | — |
| POST | `/api/Logs` | app bundle (not fired) | — |
| POST | `/api/Logs/Print` | app bundle (not fired) | — |
| PUT | `/api/Logs/{p}` | app bundle (not fired) | — |
| PUT | `/api/Mapping/BulkMap` | app bundle (not fired) | — |
| DELETE | `/api/Marketplace/DisconnectBuilderAndRevokeConsent` | app bundle (not fired) | — |
| POST | `/api/Marketplace/StoreParagonUserData` | app bundle (not fired) | — |
| POST | `/api/MarketplaceToken` | app bundle (not fired) | — |
| DELETE | `/api/PartnerAccounts` | app bundle (not fired) | — |
| PUT | `/api/Password/ResetPassword` | app bundle (not fired) | — |
| POST | `/api/PaymentsPrescreening/ReunderwriteAccount` | app bundle (not fired) | — |
| POST | `/api/PaymentsPrescreening/SetApprovalStatus` | app bundle (not fired) | — |
| POST | `/api/Payroll/CreatePayrollAccount` | app bundle (not fired) | — |
| PUT | `/api/Payroll/Disconnect` | app bundle (not fired) | — |
| DELETE | `/api/PdfSignature` | app bundle (not fired) | — |
| DELETE | `/api/Receipts/{p}` | app bundle (not fired) | — |
| POST | `/api/Search/Validate` | app bundle (not fired) | — |
| POST | `/api/Signup/InsertOrUpdateBuilder` | app bundle (not fired) | — |
| PUT | `/api/Signup/UpdateBuilderFromInProgressSignup` | app bundle (not fired) | — |
| PUT | `/api/SignupPricingDetails/{p}` | app bundle (not fired) | — |
| DELETE | `/api/Tags` | app bundle (not fired) | — |
| PUT | `/api/Tags/{p}` | app bundle (not fired) | — |
| DELETE/POST | `/api/TaxRates` | app bundle (not fired) | — |
| PUT | `/api/TaxRates/{p}` | app bundle (not fired) | — |
| PUT | `/api/TradeAgreement/ApproveOrDecline` | app bundle (not fired) | — |
| PUT | `/api/TradeAgreement/ReleaseAgreement` | app bundle (not fired) | — |
| PUT | `/api/TradeAgreement/ReplaceAgreement` | app bundle (not fired) | — |
| POST | `/api/calendar/${d` | app bundle (not fired) | — |
| POST | `/api/calendar/BreakLinks` | app bundle (not fired) | — |
| PUT | `/api/calendar/ConfirmExternal` | app bundle (not fired) | — |
| POST | `/api/calendar/CreateLink` | app bundle (not fired) | — |
| DELETE | `/api/calendar/DeleteLink` | app bundle (not fired) | — |
| PUT | `/api/calendar/NotifyOnline` | app bundle (not fired) | — |
| POST | `/api/calendar/Recalculate` | app bundle (not fired) | — |
| PUT | `/api/calendar/{p}` | app bundle (not fired) | — |
| POST | `/api/calendar/{p}/Reminder` | app bundle (not fired) | — |
| POST | `/api/calendar/{p}/confirmed` | app bundle (not fired) | — |
| POST | `/api/login/SwitchAccount` | app bundle (not fired) | — |
| POST | `/api/login/SwitchLinkedLogin` | app bundle (not fired) | — |
| POST | `/api/oauth/Authorize` | app bundle (not fired) | — |
| PUT | `/api/payroll/CreateEmployee` | app bundle (not fired) | — |
| PUT | `/api/payroll/CreateEmployees` | app bundle (not fired) | — |
| PUT | `/api/payroll/DisconnectEmployee` | app bundle (not fired) | — |
| PUT | `/api/payroll/MarkSyncedToGusto` | app bundle (not fired) | — |
| PUT | `/api/payroll/SyncEmployee` | app bundle (not fired) | — |
| PUT | `/api/payroll/SyncEmployees` | app bundle (not fired) | — |
| PUT | `/api/payroll/SyncPayrollWithGusto` | app bundle (not fired) | — |
| POST | `/api/receipts` | app bundle (not fired) | — |
| DELETE | `/api/receipts/BulkDeleteReceipts` | app bundle (not fired) | — |
| PUT | `/api/receipts/{p}` | app bundle (not fired) | — |
| PATCH | `/apix/v2.0/Channels/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/AgentSessions` | app bundle (not fired) | — |
| POST | `/apix/v2/Alerts/dismiss-entity-empty-state` | app bundle (not fired) | — |
| POST | `/apix/v2/AuthToken/service-token` | app bundle (not fired) | — |
| DELETE/POST/PUT | `/apix/v2/BluebeamSessions/{p}/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/BluebeamSessions/{p}/{p}/sync` | app bundle (not fired) | — |
| POST | `/apix/v2/BluebeamSessions/{p}/{p}/unlink` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Channels/{p}` | app bundle (not fired) | — |
| POST/PUT | `/apix/v2/Contracts/prime` | app bundle (not fired) | — |
| PUT | `/apix/v2/Contracts/prime/lock` | app bundle (not fired) | — |
| DELETE | `/apix/v2/CostGroups/bulk` | app bundle (not fired) | — |
| POST | `/apix/v2/CostInboxMigration/opt-in` | app bundle (not fired) | — |
| POST | `/apix/v2/DivisionCodes` | app bundle (not fired) | — |
| DELETE/PATCH | `/apix/v2/DivisionCodes/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/DynamicGrid/{p}/record-count` | app bundle (not fired) | — |
| POST | `/apix/v2/EntityApprovals/entity/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/EntityApprovals/entity/{p}/external` | app bundle (not fired) | — |
| POST | `/apix/v2/EntityApprovals/entity/{p}/pdf/external` | app bundle (not fired) | — |
| POST | `/apix/v2/EntityApprovals/{p}/pdf` | app bundle (not fired) | — |
| POST | `/apix/v2/EntityRecords/insert` | app bundle (not fired) | — |
| POST | `/apix/v2/EntityRecords/linked-entities/mass-link` | app bundle (not fired) | — |
| PUT | `/apix/v2/EntityRecords/linked-entities/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/Feedback/submit` | app bundle (not fired) | — |
| POST | `/apix/v2/FieldNotes/audio` | app bundle (not fired) | — |
| POST | `/apix/v2/LienWaivers/external/print` | app bundle (not fired) | — |
| POST | `/apix/v2/MfaEnrollmentState/nudges` | app bundle (not fired) | — |
| DELETE/PATCH | `/apix/v2/PaymentMethods/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/PdfSignature` | app bundle (not fired) | — |
| POST | `/apix/v2/PdfSignature/saved-signatures` | app bundle (not fired) | — |
| PUT | `/apix/v2/PdfSignature/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/PricingTable/cost-items` | app bundle (not fired) | — |
| POST | `/apix/v2/PricingTable/cost-items/bulk-delete` | app bundle (not fired) | — |
| POST | `/apix/v2/PricingTable/cost-items/generate` | app bundle (not fired) | — |
| PUT | `/apix/v2/Receipts/bulk-complete` | app bundle (not fired) | — |
| PUT | `/apix/v2/Receipts/normalized-company-name` | app bundle (not fired) | — |
| POST | `/apix/v2/ScopesOfWork/{p}/group` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/ScopesOfWork/{p}/group/{p}` | app bundle (not fired) | — |
| PATCH | `/apix/v2/Share` | app bundle (not fired) | — |
| POST | `/apix/v2/Share/query` | app bundle (not fired) | — |
| POST | `/apix/v2/SubSummary/daily-logs` | app bundle (not fired) | — |
| POST | `/apix/v2/Suppliers/{p}/initiate-account-link` | app bundle (not fired) | — |
| DELETE/PATCH | `/apix/v2/Views/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/AgentSessions` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/BTAdminUsers` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/BTAdminUsers/{p}` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/BTAdminUsers/{p}/enable` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/Builders/{p}/company-info` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/FeaturesAndFlags/{p}/config-flag` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/FeaturesAndFlags/{p}/feature-flag` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Feedback/generate-story/analyze` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Feedback/generate-story/confirm` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Feedback/outreach` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/Feedback/outreach/clear` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/ShareTokens/{p}/expire` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/WhatsNew` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/WhatsNew/tags` | app bundle (not fired) | — |
| PUT | `/apix/v2/admin/WhatsNew/tags/{p}` | app bundle (not fired) | — |
| DELETE/PUT | `/apix/v2/admin/WhatsNew/{p}` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/receipts` | app bundle (not fired) | — |
| POST | `/apix/v2/admin/receipts/{p}/review` | app bundle (not fired) | — |
| PUT | `/apix/v3/EntityRecords/linked-entities/{p}` | app bundle (not fired) | — |
| POST | `/apix/v3/Rebates/enroll-builder` | app bundle (not fired) | — |
| POST | `/apix/v3/admin/ProductMatches/{p}/review` | app bundle (not fired) | — |
| POST | `/apix/v4/admin/Products/matches` | app bundle (not fired) | — |

### Bundle read APIs not reached

`GET /api/AccountInfo/DefaultAction` · `GET /api/AccountInfo/FrozenBuilder{p}` · `POST /api/AccountInfo/Grid` · `GET /api/Assemblies/DefaultInfo` · `GET /api/Builder/GetCurrentBuilderInformation` · `GET /api/Builder/{p}/DemoInfo` · `GET /api/BuilderAccount/GetAccountChangeRequest` · `GET /api/Calendar/AllConflicts` · `GET /api/Calendar/ComputeCopyDates` · `GET /api/Calendar/Conflicts` · `GET /api/Calendar/ConflictsByJob` · `GET /api/Calendar/ConflictsByUser` · `GET /api/Calendar/InlineEditAssignedUsers` · `GET /api/Calendar/MassAssignment` · `GET /api/Carrier/Lookup` · `GET /api/Channels/{p}` · `GET /api/Channels/{p}/Events` · `GET /api/ClientObservableBackgroundJobs` · `? /api/CostGroups/ExportToExcel` · `POST /api/CostGroups/Grid` · `GET /api/CreditMemos/DefaultInfo` · `? /api/CreditMemos/ExportToExcel` · `GET /api/DataScienceInformation/LoadInitialDataScienceInfo` · `GET /api/DataScienceInformation/UpdateProjectDropdown` · `GET /api/Discussions` · `GET /api/FeatureFlag/ActionHistory` · `GET /api/FeatureFlag/List` · `POST /api/GridViews/GetGridViewsExternal` · `GET /api/LienWaivers/FormDefaults` · `GET /api/LienWaivers/{p}/Details` · `GET /api/LienWaiversForms/Defaults` · `? /api/Login/EphemeralLogin` · `GET /api/Login/GenerateEphemeralUrl` · `GET /api/Login/ImpersonationCode` · `? /api/Login/LoginWithAuth0` · `GET /api/Logs/NotifyUsers` · `GET /api/Mapping/GetUnmappedBuilderItems` · `GET /api/MarketPlaceToken/GetReconsentDetails` · `GET /api/Marketplace/GetParagonUserToken` · `GET /api/Options/Export` · `GET /api/Partners/GetPartnerByName` · `GET /api/Partners/GetPartnerRedirectInfo` · `GET /api/PriceCode/ValidatePriceCodeAndGenerateRedirect` · `GET /api/RebateSuppliers/Terms` · `GET /api/RebateSuppliers/{p}/SupplierDetails` · `? /api/Receipts/ExportToExcel` · `GET /api/RelatedEntities/Entities` · `GET /api/SalesTax/ResolveAddress` · `GET /api/Signup/GetAddressCountryChanged` · `GET /api/Signup/GetSignupFormEntity` · `GET /api/Signup/GetSignupWhatsNext` · `GET /api/Tags/Edit` · `GET /api/TaxRates/DefaultInfo` · `? /api/TaxRates/ExportToExcel` · `POST /api/TaxRates/Grid` · `GET /api/Time/BTTimezoneFromLatLong` · `GET /api/Time/CurrentTime` · `GET /api/TradeAgreement` · `GET /api/TradeAgreement/{p}/Print` · `GET /api/builder/GetCurrentBuilderInformation` · `GET /api/builder/{p}/DemoInfo` · `POST /api/calendar` · `GET /api/calendar/{p}/LinkList` · `GET /api/channels/read` · `GET /api/discussions` · `GET /api/discussions/Entities` · `GET /api/dynamicGrid/GetFullIDsListFromFilters` · `GET /api/login/GetAuthStoreForUsername` · `? /api/login/LoginWithAuth0` · `? /api/logout` · `GET /api/menu/HeaderInfo` · `GET /api/oauth/AuthRedirect` · `GET /api/payroll/SelectPayrolls` · `GET /api/receipts/ForwardAddress` · `POST /api/receipts/grid` · `GET /api/share/{p}` · `? /api/v2/{p}` · `? /apix/btadmin/hangfire` · `? /apix/swagger/all/swagger.yaml` · `? /apix/swagger/legacy/swagger.yaml` · `? /apix/v1` · `? /apix/v1/Admin{p}${(i` · `GET /apix/v1/admin/Products/brands` · `GET /apix/v1/admin/Products/manufacturers/all` · `GET /apix/v2/AgentSessions/{p}` · `? /apix/v2/BluebeamSessions` · `GET /apix/v2/BluebeamSessions/{p}/{p}/details` · `GET /apix/v2/Builders/{p}/info` · `GET /apix/v2/Context/global` · `GET /apix/v2/Context/step-up-status` · `GET /apix/v2/Context/{p}/global-external` · `POST /apix/v2/Contracts/prime/list` · `GET /apix/v2/Discussions/{p}` · `GET /apix/v2/DivisionCodes/list` · `GET /apix/v2/EntityChangeTracking/external/{p}/entity-changes` · `GET /apix/v2/EntityRecords/search-available` · `GET /apix/v2/EntityRecords/{p}/attachable-entities` · `GET /apix/v2/EntitySnapshots/{p}/{p}` · `GET /apix/v2/LienWaivers/external/{p}` · `GET /apix/v2/LienWaivers/print` · `GET /apix/v2/PdfSignature/defaults` · `GET /apix/v2/PdfSignature/{p}/status` · `GET /apix/v2/ProofsOfPurchase` · `GET /apix/v2/Rebates/earnings` · `GET /apix/v2/Rebates/purchasing-dashboard` · `GET /apix/v2/Receipts/forward-address` · `GET /apix/v2/Suppliers` · `GET /apix/v2/Suppliers/logos` · `GET /apix/v2/WhatsNew` · `GET /apix/v2/admin/AgentSessions/{p}` · `GET /apix/v2/admin/Agents` · `GET /apix/v2/admin/FeaturesAndFlags/{p}` · `GET /apix/v2/admin/Feedback/export-csv` · `GET /apix/v2/admin/Feedback/feedback-ids` · `GET /apix/v2/admin/Feedback/list` · `GET /apix/v2/admin/LoginHistory` · `GET /apix/v2/admin/ProductMatches/Queues` · `GET /apix/v2/admin/ProductMatches/Queues/{p}/next` · `GET /apix/v2/admin/ProductMatches/history` · `GET /apix/v2/admin/ProductMatches/{p}` · `GET /apix/v2/admin/ProductMatches/{p}/related-reviews` · `GET /apix/v2/admin/Receipts/queues` · `GET /apix/v2/admin/ShareTokens/{p}` · `GET /apix/v2/admin/WhatsNew/feature-flags` · `? /apix/v2/admin/auth/logout` · `GET /apix/v2/admin/products/{p}` · `GET /apix/v2/admin/receipts/{p}` · `GET /apix/v2/external/{p}/BluebeamSessions/{p}` · `GET /apix/v2/external/{p}/custom-fields/definitions` · `GET /apix/v3/EntityApprovals/external/{p}` · `GET /apix/v3/PurchasingPaymentHistory` · `GET /apix/v3/PurchasingPaymentHistory/{p}` · `GET /apix/v3/Rebates` · `? /apix/v3/Rebates/purchasing-dashboard` · `GET /apix/v3/Rebates/{p}` · `GET /apix/v4/ProofsOfPurchase/{p}`


## VIABUILD ↔ Buildertrend gaps

Direction is one-way: VIABUILD is where the office works; Buildertrend is
kept current by a daily push through this gateway. A gap is either
**no gateway write** (Buildertrend can hold it, we cannot push it yet) or
**no VIABUILD source** (Buildertrend holds it, VIABUILD has nothing to push).

| Buildertrend module | VIABUILD source | Gateway write today | Gap |
| --- | --- | --- | --- |
| Jobs | `jobs`, `contracts`, `job_entities` | none (`jobs.create`/`jobs.update` not_captured) | **Push blocked.** Job create/update not captured. Job Info fields (contract type, contract price, site address, project manager, dates) all have VIABUILD columns. |
| Client contacts | `entities` (`is_client`), `entity_persons` | none (not_captured) | **Push blocked.** |
| Subs / vendors | `entities` (`is_supplier`, `is_subcontractor`), `entity_compliance` | none | **Push blocked**, no verb. Liability / workers' comp expiry columns map to `entity_compliance`. |
| Leads | none (HubSpot deals) | none | **No VIABUILD source.** Leave Buildertrend leads out of the push, or source from HubSpot. |
| Estimates / proposals | `estimates`, `estimate_sections`, `estimate_line_items` | none (`estimates.updateLine`/`addLines` not_captured) | **Push blocked.** Worksheet lock (`worksheetLocked`) must be respected. |
| Budget / job costing | `job_budgets`, `job_budget_lines`, `cost_codes` | none (out of scope: budget lock) | **Push blocked by design.** Read-only today. |
| Change orders | `variations`, `variation_line_items` | header save, line add/update/delete (captured); create not_captured | **Create blocked.** Existing drafts only. `variations.createDraft` needs the `create-draft` capture. |
| Owner invoices | `progress_claims`, `claim_line_items` | none (`invoices.saveDraft`/`addLines` not_captured) | **Push blocked.** |
| Purchase orders | `purchase_orders`, `purchase_order_line_items` | `pos.update` (captured); create not_captured | **Create blocked.** |
| Bills | `invoices`, `invoice_line_items`, `invoice_po_matches` | create / update / attach / link PO (captured) | Covered (draft only). |
| Bids | `quote_packages`, `quote_requests`, `quote_responses` | none | **Push blocked**, no verb. |
| Schedule | `schedule_phases`, `schedule_tasks`, `schedule_task_dependencies` | none | **Push blocked**, no verb. |
| Daily logs | `project_feed_entries` (closest) | none | **Push blocked**, no verb; VIABUILD has no dedicated site-diary table (weather, notes, tags). |
| Tasks / to-dos | none (closest `schedule_tasks`) | none | **No VIABUILD source.** |
| Selections | `selections`, `selection_options` | none | **Push blocked**, no verb. |
| Warranty | `defects` | none | **Push blocked**, no verb. Warranty claim columns (priority, category, class, follow-up) exceed `defects` (severity, status, location). |
| RFIs | none | none | **No VIABUILD source.** |
| Submittals | none (closest `document_reviews`) | none | **No VIABUILD source.** |
| Time clock | none (`labor_rates` only) | none | **No VIABUILD source.** |
| Plans and specs | `plans`, `plan_pages` | none | **Push blocked**, no verb. |
| Files | `documents`, `document_folders` | none (`docs.upload` not_captured) | **Push blocked.** Bills attach is the only captured upload. |
| Messaging / comments | `email_sends`, `project_feed_comments` | none | Not a push target (Buildertrend sends notifications; send stays locked). |
| Client updates | `project_feed_entries` | none | **Push blocked**, no verb. Publishing notifies clients: send-locked. |
| Internal users | `profiles` | none | Not a push target (account admin). |
| Reports | `saved_reports` | read only | Not a push target. |

## Write captures still needed (prioritised)

Every capture: **the account owner present**, a **sandbox job**, **Draft saves only**,
**no Send**, per [slice-c-captures.md](slice-c-captures.md). One save per
capture with `pnpm --filter gateway capture`, then implement the verb,
replay `dry_run`, one real draft, GET to verify, leave Not sent.

Order is by what blocks VIABUILD's daily push soonest, then by how much
VIABUILD data the module carries.
"Bundle hint" is a path the web app's own code calls, taken from the
inventory. It is a hint only: capture the real request before writing a verb.

| # | Verb (new or `not_captured`) | Screen and exact click | Bundle hint / crawl evidence | VIABUILD source |
| --- | --- | --- | --- | --- |
| 1 | `jobs.create` / `jobs.update` | `/app/JobPage/0/1`: fake sandbox job, Save. Never touch a live job's contract price. | `PUT /api/jobsites/Add`, `GET,PUT /api/Jobsites/Setup`, `POST /api/Jobsites/UpdateContractPrice` | `jobs`, `contracts` |
| 2 | `contacts.create` / `contacts.update` | Customer contact add form (`/api/Contacts/0/Details`), one sandbox contact, Save. **Do not** click Invite. | `POST /api/Contacts`, `PUT /api/Contacts/{id}`, `POST /apix/v2/Contacts`; invite is `PUT /apix/v2/Contacts/invite` (send-locked) | `entities` (`is_client`), `entity_persons` |
| 3 | `variations.createDraft` | Change Orders → New on the sandbox job; leave Draft. | **Observed blocked during crawl:** `POST /apix/v2/ChangeOrders/{id}/create-draft` (fires when the new form opens) | `variations`, `variation_line_items` |
| 4 | `invoices.saveDraft` / `invoices.addLines` | Owner invoice draft on the sandbox job, Save (not Send). | No literal save path in the bundle (built at run time); `/api/LineItems/EntityAttachmentsToInvoice` for lines | `progress_claims`, `claim_line_items` |
| 5 | `pos.create` | Purchase Orders → New on the sandbox job, project expense, Save. Do not release or approve. | `POST /api/PurchaseOrders`; `MapLineItemsToNewPurchaseOrders` (from budget) | `purchase_orders`, `purchase_order_line_items` |
| 6 | `estimates.addLines` / `estimates.updateLine` | Worksheet on an **unlocked** sandbox job, add/edit one line, Save. Never Send to budget. | `POST /apix/v2/LineItems/add-estimate-line-items`, `PUT /apix/v2/LineItems/update-estimate-line-item` | `estimates`, `estimate_line_items` |
| 7 | `docs.upload` | Job Documents, sandbox folder, upload a tiny test file. | `POST /api/MediaFolders`, `GET,PUT /api/MediaFolders/{id}` (rename is UI-blocked) | `documents`, `document_folders` |
| 8 | `schedule.createItem` / `schedule.updateItem` (new) | Schedule → New item on the sandbox job, Save. **Untick** notify assignees. | `POST /apix/v2/ScheduleDrafts`, `…/preview`; calendar reads only so far | `schedule_tasks`, `schedule_phases` |
| 9 | `selections.create` / `selections.addChoice` (new) | Selections → New on the sandbox job, Save; add one choice. Do not release to client. | `POST /api/Selections`, `PUT /api/Selections/{id}`, `POST /api/SelectionChoices`, `POST /api/Allowances` | `selections`, `selection_options` |
| 10 | `warranty.create` (new) | Warranty → New claim on the sandbox job, Save. Never ForceNotify. | `POST /api/Warranty`, `PUT /api/Warranty/{id}` (`ForceNotify` is send-locked) | `defects` |
| 11 | `subs.create` / `subs.update` (new) | Subs/Vendors → New, sandbox vendor, Save. **Do not** invite. | `PUT /api/Subs/Details`, `GET,PUT /api/Subs/Setup` (`BulkInviteSubs` send-locked) | `entities` (`is_supplier`, `is_subcontractor`), `entity_compliance` |
| 12 | `bids.create` (new) | Bids → New package on the sandbox job, Save. Never Release. | `POST /api/BidPackages`, `PUT /api/BidPackages/{id}` (`release` send-locked) | `quote_packages`, `quote_requests` |
| 13 | `dailyLogs.create` (new) | Daily Logs → New on the sandbox job, Save with sharing off. | `PATCH /apix/v2/DailyLogs/{id}`, `PUT …/tags`, `PUT …/weather` (create path not literal) | `project_feed_entries` |
| 14 | `leads.create` / `leads.update` | Lead add form, clearly fake lead, Save. | `POST /api/Leads`, `PUT /api/Leads/{id}` | none (HubSpot); lowest priority |

Never capture: anything that sends, notifies, invites, releases, approves,
pays or syncs to accounting (`SendMassSubInvitationRequest`, `ForceNotify`,
`BidPackages/release`, `Contacts/invite`, `SyncOwnerInvoices`,
`create-invoices-from-payment-schedule`, `share-payment-schedule`). Those stay
behind `BT_GATEWAY_ENABLE_SEND=false`.

## Follow-ups

- `session.status` does not find a builder id in this tenant's GlobalInfo
  (`builderId: null` after sign-in). The id must come from somewhere else
  before `BT_BUILDER_ID` can be filled automatically.
- `PUT /api/Payroll/RefreshPayPeriods` and `GET /apix/v2/Summary/update-insights`
  fire on page load and were blocked; the UI still rendered. A gateway read
  that needs them should treat them as side effects, not reads.
