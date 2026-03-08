import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TfNSWClient } from "../api-client.js";

interface CoordLocation {
  id?: string;
  name?: string;
  disassembledName?: string;
  type?: string;
  coord?: number[];
  productClasses?: number[];
  modes?: number[];
  matchQuality?: number;
  parent?: { name?: string };
  properties?: { distance?: number | string };
}

const MODE_NAMES: Record<number, string> = {
  1: "Train",
  4: "Light Rail",
  5: "Bus",
  7: "Coach",
  9: "Ferry",
  11: "School Bus",
};

export function registerCoordRequest(server: McpServer, client: TfNSWClient) {
  server.tool(
    "tfnsw_coord_request",
    "Find public transport stops and stations near a geographic coordinate in NSW. Returns nearby locations with names, distances, and available transport modes.",
    {
      latitude: z.number().describe("Latitude (e.g. -33.8688)"),
      longitude: z.number().describe("Longitude (e.g. 151.2093)"),
      radius: z.number().optional().default(1000).describe("Search radius in meters (default 1000)"),
      type: z.enum(["STOP", "GIS_POINT"]).optional().default("STOP").describe("Location type to find"),
    },
    async ({ latitude, longitude, radius, type }) => {
      // TfNSW coord param uses longitude:latitude order
      const data = (await client.request("coord", {
        coord: `${longitude}:${latitude}:EPSG:4326`,
        type_1: type,
        radius_1: radius,
        inclFilter: 1,
      })) as { locations?: CoordLocation[] };

      const locations = data.locations ?? [];
      if (locations.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No stops found within ${radius}m of ${latitude}, ${longitude}.`,
            },
          ],
        };
      }

      const results = locations.map((loc) => {
        const name = loc.name ?? loc.disassembledName ?? "Unknown";
        const parent = loc.parent?.name ? ` (${loc.parent.name})` : "";
        const distance = loc.properties?.distance ? `${loc.properties.distance}m` : "?";
        const modes = (loc.productClasses ?? loc.modes ?? [])
          .map((m) => MODE_NAMES[m] ?? `Mode ${m}`)
          .join(", ");
        const coord =
          loc.coord && loc.coord.length === 2
            ? `${loc.coord[0]}, ${loc.coord[1]}`
            : "N/A";
        return `- **${name}**${parent} — ${distance}\n  ID: \`${loc.id}\` | Coords: ${coord}\n  Modes: ${modes || "N/A"}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `${locations.length} stop(s) within ${radius}m of ${latitude}, ${longitude}:\n\n${results.join("\n\n")}`,
          },
        ],
      };
    }
  );
}
