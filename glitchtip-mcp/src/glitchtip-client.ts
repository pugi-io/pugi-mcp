type GlitchTipConfig = {
  baseUrl: URL;
  basicAuthUsername: string;
  basicAuthPassword: string;
  email: string;
  password: string;
};

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type AuthResponse = {
  meta?: { is_authenticated?: boolean };
};

const SESSION_PATH = "/_allauth/browser/v1/auth/session?client=browser";
const LOGIN_PATH = "/_allauth/browser/v1/auth/login?client=browser";
const MAX_RESPONSE_BYTES = 24_000;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`);
  }
  return value;
}

export function readGlitchTipConfig(): GlitchTipConfig {
  const baseUrl = new URL(process.env.GLITCHTIP_BASE_URL?.trim() || "https://errors.pugi.dev");
  if (baseUrl.protocol !== "https:") {
    throw new Error("GLITCHTIP_BASE_URL must use HTTPS.");
  }
  if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new Error("GLITCHTIP_BASE_URL must be an origin or path without credentials, query, or fragment.");
  }

  return {
    baseUrl,
    basicAuthUsername: requiredEnv("GLITCHTIP_BASIC_AUTH_USERNAME"),
    basicAuthPassword: requiredEnv("GLITCHTIP_BASIC_AUTH_PASSWORD"),
    email: requiredEnv("GLITCHTIP_EMAIL"),
    password: requiredEnv("GLITCHTIP_PASSWORD"),
  };
}

export class GlitchTipClient {
  private readonly cookies = new Map<string, string>();
  private loginPromise: Promise<void> | undefined;

  constructor(private readonly config: GlitchTipConfig) {}

  async getJson(path: string, params: Record<string, string | number | undefined> = {}): Promise<JsonValue> {
    await this.ensureAuthenticated();

    const url = new URL(path, this.config.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let response = await this.fetchWithAuth(url);
    if (response.status === 401) {
      this.loginPromise = undefined;
      this.cookies.delete("sessionid");
      await this.ensureAuthenticated();
      response = await this.fetchWithAuth(url);
    }
    if (!response.ok) {
      throw new Error(`GlitchTip API request failed with HTTP ${response.status}.`);
    }
    return this.readJson(response);
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.loginPromise) return this.loginPromise;

    this.loginPromise = this.login();
    try {
      await this.loginPromise;
    } catch (error) {
      this.loginPromise = undefined;
      throw error;
    }
  }

  private async login(): Promise<void> {
    const sessionResponse = await this.fetchWithAuth(new URL(SESSION_PATH, this.config.baseUrl));
    const session = await this.readJson(sessionResponse) as AuthResponse;
    if (session.meta?.is_authenticated) return;

    const csrfToken = this.cookies.get("csrftoken");
    if (!csrfToken) {
      throw new Error("GlitchTip did not provide a CSRF cookie for login.");
    }

    const loginResponse = await this.fetchWithAuth(new URL(LOGIN_PATH, this.config.baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrftoken": csrfToken,
        referer: new URL("/login", this.config.baseUrl).toString(),
      },
      body: JSON.stringify({ email: this.config.email, password: this.config.password }),
    });
    const login = await this.readJson(loginResponse) as AuthResponse;
    if (!loginResponse.ok || !login.meta?.is_authenticated) {
      throw new Error("GlitchTip login failed. Check the credentials or account MFA requirements.");
    }
  }

  private async fetchWithAuth(url: URL, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${this.config.basicAuthUsername}:${this.config.basicAuthPassword}`).toString("base64")}`,
    );
    const cookieHeader = [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
    if (cookieHeader) headers.set("cookie", cookieHeader);

    const response = await fetch(url, { ...init, headers, redirect: "error" });
    this.storeCookies(response);
    return response;
  }

  private storeCookies(response: Response): void {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = headers.getSetCookie?.() ?? splitSetCookieHeader(headers.get("set-cookie"));
    for (const cookie of cookies) {
      const pair = cookie.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator < 1) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
  }

  private async readJson(response: Response): Promise<JsonValue> {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
      throw new Error("GlitchTip returned a response larger than the 24 KB safety limit.");
    }
    try {
      return JSON.parse(text) as JsonValue;
    } catch {
      throw new Error(`GlitchTip returned non-JSON content (HTTP ${response.status}).`);
    }
  }
}

function splitSetCookieHeader(value: string | null): string[] {
  if (!value) return [];
  return value.split(/,(?=\s*[^;,=\s]+=[^;,]*)/g);
}
