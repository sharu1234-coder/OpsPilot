export type TicketActivity = {
  id: string;
  ticketId: string;
  action: string;
  timestamp: string;
};

const ACTIVITY_KEY = "opspilot-demo-activity-v1";

export function getTicketActivity(ticketId: string): TicketActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is TicketActivity =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.ticketId === "string" &&
        typeof item.action === "string" &&
        typeof item.timestamp === "string" &&
        item.ticketId === ticketId
    );
  } catch {
    return [];
  }
}

export function addTicketActivity(ticketId: string, action: string): void {
  const activity = getAllActivity();

  activity.unshift({
    id: crypto.randomUUID(),
    ticketId,
    action,
    timestamp: new Date().toISOString(),
  });

  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
}

function getAllActivity(): TicketActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is TicketActivity =>
            item !== null &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            typeof item.ticketId === "string" &&
            typeof item.action === "string" &&
            typeof item.timestamp === "string"
        )
      : [];
  } catch {
    return [];
  }
}
