# Pugi GlitchTip MCP

A local, read-only MCP connector for the GlitchTip instance at `errors.pugi.dev`. It uses GlitchTip's documented REST API and official MCP TypeScript SDK over stdio. It does not require a paid host or a hosted MCP endpoint.

## Requirements

- Node.js 20 or newer
- Network access to `errors.pugi.dev`
- A GlitchTip account and the Basic Auth credentials for the site

## Configure credentials

From this directory:

```sh
cp .env.example .env
chmod 600 .env
```

Fill in `GLITCHTIP_BASIC_AUTH_PASSWORD`, `GLITCHTIP_EMAIL`, and `GLITCHTIP_PASSWORD` in `.env`. Keep `.env` on the local machine; it is ignored by Git. The server holds its login session in memory and never writes credentials, cookies, or API responses to stderr. Issue and event details are returned to the MCP client when requested.

Install dependencies once:

```sh
npm install
```

Check the client locally:

```sh
npm test
npm run typecheck
```

## Connect an MCP client

The server uses the standard local stdio transport. Add an entry to the MCP client's server configuration, replacing the placeholder with the absolute path to `run.sh`:

```json
{
  "mcpServers": {
    "pugi-glitchtip": {
      "command": "/absolute/path/to/glitchtip-mcp/run.sh"
    }
  }
}
```

Restart or reload the MCP client after saving the configuration. The client starts the server locally; `.env` supplies its credentials.

For Codex, add this to `.codex/config.toml` or `~/.codex/config.toml`:

```toml
[mcp_servers.pugi-glitchtip]
command = "/absolute/path/to/glitchtip-mcp/run.sh"
```

## Available tools

- `list_organizations`
- `list_projects` (optionally scoped by organization)
- `list_issues` (defaults to `is:unresolved`, capped at 100 results)
- `get_issue`
- `get_latest_event`

All tools are read-only. The MCP server does not resolve issues, add comments, change settings, or create tokens.
