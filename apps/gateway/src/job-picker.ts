import { unwrapData } from "./adapter.js";
import { GatewayError, isGatewayError } from "./errors.js";
import { asRecord, jobIdsFrom, numberish } from "./grids.js";

export const PICKER_UNSELECTED_LABEL = /please select a job/i;

const JOB_ID_ALIASES = ["jobId", "jobIds", "selectedJobId", "id", "jobsiteId", "jobID"] as const;

export interface PickerSelection {
  selected: boolean;
  jobId?: number;
  jobName?: string;
  jobNumber?: string;
  jobIds: number[];
  requestShape: "object" | "array" | "custom";
}

export function jobIdsFromPickerArgs(args: Record<string, unknown>): number[] {
  const fromGrid = jobIdsFrom(args);
  if (fromGrid.length) return fromGrid;
  for (const key of ["selectedJobId", "id", "jobsiteId", "jobID", "jobId"]) {
    const num = numberish(args[key]);
    if (num != null && num > 0) return [num];
  }
  return [];
}

export function requirePickerJobIds(args: Record<string, unknown>): number[] {
  const ids = jobIdsFromPickerArgs(args);
  if (ids.length) return ids;
  throw new GatewayError(
    "validation",
    `jobId is required. Also accepts ${JOB_ID_ALIASES.filter((k) => k !== "jobId").join(", ")}.`,
  );
}

/**
 * Object body covering the id names BT uses on job rows (`jobID`) plus the
 * camelCase names the previous handler sent. Extra keys are ignored by
 * typical ASP.NET binders; a missing `jobID` was the likely miss.
 */
export function buildJobPickerSelectBody(
  jobIds: number[],
  jobRow?: Record<string, unknown>,
): Record<string, unknown> {
  const jobId = jobIds[0];
  return {
    ...(jobRow ?? {}),
    jobId,
    jobID: jobId,
    id: jobId,
    jobsiteId: jobId,
    selectedJobId: jobId,
    jobIds,
  };
}

function jobFromUnknown(value: unknown): { jobId?: number; jobName?: string; jobNumber?: string } {
  if (typeof value === "string") {
    if (PICKER_UNSELECTED_LABEL.test(value)) return {};
    return { jobName: value };
  }
  const rec = asRecord(value);
  const jobId = numberish(rec.jobId ?? rec.jobID ?? rec.jobsiteId ?? rec.id ?? rec.selectedJobId);
  const jobName = typeof rec.jobName === "string"
    ? rec.jobName
    : typeof rec.selectedJobName === "string"
      ? rec.selectedJobName
      : typeof rec.name === "string"
        ? rec.name
        : undefined;
  const jobNumber = typeof rec.jobNumber === "string" ? rec.jobNumber : undefined;
  const out: { jobId?: number; jobName?: string; jobNumber?: string } = {};
  if (jobId != null && jobId > 0) out.jobId = jobId;
  if (jobName && !PICKER_UNSELECTED_LABEL.test(jobName)) out.jobName = jobName;
  if (jobNumber) out.jobNumber = jobNumber;
  return out;
}

export function isPickerUnselectedPayload(payload: unknown): boolean {
  if (payload == null) return true;
  if (typeof payload === "string") return PICKER_UNSELECTED_LABEL.test(payload);
  const envelope = asRecord(payload);
  const data = unwrapData(payload);
  if (typeof data === "string" && PICKER_UNSELECTED_LABEL.test(data)) {
    return jobFromUnknown(envelope.sessionJobInfo).jobId == null;
  }
  const fromSession = jobFromUnknown(envelope.sessionJobInfo);
  const fromData = jobFromUnknown(data);
  if (fromSession.jobId != null || fromData.jobId != null) return false;
  const blob = `${typeof data === "string" ? data : ""} ${String(fromData.jobName ?? "")} ${String(fromSession.jobName ?? "")}`;
  return PICKER_UNSELECTED_LABEL.test(blob);
}

export function pickerSelectionFromPayload(
  payload: unknown,
  requestedJobIds: number[],
  requestShape: PickerSelection["requestShape"],
  options: { envelopeOnly?: boolean } = {},
): PickerSelection {
  const envelope = asRecord(payload);
  const data = options.envelopeOnly ? undefined : unwrapData(payload);
  const fromSession = jobFromUnknown(envelope.sessionJobInfo);
  const fromData = options.envelopeOnly ? {} : jobFromUnknown(data);
  const jobId = fromSession.jobId ?? fromData.jobId;
  const jobName = fromSession.jobName ?? fromData.jobName;
  const jobNumber = fromSession.jobNumber ?? fromData.jobNumber;
  const unselected = options.envelopeOnly
    ? fromSession.jobId == null
    : isPickerUnselectedPayload(payload);
  const selected = !unselected && jobId != null && jobId > 0;
  return {
    selected,
    jobId: selected ? jobId : undefined,
    jobName: selected ? jobName : undefined,
    jobNumber: selected ? jobNumber : undefined,
    jobIds: requestedJobIds,
    requestShape,
  };
}

export function isPickerUnselectedError(err: unknown): boolean {
  return isGatewayError(err) && err.code === "bt_error" && PICKER_UNSELECTED_LABEL.test(err.message);
}

export function findExistingJobRow(payload: unknown, jobId: number): Record<string, unknown> | undefined {
  const data = asRecord(unwrapData(payload));
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  for (const row of jobs) {
    const rec = asRecord(row);
    const id = numberish(rec.jobID ?? rec.jobId ?? rec.id ?? rec.jobsiteId);
    if (id === jobId) return rec;
  }
  return undefined;
}
