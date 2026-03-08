import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TfNSWClient } from "../api-client.js";

interface StopEvent {
  departureTimePlanned?: string;
  departureTimeEstimated?: string;
  isRealtimeControlled?: boolean;
  transportation?: {
    number?: string;
    description?: string;
    product?: { name?: string; class?: number };
    destination?: { name?: string };
    origin?: { name?: string };
  };
  location?: { name?: string; id?: string };
  infos?: Array<{ subtitle?: string; content?: string }>;
}

function formatTime(planned?: string, estimated?: string): string {
  const fmt = (iso?: string) => {
    if (!iso) return "?";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
  };
  const p = fmt(planned);
  if (!estimated || planned === estimated) return p;
  const e = fmt(estimated);
  // Calculate delay
  if (planned && estimated) {
    const delayMin = Math.round(
      (new Date(estimated).getTime() - new Date(planned).getTime()) / 60000
    );
    if (delayMin > 0) return `~~${p}~~ **${e}** (+${delayMin} min)`;
    if (delayMin < 0) return `~~${p}~~ **${e}** (${delayMin} min)`;
  }
  return `~~${p}~~ **${e}**`;
}

export function registerDepartures(server: McpServer, client: TfNSWClient) {
  server.tool(
    "tfnsw_departures",
    "Get real-time departure board for a specific public transport stop in NSW. Shows upcoming services with line numbers, destinations, and real-time delays. Use tfnsw_stop_finder first to get the stop ID.",
    {
      stopId: z.string().describe("Stop/station ID (get this from tfnsw_stop_finder)"),
      date: z.string().optional().describe("Date in YYYYMMDD format (default: today)"),
      time: z.string().optional().describe("Time in HHMM format (default: now)"),
      limit: z.number().optional().default(10).describe("Max departures to return (default 10)"),
    },
    async ({ stopId, date, time, limit }) => {
      const params: Record<string, string | number | boolean> = {
        type_dm: "stop",
        name_dm: stopId,
        mode: "direct",
        depArrMacro: "dep",
        TfNSWDM: true,
      };
      if (date) params.itdDate = date;
      if (time) params.itdTime = time;

      const data = (await client.request("departure_mon", params)) as {
        stopEvents?: StopEvent[];
      };

      const events = (data.stopEvents ?? []).slice(0, limit);
      if (events.length === 0) {
        return { content: [{ type: "text", text: `No upcoming departures found for stop ${stopId}.` }] };
      }

      const stopName = events[0]?.location?.name ?? stopId;
      const lines = events.map((ev) => {
        const line = ev.transportation?.number ?? ev.transportation?.description ?? "?";
        const towards = ev.transportation?.destination?.name ?? "Unknown";
        const depTime = formatTime(ev.departureTimePlanned, ev.departureTimeEstimated);
        const realtime = ev.isRealtimeControlled ? " (live)" : "";
        return `- **${line}** → ${towards} at ${depTime}${realtime}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Departures from **${stopName}**:\n\n${lines.join("\n")}`,
          },
        ],
      };
    }
  );
}
