import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Loader2,
  Mail,
  MapPin,
  Save,
  UserPlus,
  UserRound,
} from "lucide-react";
import {
  createApiTeamMember,
  type CreateApiTeamMember,
  type TeamMemberStatus,
} from "../lib/api";

const initialForm: CreateApiTeamMember = {
  full_name: "",
  email: "",
  department: "",
  role: "",
  status: "Active",
  location: "",
};

const fields = [
  {
    name: "full_name",
    label: "Full Name",
    placeholder: "e.g. Priya Reddy",
    maxLength: 120,
    icon: UserRound,
    type: "text",
  },
  {
    name: "email",
    label: "Work Email",
    placeholder: "e.g. priya@company.com",
    maxLength: 254,
    icon: Mail,
    type: "email",
  },
  {
    name: "department",
    label: "Department",
    placeholder: "e.g. IT Support",
    maxLength: 100,
    icon: Building2,
    type: "text",
  },
  {
    name: "role",
    label: "Job Role",
    placeholder: "e.g. Support Engineer",
    maxLength: 100,
    icon: BriefcaseBusiness,
    type: "text",
  },
  {
    name: "location",
    label: "Office Location",
    placeholder: "e.g. Hyderabad",
    maxLength: 150,
    icon: MapPin,
    type: "text",
  },
] as const;

export default function CreateTeamMemberPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateApiTeamMember>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setError(null);

    const payload: CreateApiTeamMember = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      department: form.department.trim(),
      role: form.role.trim(),
      status: form.status,
      location: form.location.trim(),
    };

    if (
      !payload.full_name ||
      !payload.email ||
      !payload.department ||
      !payload.role ||
      !payload.location
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSaving(true);

    try {
      await createApiTeamMember(payload);
      navigate("/team");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create employee. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-12">
      <div>
        <Link
          to="/team"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Team Directory
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <UserPlus size={26} />
          </div>

          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Workforce Management
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Add Employee
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create a new employee profile in the OpsPilot team directory.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-slate-900">
              Employee Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the employee's professional and organizational details.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {fields.map((field) => {
              const Icon = field.icon;

              return (
                <div key={field.name} className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-semibold text-slate-700"
                  >
                    {field.label}
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <Icon
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={form[field.name]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      required
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                    />
                  </div>
                </div>
              );
            })}

            <div className="space-y-2">
              <label
                htmlFor="employee-status"
                className="block text-sm font-semibold text-slate-700"
              >
                Employment Status
              </label>

              <select
                id="employee-status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as TeamMemberStatus,
                  }))
                }
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            to="/team"
            aria-disabled={saving}
            onClick={(event) => {
              if (saving) event.preventDefault();
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Creating Employee..." : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
