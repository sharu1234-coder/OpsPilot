import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, CalendarClock, CheckCircle2,
  ClipboardList, Save, UserRound
} from "lucide-react";
import { toast } from "sonner";
import type { Ticket } from "../data/dashboard";
import { getTicketById, updateTicket } from "../lib/ticketUpdates";
import { getTicketActivity } from "../lib/ticketActivity";
import { priorityStyles, statusStyles } from "../lib/ticketStyles";

export default function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | undefined>(
    () => getTicketById(ticketId ?? "")
  );
  const [status, setStatus] = useState<Ticket["status"]>(
    ticket?.status ?? "Open"
  );
  const [priority, setPriority] = useState<Ticket["priority"]>(
    ticket?.priority ?? "Medium"
  );
  const [assignee, setAssignee] = useState(ticket?.assignee ?? "");
  const [saving, setSaving] = useState(false);

  if (!ticket) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Ticket not found
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          The requested incident does not exist in this demo workspace.
        </p>
        <Link
          to="/tickets"
          className="mt-6 inline-block font-semibold text-blue-600"
        >
          Back to Tickets
        </Link>
      </div>
    );
  }

  const activity = getTicketActivity(ticket.id);

  function handleSave() {
    if (!ticket) return;

    setSaving(true);

    try {
      const updated = updateTicket(ticket.id, {
        status,
        priority,
        assignee,
      });

      setTicket(updated);
      toast.success("Incident updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update incident"
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

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
            Incident Details / {ticket.id}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {ticket.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Requested by {ticket.requester}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${priorityStyles[ticket.priority]}`}>
            {ticket.priority}
          </span>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[ticket.status]}`}>
            {ticket.status}
          </span>
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
                  {ticket.id}
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
                  {ticket.assignee}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Last Updated
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {ticket.updated}
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
            <div className="mb-6 flex items-center gap-3">
              <CalendarClock size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Activity Timeline
              </h2>
            </div>

            {activity.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm text-slate-500">
                  No changes recorded yet.
                </p>
              </div>
            ) : (
              <ol className="space-y-5">
                {activity.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {event.action}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <UserRound size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Manage Incident
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="ticket-status" className="text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                id="ticket-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as Ticket["status"])
                }
                className={inputClass}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label htmlFor="ticket-priority" className="text-sm font-semibold text-slate-700">
                Priority
              </label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as Ticket["priority"])
                }
                className={inputClass}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="ticket-assignee" className="text-sm font-semibold text-slate-700">
                Assigned Agent
              </label>
              <input
                id="ticket-assignee"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder="Agent name or Unassigned"
                maxLength={100}
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
            Changes are stored in your browser for this demo.
          </p>
        </aside>
      </div>
    </div>
  );
}
