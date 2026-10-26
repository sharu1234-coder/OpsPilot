import BackendTicketForm from "../components/tickets/BackendTicketForm";
import { useEffect, useState } from "react";
import { Database, RefreshCw, AlertCircle } from "lucide-react";
import { fetchTickets, type ApiTicket } from "../lib/api";

export default function BackendTicketsPage() {
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTickets() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTickets();
      setTickets(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load tickets"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              PostgreSQL Tickets
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Live ticket records retrieved from the FastAPI backend.
          </p>
        </div>

        <button
          onClick={() => void loadTickets()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <BackendTicketForm
        onCreated={(ticket) => {
          setTickets((current) => [
            ticket,
            ...current.filter((item) => item.id !== ticket.id),
          ]);
        }}
      />

      {loading ? (
        <p className="text-slate-500">Loading PostgreSQL tickets...</p>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {["ID", "Title", "Requester", "Priority", "Status", "Assignee"].map(
                  (heading) => (
                    <th key={heading} className="px-5 py-4 font-semibold">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-blue-600">
                    INC-{String(ticket.id).padStart(4, "0")}
                  </td>
                  <td className="px-5 py-4 text-slate-900">{ticket.title}</td>
                  <td className="px-5 py-4">{ticket.requester}</td>
                  <td className="px-5 py-4">{ticket.priority}</td>
                  <td className="px-5 py-4">{ticket.status}</td>
                  <td className="px-5 py-4">{ticket.assignee ?? "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {tickets.length === 0 && (
            <p className="p-6 text-center text-slate-500">
              No PostgreSQL tickets found.
            </p>
          )}
        </div>
      )}

      {!loading && !error && (
        <p className="text-sm text-slate-500">
          {tickets.length} ticket(s) loaded from PostgreSQL.
        </p>
      )}
    </div>
  );
}
