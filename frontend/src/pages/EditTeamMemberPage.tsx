import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Loader2,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import {
  fetchTeamMemberById,
  updateApiTeamMember,
  type ApiTeamMember,
  type TeamMemberStatus,
  type UpdateApiTeamMember,
} from "../lib/api";

type EditForm = {
  department: string;
  role: string;
  status: TeamMemberStatus;
  location: string;
};

function formFromMember(member: ApiTeamMember): EditForm {
  return {
    department: member.department,
    role: member.role,
    status: member.status,
    location: member.location,
  };
}

export default function EditTeamMemberPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState<ApiTeamMember | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMember() {
      setLoading(true);
      setError(null);
      setMember(null);
      setForm(null);

      if (!memberId || !/^[1-9]\d*$/.test(memberId)) {
        setError("Invalid employee ID.");
        setLoading(false);
        return;
      }

      const id = Number(memberId);

      if (!Number.isSafeInteger(id)) {
        setError("Invalid employee ID.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchTeamMemberById(id);

        if (active) {
          setMember(data);
          setForm(formFromMember(data));
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load employee."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMember();

    return () => {
      active = false;
    };
  }, [memberId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!member || !form || saving) return;

    setError(null);

    const normalized: EditForm = {
      department: form.department.trim(),
      role: form.role.trim(),
      status: form.status,
      location: form.location.trim(),
    };

    if (
      !normalized.department ||
      !normalized.role ||
      !normalized.location
    ) {
      setError("All required fields must be completed.");
      return;
    }

    const changes: UpdateApiTeamMember = {};

    if (normalized.department !== member.department) {
      changes.department = normalized.department;
    }

    if (normalized.role !== member.role) {
      changes.role = normalized.role;
    }

    if (normalized.status !== member.status) {
      changes.status = normalized.status;
    }

    if (normalized.location !== member.location) {
      changes.location = normalized.location;
    }

    if (Object.keys(changes).length === 0) {
      navigate(`/team/${member.id}`);
      return;
    }

    setSaving(true);

    try {
      await updateApiTeamMember(member.id, changes);
      navigate(`/team/${member.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update employee."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-12">
      <div>
        <Link
          to={memberId ? `/team/${memberId}` : "/team"}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Employee Profile
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <UserRound size={26} />
          </div>

          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Workforce Management
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Edit Employee
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Update an employee's professional information.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500"
        >
          Loading employee information...
        </div>
      ) : member && form ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="text-lg font-semibold text-slate-900">
                {member.full_name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {member.email}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Employee #{String(member.id).padStart(4, "0")}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="department"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Department *
                </label>

                <div className="relative">
                  <Building2
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="department"
                    type="text"
                    value={form.department}
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, department: event.target.value }
                          : current
                      )
                    }
                    maxLength={100}
                    required
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Job Role *
                </label>

                <div className="relative">
                  <BriefcaseBusiness
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="role"
                    type="text"
                    value={form.role}
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, role: event.target.value }
                          : current
                      )
                    }
                    maxLength={100}
                    required
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Office Location *
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="location"
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) =>
                        current
                          ? { ...current, location: event.target.value }
                          : current
                      )
                    }
                    maxLength={150}
                    required
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Employment Status
                </label>

                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            status: event.target.value as TeamMemberStatus,
                          }
                        : current
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
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
              className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              to={`/team/${member.id}`}
              onClick={(event) => {
                if (saving) event.preventDefault();
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            {error || "Employee information is unavailable."}
          </div>
        </div>
      )}
    </div>
  );
}
