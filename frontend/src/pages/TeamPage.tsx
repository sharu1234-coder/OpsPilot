import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  RefreshCw,
  Plus,
  Search,
  UserRound,
  Users,
  UserX,
} from "lucide-react";
import {
  fetchTeamMembers,
  type ApiTeamMember,
  type TeamMemberStatus,
} from "../lib/api";

type StatusFilter = "All" | TeamMemberStatus;

const statusStyles: Record<TeamMemberStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={21} />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MemberCard({ member }: { member: ApiTeamMember }) {
  const initials = member.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700">
          {initials || <UserRound size={22} />}
        </div>

        <div className="min-w-0 flex-1">
          <Link
            to={`/team/${member.id}`}
            className="block truncate font-semibold text-slate-900 hover:text-indigo-600 hover:underline"
          >
            {member.full_name}
          </Link>
          <p className="mt-0.5 text-sm text-slate-500">
            {member.role}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[member.status]}`}
        >
          {member.status}
        </span>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <Building2 size={16} className="shrink-0 text-slate-400" />
          <span className="truncate">{member.department}</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <MapPin size={16} className="shrink-0 text-slate-400" />
          <span className="truncate">{member.location}</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm">
          <Mail size={16} className="shrink-0 text-slate-400" />
          <a
            href={`mailto:${member.email}`}
            className="truncate text-indigo-600 hover:underline"
            title={member.email}
          >
            {member.email}
          </a>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Employee #{String(member.id).padStart(4, "0")}
      </div>
    </article>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<ApiTeamMember[]>([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await fetchTeamMembers();
      setMembers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load team members"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === "Active").length,
      inactive: members.filter((m) => m.status === "Inactive").length,
    }),
    [members]
  );

  const departments = useMemo(
    () => [
      "All",
      ...Array.from(new Set(members.map((m) => m.department))).sort(),
    ],
    [members]
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return members.filter((member) => {
      const searchable = [
        member.full_name,
        member.email,
        member.department,
        member.role,
        member.location,
      ];

      const matchesSearch = searchable.some((value) =>
        value.toLowerCase().includes(search)
      );

      return (
        matchesSearch &&
        (department === "All" || member.department === department) &&
        (status === "All" || member.status === status)
      );
    });
  }, [members, query, department, status]);

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Workforce Management
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Team Directory
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Explore your IT workforce, departments, and employee status.
          </p>
        </div>

        {user?.role === "admin" && (
          <Link
          to="/team/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          Add Employee
        </Link>
        )}
        <button
          type="button"
          onClick={() => void loadMembers(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Members"
          value={stats.total}
          icon={Users}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Active Members"
          value={stats.active}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Inactive Members"
          value={stats.inactive}
          icon={UserX}
          color="bg-slate-100 text-slate-600"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_160px]">
          <label className="relative block">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team members..."
              aria-label="Search team members"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            aria-label="Filter by department"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            {departments.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Departments" : item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as StatusFilter)
            }
            aria-label="Filter by status"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Team Members
        </h2>
        <span className="text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? "member" : "members"}
        </span>
      </div>

      {loading ? (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500"
        >
          Loading team members...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <Users size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-4 font-semibold text-slate-900">
            {error
              ? "Unable to display team members"
              : members.length === 0
                ? "No team members yet"
                : "No matching team members"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {error
              ? "Try refreshing the directory."
              : members.length === 0
                ? "Employees will appear here after they are added."
                : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
