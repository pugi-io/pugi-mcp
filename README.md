# Pugi MCP server

Pugi is an AI product team that builds, checks and publishes websites from a brief. This is its hosted (remote) MCP server: connect any MCP client to it and sign in with your Pugi account. Nothing runs on your machine.

- **URL:** `https://api.pugi.io/api/agent/v1/mcp`
- **Transport:** Streamable HTTP
- **Auth:** OAuth 2.1 with dynamic client registration. The first tool call opens a Pugi sign-in page; no API key to paste.

## Tools

| Tool | What it does |
|---|---|
| `build_site` | Builds a website from a plain-language brief, with a live preview |
| `job_status` | Follows a build and returns its preview and result |
| `edit` | Changes a site Pugi built |
| `publish` | Puts the site live on its own address |
| `publish_status` | Lists your published sites and their addresses |
| `make_logo` | Draws four whole logos for a business name |
| `select_logo` | Keeps the logo you chose and opens its brand kit |
| `scan_url` | Passive security check of a public website, graded A+ to F |
| `scan_repo` | Checks a public GitHub repository for leaked secrets, vulnerable dependencies and risky code |
| `catalog_search` | Finds public sites and templates to start from |
| `get_balance` | Shows your plan and remaining credit |
| `buy_credits_link` | Gives a link a person can open to add credit |

Every tool carries MCP annotations (read-only, destructive, idempotent, open-world).

## Connect

**Claude Code**

```sh
claude mcp add pugi --transport http https://api.pugi.io/api/agent/v1/mcp
```

**Cline, Cursor, VS Code and other clients** (JSON config):

```json
{
  "mcpServers": {
    "pugi": {
      "type": "streamableHttp",
      "url": "https://api.pugi.io/api/agent/v1/mcp"
    }
  }
}
```

Some clients name the type `http` instead of `streamableHttp`.

## Example prompts

- "Build a website for my yoga studio in Lisbon: home, schedule, prices, contact. Calm colours."
- "Is https://example.com secure? Check its headers and give me a grade."
- "Check github.com/acme/shop for leaked secrets and vulnerable dependencies."
- "Make a logo for 'Blue Fern Bakery', warm and hand-drawn, green and cream."

## Links

- Site: https://pugi.io
- Agent guide: https://pugi.io/agents.md
- Plans: https://pugi.io/pricing
- Privacy: https://pugi.io/privacy · Terms: https://pugi.io/terms
- Support: support@pugi.io

Also listed in the official MCP Registry as `io.pugi/pugi`.

## License

MIT for the files in this repository. The Pugi service is covered by its terms.
