import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { GlitchTipClient, readGlitchTipConfig } from "./glitchtip-client.js";

const server = new McpServer({ name: "pugi-glitchtip", version: "0.1.0" });
const client = new GlitchTipClient(readGlitchTipConfig());
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true };

function registerJsonTool(
  name: string,
  description: string,
  inputSchema: z.ZodType,
  run: (input: Record<string, unknown>) => Promise<unknown>,
): void {
  server.registerTool(name, { description, inputSchema, annotations: readOnly }, async (input) => {
    try {
      const data = await run(input as Record<string, unknown>);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected GlitchTip MCP error.";
      return { content: [{ type: "text", text: message }], isError: true };
    }
  });
}

registerJsonTool(
  "list_organizations",
  "List GlitchTip organizations available to the configured account.",
  z.object({}),
  () => client.getJson("/api/0/organizations/"),
);

registerJsonTool(
  "list_projects",
  "List projects accessible to the configured GlitchTip account. Optionally filter by organization slug.",
  z.object({ organizationSlug: z.string().optional() }),
  ({ organizationSlug }) => organizationSlug
    ? client.getJson(`/api/0/organizations/${encodeURIComponent(String(organizationSlug))}/projects/`)
    : client.getJson("/api/0/projects/"),
);

registerJsonTool(
  "list_issues",
  "List issues for one project. Defaults to unresolved issues; use the GlitchTip/Sentry search syntax to change the query.",
  z.object({
    organizationSlug: z.string().min(1),
    projectSlug: z.string().min(1),
    query: z.string().max(300).default("is:unresolved"),
    limit: z.number().int().min(1).max(100).default(25),
  }),
  ({ organizationSlug, projectSlug, query, limit }) => client.getJson(
    `/api/0/projects/${encodeURIComponent(String(organizationSlug))}/${encodeURIComponent(String(projectSlug))}/issues/`,
    { query: String(query), limit: Number(limit) },
  ),
);

registerJsonTool(
  "get_issue",
  "Get the details and current state of one GlitchTip issue by numeric issue ID.",
  z.object({ issueId: z.string().regex(/^\d+$/) }),
  ({ issueId }) => client.getJson(`/api/0/issues/${encodeURIComponent(String(issueId))}/`),
);

registerJsonTool(
  "get_latest_event",
  "Get the latest event and stack trace for a GlitchTip issue by numeric issue ID.",
  z.object({ issueId: z.string().regex(/^\d+$/) }),
  ({ issueId }) => client.getJson(`/api/0/issues/${encodeURIComponent(String(issueId))}/events/latest/`),
);

void serveStdio(() => server);
console.error("Pugi GlitchTip MCP server started on stdio.");
