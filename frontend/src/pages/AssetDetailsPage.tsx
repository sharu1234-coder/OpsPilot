import AssetActivityTimeline from "../components/assets/AssetActivityTimeline";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  HardDrive,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import type { AssetStatus } from "../data/assets";
import { getAssetById, updateAsset } from "../lib/assetUpdates";

const statuses: AssetStatus[] = [
  "Available",
  "Assigned",
  "Maintenance",
  "Retired",
];

const statusStyles: Record<AssetStatus, string> = {
  Available: "bg-emerald-50 text-emerald-700",
  Assigned: "bg-blue-50 text-blue-700",
  Maintenance: "bg-amber-50 text-amber-700",
  Retired: "bg-slate-100 text-slate-600",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleString();
}

export default function AssetDetailsPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const [asset, setAsset] = useState(() =>
    getAssetById(assetId ?? "")
  );

  const [status, setStatus] = useState<AssetStatus>(
    asset?.status ?? "Available"
  );
  const [assignedTo, setAssignedTo] = useState(
    asset?.assignedTo ?? ""
  );
  const [location, setLocation] = useState(
    asset?.location ?? ""
  );
  const [saving, setSaving] = useState(false);

  if (!asset || asset.id !== assetId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <HardDrive size={40} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Asset not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          The requested asset does not exist in this inventory.
        </p>
        <Link
          to="/assets"
          className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:underline"
        >
          Return to Asset Inventory
        </Link>
      </div>
    );
  }

  const hasChanges =
    status !== asset.status ||
    (status === "Assigned" ? assignedTo.trim() : "") !== asset.assignedTo ||
    location.trim() !== asset.location;

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!asset) return;

    setSaving(true);

    try {
      const updated = updateAsset(asset.id, {
        status,
        assignedTo,
        location,
      });

      setAsset(updated);
      setAssignedTo(updated.assignedTo);
      setLocation(updated.location);
      toast.success("Asset updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update asset"
      );
    } finally {
      setSaving(false);
    }
  }

  const inputStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <button
        type="button"
        onClick={() => navigate("/assets")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Assets
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Asset Details / {asset.id}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {asset.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage asset ownership, location, and lifecycle.
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-xs font-bold ${statusStyles[asset.status]}`}
        >
          {asset.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <HardDrive size={21} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Asset Information
                </h2>
                <p className="text-xs text-slate-400">
                  Equipment identification and classification
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                ["Asset ID", asset.id],
                ["Asset Name", asset.name],
                ["Category", asset.category],
                ["Serial Number", asset.serialNumber],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Manage Asset
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update assignment, location, and operational status.
            </p>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="asset-status"
                  className="text-sm font-semibold text-slate-800"
                >
                  Asset Status
                </label>
                <select
                  id="asset-status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as AssetStatus)
                  }
                  className={inputStyle}
                >
                  {statuses.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="asset-assignee"
                  className="text-sm font-semibold text-slate-800"
                >
                  Assigned Employee
                </label>
                <input
                  id="asset-assignee"
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  disabled={status !== "Assigned"}
                  maxLength={100}
                  placeholder="Employee name"
                  className={`${inputStyle} disabled:bg-slate-50 disabled:text-slate-400`}
                />
                <p className="mt-2 text-xs text-slate-400">
                  Enabled when status is Assigned.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="asset-location"
                  className="text-sm font-semibold text-slate-800"
                >
                  Location
                </label>
                <input
                  id="asset-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={150}
                  placeholder="e.g. Hyderabad Office"
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <AssetActivityTimeline assetId={asset.id} />
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Asset Overview
            </h2>

            <div className="mt-6 space-y-6">
              <div className="flex gap-3">
                <UserRound size={18} className="mt-0.5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-400">Assigned To</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {asset.assignedTo || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin size={18} className="mt-0.5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {asset.location}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CalendarDays size={18} className="mt-0.5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-400">Registered</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(asset.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle2 size={18} className="mt-0.5 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-400">Last Updated</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(asset.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
            <p className="text-sm font-bold text-slate-900">
              Lifecycle Management
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Track assets from availability and assignment through
              maintenance and retirement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
