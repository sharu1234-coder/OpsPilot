import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ticket } from "../../data/dashboard";
import type { ApiTicket } from "../../lib/api";
import { mapApiTicketsToTickets } from "../../lib/ticketAdapter";

export const priorityStyles: Record<Ticket["priority"], string> = {
  Critical: "bg-rose-50 text-rose-700",
  High: "bg-orange-50 text-orange-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

export const statusStyles: Record<Ticket["status"], string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-violet-50 text-violet-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};

interface RecentTicketsProps {
  tickets: ApiTicket[];
}

export default function RecentTickets({ tickets }: RecentTicketsProps) {
  const recentTickets = mapApiTicketsToTickets(
    [...tickets]
      .sort((a, b) => {
        const dateDifference =
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime();

        return dateDifference || b.id - a.id;
      })
      .slice(0, 5)
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Recent Incidents
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Latest incidents from PostgreSQL
          </p>
        </div>

        <Link
          to="/tickets"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          View all <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead className="border-y border-slate-100 bg-slate-50/70">
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-3">Incident</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-6 py-3">Updated</th>
            </tr>
          </thead>

          <tbody>
            {recentTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <Link
                    to={`/tickets/db/${ticket.id}`}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {ticket.id}
                  </Link>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {ticket.title}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    by {ticket.requester}
                  </p>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[ticket.priority]}`}
                  >
                    {ticket.priority}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>
                </td>

                <td className="px-4 py-4 text-xs font-medium text-slate-600">
                  {ticket.assignee}
                </td>

                <td className="px-6 py-4 text-xs text-slate-400">
                  {ticket.updated}
                </td>
              </tr>
            ))}

            {recentTickets.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  No incidents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
