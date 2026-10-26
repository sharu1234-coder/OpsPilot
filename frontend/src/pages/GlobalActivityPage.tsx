import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Clock3,
  Laptop,
  RefreshCw,
  Ticket,
  AlertCircle,
  Inbox,
} from "lucide-react";

import {
  fetchGlobalActivity,
  type ApiGlobalActivity,
  type GlobalActivityEntityType,
} from "../lib/api";

const filters: {
  label: string;
  value: GlobalActivityEntityType;
}[] = [
  { label: "All Activity", value: "all" },
  { label: "Tickets", value: "ticket" },
  { label: "Assets", value: "asset" },
];

const fieldLabels: Record<string, string> = {
  status: "Status",
  priority: "Priority",
  assignee: "Assignee",
  assigned_to: "Assigned to",
  location: "Location",
  title: "Title",
  description: "Description",
  requester: "Requester",
};

function formatField(field: string): string {
  return (
    fieldLabels[field] ??
    field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function formatValue(value: string | null): string {
  return value === null || value.trim() === ""
    ? "Not set"
    : value;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getEntityCode(item: ApiGlobalActivity): string {
  const prefix = item.entity_type === "ticket" ? "INC" : "AST";
  return `${prefix}-${String(item.entity_id).padStart(4, "0")}`;
}

function getEntityLink(item: ApiGlobalActivity): string {
  const code = getEntityCode(item);

  return item.entity_type === "ticket"
    ? `/tickets/db/${code}`
    : `/assets/db/${code}`;
}

function ActivityEntry({ item }: { item: ApiGlobalActivity }) {
  const isTicket = item.entity_type === "ticket";
  const Icon = isTicket ? Ticket : Laptop;
  const fieldLabel = formatField(item.field_name);

  return (
    <div className="group flex gap-4 border-b border-slate-100 px-5 py-5 last:border-b-0 sm:px-6">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
          isTicket
            ? "bg-blue-50 text-blue-600"
            : "bg-violet-50 text-violet-600"
        }`}
      >
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isTicket ? "Ticket updated" : "Asset updated"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {fieldLabel} changed
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock3 size={13} />
            <time dateTime={item.created_at}>
              {formatTimestamp(item.created_at)}
            </time>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="max-w-full break-words rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600">
            {formatValue(item.old_value)}
          </span>

          <ArrowRight
            size={15}
            className="shrink-0 text-slate-400"
            aria-label="Changed to"
          />

          <span className="max-w-full break-words rounded-lg bg-emerald-50 px-2.5 py-1.5 font-medium text-emerald-700">
            {formatValue(item.new_value)}
          </span>
        </div>

        <Link
          to={getEntityLink(item)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
        >
          View {getEntityCode(item)}
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function GlobalActivityPage() {
  const [filter, setFilter] =
    useState<GlobalActivityEntityType>("all");

  const [activities, setActivities] =
    useState<ApiGlobalActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadActivity() {
      if (reloadKey === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const records = await fetchGlobalActivity(filter, 100);

        if (active) {
          setActivities(records);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load activity"
          );
          setActivities([]);
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadActivity();

    return () => {
      active = false;
    };
  }, [filter, reloadKey]);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <Activity size={17} />
            Operations audit trail
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Activity Log
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track changes across your IT tickets and managed assets.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Activity size={21} className="text-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Displayed activities
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {activities.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Ticket size={21} className="text-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Ticket changes
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {activities.filter(
              (item) => item.entity_type === "ticket"
            ).length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Laptop size={21} className="text-violet-600" />
          <p className="mt-4 text-sm text-slate-500">
            Asset changes
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {activities.filter(
              (item) => item.entity_type === "asset"
            ).length}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent activity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Showing up to 100 latest matching changes
              </p>
            </div>

            <div
              className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1"
              role="group"
              aria-label="Filter activity"
            >
              {filters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFilter(option.value);
                    setLoading(true);
                  }}
                  aria-pressed={filter === option.value}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    filter === option.value
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div
            role="status"
            className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-slate-500"
          >
            <RefreshCw size={25} className="animate-spin" />
            <p className="text-sm">Loading activity history...</p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center"
          >
            <AlertCircle size={28} className="text-rose-500" />
            <p className="font-semibold text-slate-900">
              Unable to load activity
            </p>
            <p className="max-w-md text-sm text-slate-500">
              {error}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
            <Inbox size={30} className="text-slate-400" />
            <p className="font-semibold text-slate-900">
              No activity recorded yet
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Changes to tickets and assets will appear here.
            </p>
          </div>
        ) : (
          <div aria-live="polite">
            {activities.map((item) => (
              <ActivityEntry
                key={`${item.entity_type}-${item.activity_id}`}
                item={item}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
