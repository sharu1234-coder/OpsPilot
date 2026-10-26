import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Ticket as TicketIcon,
} from "lucide-react";

import type { Ticket } from "../data/dashboard";
import { fetchTickets } from "../lib/api";
import { mapApiTicketsToTickets } from "../lib/ticketAdapter";
import { priorityStyles, statusStyles } from "../lib/ticketStyles";

export default function TicketsPage() {
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      setLoading(true);
      setError(null);

      try {
        const apiTickets = await fetchTickets();

        if (!cancelled) {
          setTickets(mapApiTicketsToTickets(apiTickets));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the ticket database."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return tickets;

    return tickets.filter((ticket) =>
      [
        ticket.id,
        ticket.title,
        ticket.requester,
        ticket.assignee,
        ticket.status,
        ticket.priority,
      ].some((value) => value.toLowerCase().includes(q))
    );
  }, [query, tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Service Desk
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Incident Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage incidents stored in PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            to="/backend-tickets"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Database size={17} />
            Manage Database Tickets
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <TicketIcon size={19} className="text-blue-600" />

            <h2 className="font-bold text-slate-900">
              All Tickets
            </h2>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {filtered.length}
            </span>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-100">
            <Search size={17} className="text-slate-400" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tickets..."
              aria-label="Search tickets"
              className="w-52 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-20 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            Loading tickets from PostgreSQL...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <AlertCircle size={28} className="text-red-500" />

            <p className="font-semibold text-slate-900">
              Unable to load database tickets
            </p>

            <p className="max-w-md text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4">Ticket</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Assigned to</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/tickets/db/${ticket.id}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        {ticket.id}
                      </Link>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {ticket.title}
                      </p>

                      <p className="text-xs text-slate-400">
                        {ticket.requester}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[ticket.status]}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {ticket.assignee}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      {query
                        ? "No tickets match your search."
                        : "No PostgreSQL tickets found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Tickets on this page are loaded from PostgreSQL through FastAPI.
        Existing localStorage demo records remain saved separately.
      </p>
    </div>
  );
}
