import { describe, expect, it } from "vitest";
import { CONTENT_JSON } from "../src/adapter.js";
import { GatewayError } from "../src/errors.js";
import { buildJobPickerSelectBody, pickerSelectionFromPayload } from "../src/job-picker.js";
import { createHarness } from "./helpers.js";

const JOB_ID = 200001;

describe("jobs.picker.select", () => {
  it("does not return the unselected placeholder when sessionJobInfo has the job", async () => {
    const { invoke, calls } = createHarness(async (req) => {
      if (req.path === "/api/jobpicker/GetExistingJobList") {
        return {
          status: 200,
          contentType: CONTENT_JSON,
          json: { success: true, data: { jobs: [{ jobID: JOB_ID, jobName: "Sandbox Job", jobNumber: "SB-1" }] } },
        };
      }
      if (req.path === "/api/jobpicker/SetJobPickerData") {
        return {
          status: 200,
          contentType: CONTENT_JSON,
          json: {
            success: true,
            message: "",
            sessionJobInfo: { jobId: JOB_ID, jobName: "Sandbox Job", jobNumber: "SB-1" },
            data: "Please select a job",
          },
        };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
    });

    const result = await invoke("jobs.picker.select", { jobId: JOB_ID });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      selected: true,
      jobId: JOB_ID,
      jobName: "Sandbox Job",
      jobNumber: "SB-1",
    });
    expect(JSON.stringify(result.data)).not.toMatch(/Please select a job/i);
    const sets = calls.filter((c) => c.path === "/api/jobpicker/SetJobPickerData");
    expect(sets).toHaveLength(1);
    expect(sets[0]?.json).toMatchObject({ jobID: JOB_ID, jobId: JOB_ID, selectedJobId: JOB_ID });
  });

  it("retries SetJobPickerData as [jobId] when the object body leaves the picker unselected", async () => {
    const { invoke, calls } = createHarness(async (req) => {
      if (req.path === "/api/jobpicker/GetExistingJobList") {
        return {
          status: 200,
          contentType: CONTENT_JSON,
          json: { success: true, data: { jobs: [{ jobID: JOB_ID, jobName: "Sandbox Job" }] } },
        };
      }
      if (req.path === "/api/jobpicker/SetJobPickerData") {
        if (Array.isArray(req.json)) {
          return {
            status: 200,
            contentType: CONTENT_JSON,
            json: {
              success: true,
              sessionJobInfo: { jobId: JOB_ID, jobName: "Sandbox Job" },
              data: { jobID: JOB_ID, jobName: "Sandbox Job" },
            },
          };
        }
        return {
          status: 200,
          contentType: CONTENT_JSON,
          json: { success: true, sessionJobInfo: null, data: "Please select a job" },
        };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: {} } };
    });

    const result = await invoke("jobs.picker.select", { jobID: JOB_ID });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ selected: true, jobId: JOB_ID, requestShape: "array" });
    const sets = calls.filter((c) => c.path === "/api/jobpicker/SetJobPickerData");
    expect(sets).toHaveLength(2);
    expect(sets[1]?.json).toEqual([JOB_ID]);
  });

  it("accepts jobsiteId / id aliases and requires a job id", async () => {
    const { invoke } = createHarness(async (req) => {
      if (req.path === "/api/jobpicker/SetJobPickerData") {
        return {
          status: 200,
          contentType: CONTENT_JSON,
          json: {
            success: true,
            sessionJobInfo: { jobId: JOB_ID, jobName: "Sandbox Job" },
            data: { jobID: JOB_ID },
          },
        };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: { jobs: [] } } };
    });

    const aliased = await invoke("jobs.picker.select", { jobsiteId: JOB_ID });
    expect(aliased.ok).toBe(true);
    expect((aliased.data as { jobId: number }).jobId).toBe(JOB_ID);

    await expect(invoke("jobs.picker.select", {})).rejects.toBeInstanceOf(GatewayError);
    await expect(invoke("jobs.picker.select", {})).rejects.toMatchObject({ code: "validation" });
  });

  it("parses the placeholder string as unselected unless sessionJobInfo is set", () => {
    const unselected = pickerSelectionFromPayload(
      { success: true, data: "Please select a job", sessionJobInfo: null },
      [JOB_ID],
      "object",
    );
    expect(unselected.selected).toBe(false);

    const selected = pickerSelectionFromPayload(
      {
        success: true,
        data: "Please select a job",
        sessionJobInfo: { jobId: JOB_ID, jobName: "Sandbox Job" },
      },
      [JOB_ID],
      "object",
    );
    expect(selected.selected).toBe(true);
    expect(selected.jobId).toBe(JOB_ID);
  });

  it("retries when BT returns success=false with the placeholder message", async () => {
    const { invoke, calls } = createHarness(async (req) => {
      if (req.path === "/api/jobpicker/SetJobPickerData") {
        if (Array.isArray(req.json)) {
          return {
            status: 200,
            contentType: CONTENT_JSON,
            json: {
              success: true,
              sessionJobInfo: { jobId: JOB_ID, jobName: "Sandbox Job" },
              data: { jobID: JOB_ID },
            },
          };
        }
        return {
          status: 200,
          contentType: CONTENT_JSON,
          json: { success: false, message: "Please select a job", data: null },
        };
      }
      return { status: 200, contentType: CONTENT_JSON, json: { success: true, data: { jobs: [] } } };
    });

    const result = await invoke("jobs.picker.select", { id: JOB_ID });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ selected: true, jobId: JOB_ID, requestShape: "array" });
    expect(calls.filter((c) => c.path === "/api/jobpicker/SetJobPickerData")).toHaveLength(2);
  });

  it("includes jobID on the object body (GetExistingJobList field name)", () => {
    expect(buildJobPickerSelectBody([JOB_ID], { jobID: JOB_ID, jobName: "Sandbox Job" })).toMatchObject({
      jobID: JOB_ID,
      jobId: JOB_ID,
      jobIds: [JOB_ID],
      selectedJobId: JOB_ID,
      jobName: "Sandbox Job",
    });
  });
});
