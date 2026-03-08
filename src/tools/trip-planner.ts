import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TfNSWClient } from "../api-client.js";

interface TripLeg {
  origin?: { name?: string; departureTimePlanned?: string; departureTimeEstimated?: string };
  destination?: { name?: string; arrivalTimePlanned?: string; arrivalTimeEstimated?: string };
  transportation?: { product?: { name?: string; class?: number }; number?: string; description?: string; destination?: { name?: string } };
  duration?: number;
  footPathInfo?: Array<{ duration?: number; position?: string }>;
  coords?: number[][];
  interchange?: { desc?: string };
}

interface Journey {
  legs?: TripLeg[];
  fare?: { tickets?: Array<{ properties?: { priceBrutto?: number }; name?: string }> };
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
  return `~~${p}~~ **${e}**`;
}

function formatLeg(leg: TripLeg, index: number): string {
  const origin = leg.origin?.name ?? "Unknown";
  const dest = leg.destination?.name ?? "Unknown";
  const depTime = formatTime(leg.origin?.departureTimePlanned, leg.origin?.departureTimeEstimated);
  const arrTime = formatTime(leg.destination?.arrivalTimePlanned, leg.destination?.arrivalTimeEstimated);
  const transport = leg.transportation;
  const duration = leg.duration ? `${leg.duration} min` : "";

  if (transport?.product?.class === 99 || transport?.product?.class === 100) {
    // Walking leg
    const walkMin = leg.footPathInfo?.[0]?.duration ?? leg.duration ?? 0;
    return `**Leg ${index + 1}: Walk** (${walkMin} min)\n  ${origin} → ${dest}`;
  }

  const line = transport?.number ?? transport?.description ?? transport?.product?.name ?? "Unknown";
  const towards = transport?.destination?.name ? ` → ${transport.destination.name}` : "";
  return `**Leg ${index + 1}: ${line}${towards}** (${duration})\n  ${depTime} ${origin}\n  ${arrTime} ${dest}`;
}

export function registerTripPlanner(server: McpServer, client: TfNSWClient) {
  server.tool(
    "tfnsw_trip",
    "Plan a public transport journey between two locations in NSW. Returns trip options with detailed legs including real-time departure/arrival times, line numbers, transfers, and walking directions.",
    {
      origin: z.string().describe("Starting location (stop name, address, or stop ID)"),
      destination: z.string().describe("Destination (stop name, address, or stop ID)"),
      date: z.string().optional().describe("Travel date in YYYYMMDD format (default: today)"),
      time: z.string().optional().describe("Travel time in HHMM format (default: now)"),
      departOrArrive: z.enum(["dep", "arr"]).optional().default("dep").describe("'dep' = depart at time, 'arr' = arrive by time"),
      wheelchair: z.boolean().optional().describe("Require wheelchair accessible routes"),
    },
    async ({ origin, destination, date, time, departOrArrive, wheelchair }) => {
      const params: Record<string, string | number | boolean> = {
        type_origin: "any",
        name_origin: origin,
        type_destination: "any",
        name_destination: destination,
        depArrMacro: departOrArrive,
        TfNSWTR: true,
      };
      if (date) params.itdDate = date;
      if (time) params.itdTime = time;
      if (wheelchair) params.wheelchair = true;

      const data = (await client.request("trip", params)) as { journeys?: Journey[] };
      const journeys = data.journeys ?? [];

      if (journeys.length === 0) {
        return { content: [{ type: "text", text: "No trips found for this route." }] };
      }

      const results = journeys.map((journey, i) => {
        const legs = journey.legs ?? [];
        const firstDep = legs[0]?.origin?.departureTimePlanned;
        const lastArr = legs[legs.length - 1]?.destination?.arrivalTimePlanned;
        const totalMin =
          firstDep && lastArr
            ? Math.round((new Date(lastArr).getTime() - new Date(firstDep).getTime()) / 60000)
            : null;
        const transfers = legs.filter(
          (l) => l.transportation?.product?.class !== 99 && l.transportation?.product?.class !== 100
        ).length - 1;

        const header = `### Option ${i + 1}${totalMin ? ` (${totalMin} min` : "("}${transfers > 0 ? `, ${transfers} transfer${transfers > 1 ? "s" : ""}` : ""})\n`;
        const legsText = legs.map((leg, j) => formatLeg(leg, j)).join("\n");

        let fareText = "";
        const ticket = journey.fare?.tickets?.[0];
        if (ticket?.properties?.priceBrutto) {
          fareText = `\n  Fare: $${(ticket.properties.priceBrutto / 100).toFixed(2)} (${ticket.name ?? "Adult"})`;
        }

        return header + legsText + fareText;
      });

      return {
        content: [{ type: "text", text: results.join("\n\n---\n\n") }],
      };
    }
  );
}
