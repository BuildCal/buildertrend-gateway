/**
 * Invented secrets for list/get and form-defaults tests.
 * Do not replace with live values.
 */
import {
  FAKE_BASE64_TOKEN,
  FAKE_DATADOG_TOKEN,
  FAKE_GOOGLE_MAPS_KEY,
  FAKE_HEX_TOKEN,
  FAKE_JWT,
  FAKE_LICENSE_KEY,
  FAKE_SALESFORCE_PEM,
} from "./session-status-secrets.js";

export {
  FAKE_BASE64_TOKEN,
  FAKE_DATADOG_TOKEN,
  FAKE_GOOGLE_MAPS_KEY,
  FAKE_HEX_TOKEN,
  FAKE_JWT,
  FAKE_LICENSE_KEY,
  FAKE_SALESFORCE_PEM,
};

/** Token-shaped strings that must never appear in a verb result. */
export const FAKE_SECRET_STRINGS = [
  FAKE_SALESFORCE_PEM,
  FAKE_GOOGLE_MAPS_KEY,
  FAKE_DATADOG_TOKEN,
  FAKE_LICENSE_KEY,
  FAKE_JWT,
  FAKE_HEX_TOKEN,
  FAKE_BASE64_TOKEN,
  "not-a-real-password",
];

/** Secret-named fields plus token-shaped values on otherwise ordinary keys. */
export function fakeSecretFields(): Record<string, unknown> {
  return {
    googleMapsApiKey: FAKE_GOOGLE_MAPS_KEY,
    salesforcePrivateKey: FAKE_SALESFORCE_PEM,
    datadogClientToken: FAKE_DATADOG_TOKEN,
    licenceKey: FAKE_LICENSE_KEY,
    mixpanelToken: FAKE_HEX_TOKEN,
    apiToken: FAKE_BASE64_TOKEN,
    jwt: FAKE_JWT,
    password: "not-a-real-password",
    secret: FAKE_HEX_TOKEN,
    note: FAKE_JWT,
    extra: FAKE_SALESFORCE_PEM,
    hexBlob: FAKE_HEX_TOKEN,
    b64Blob: FAKE_BASE64_TOKEN,
    mapsHint: FAKE_GOOGLE_MAPS_KEY,
  };
}

export const FAKE_LIST_ROW_WITH_SECRETS = {
  id: 101,
  jobName: "Sample job",
  jobNumber: "SJ-1",
  status: "Open",
  title: "Sample row",
  ...fakeSecretFields(),
};

export const FAKE_JOBS_GRID_WITH_SECRETS = {
  success: true,
  data: {
    rows: [FAKE_LIST_ROW_WITH_SECRETS],
  },
};

export const FAKE_PICKER_LIST_WITH_SECRETS = {
  success: true,
  data: {
    rows: [FAKE_LIST_ROW_WITH_SECRETS],
  },
};

export const FAKE_EXISTING_JOBS_WITH_SECRETS = {
  success: true,
  data: {
    jobs: [FAKE_LIST_ROW_WITH_SECRETS],
  },
};

export const FAKE_JOB_GET_WITH_SECRETS = {
  success: true,
  data: {
    id: 101,
    jobName: "Sample job",
    jobNumber: "SJ-1",
    status: "Open",
    ...fakeSecretFields(),
  },
};

export const FAKE_LEADS_DEFAULTS_WITH_SECRETS = {
  success: true,
  data: {
    assignedTo: { options: [{ id: 7, name: "Sample user" }] },
    defaultStatus: "New",
    ...fakeSecretFields(),
  },
};

export const FAKE_BILLS_DEFAULTS_WITH_SECRETS = {
  success: true,
  data: {
    customFields: [{ id: 1, name: "Sample field", value: null }],
    lienWaiverFormId: 42,
    ...fakeSecretFields(),
  },
};
