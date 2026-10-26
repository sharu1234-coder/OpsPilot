import { Clock3, History } from "lucide-react";
import { getAssetActivity } from "../../lib/assetActivity";

type Props = {
  assetId: string;
};

function formatActivityDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString();
}

export default function AssetActivityTimeline({ assetId }: Props) {
  const activities = getAssetActivity(assetId);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
          <History size={21} />
        </div>

        <div>
          <h2 className="font-bold text-slate-900">
            Asset Activity
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Assignment, status, and location history
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
          <Clock3 size={27} className="mx-auto text-slate-300" />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No activity recorded yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Future asset changes will appear here.
          </p>
        </div>
      ) : (
        <ol className="relative ml-2 border-l-2 border-slate-100">
          {activities.map((activity) => (
            <li key={activity.id} className="relative pb-7 pl-7 last:pb-0">
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-[3px] border-white bg-blue-600 ring-1 ring-blue-200" />

              <p className="text-sm font-medium leading-6 text-slate-800">
                {activity.action}
              </p>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock3 size={13} />
                <time dateTime={activity.timestamp}>
                  {formatActivityDate(activity.timestamp)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
