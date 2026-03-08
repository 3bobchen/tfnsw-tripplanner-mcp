import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TfNSWClient } from "../api-client.js";

interface StopFinderLocation {
  id?: string;
  name?: string;
  disassembledName?: string;
  type?: string;
  coord?: number[];
  productClasses?: number[];
  modes?: number[];
  parent?: { name?: string };
}

const MODE_NAMES: Record<number, string> = {
  1: "Train",
  4: "Light Rail",
  5: "Bus",
  7: "Coach",
  9: "Ferry",
  11: "School Bus",
};

export function registerStopFinder(server: McpServer, client: TfNSWClient) {
  server.tool(
    "tfnsw_stop_finder",
    "Search for public transport stops, stations, platforms, or points of interest in NSW by name or keyword. Returns matching locations with IDs (needed for other tools), coordinates, and available transport modes.",
    {
      query: z.string().describe("Search term (e.g. 'Central Station', 'Circular Quay', 'Town Hall')"),
      maxResults: z.number().optional().default(10).describe("Maximum results to return (default 10)"),
    },
    async ({ query, maxResults }) => {
      const data = (await client.request("stop_finder", {
        type_sf: "any",
        name_sf: query,
        TfNSWSF: true,
        anyMaxSizeHitList: maxResults,
      })) as { locations?: StopFinderLocation[] };

      const locations = data.locations ?? [];
      if (locations.length === 0) {
        return { content: [{ type: "text", text: `No stops found for "${query}".` }] };
      }

      const results = locations.map((loc) => {
        const modes = (loc.productClasses ?? loc.modes ?? [])
          .map((m) => MODE_NAMES[m] ?? `Mode ${m}`)
          .join(", ");
        const coord =
          loc.coord && loc.coord.length === 2
            ? `${loc.coord[0]}, ${loc.coord[1]}`
            : "N/A";
        const parent = loc.parent?.name ? ` (${loc.parent.name})` : "";
        return `- **${loc.name ?? loc.disassembledName ?? "Unknown"}**${parent}\n  ID: \`${loc.id}\` | Type: ${loc.type ?? "unknown"} | Coords: ${coord}\n  Modes: ${modes || "N/A"}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${locations.length} result(s) for "${query}":\n\n${results.join("\n\n")}`,
          },
        ],
      };
    }
  );
}
