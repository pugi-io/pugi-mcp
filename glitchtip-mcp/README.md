# Pugi GlitchTip MCP

A local, read-only MCP connector for the GlitchTip instance at `errors.pugi.dev`. It uses GlitchTip's documented REST API and official MCP TypeScript SDK over stdio. It does not require a paid host or a hosted MCP endpoint.

## Requirements

- Node.js 20.6 or newer (the launcher uses Node's `--env-file` option)
- Network access to `errors.pugi.dev`
- A GlitchTip account and the site's HTTP Basic Auth credentials

## Configure credentials

From this directory:

```sh
cp .env.example .env
chmod 600 .env
```

In `.env`, set the site's `GLITCHTIP_BASIC_AUTH_USERNAME` and `GLITCHTIP_BASIC_AUTH_PASSWORD`, then the GlitchTip account's `GLITCHTIP_EMAIL` and `GLITCHTIP_PASSWORD`. The example username is `pugi`; change it if your Basic Auth username differs. Keep `.env` on the local machine; it is ignored by Git.

The server holds its login session in memory. It does not write credentials, cookies, or API responses to stderr. Issue and event details are returned to the MCP client when requested. The login flow does not handle an MFA challenge.

Install dependencies once:

```sh
npm ci
```

Start the server locally to check that its configuration loads:

```sh
./run.sh
```

It prints a startup message to stderr and waits for an MCP client on stdin. Stop it with `Ctrl+C`.

Check the client locally:

```sh
npm test
npm run typecheck
npm run coverage
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

All tools are read-only. The MCP server does not resolve issues, add comments, change settings, or create tokens. If authentication fails, check both pairs of credentials and confirm that the account can sign in without an MFA challenge.
