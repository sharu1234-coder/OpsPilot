import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  fetchTicketTrends,
  type ApiTicketTrendDay,
} from "../../lib/api";

interface TicketTrendChartProps {
  refreshKey?: number;
}

export default function TicketTrendChart({
  refreshKey = 0,
}: TicketTrendChartProps) {
  const [data, setData] = useState<ApiTicketTrendDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchTicketTrends(7);

        if (!cancelled) {
          setData(result.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load ticket trends."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrends();

    return () => {
      cancelled = true;
    };
  }, [refreshKey, retryKey]);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-900">
          Ticket Activity
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Created tickets vs. resolution events · Last 7 days · IST
        </p>
      </div>

      {loading ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
          Loading PostgreSQL trends...
        </div>
      ) : error ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-3 text-center">
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 10, left: -22, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#eef2f7"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 14 }}
              />
              <Line
                type="monotone"
                dataKey="created"
                name="Created"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                name="Resolution Events"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
