import type { Ticket } from "../data/dashboard";
import { getTickets } from "./ticketStorage";

export type DailyTicketTrend = {
  date: string;
  label: string;
  tickets: number;
};

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function calculateTicketCreationTrend(
  tickets: Ticket[],
  days = 7,
  today = new Date()
): DailyTicketTrend[] {
  const result: DailyTicketTrend[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - offset
    );

    const key = getLocalDateKey(date);

    const count = tickets.filter((ticket) => {
      if (!ticket.createdAt) return false;

      const created = new Date(ticket.createdAt);

      if (Number.isNaN(created.getTime())) return false;

      return getLocalDateKey(created) === key;
    }).length;

    result.push({
      date: key,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      tickets: count,
    });
  }

  return result;
}

export function getTicketCreationTrend(
  days = 7
): DailyTicketTrend[] {
  return calculateTicketCreationTrend(getTickets(), days);
}
