import { exportAnalyticsCSV } from "../lib/exportAnalytics";
import { fetchTicketTrends } from "../lib/api";
import TicketCreationChart from "../components/analytics/TicketCreationChart";
import { useEffect, useState } from "react";
import {
  Activity,
  Boxes,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAnalyticsSnapshot,
  type AnalyticsItem,
} from "../lib/analytics";

const COLORS = [
  "#2563EB",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#64748B",
];

type IconType = typeof Activity;

function Metric({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: IconType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={21} />
      </div>

      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  data,
  variant,
}: {
  title: string;
  subtitle: string;
  data: AnalyticsItem[];
  variant: "pie" | "bar";
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>

      {total === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-400">
          No records available
        </div>
      ) : (
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {variant === "pie" ? (
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs text-slate-500">
              {item.name}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [snapshot, setSnapshot] = useState(getAnalyticsSnapshot);
  const [trendDays, setTrendDays] = useState<7 | 14 | 30>(7);
  const [ticketTrend, setTicketTrend] = useState<
    { date: string; label: string; tickets: number }[]
  >([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [trendRefreshKey, setTrendRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(
    () => new Date().toLocaleTimeString()
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      setTrendLoading(true);
      setTrendError(null);

      try {
        const response = await fetchTicketTrends(trendDays);

        if (!cancelled) {
          setTicketTrend(
            response.data.map((item) => ({
              date: item.date,
              label: item.day,
              tickets: item.created,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setTrendError(
            err instanceof Error
              ? err.message
              : "Unable to load ticket trends."
          );
        }
      } finally {
        if (!cancelled) {
          setTrendLoading(false);
        }
      }
    }

    void loadTrends();

    return () => {
      cancelled = true;
    };
  }, [trendDays, trendRefreshKey]);
  function refresh() {
    setSnapshot(getAnalyticsSnapshot());
    setTrendRefreshKey((value) => value + 1);
    setLastRefreshed(new Date().toLocaleTimeString());
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Operational Intelligence
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Analytics & Reporting
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Explore service desk performance and IT asset distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>

          <button
            type="button"
            onClick={() => exportAnalyticsCSV(getAnalyticsSnapshot())}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Total Tickets"
          value={snapshot.totalTickets}
          description="All saved incidents"
          icon={ClipboardList}
        />
        <Metric
          title="Resolved Tickets"
          value={snapshot.resolvedTickets}
          description="Currently marked resolved"
          icon={CheckCircle2}
        />
        <Metric
          title="Resolution Rate"
          value={`${snapshot.resolutionRate}%`}
          description="Resolved tickets / total tickets"
          icon={TrendingUp}
        />
        <Metric
          title="Total Assets"
          value={snapshot.totalAssets}
          description="Registered IT equipment"
          icon={Boxes}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Incident Trends
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Explore ticket creation activity by reporting period.
            </p>
          </div>

          <div
            role="group"
            aria-label="Ticket trend reporting period"
            className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
          >
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={trendDays === days}
                onClick={() => {
                  setTrendDays(days);

                }}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  trendDays === days
                    ? "bg-blue-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading PostgreSQL ticket trends...
          </div>
        ) : trendError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {trendError}
          </div>
        ) : (
          <TicketCreationChart data={ticketTrend} />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Ticket Status Distribution"
          subtitle="Current incident lifecycle"
          data={snapshot.ticketStatus}
          variant="pie"
        />
        <ChartCard
          title="Tickets by Priority"
          subtitle="Incident urgency breakdown"
          data={snapshot.ticketPriority}
          variant="bar"
        />
        <ChartCard
          title="Asset Lifecycle Status"
          subtitle="Current equipment availability"
          data={snapshot.assetStatus}
          variant="pie"
        />
        <ChartCard
          title="Assets by Category"
          subtitle="Inventory composition"
          data={snapshot.assetCategories}
          variant="bar"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Activity size={16} className="text-blue-600" />
          Analytics calculated from your saved demo records.
        </div>

        <p className="text-xs text-slate-400">
          Last refreshed: {lastRefreshed}
        </p>
      </div>
    </div>
  );
}
