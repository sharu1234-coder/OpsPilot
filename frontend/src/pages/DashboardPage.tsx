import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Clock3, LifeBuoy,
  ArrowRight, ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import MetricCard from "../components/dashboard/MetricCard";
import TicketTrendChart from "../components/dashboard/TicketTrendChart";
import RecentTickets from "../components/dashboard/RecentTickets";
import { fetchTickets, type ApiTicket } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const canViewAnalytics =
    user?.role === "admin" || user?.role === "agent";

  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchTickets();

        if (!cancelled) {
          setTickets(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "Open").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    inProgress: tickets.filter(
      (ticket) => ticket.status === "In Progress"
    ).length,
  }), [tickets]);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Operations Center
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor service health, incidents, and team performance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
        >
          {loading ? "Loading PostgreSQL..." : "Refresh Live Data"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700"
        >
          {error} — click Refresh Live Data to retry.
        </div>
      )}

      {!error && (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Tickets"
          value={stats.total.toLocaleString()}
          change="Live"
          positive={true}
          icon={LifeBuoy}
          color="blue"
        />
        <MetricCard
          label="Open Incidents"
          value={stats.open.toLocaleString()}
          change="Live"
          positive={true}
          icon={AlertTriangle}
          color="amber"
        />
        <MetricCard
          label="Resolved Incidents"
          value={stats.resolved.toLocaleString()}
          change="Live"
          positive={true}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          label="In Progress"
          value={stats.inProgress.toLocaleString()}
          change="Live"
          positive={true}
          icon={Clock3}
          color="violet"
        />
      </div>

      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        {canViewAnalytics ? (
          <TicketTrendChart refreshKey={refreshKey} />
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Your Incident Overview
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your dashboard shows incidents associated with your account.
              Team-wide analytics are available to IT staff.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-blue-50 p-5">
                <p className="text-sm text-blue-700">Your Tickets</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-5">
                <p className="text-sm text-amber-700">Awaiting Resolution</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.open + stats.inProgress}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200/80 bg-[#0B1220] p-6 text-white shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
            <ShieldCheck size={23} />
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-blue-400">
            Service Excellence
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Stay ahead of every incident.
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            Centralize IT requests, track service performance, and give every
            team a clear view of what matters.
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-end justify-between">
              <span className="text-xs text-slate-400">
                SLA Compliance · Demo
              </span>
              <span className="text-xl font-bold">96.8%</span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[96.8%] rounded-full bg-emerald-400" />
            </div>
          </div>

          <Link
            to="/tickets"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            Explore service desk <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <RecentTickets tickets={tickets} />
    </div>
  );
}
