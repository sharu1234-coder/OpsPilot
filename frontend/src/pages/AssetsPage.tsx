import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes, CheckCircle2, Laptop, Search,
  Settings2, UserRound, Plus
} from "lucide-react";
import { fetchAssets } from "../lib/api";
import { mapApiAssetsToAssets } from "../lib/assetAdapter";
import type { Asset, AssetCategory, AssetStatus } from "../data/assets";

const statusStyles: Record<AssetStatus, string> = {
  Available: "bg-emerald-50 text-emerald-700",
  Assigned: "bg-blue-50 text-blue-700",
  Maintenance: "bg-amber-50 text-amber-700",
  Retired: "bg-slate-100 text-slate-600",
};

const categories: Array<AssetCategory | "All"> = [
  "All", "Laptop", "Desktop", "Server",
  "Monitor", "Network", "Other"
];

const statuses: Array<AssetStatus | "All"> = [
  "All", "Available", "Assigned", "Maintenance", "Retired"
];

function StatCard({
  label, value, icon: Icon, color
}: {
  label: string;
  value: number;
  icon: typeof Laptop;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon size={21} />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function AssetsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AssetCategory | "All">("All");
  const [status, setStatus] = useState<AssetStatus | "All">("All");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAssets = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const apiAssets = await fetchAssets();
      setAssets(mapApiAssetsToAssets(apiAssets));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assets"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const stats = useMemo(() => ({
    total: assets.length,
    available: assets.filter(a => a.status === "Available").length,
    assigned: assets.filter(a => a.status === "Assigned").length,
    maintenance: assets.filter(a => a.status === "Maintenance").length,
  }), [assets]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return assets.filter((asset: Asset) => {
      const matchesSearch = [
        asset.id,
        asset.name,
        asset.serialNumber,
        asset.assignedTo,
        asset.location
      ].some(value => value.toLowerCase().includes(search));

      return matchesSearch &&
        (category === "All" || asset.category === category) &&
        (status === "All" || asset.status === status);
    });
  }, [assets, query, category, status]);

  const selectStyle =
    "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            IT Asset Management
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Asset Inventory
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track IT equipment, ownership, and lifecycle status.
          </p>
        </div>

        <Link
          to="/assets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Asset
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Assets"
          value={stats.total}
          icon={Boxes}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Assigned"
          value={stats.assigned}
          icon={UserRound}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="In Maintenance"
          value={stats.maintenance}
          icon={Settings2}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <span className="text-xs font-medium text-slate-500">
            PostgreSQL Asset Inventory
          </span>
          <button
            type="button"
            onClick={() => void loadAssets(true)}
            disabled={loading || refreshing}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh Assets"}
          </button>
        </div>

        {error && (
          <div role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}. Check that the backend is running, then refresh.
          </div>
        )}

        {loading && (
          <div role="status" className="border-b border-slate-100 px-5 py-4 text-sm text-slate-500">
            Loading assets from PostgreSQL...
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">All Assets</h2>
            <p className="mt-1 text-xs text-slate-400">
              {filtered.length} of {assets.length} assets
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <Search size={17} className="text-slate-400" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search assets..."
                aria-label="Search assets"
                className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              aria-label="Filter by category"
              value={category}
              onChange={event =>
                setCategory(event.target.value as AssetCategory | "All")
              }
              className={selectStyle}
            >
              {categories.map(value => (
                <option key={value} value={value}>
                  {value === "All" ? "All Categories" : value}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={status}
              onChange={event =>
                setStatus(event.target.value as AssetStatus | "All")
              }
              className={selectStyle}
            >
              {statuses.map(value => (
                <option key={value} value={value}>
                  {value === "All" ? "All Statuses" : value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4">Asset</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Serial Number</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Assigned To</th>
                <th className="px-5 py-4">Location</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(asset => (
                <tr
                  key={asset.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <Link
                      to={`/assets/db/${asset.id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      aria-label={`View details for ${asset.id}`}
                    >
                      {asset.id}
                    </Link>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {asset.name}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {asset.category}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    {asset.serialNumber}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[asset.status]}`}>
                      {asset.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {asset.assignedTo || "Unassigned"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {asset.location}
                  </td>
                </tr>
              ))}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <Laptop size={30} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      No assets match your filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setCategory("All");
                        setStatus("All");
                      }}
                      className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Inventory loaded from PostgreSQL. Existing browser-stored assets
        remain untouched during migration.
      </p>
    </div>
  );
}
