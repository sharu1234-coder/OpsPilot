import type { ApiTicket } from "./api";
import type { AnalyticsSnapshot } from "./analytics";
import { calculateAnalytics } from "./analytics";
import { mapApiTicketsToTickets } from "./ticketAdapter";
import { getAssets } from "./assetStorage";

export function calculatePostgresAnalytics(
  apiTickets: ApiTicket[]
): AnalyticsSnapshot {
  const tickets = mapApiTicketsToTickets(apiTickets);
  const assets = getAssets();

  return calculateAnalytics(tickets, assets);
}
