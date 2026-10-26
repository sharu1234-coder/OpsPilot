import type { AnalyticsSnapshot } from "./analytics";

function escapeCSV(value: string | number): string {
  const text = String(value);

  // Prevent spreadsheet formula execution in exported cells.
  const safeText = /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

export function exportAnalyticsCSV(
  snapshot: AnalyticsSnapshot
): void {
  const rows: Array<Array<string | number>> = [
    ["OpsPilot Analytics Report", ""],
    ["Generated At", new Date().toISOString()],
    ["", ""],
    ["Metric", "Value"],
    ["Total Tickets", snapshot.totalTickets],
    ["Open Tickets", snapshot.openTickets],
    ["In Progress Tickets", snapshot.inProgressTickets],
    ["Resolved Tickets", snapshot.resolvedTickets],
    ["Resolution Rate (%)", snapshot.resolutionRate],
    ["Total Assets", snapshot.totalAssets],
    ["Available Assets", snapshot.availableAssets],
    ["Assigned Assets", snapshot.assignedAssets],
    ["Maintenance Assets", snapshot.maintenanceAssets],
    ["Retired Assets", snapshot.retiredAssets],
    ["", ""],
    ["Ticket Status", "Count"],
    ...snapshot.ticketStatus.map(item => [item.name, item.value]),
    ["", ""],
    ["Ticket Priority", "Count"],
    ...snapshot.ticketPriority.map(item => [item.name, item.value]),
    ["", ""],
    ["Asset Status", "Count"],
    ...snapshot.assetStatus.map(item => [item.name, item.value]),
    ["", ""],
    ["Asset Category", "Count"],
    ...snapshot.assetCategories.map(item => [item.name, item.value]),
  ];

  const csv = rows
    .map(row => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `opspilot-analytics-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
