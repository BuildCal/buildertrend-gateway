/**
 * Realistic *fake* Buildertrend client-settings dump.
 * Values are invented for tests. Do not replace with live secrets.
 */
export const FAKE_SALESFORCE_PEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKFAKESECRETNOTREAL0001forGatewaySessionStatusTestsOnly
-----END RSA PRIVATE KEY-----`;

export const FAKE_GOOGLE_MAPS_KEY = "AIzaSyFakeGatewayTestKey0000001";
export const FAKE_DATADOG_TOKEN = "pub0123456789abcdef0123456789ab";
export const FAKE_LICENSE_KEY = "BT-LIC-FAKE-0000000000000001";
export const FAKE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJidC1nYXRld2F5LXRlc3QifQ.fake-signature-not-real";
export const FAKE_HEX_TOKEN = "0123456789abcdef0123456789abcdef";
export const FAKE_BASE64_TOKEN = "dGhpc2lzYWZha2ViYXNlNjR0b2tlbmZvci10ZXN0cw==";

export const FAKE_INIT_WITH_SECRETS = {
  user: {
    id: 4242,
    userName: "Pat Builder",
    loginName: "pat.builder",
    email: "pat@example.test",
  },
  builder: {
    id: 99999,
    name: "Example Homes",
  },
  currentJob: {
    jobId: 200001,
    jobName: "Sandbox Job",
    jobNumber: "SB-1",
  },
  loginTime: "2026-10-14T04:00:00.000Z",
  expiresAt: "2026-10-15T04:00:00.000Z",
  clientSettings: {
    googleMapsApiKey: FAKE_GOOGLE_MAPS_KEY,
    datadogClientToken: FAKE_DATADOG_TOKEN,
    salesforcePrivateKey: FAKE_SALESFORCE_PEM,
    licenceKey: FAKE_LICENSE_KEY,
    mixpanelToken: FAKE_HEX_TOKEN,
    jwt: FAKE_JWT,
    password: "not-a-real-password",
  },
  appSettings: {
    apiToken: FAKE_BASE64_TOKEN,
    privateKey: FAKE_SALESFORCE_PEM,
  },
  settings: {
    licenseKey: FAKE_LICENSE_KEY,
    secret: FAKE_HEX_TOKEN,
  },
};

export const FAKE_GLOBAL_INFO_WITH_SECRETS = {
  success: true,
  message: "",
  needsToRelogin: false,
  sessionJobInfo: {
    jobId: 200001,
    jobName: "Sandbox Job",
    jobNumber: "SB-1",
  },
  data: {
    builderId: 99999,
    builderName: "Example Homes",
    globalUserId: 4242,
    loginId: 4242,
    loginName: "pat.builder",
    name: "Pat Builder",
    email: "pat@example.test",
    googleMapsApiKey: FAKE_GOOGLE_MAPS_KEY,
    salesforcePrivateKey: FAKE_SALESFORCE_PEM,
    datadogClientToken: FAKE_DATADOG_TOKEN,
    licenceKey: FAKE_LICENSE_KEY,
    apiToken: FAKE_BASE64_TOKEN,
    privateKey: FAKE_SALESFORCE_PEM,
    password: "not-a-real-password",
    secret: FAKE_HEX_TOKEN,
  },
};
