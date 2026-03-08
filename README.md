# TfNSW Trip Planner MCP Server

An MCP server that provides access to Transport for NSW Trip Planner APIs, giving Claude real-time NSW public transport data.

## Tools

| Tool | Description |
|------|-------------|
| `tfnsw_stop_finder` | Search for stops, stations, and POIs by name |
| `tfnsw_trip` | Plan a journey between two locations |
| `tfnsw_departures` | Real-time departure board for a stop |
| `tfnsw_service_alerts` | Current service disruptions and alerts |
| `tfnsw_coord_request` | Find stops near a geographic coordinate |

## Setup

### 1. Get an API Key

Register at [TfNSW Open Data](https://opendata.transport.nsw.gov.au/) and create an application with the Trip Planner API enabled.

### 2. Install & Build

```bash
cd tfnsw-tripplanner-mcp
npm install
npm run build
```

### 3. Configure API Key

```bash
cp .env.example .env
# Edit .env and add your API key
```

Or pass it as an environment variable when running.

### 4. Add to Claude Code

```bash
claude mcp add tfnsw-tripplanner -e TFNSW_API_KEY=your_key -- node /path/to/tfnsw-tripplanner-mcp/build/index.js
```

### 5. Add to Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tfnsw-tripplanner": {
      "command": "node",
      "args": ["/path/to/tfnsw-tripplanner-mcp/build/index.js"],
      "env": {
        "TFNSW_API_KEY": "your_key"
      }
    }
  }
}
```

## Development

```bash
npm run dev       # Watch mode
npm run inspect   # MCP Inspector
```
