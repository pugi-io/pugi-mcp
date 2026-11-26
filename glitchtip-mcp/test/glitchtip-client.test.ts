import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { GlitchTipClient, readGlitchTipConfig } from "../src/glitchtip-client.js";

const envNames = [
  "GLITCHTIP_BASE_URL",
  "GLITCHTIP_BASIC_AUTH_USERNAME",
  "GLITCHTIP_BASIC_AUTH_PASSWORD",
  "GLITCHTIP_EMAIL",
  "GLITCHTIP_PASSWORD",
] as const;

const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const name of envNames) {
    const value = originalEnv[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  globalThis.fetch = originalFetch;
});

function configureEnv(): void {
  process.env.GLITCHTIP_BASE_URL = "https://errors.example.test";
  process.env.GLITCHTIP_BASIC_AUTH_USERNAME = "basic-user";
  process.env.GLITCHTIP_BASIC_AUTH_PASSWORD = "basic-pass";
  process.env.GLITCHTIP_EMAIL = "operator@example.test";
  process.env.GLITCHTIP_PASSWORD = "acct-pass";
}

test("uses the GlitchTip login session with Basic Auth and reads API data", async () => {
  configureEnv();
  const requests: Array<{ url: string; method: string; headers: Headers; body: string | undefined }> = [];

  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push({
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.method === "POST" ? await request.text() : undefined,
    });

    if (request.url.includes("/_allauth/browser/v1/auth/session")) {
      return Response.json(
        { meta: { is_authenticated: false } },
        { status: 401, headers: { "set-cookie": "csrftoken=csrf-test; Path=/; SameSite=Lax" } },
      );
    }
    if (request.url.includes("/_allauth/browser/v1/auth/login")) {
      return Response.json(
        { meta: { is_authenticated: true } },
        { headers: { "set-cookie": "sessionid=session-test; Path=/; HttpOnly; SameSite=Lax" } },
      );
    }
    return Response.json([{ slug: "pugi" }]);
  };

  const client = new GlitchTipClient(readGlitchTipConfig());
  const result = await client.getJson("/api/0/organizations/");

  assert.deepEqual(result, [{ slug: "pugi" }]);
  assert.equal(requests.length, 3);
  const expectedBasic = `Basic ${Buffer.from("basic-user:basic-pass").toString("base64")}`;
  assert.ok(requests.every((request) => request.headers.get("authorization") === expectedBasic));
  assert.equal(requests[1]?.headers.get("x-csrftoken"), "csrf-test");
  assert.deepEqual(JSON.parse(requests[1]?.body ?? "{}"), {
    email: "operator@example.test",
    password: "acct-pass",
  });
  assert.equal(requests[2]?.headers.get("cookie"), "csrftoken=csrf-test; sessionid=session-test");
});

test("requires HTTPS for the GlitchTip base URL", () => {
  configureEnv();
  process.env.GLITCHTIP_BASE_URL = "http://errors.example.test";

  assert.throws(() => readGlitchTipConfig(), /must use HTTPS/);
});
