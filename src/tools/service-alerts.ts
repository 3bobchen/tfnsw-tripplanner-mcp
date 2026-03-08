import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TfNSWClient } from "../api-client.js";

interface InfoMessage {
  subtitle?: string;
  content?: string;
  url?: string;
  priority?: string;
  timestamps?: { validity?: Array<{ from?: string; to?: string }> };
  properties?: {
    appliesTo?: string;
    infoLinks?: Array<{ url?: string; subtitle?: string }>;
    affectedLines?: Array<{ line?: string; direction?: string }>;
    affectedStops?: Array<{ id?: string; name?: string }>;
  };
}

export function registerServiceAlerts(server: McpServer, client: TfNSWClient) {
  server.tool(
    "tfnsw_service_alerts",
    "Get current service alerts and disruptions for NSW public transport. Shows planned works, delays, cancellations, and other disruptions. Can filter by date or stop.",
    {
      date: z.string().optional().describe("Filter by date in DD-MM-YYYY format"),
      stopId: z.string().optional().describe("Filter alerts for a specific stop ID"),
    },
    async ({ date, stopId }) => {
      const params: Record<string, string | number | boolean> = {
        filterPublicationStatus: "current",
      };
      if (date) params.filterDateValid = date;
      if (stopId) params.itdLPxx_selStop = stopId;

      const data = (await client.request("add_info", params)) as {
        infos?: { current?: InfoMessage[] };
      };

      const alerts = data.infos?.current ?? [];
      if (alerts.length === 0) {
        return {
          content: [{ type: "text", text: "No current service alerts." }],
        };
      }

      const results = alerts.slice(0, 20).map((alert) => {
        const title = alert.subtitle ?? "Service Alert";
        const content = alert.content ?? "";
        const priority = alert.priority ? ` [${alert.priority}]` : "";
        const url = alert.url ?? alert.properties?.infoLinks?.[0]?.url ?? "";
        const urlText = url ? `\n  Link: ${url}` : "";
        return `- **${title}**${priority}\n  ${content.slice(0, 200)}${content.length > 200 ? "..." : ""}${urlText}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `${alerts.length} service alert(s):\n\n${results.join("\n\n")}`,
          },
        ],
      };
    }
  );
}
