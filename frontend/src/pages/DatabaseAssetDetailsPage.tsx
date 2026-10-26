import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  HardDrive,
  MapPin,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import { fetchAssetById, updateApiAsset } from "../lib/api";
import type { ApiAsset } from "../lib/api";
import { parseDatabaseAssetId } from "../lib/assetAdapter";
import DatabaseAssetActivityTimeline from "../components/DatabaseAssetActivityTimeline";

const statusStyles: Record<ApiAsset["status"], string> = {
  Available: "bg-emerald-50 text-emerald-700",
  Assigned: "bg-blue-50 text-blue-700",
  Maintenance: "bg-amber-50 text-amber-700",
  Retired: "bg-slate-100 text-slate-600",
};

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleString();
}

export default function DatabaseAssetDetailsPage() {
  const { assetId } = useParams();

  const databaseId = parseDatabaseAssetId(assetId ?? "");

  const [asset, setAsset] = useState<ApiAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<ApiAsset["status"]>("Available");
  const [assignedTo, setAssignedTo] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (databaseId === null) {
      setAsset(null);
      setError("Invalid database asset ID");
      setLoading(false);
      return;
    }

    async function loadAsset() {
      setLoading(true);
      setError(null);
      setAsset(null);

      try {
        const result = await fetchAssetById(databaseId!);

        if (!cancelled) {
          setAsset(result);
          setStatus(result.status);
          setAssignedTo(result.assigned_to ?? "");
          setLocation(result.location);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load asset details"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAsset();

    return () => {
      cancelled = true;
    };
  }, [databaseId, reloadKey]);

  const hasChanges = asset !== null && (
    status !== asset.status ||
    (status === "Assigned" ? assignedTo.trim() : "") !==
      (asset.assigned_to ?? "") ||
    location.trim() !== asset.location
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!asset || databaseId === null || saving) return;

    const employee = assignedTo.trim();
    const trimmedLocation = location.trim();

    if (status === "Assigned" && !employee) {
      toast.error("Assigned assets require an employee name");
      return;
    }

    if (employee.length > 100) {
      toast.error("Employee name cannot exceed 100 characters");
      return;
    }

    if (trimmedLocation.length < 2 || trimmedLocation.length > 150) {
      toast.error("Location must contain 2 to 150 characters");
      return;
    }

    if (!hasChanges) return;

    setSaving(true);

    try {
      const updated = await updateApiAsset(databaseId, {
        status,
        assigned_to: status === "Assigned" ? employee : null,
        location: trimmedLocation,
      });

      setAsset(updated);
      setStatus(updated.status);
      setAssignedTo(updated.assigned_to ?? "");
      setLocation(updated.location);

      setActivityRefreshKey(key => key + 1);
      toast.success("Asset updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update asset"
      );
    } finally {
      setSaving(false);
    }
  }

  const inputStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link
        to="/assets"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Assets
      </Link>

      {loading && (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"
        >
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-4 text-sm text-slate-500">
            Loading asset details from PostgreSQL...
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-white p-10 text-center shadow-sm"
        >
          <HardDrive size={36} className="mx-auto text-rose-300" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Unable to load asset
          </h1>

          <p className="mt-2 text-sm text-rose-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setReloadKey(key => key + 1)}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && asset && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                PostgreSQL Asset Management / {assetId}
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {asset.name}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage equipment ownership, location, and lifecycle.
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
                    ["Asset ID", assetId ?? ""],
                    ["Asset Name", asset.name],
                    ["Category", asset.category],
                    ["Serial Number", asset.serial_number],
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
                      htmlFor="db-asset-status"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Asset Status
                    </label>

                    <select
                      id="db-asset-status"
                      value={status}
                      onChange={event =>
                        setStatus(event.target.value as ApiAsset["status"])
                      }
                      disabled={saving}
                      className={inputStyle}
                    >
                      {(
                        [
                          "Available",
                          "Assigned",
                          "Maintenance",
                          "Retired",
                        ] as const
                      ).map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="db-asset-assignee"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Assigned Employee
                    </label>

                    <input
                      id="db-asset-assignee"
                      value={assignedTo}
                      onChange={event => setAssignedTo(event.target.value)}
                      disabled={status !== "Assigned" || saving}
                      maxLength={100}
                      placeholder="Employee name"
                      className={`${inputStyle} disabled:bg-slate-50 disabled:text-slate-400`}
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Required when status is Assigned.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="db-asset-location"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Location
                    </label>

                    <input
                      id="db-asset-location"
                      value={location}
                      onChange={event => setLocation(event.target.value)}
                      disabled={saving}
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

              <DatabaseAssetActivityTimeline
                assetId={asset.id}
                refreshKey={activityRefreshKey}
              />
            </section>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="font-bold text-slate-900">
                  Asset Overview
                </h2>

                <div className="mt-6 space-y-6">
                  <div className="flex gap-3">
                    <UserRound
                      size={18}
                      className="mt-0.5 text-blue-500"
                    />
                    <div>
                      <p className="text-xs text-slate-400">
                        Assigned To
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {asset.assigned_to || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <MapPin
                      size={18}
                      className="mt-0.5 text-blue-500"
                    />
                    <div>
                      <p className="text-xs text-slate-400">
                        Location
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {asset.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CalendarDays
                      size={18}
                      className="mt-0.5 text-blue-500"
                    />
                    <div>
                      <p className="text-xs text-slate-400">
                        Registered
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(asset.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 text-blue-500"
                    />
                    <div>
                      <p className="text-xs text-slate-400">
                        Last Updated
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(asset.updated_at)}
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
                  Track assets from availability and assignment
                  through maintenance and retirement.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
