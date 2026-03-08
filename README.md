# TfNSW Trip Planner MCP Server

This project lets you ask Claude (Anthropic's AI assistant) about real-time NSW public transport — things like trip planning, live departures, and service alerts — by connecting it to the [Transport for NSW Open Data](https://opendata.transport.nsw.gov.au/) APIs.

It works as an **MCP server**, which is a way to give Claude access to external tools and data sources.

## What can it do?

Once set up, you can ask Claude things like:

- "When is the next train from Central to Parramatta?"
- "Are there any service alerts on the T1 line?"
- "What buses leave from Town Hall in the next 30 minutes?"
- "Plan a trip from Bondi Junction to Circular Quay"
- "What stops are near me?" (using coordinates)

Behind the scenes, Claude uses these tools:

| Tool | What it does |
|------|-------------|
| `tfnsw_stop_finder` | Searches for stops, stations, and places by name |
| `tfnsw_trip` | Plans a journey between two locations |
| `tfnsw_departures` | Shows the live departure board for a stop |
| `tfnsw_service_alerts` | Shows current service disruptions and alerts |
| `tfnsw_coord_request` | Finds stops near a geographic coordinate |

## Prerequisites

- **Node.js** (version 18 or higher) — [download here](https://nodejs.org/) if you don't have it. To check, run `node --version` in your terminal.
- **Claude Desktop** or **Claude Code** — you'll connect the server to one of these.

## Setup

### Get a free TfNSW API key

You need an API key to access Transport for NSW data. It's free.

1. Go to [opendata.transport.nsw.gov.au](https://opendata.transport.nsw.gov.au/)
2. Click **Sign up** (top-right) and create an account
3. Once logged in, click **your username** in the top-right header
4. Click the **API tokens** tab
5. Copy your API key — you'll use it below

### Add to Claude

Choose **one** of the options below depending on which Claude app you use. Replace `your_key` with the API key you copied above.

#### Option A: Claude Code (terminal)

```bash
claude mcp add tfnsw-tripplanner -e TFNSW_API_KEY=your_key -- npx tfnsw-tripplanner-mcp
```

#### Option B: Claude Desktop (app)

Open the Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the following (replace `your_key` with your actual API key):

```json
{
  "mcpServers": {
    "tfnsw-tripplanner": {
      "command": "npx",
      "args": ["tfnsw-tripplanner-mcp"],
      "env": {
        "TFNSW_API_KEY": "your_key"
      }
    }
  }
}
```

Restart Claude Desktop after saving the file.

That's it — no need to clone or build anything. `npx` will download and run the server automatically.
