import type { Ticket } from "../data/dashboard";

export const priorityStyles: Record<Ticket["priority"], string> = {
  Critical: "bg-rose-50 text-rose-700",
  High: "bg-orange-50 text-orange-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

export const statusStyles: Record<Ticket["status"], string> = {
  Open: "bg-blue-50 text-blue-700",
  "In Progress": "bg-violet-50 text-violet-700",
  Resolved: "bg-emerald-50 text-emerald-700",
};
