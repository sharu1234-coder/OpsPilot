import { Activity, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchTicketActivities,
  type ApiTicketActivity,
} from "../../lib/api";

interface Props {
  ticketId: number;
  refreshKey: number;
}

const fieldLabels: Record<string, string> = {
  status: "Status changed",
  priority: "Priority changed",
  assignee: "Assigned agent changed",
};

export default function DatabaseActivityTimeline({
  ticketId,
  refreshKey,
}: Props) {
  const [activities, setActivities] = useState<ApiTicketActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchTicketActivities(ticketId);

        if (!cancelled) {
          setActivities(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load activity history."
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
  }, [ticketId, refreshKey, retryKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
        <Loader2 size={18} className="animate-spin text-blue-600" />
        Loading activity history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 p-5 text-sm text-rose-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          className="mt-3 inline-flex items-center gap-2 font-semibold"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl bg-slate-50 px-5 py-8 text-center">
        <Activity size={24} className="mx-auto mb-3 text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          No recorded changes yet
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Future incident updates will appear here.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {activities.map((activity, index) => (
        <li key={activity.id} className="relative flex gap-4 pb-7 last:pb-0">
          {index < activities.length - 1 && (
            <div className="absolute bottom-0 left-[7px] top-4 w-px bg-slate-200" />
          )}

          <div className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-blue-100 bg-blue-600" />

          <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {fieldLabels[activity.field_name] ??
                `${activity.field_name} changed`}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="max-w-full break-words rounded-lg bg-white px-3 py-1.5 text-slate-500">
                {activity.old_value || "Unassigned"}
              </span>

              <ArrowRight size={15} className="shrink-0 text-blue-500" />

              <span className="max-w-full break-words rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                {activity.new_value || "Unassigned"}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {new Date(activity.created_at).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
