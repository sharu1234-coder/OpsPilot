import type { Ticket } from "../data/dashboard";
import { getTickets, saveTickets } from "./ticketStorage";
import { addTicketActivity } from "./ticketActivity";

export type TicketUpdate = Pick<
  Ticket,
  "status" | "priority" | "assignee"
>;

export function getTicketById(id: string): Ticket | undefined {
  return getTickets().find((ticket) => ticket.id === id);
}

export function updateTicket(
  id: string,
  changes: TicketUpdate
): Ticket {
  const tickets = getTickets();
  const index = tickets.findIndex((ticket) => ticket.id === id);

  if (index === -1) {
    throw new Error("Ticket not found");
  }

  const previous = tickets[index];

  const allowedStatuses: Ticket["status"][] = [
    "Open",
    "In Progress",
    "Resolved",
  ];

  const allowedPriorities: Ticket["priority"][] = [
    "Critical",
    "High",
    "Medium",
    "Low",
  ];

  if (!allowedStatuses.includes(changes.status)) {
    throw new Error("Invalid ticket status");
  }

  if (!allowedPriorities.includes(changes.priority)) {
    throw new Error("Invalid ticket priority");
  }

  const assignee = changes.assignee.trim();

  if (assignee.length === 0 || assignee.length > 100) {
    throw new Error("Assignee must contain 1 to 100 characters");
  }

  const updated: Ticket = {
    ...previous,
    ...changes,
    assignee,
    updated: new Date().toLocaleString(),
    updatedAt: new Date().toISOString(),
  };

  const activity: string[] = [];

  if (previous.status !== updated.status) {
    activity.push(`Status changed from ${previous.status} to ${updated.status}`);
  }

  if (previous.priority !== updated.priority) {
    activity.push(`Priority changed from ${previous.priority} to ${updated.priority}`);
  }

  if (previous.assignee !== updated.assignee) {
    activity.push(`Assigned agent changed from ${previous.assignee} to ${updated.assignee}`);
  }

  if (activity.length === 0) {
    return previous;
  }

  tickets[index] = updated;
  saveTickets(tickets);

  for (const action of activity) {
    addTicketActivity(id, action);
  }

  return updated;
}
