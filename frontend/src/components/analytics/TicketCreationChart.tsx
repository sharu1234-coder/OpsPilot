import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyTicketTrend } from "../../lib/ticketTrends";

type Props = {
  data: DailyTicketTrend[];
};

export default function TicketCreationChart({ data }: Props) {
  const total = data.reduce((sum, day) => sum + day.tickets, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Ticket Creation Trend
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Daily incident registrations over the selected reporting period
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 px-4 py-2 text-center">
          <p className="text-xs font-medium text-blue-600">
            New Tickets
          </p>

          <p className="text-xl font-bold text-blue-700">
            {total}
          </p>
        </div>
      </div>

      <div className="mt-7 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="ticketTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#2563EB"
                  stopOpacity={0.22}
                />
                <stop
                  offset="95%"
                  stopColor="#2563EB"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value) => [value, "Tickets Created"]}
            />

            <Area
              type="monotone"
              dataKey="tickets"
              stroke="#2563EB"
              strokeWidth={3}
              fill="url(#ticketTrendFill)"
              dot={{ r: 4, fill: "#2563EB" }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Daily ticket creation counts are retrieved from PostgreSQL.
        Reporting dates use the Asia/Kolkata timezone.
      </p>
    </section>
  );
}
