# Pugi MCP server

Your AI product team: build websites and web apps, design logos, check security, publish.

Pugi is an AI product team you can call from any MCP client (ChatGPT, Claude, Claude Code, Cursor and others). Describe a business or an idea in your own words and Pugi designs, writes and builds it: a website, or a web app with accounts, a database and payments. You see the progress and a live preview while it works, ask for changes in plain words, and publish it to its own pugi.app address when you are ready.

- **Websites and web apps** from a brief, with real sections, photos and the owner's own facts; edits in plain words; one-step publishing.
- **Logos and brand kits**: a short brand interview, four whole logo options, refinements, PNG files and a short brand book.
- **Security checks**: grade a public website from A+ to F (HTTPS, security headers, exposed keys) and scan a public GitHub repository for leaked secrets, vulnerable dependencies and risky code.
- **Your workspace in the chat**: open a project with its preview, code, design and security results without leaving the conversation (in clients that support MCP Apps).
- **Catalogue**: search sites built with Pugi to start from.

Sign in once with your Pugi account (OAuth). The client asks you before any step that builds, publishes or uses your plan. Free plan available.

This is Pugi's hosted (remote) MCP server: connect any MCP client to it and sign in with your Pugi account. Nothing runs on your machine.

- **URL:** `https://api.pugi.io/api/agent/v1/mcp`
- **Transport:** Streamable HTTP
- **Auth:** OAuth 2.1 with dynamic client registration. The first tool call opens a Pugi sign-in page; no API key to paste.

## Tools (16)

| Tool | What it does |
|---|---|
| `build_site` | Builds a website from a plain-language brief, with a live preview |
| `build_app` | Builds a web app: accounts, saved data, uploads, AI features, payments |
| `edit` | Changes a site or app Pugi built, in plain words |
| `job_status` | Follows a build or change and returns its preview and result |
| `publish` | Puts the site or app live on its own pugi.app address |
| `publish_status` | Lists your published sites and their addresses |
| `my_sites` | Finds a site or app you built earlier |
| `open_project` | Opens a project with its preview, code, design and security results |
| `make_logo` | Short brand interview, then four whole logo options |
| `refine_logo` | Changes or redoes the logos shown (colours, style, layout) |
| `select_logo` | Keeps the logo you chose and opens its brand kit |
| `scan_url` | Security check of a public website, graded A+ to F |
| `scan_repo` | Checks a public GitHub repository for leaked secrets, vulnerable dependencies and risky code |
| `catalog_search` | Finds sites built with Pugi to start from |
| `get_balance` | Shows your plan and remaining credit |
| `buy_credits_link` | Gives a link a person can open to add credit |

Every tool carries MCP annotations (read-only, destructive, idempotent, open-world).

## Local GlitchTip connector

This repository also contains a separate local, read-only connector for Pugi's GlitchTip instance. It uses stdio and your local credentials; it is not part of the hosted Pugi MCP service described above. See [`glitchtip-mcp/README.md`](glitchtip-mcp/README.md) for setup and client configuration.

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
- Support: https://pugi.io/support · support@pugi.io

Also listed in the official MCP Registry as `io.pugi/pugi`.

## License

MIT for the files in this repository. The Pugi service is covered by its terms.
