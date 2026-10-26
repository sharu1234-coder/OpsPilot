import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { createApiTicket } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const schema = z.object({
  title: z.string().trim().min(5, "Title must contain at least 5 characters").max(150),
  requester: z.string().trim().min(2, "Enter the requester's name").max(100),
  priority: z.enum(["Critical", "High", "Medium", "Low"]),
  description: z.string().trim().min(10, "Description must contain at least 10 characters").max(5000),
});

const employeeSchema = schema.omit({ requester: true });

type FormValues = z.infer<typeof schema>;

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  const [form, setForm] = useState<FormValues>({
    title: "",
    requester: "",
    priority: "Medium",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const result = (
      isEmployee ? employeeSchema : schema
    ).safeParse(form);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const ticket = await createApiTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        ...(!isEmployee
          ? { requester: form.requester.trim() }
          : {}),
      });

      const ticketId = `INC-${String(ticket.id).padStart(4, "0")}`;

      toast.success(`${ticketId} created successfully in PostgreSQL`);

      navigate("/tickets");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save the ticket. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  }

  const fieldStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/tickets" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600">
        <ArrowLeft size={17} /> Back to Tickets
      </Link>

      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          Service Desk
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Create Incident
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Record a new IT incident in your PostgreSQL workspace.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="text-sm font-semibold text-slate-800">
              Incident Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Unable to connect to company VPN"
              className={fieldStyle}
              maxLength={150}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="mt-2 text-xs text-rose-600">{errors.title}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {isEmployee ? (
              <div>
                <label htmlFor="requester-account" className="text-sm font-semibold text-slate-800">
                  Requester Account
                </label>
                <input
                  id="requester-account"
                  value={user?.email ?? ""}
                  readOnly
                  className={`${fieldStyle} bg-slate-50`}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Your account is automatically linked to this incident.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="requester" className="text-sm font-semibold text-slate-800">
                  Requester Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="requester"
                  value={form.requester}
                  onChange={(event) => update("requester", event.target.value)}
                  placeholder="Employee name"
                  className={fieldStyle}
                  maxLength={100}
                  aria-invalid={Boolean(errors.requester)}
                />
                {errors.requester && <p className="mt-2 text-xs text-rose-600">{errors.requester}</p>}
              </div>
            )}

            <div>
              <label htmlFor="priority" className="text-sm font-semibold text-slate-800">
                Priority <span className="text-rose-500">*</span>
              </label>
              <select
                id="priority"
                value={form.priority}
                onChange={(event) => update("priority", event.target.value as FormValues["priority"])}
                className={fieldStyle}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-semibold text-slate-800">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Describe the problem, affected system, and steps already attempted..."
              rows={6}
              maxLength={5000}
              className={`${fieldStyle} resize-y`}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="mt-2 text-xs text-rose-600">{errors.description}</p>}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <Link to="/tickets" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? "Saving..." : "Create Incident"}
          </button>
        </div>
      </form>
    </div>
  );
}
