import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  Loader2,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";

import { fetchTicketById, updateApiTicket, type ApiTicket } from "../lib/api";
import { mapApiTicketToTicket } from "../lib/ticketAdapter";
import { useAuth } from "../contexts/AuthContext";
import DatabaseActivityTimeline from "../components/tickets/DatabaseActivityTimeline";
import {
  priorityStyles,
  statusStyles,
} from "../components/dashboard/RecentTickets";

export default function DatabaseTicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user } = useAuth();
  const canManage =
    user?.role === "admin" || user?.role === "agent";

  const [ticket, setTicket] = useState<ApiTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const [status, setStatus] = useState<ApiTicket["status"]>("Open");
  const [priority, setPriority] = useState<ApiTicket["priority"]>("Medium");
  const [assignee, setAssignee] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      setLoading(true);
      setError(null);
      setTicket(null);

      const match = /^INC-(\d+)$/i.exec(ticketId ?? "");
      const id = match ? Number(match[1]) : NaN;

      if (!Number.isSafeInteger(id) || id <= 0) {
        setError("Invalid database ticket ID.");
        setLoading(false);
        return;
      }

      try {
        const result = await fetchTicketById(id);

        if (!cancelled) {
          setTicket(result);
          setStatus(result.status);
          setPriority(result.priority);
          setAssignee(result.assignee ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load incident details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTicket();

    return () => {
      cancelled = true;
    };
  }, [ticketId, refreshKey]);

  async function handleSave() {
    if (!canManage || !ticket || saving) return;

    setSaving(true);

    try {
      const updated = await updateApiTicket(ticket.id, {
        status,
        priority,
        assignee: assignee.trim() || "Unassigned",
      });

      setTicket(updated);
      setStatus(updated.status);
      setPriority(updated.priority);
      setAssignee(updated.assignee ?? "");

      setActivityRefreshKey((value) => value + 1);
      toast.success("Incident updated successfully in PostgreSQL");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update incident."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-3 text-slate-500">
        <Loader2 size={22} className="animate-spin text-blue-600" />
        Loading incident from PostgreSQL...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <AlertCircle size={32} className="mx-auto text-rose-500" />

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Unable to load incident
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          {error ?? "Ticket not found."}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/tickets"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Back to Tickets
          </Link>

          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayTicket = mapApiTicketToTicket(ticket);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Tickets
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Incident Details / {displayTicket.id}
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {ticket.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Requested by {ticket.requester}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${priorityStyles[ticket.priority]}`}
          >
            {ticket.priority}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[ticket.status]}`}
          >
            {ticket.status}
          </span>

          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            aria-label="Refresh incident"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList size={20} className="text-blue-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Incident Information
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Incident ID
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {displayTicket.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Requester
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {ticket.requester}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Assigned Agent
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {ticket.assignee || "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Last Updated
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {displayTicket.updated}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Description
              </h3>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {ticket.description || "No description available for this incident."}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <CalendarClock size={20} className="text-blue-600" />

              <h2 className="text-lg font-bold text-slate-900">
                Activity Timeline
              </h2>
            </div>

            <DatabaseActivityTimeline
              ticketId={ticket.id}
              refreshKey={refreshKey + activityRefreshKey}
            />
          </section>
        </div>

        {canManage ? (
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <UserRound size={20} className="text-blue-600" />

            <h2 className="text-lg font-bold text-slate-900">
              Manage Incident
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="db-ticket-status"
                className="text-sm font-semibold text-slate-700"
              >
                Status
              </label>
              <select
                id="db-ticket-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ApiTicket["status"])
                }
                disabled={saving}
                className={inputClass}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="db-ticket-priority"
                className="text-sm font-semibold text-slate-700"
              >
                Priority
              </label>
              <select
                id="db-ticket-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as ApiTicket["priority"])
                }
                disabled={saving}
                className={inputClass}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="db-ticket-assignee"
                className="text-sm font-semibold text-slate-700"
              >
                Assigned Agent
              </label>
              <input
                id="db-ticket-assignee"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder="Agent name or Unassigned"
                maxLength={100}
                disabled={saving}
                className={inputClass}
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            Changes are saved to PostgreSQL through FastAPI.
          </p>
          </aside>
        ) : (
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <UserRound size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Incident Status
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Status
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {ticket.status}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Priority
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {ticket.priority}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Assigned Agent
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {ticket.assignee || "Unassigned"}
                </p>
              </div>
            </div>

            <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
              Your IT support team manages incident updates.
              You can follow changes in the activity timeline.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
