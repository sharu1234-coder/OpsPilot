import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Props = {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: LucideIcon;
  color: "blue" | "amber" | "emerald" | "violet";
};

const styles = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function MetricCard({ label, value, change, positive, icon: Icon, color }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color]}`}>
          <Icon size={21} />
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {positive ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
          {change}
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">vs. previous period · demo</p>
    </div>
  );
}
