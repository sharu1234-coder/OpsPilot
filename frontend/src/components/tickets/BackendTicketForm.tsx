import { useState, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  createApiTicket,
  type ApiTicket,
  type CreateApiTicket,
} from "../../lib/api";
import { useAuth } from "../../contexts/authContextState";

interface Props {
  onCreated: (ticket: ApiTicket) => void;
}

const initialForm: CreateApiTicket = {
  title: "",
  description: "",
  requester: "",
  priority: "Medium",
  assignee: "",
};

export default function BackendTicketForm({ onCreated }: Props) {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateApiTicket>({
    ...initialForm,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (
      !form.title.trim() ||
      (!isEmployee && !(form.requester ?? "").trim())
    ) {
      toast.error(
        isEmployee
          ? "Title is required."
          : "Title and requester are required."
      );
      return;
    }

    setSaving(true);

    try {
      const ticket = await createApiTicket({
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        priority: form.priority,
        ...(!isEmployee
          ? {
              requester: (form.requester ?? "").trim(),
              assignee: form.assignee?.trim() || undefined,
            }
          : {}),
      });

      toast.success("Ticket created in PostgreSQL!");
      setForm({ ...initialForm });
      setOpen(false);
      onCreated(ticket);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create ticket."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <Plus size={16} />
        Create PostgreSQL Ticket
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          Create PostgreSQL Ticket
        </h2>

        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={saving}
          aria-label="Close ticket form"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="backend-ticket-title"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Ticket Title *
          </label>
          <input
            id="backend-ticket-title"
            required
            maxLength={200}
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="Example: Laptop not connecting to Wi-Fi"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="backend-ticket-description"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="backend-ticket-description"
            rows={3}
            value={form.description ?? ""}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Describe the issue..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isEmployee ? (
            <div>
              <label
                htmlFor="backend-ticket-requester-account"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Requester Account
              </label>
              <input
                id="backend-ticket-requester-account"
                value={user?.email ?? ""}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                This ticket will be linked to your account.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="backend-ticket-requester"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Requester *
              </label>
              <input
                id="backend-ticket-requester"
                required
                maxLength={120}
                value={form.requester ?? ""}
                onChange={(event) =>
                  setForm({ ...form, requester: event.target.value })
                }
                placeholder="Employee name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="backend-ticket-priority"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Priority
            </label>
            <select
              id="backend-ticket-priority"
              value={form.priority}
              onChange={(event) =>
                setForm({
                  ...form,
                  priority: event.target.value as CreateApiTicket["priority"],
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {!isEmployee && (
          <div>
            <label
              htmlFor="backend-ticket-assignee"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Assignee
            </label>
            <input
              id="backend-ticket-assignee"
              maxLength={120}
              value={form.assignee ?? ""}
              onChange={(event) =>
                setForm({ ...form, assignee: event.target.value })
              }
              placeholder="Optional IT support employee"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {saving ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
