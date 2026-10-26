import type { Ticket } from "../data/dashboard";
import type { ApiTicket } from "./api";

export function mapApiTicketToTicket(apiTicket: ApiTicket): Ticket {
  return {
    id: `INC-${String(apiTicket.id).padStart(4, "0")}`,
    title: apiTicket.title,
    description: apiTicket.description ?? "",
    requester: apiTicket.requester,
    priority: apiTicket.priority,
    status: apiTicket.status,
    assignee: apiTicket.assignee ?? "Unassigned",
    updated: new Date(apiTicket.updated_at).toLocaleString(),
    createdAt: apiTicket.created_at,
    updatedAt: apiTicket.updated_at,
  };
}

export function mapApiTicketsToTickets(
  apiTickets: ApiTicket[]
): Ticket[] {
  return apiTickets.map(mapApiTicketToTicket);
}
