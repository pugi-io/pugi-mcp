# Installing the Pugi MCP server (for AI agents such as Cline)

Pugi is a hosted remote MCP server. There is nothing to clone, build or run locally, and no API key or environment variable is needed.

1. Add this entry to the MCP settings (for Cline: `cline_mcp_settings.json`, under `mcpServers`):

```json
"pugi": {
  "type": "streamableHttp",
  "url": "https://api.pugi.io/api/agent/v1/mcp",
  "disabled": false
}
```

2. Save the settings. The server connects and lists 16 tools.
3. The first tool that needs an account opens a Pugi sign-in page in the browser (OAuth). The user signs in or creates a Pugi account there and clicks Allow. Do not ask the user for a password or token.
4. Verify with a free read-only call: `scan_url` with `{"url": "https://example.com"}` returns a security grade.

Notes: builds and edits take several minutes; call `job_status` with the returned `job_id` about once a minute until the state is final. Paid tools spend prepaid credit or the plan allowance; nothing charges a card by itself.
