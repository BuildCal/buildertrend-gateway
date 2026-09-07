/**
 * Captured Buildertrend purchase-order draft save (7 Sep 2026).
 *
 * Replay only the observed cookie-session HTTP:
 *   GET /api/PurchaseOrders/{id}
 *   PUT /api/PurchaseOrders/{id}  application/json
 *
 * Do not invent pos.create (POST /api/PurchaseOrders or PUT with a new id
 * is a hypothesis only). Do not approve, release, send, or mark ready
 * for payment. Project expenses only — never workers comp / icare / tax /
 * payroll.
 */

import { GatewayError } from "./errors.js";
import { asRecord, asRows, numberish } from "./grids.js";

/** Observed top-level keys on the 7 Sep 2026 draft-PO PUT (id 76899300). */
export const PO_CAPTURED_PUT_KEYS = [
  "isVariance",
  "isEntirePoVariance",
  "varianceCode",
  "relatedPOs",
  "relatedCO",
  "hasLineItemCustomerVariance",
  "relatedCOsToRemove",
  "skipVarianceValidation",
  "attachedFiles",
  "attachedFilesPostApproval",
  "customFields",
  "internalNotes",
  "materialsOnly",
  "performingUserId",
  "performingUserName",
  "performingUserType",
  "purchaseOrderName",
  "statusChangeComments",
  "title",
  "containerIsValid",
  "varianceCount",
  "lineItems",
  "purchaseOrderLineItems",
  "priceType",
  "unifiedDeadlineRequest",
  "unlinkedBids",
  "scopeOfWork",
  "disclaimer",
  "linkedBids",
  "availableBids",
  "saveAndRelease",
] as const;

/** Caller-supplied draft fields we overlay onto the GET body. */
export const PO_SAFE_DRAFT_KEYS = [
  "title",
  "purchaseOrderName",
  "internalNotes",
  "materialsOnly",
  "scopeOfWork",
  "disclaimer",
  "customFields",
  "unifiedDeadlineRequest",
  "statusChangeComments",
  "lineItems",
  "purchaseOrderLineItems",
  "attachedFiles",
] as const;

export type PoSafeDraftKey = (typeof PO_SAFE_DRAFT_KEYS)[number];

export const PO_SEND_PAY_FLAGS = [
  "saveAndRelease",
  "readyForPayment",
  "payInFull",
  "payOnline",
  "sendToAccounting",
  "syncUpdatesToAccounting",
  "sendForApproval",
  "approve",
  "approvePo",
  "approvePurchaseOrder",
  "release",
  "releasePo",
  "isApproved",
] as const;

export type PoSendPayFlag = (typeof PO_SEND_PAY_FLAGS)[number];

const FORBIDDEN_EXPENSE = /workers?\s*comp|\bicare\b|\bpayroll\b|\btax\b/i;
const DRAFT_STATUS = /draft/i;
const NON_DRAFT_STATUS = /approv|releas|sent|paid|closed|void|cancel/i;

export function seedFromPoGet(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw);
  const data = asRecord(root.data ?? root);
  if (data.purchaseOrder && typeof data.purchaseOrder === "object" && !Array.isArray(data.purchaseOrder)) {
    return asRecord(data.purchaseOrder);
  }
  return data;
}

export function poIdFrom(payload: unknown): number | undefined {
  const data = seedFromPoGet(payload);
  return numberish(data.id) ?? numberish(data.purchaseOrderId);
}

export function poStatusText(current: Record<string, unknown>): string {
  const nested = asRecord(current.purchaseOrderStatus ?? current.status);
  return String(
    current.statusText ??
      nested.statusText ??
      nested.name ??
      (typeof current.status === "string" ? current.status : "") ??
      "",
  );
}

export function assertExistingPoIsDraft(current: Record<string, unknown>): void {
  const text = poStatusText(current);
  if (text && NON_DRAFT_STATUS.test(text) && !DRAFT_STATUS.test(text)) {
    throw new GatewayError(
      "send_disabled",
      "pos.update only writes Draft purchase orders. This PO is not Draft.",
      { statusText: text },
    );
  }
  const approval = numberish(current.approvalStatus);
  if (approval != null && approval !== 0) {
    throw new GatewayError(
      "send_disabled",
      "pos.update only writes Draft purchase orders. Do not approve.",
      { approvalStatus: approval },
    );
  }
}

export function assertPoSendPayLocked(args: Record<string, unknown>, source = "args"): void {
  const raised = PO_SEND_PAY_FLAGS.filter((flag) => args[flag] === true);
  if (raised.length) {
    throw new GatewayError(
      "send_disabled",
      `PO send/approve/release/pay flags stay locked: ${raised.join(", ")}. Force Draft; saveAndRelease stays false.`,
      { flags: raised, source },
    );
  }
}

function textBlobs(args: Record<string, unknown>, current: Record<string, unknown>): string[] {
  const blobs: string[] = [];
  for (const key of ["title", "purchaseOrderName", "internalNotes", "scopeOfWork", "disclaimer"] as const) {
    if (typeof args[key] === "string") blobs.push(args[key] as string);
    if (typeof current[key] === "string") blobs.push(current[key] as string);
  }
  for (const line of [
    ...asRows(args.lineItems),
    ...asRows(args.purchaseOrderLineItems),
    ...asRows(current.lineItems),
    ...asRows(current.purchaseOrderLineItems),
  ]) {
    blobs.push(String(line.title ?? ""), String(line.description ?? ""), String(line.itemTitle ?? ""));
  }
  return blobs;
}

export function assertProjectExpenseOnly(
  args: Record<string, unknown>,
  current: Record<string, unknown> = {},
): void {
  const hit = textBlobs(args, current).find((text) => FORBIDDEN_EXPENSE.test(text));
  if (hit) {
    throw new GatewayError(
      "validation",
      "Purchase orders are project expenses only. Never workers comp / icare / tax / payroll.",
      { matched: hit.slice(0, 80) },
    );
  }
}

function overlaySafeDraftFields(
  current: Record<string, unknown>,
  args: Record<string, unknown>,
): Record<string, unknown> {
  const fromBody = asRecord(args.body);
  const overlay: Record<string, unknown> = {};
  for (const key of PO_SAFE_DRAFT_KEYS) {
    if (fromBody[key] !== undefined) overlay[key] = fromBody[key];
    if (args[key] !== undefined) overlay[key] = args[key];
  }
  const lineItems = Array.isArray(overlay.lineItems)
    ? overlay.lineItems
    : Array.isArray(current.lineItems)
      ? current.lineItems
      : undefined;
  const poLines = Array.isArray(overlay.purchaseOrderLineItems)
    ? overlay.purchaseOrderLineItems
    : Array.isArray(current.purchaseOrderLineItems)
      ? current.purchaseOrderLineItems
      : undefined;
  if (lineItems !== undefined) overlay.lineItems = lineItems;
  if (poLines !== undefined) overlay.purchaseOrderLineItems = poLines;
  return overlay;
}

function lockPoDraftFlags(body: Record<string, unknown>): Record<string, unknown> {
  body.saveAndRelease = false;
  for (const flag of PO_SEND_PAY_FLAGS) {
    if (flag in body) body[flag] = false;
  }
  if ("approvalStatus" in body) body.approvalStatus = 0;
  const text = poStatusText(body);
  if (text && NON_DRAFT_STATUS.test(text) && !DRAFT_STATUS.test(text)) {
    if (typeof body.status === "string") body.status = "Draft";
    if (typeof body.statusText === "string") body.statusText = "Draft";
    const nested = asRecord(body.purchaseOrderStatus ?? body.status);
    if (nested.statusText) {
      body.purchaseOrderStatus = { ...nested, statusText: "Draft" };
    }
  }
  return body;
}

/**
 * PUT /api/PurchaseOrders/{id} Save-draft body.
 * Starts from GET, overlays safe draft fields, forces Draft / saveAndRelease false.
 */
export function poSaveDraftPayload(
  args: Record<string, unknown>,
  currentRaw: unknown,
  purchaseOrderId: number,
): Record<string, unknown> {
  assertPoSendPayLocked(args);
  const current = seedFromPoGet(currentRaw);
  assertExistingPoIsDraft(current);
  assertProjectExpenseOnly(args, current);
  const overlay = overlaySafeDraftFields(current, args);
  const body: Record<string, unknown> = {
    ...current,
    ...overlay,
    id: numberish(current.id) ?? purchaseOrderId,
    purchaseOrderId: numberish(current.purchaseOrderId) ?? purchaseOrderId,
    saveAndRelease: false,
  };
  return lockPoDraftFlags(body);
}
