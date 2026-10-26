import type { Ticket } from "../data/dashboard";
import type { Asset } from "../data/assets";
import { getTickets } from "./ticketStorage";
import { getAssets } from "./assetStorage";

export type AnalyticsItem = {
  name: string;
  value: number;
};

export type AnalyticsSnapshot = {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  resolutionRate: number;
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  ticketStatus: AnalyticsItem[];
  ticketPriority: AnalyticsItem[];
  assetStatus: AnalyticsItem[];
  assetCategories: AnalyticsItem[];
};

function countBy<T>(
  records: T[],
  key: (record: T) => string,
  categories: readonly string[]
): AnalyticsItem[] {
  return categories.map((name) => ({
    name,
    value: records.filter((record) => key(record) === name).length,
  }));
}

export function calculateAnalytics(
  tickets: Ticket[],
  assets: Asset[]
): AnalyticsSnapshot {
  const ticketStatus = countBy(
    tickets,
    (ticket) => ticket.status,
    ["Open", "In Progress", "Resolved"]
  );

  const ticketPriority = countBy(
    tickets,
    (ticket) => ticket.priority,
    ["Critical", "High", "Medium", "Low"]
  );

  const assetStatus = countBy(
    assets,
    (asset) => asset.status,
    ["Available", "Assigned", "Maintenance", "Retired"]
  );

  const assetCategories = countBy(
    assets,
    (asset) => asset.category,
    ["Laptop", "Desktop", "Server", "Monitor", "Network", "Other"]
  );

  const resolvedTickets =
    ticketStatus.find((item) => item.name === "Resolved")?.value ?? 0;

  const resolutionRate =
    tickets.length === 0
      ? 0
      : Math.round((resolvedTickets / tickets.length) * 1000) / 10;

  return {
    totalTickets: tickets.length,
    openTickets:
      ticketStatus.find((item) => item.name === "Open")?.value ?? 0,
    inProgressTickets:
      ticketStatus.find((item) => item.name === "In Progress")?.value ?? 0,
    resolvedTickets,
    resolutionRate,

    totalAssets: assets.length,
    availableAssets:
      assetStatus.find((item) => item.name === "Available")?.value ?? 0,
    assignedAssets:
      assetStatus.find((item) => item.name === "Assigned")?.value ?? 0,
    maintenanceAssets:
      assetStatus.find((item) => item.name === "Maintenance")?.value ?? 0,
    retiredAssets:
      assetStatus.find((item) => item.name === "Retired")?.value ?? 0,

    ticketStatus,
    ticketPriority,
    assetStatus,
    assetCategories,
  };
}

export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  return calculateAnalytics(getTickets(), getAssets());
}
