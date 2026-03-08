import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TfNSWClient } from "../api-client.js";
import { registerStopFinder } from "./stop-finder.js";
import { registerTripPlanner } from "./trip-planner.js";
import { registerDepartures } from "./departures.js";
import { registerServiceAlerts } from "./service-alerts.js";
import { registerCoordRequest } from "./coord-request.js";

export function registerAllTools(server: McpServer) {
  const client = new TfNSWClient();

  registerStopFinder(server, client);
  registerTripPlanner(server, client);
  registerDepartures(server, client);
  registerServiceAlerts(server, client);
  registerCoordRequest(server, client);
}
