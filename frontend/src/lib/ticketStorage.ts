import { tickets, type Ticket } from "../data/dashboard";

const STORAGE_KEY = "opspilot-demo-tickets-v1";

export function getTickets(): Ticket[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [...tickets];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...tickets];

    const valid = parsed.every((item) =>
      item !== null &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.requester === "string" &&
      typeof item.assignee === "string" &&
      typeof item.updated === "string" &&
      ["Critical", "High", "Medium", "Low"].includes(item.priority) &&
      ["Open", "In Progress", "Resolved"].includes(item.status)
    );

    return valid ? (parsed as Ticket[]) : [...tickets];
  } catch {
    return [...tickets];
  }
}

export function saveTickets(updated: Ticket[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function createTicket(
  input: Pick<Ticket, "title" | "requester" | "priority"> & { description: string }
): Ticket {
  const current = getTickets();

  const nextId =
    Math.max(
      1042,
      ...current.map((ticket) => {
        const match = /^INC-(\d+)$/.exec(ticket.id);
        return match ? Number(match[1]) : 0;
      })
    ) + 1;

  const now = new Date().toISOString();
  const ticket: Ticket = {
    id: `INC-${nextId}`,
    title: input.title,
    description: input.description,
    requester: input.requester,
    priority: input.priority,
    status: "Open",
    assignee: "Unassigned",
    updated: new Date().toLocaleString(),
    createdAt: now,
    updatedAt: now,
  };

  saveTickets([ticket, ...current]);
  return ticket;
}
