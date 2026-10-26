import { useEffect, useState } from "react";
import { Clock3, RefreshCw } from "lucide-react";
import {
  fetchAssetActivities,
  type ApiAssetActivity,
} from "../lib/api";

interface Props {
  assetId: number;
  refreshKey?: number;
}

const fieldLabels: Record<string, string> = {
  status: "Status",
  assigned_to: "Assigned Employee",
  location: "Location",
};

function formatValue(value: string | null): string {
  return value === null || value.trim() === ""
    ? "Unassigned / None"
    : value;
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString();
}

export default function DatabaseAssetActivityTimeline({
  assetId,
  refreshKey = 0,
}: Props) {
  const [activities, setActivities] = useState<ApiAssetActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      setLoading(true);
      setError(null);
      setActivities([]);

      try {
        const result = await fetchAssetActivities(assetId);

        if (!cancelled) {
          setActivities(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load activity history"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadActivities();

    return () => {
      cancelled = true;
    };
  }, [assetId, refreshKey, retryKey]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Clock3 size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Asset Activity Timeline
          </h2>
          <p className="text-xs text-slate-400">
            Recorded changes from PostgreSQL
          </p>
        </div>
      </div>

      {loading && (
        <p role="status" className="text-sm text-slate-500">
          Loading activity history...
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey(key => key + 1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <p className="text-sm text-slate-500">
          No asset changes have been recorded yet.
        </p>
      )}

      {!loading && !error && activities.length > 0 && (
        <ol className="space-y-5">
          {activities.map(activity => (
            <li
              key={activity.id}
              className="relative border-l-2 border-blue-100 pb-2 pl-5"
            >
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />

              <p className="text-sm font-semibold text-slate-900">
                {fieldLabels[activity.field_name] ??
                  activity.field_name}{" "}
                changed
              </p>

              <p className="mt-2 break-words text-sm text-slate-600">
                <span className="text-slate-400">
                  {formatValue(activity.old_value)}
                </span>
                {" → "}
                <span className="font-medium text-slate-800">
                  {formatValue(activity.new_value)}
                </span>
              </p>

              <time
                dateTime={activity.created_at}
                className="mt-2 block text-xs text-slate-400"
              >
                {formatDate(activity.created_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
