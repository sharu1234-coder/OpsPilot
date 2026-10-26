import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft,
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  RefreshCw,
  Pencil,
  UserRound,
} from "lucide-react";
import {
  fetchTeamMemberById,
  type ApiTeamMember,
} from "../lib/api";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={16} />
        {label}
      </div>

      <p className="mt-2 break-words font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function TeamMemberDetailsPage() {
  const { user } = useAuth();
  const { memberId } = useParams();

  const [member, setMember] = useState<ApiTeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadMember() {
      setLoading(true);
      setError(null);
      setMember(null);

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
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load employee profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadMember();

    return () => {
      active = false;
    };
  }, [memberId, reloadKey]);

  function refresh() {
    if (loading || refreshing) return;

    setRefreshing(true);
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/team"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to Team Directory
          </Link>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            Employee Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View employee information stored in PostgreSQL.
          </p>
        </div>

        {member && user?.role === "admin" && (
          <Link
            to={`/team/${member.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Pencil size={16} />
            Edit Employee
          </Link>
        )}
        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500"
        >
          Loading employee profile...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          <AlertCircle size={20} />
          {error}
        </div>
      ) : member ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <UserRound size={30} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-slate-900">
                  {member.full_name}
                </h2>

                <p className="mt-1 text-slate-500">
                  {member.role}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  Employee #{String(member.id).padStart(4, "0")}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  member.status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {member.status}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Professional Information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Department"
                value={member.department}
                icon={Building2}
              />
              <Detail
                label="Job Role"
                value={member.role}
                icon={BriefcaseBusiness}
              />
              <Detail
                label="Office Location"
                value={member.location}
                icon={MapPin}
              />
              <Detail
                label="Work Email"
                value={member.email}
                icon={Mail}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Record Information
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Created"
                value={formatDate(member.created_at)}
                icon={CalendarDays}
              />
              <Detail
                label="Last Updated"
                value={formatDate(member.updated_at)}
                icon={CalendarDays}
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
