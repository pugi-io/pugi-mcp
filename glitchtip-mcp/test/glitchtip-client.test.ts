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
  const result = await client.getJson("/api/0/organizations/", { limit: 5, skip: undefined });

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
  assert.equal(new URL(requests[2]!.url).searchParams.get("limit"), "5");
});

test("requires HTTPS for the GlitchTip base URL", () => {
  configureEnv();
  process.env.GLITCHTIP_BASE_URL = "http://errors.example.test";

  assert.throws(() => readGlitchTipConfig(), /must use HTTPS/);
});

test("requires every credential setting", () => {
  configureEnv();
  delete process.env.GLITCHTIP_PASSWORD;

  assert.throws(() => readGlitchTipConfig(), /Missing required environment variable GLITCHTIP_PASSWORD/);
});

test("reuses an authenticated GlitchTip session without logging in again", async () => {
  configureEnv();
  const requests: string[] = [];
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push(request.url);
    if (request.url.includes("/auth/session")) {
      return Response.json({ meta: { is_authenticated: true } });
    }
    return Response.json([{ slug: "pugi" }]);
  };

  const result = await new GlitchTipClient(readGlitchTipConfig()).getJson("/api/0/organizations/");

  assert.deepEqual(result, [{ slug: "pugi" }]);
  assert.equal(requests.length, 2);
  assert.ok(requests[0]?.includes("/auth/session"));
  assert.ok(requests[1]?.includes("/api/0/organizations/"));
});

test("reports when GlitchTip does not provide a CSRF cookie", async () => {
  configureEnv();
  globalThis.fetch = async () => Response.json({ meta: { is_authenticated: false } }, { status: 401 });
  const client = new GlitchTipClient(readGlitchTipConfig());

  await assert.rejects(client.getJson("/api/0/organizations/"), /did not provide a CSRF cookie/);
});

test("rejects a GlitchTip login that does not authenticate the account", async () => {
  configureEnv();
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/auth/session")) {
      return Response.json(
        { meta: { is_authenticated: false } },
        { status: 401, headers: { "set-cookie": "csrftoken=csrf-test; Path=/" } },
      );
    }
    return Response.json({ meta: { is_authenticated: false } }, { status: 200 });
  };
  const client = new GlitchTipClient(readGlitchTipConfig());

  await assert.rejects(client.getJson("/api/0/organizations/"), /GlitchTip login failed/);
});

test("renews an expired session once and retries the API request", async () => {
  configureEnv();
  let sessionCount = 0;
  let loginCount = 0;
  let apiCount = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/auth/session")) {
      sessionCount += 1;
      return Response.json(
        { meta: { is_authenticated: false } },
        { status: 401, headers: { "set-cookie": `csrftoken=csrf-${sessionCount}; Path=/` } },
      );
    }
    if (url.includes("/auth/login")) {
      loginCount += 1;
      return Response.json(
        { meta: { is_authenticated: true } },
        { headers: { "set-cookie": `sessionid=session-${loginCount}; Path=/; HttpOnly` } },
      );
    }
    apiCount += 1;
    if (apiCount === 1) return Response.json({ detail: "expired" }, { status: 401 });
    return Response.json([{ slug: "pugi" }]);
  };

  const result = await new GlitchTipClient(readGlitchTipConfig()).getJson("/api/0/organizations/");

  assert.deepEqual(result, [{ slug: "pugi" }]);
  assert.deepEqual({ sessionCount, loginCount, apiCount }, { sessionCount: 2, loginCount: 2, apiCount: 2 });
});

test("returns bounded API failures and rejects non-JSON or oversized responses", async () => {
  configureEnv();
  const responses = [
    Response.json({ detail: "forbidden" }, { status: 403 }),
    new Response("not-json", { status: 200 }),
    new Response("x".repeat(24_001), { status: 200 }),
  ];
  globalThis.fetch = async (input) => {
    if (String(input).includes("/auth/session")) {
      return Response.json(
        { meta: { is_authenticated: false } },
        { status: 401, headers: { "set-cookie": "csrftoken=csrf-test; Path=/" } },
      );
    }
    if (String(input).includes("/auth/login")) {
      return Response.json(
        { meta: { is_authenticated: true } },
        { headers: { "set-cookie": "sessionid=session-test; Path=/" } },
      );
    }
    return responses.shift() ?? Response.json([]);
  };
  const client = new GlitchTipClient(readGlitchTipConfig());

  await assert.rejects(client.getJson("/api/0/organizations/"), /HTTP 403/);
  await assert.rejects(client.getJson("/api/0/organizations/"), /non-JSON content/);
  await assert.rejects(client.getJson("/api/0/organizations/"), /24 KB safety limit/);
});
