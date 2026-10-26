import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createApiAsset } from "../lib/api";
import type { AssetCategory, AssetStatus } from "../data/assets";

const categories = [
  "Laptop", "Desktop", "Server", "Monitor", "Network", "Other"
] as const;

const statuses = [
  "Available", "Assigned", "Maintenance", "Retired"
] as const;

const assetSchema = z.object({
  name: z.string().trim().min(3, "Enter at least 3 characters").max(150),
  category: z.enum(categories),
  serialNumber: z.string().trim().min(3, "Enter a valid serial number").max(100),
  status: z.enum(statuses),
  assignedTo: z.string().trim().max(100),
  location: z.string().trim().min(2, "Enter an asset location").max(150),
}).refine(
  (data) => data.status !== "Assigned" || data.assignedTo.length > 0,
  {
    message: "Assigned assets require an employee name",
    path: ["assignedTo"],
  }
);

type FormValues = z.infer<typeof assetSchema>;

export default function CreateAssetPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormValues>({
    name: "",
    category: "Laptop",
    serialNumber: "",
    status: "Available",
    assignedTo: "",
    location: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    setForm(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = assetSchema.safeParse(form);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const asset = await createApiAsset({
        name: result.data.name,
        category: result.data.category,
        serial_number: result.data.serialNumber,
        status: result.data.status,
        assigned_to:
          result.data.status === "Assigned"
            ? result.data.assignedTo
            : null,
        location: result.data.location,
      });

      const displayId = `AST-${String(asset.id).padStart(4, "0")}`;

      toast.success(`${displayId} registered successfully`);
      navigate(`/assets/db/${displayId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to register asset"
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/assets"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} /> Back to Assets
      </Link>

      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          IT Asset Management
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Register New Asset
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Add IT equipment to your workspace inventory.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="asset-name" className="text-sm font-semibold text-slate-800">
              Asset Name *
            </label>
            <input
              id="asset-name"
              value={form.name}
              onChange={event => update("name", event.target.value)}
              placeholder="e.g. Dell Latitude 7450"
              maxLength={150}
              className={fieldStyle}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <p className="mt-2 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="asset-category" className="text-sm font-semibold text-slate-800">
              Category *
            </label>
            <select
              id="asset-category"
              value={form.category}
              onChange={event => update("category", event.target.value as AssetCategory)}
              className={fieldStyle}
            >
              {categories.map(value => <option key={value}>{value}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="asset-serial" className="text-sm font-semibold text-slate-800">
              Serial Number *
            </label>
            <input
              id="asset-serial"
              value={form.serialNumber}
              onChange={event => update("serialNumber", event.target.value)}
              placeholder="e.g. DL7450-006"
              maxLength={100}
              className={fieldStyle}
              aria-invalid={Boolean(errors.serialNumber)}
            />
            {errors.serialNumber && (
              <p className="mt-2 text-xs text-rose-600">{errors.serialNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="asset-status" className="text-sm font-semibold text-slate-800">
              Asset Status *
            </label>
            <select
              id="asset-status"
              value={form.status}
              onChange={event => update("status", event.target.value as AssetStatus)}
              className={fieldStyle}
            >
              {statuses.map(value => <option key={value}>{value}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="asset-assignee" className="text-sm font-semibold text-slate-800">
              Assigned Employee
            </label>
            <input
              id="asset-assignee"
              value={form.assignedTo}
              onChange={event => update("assignedTo", event.target.value)}
              placeholder="Employee name"
              disabled={form.status !== "Assigned"}
              maxLength={100}
              className={`${fieldStyle} disabled:bg-slate-50 disabled:text-slate-400`}
              aria-invalid={Boolean(errors.assignedTo)}
            />
            {errors.assignedTo && (
              <p className="mt-2 text-xs text-rose-600">{errors.assignedTo}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="asset-location" className="text-sm font-semibold text-slate-800">
              Location *
            </label>
            <input
              id="asset-location"
              value={form.location}
              onChange={event => update("location", event.target.value)}
              placeholder="e.g. Hyderabad Office"
              maxLength={150}
              className={fieldStyle}
              aria-invalid={Boolean(errors.location)}
            />
            {errors.location && (
              <p className="mt-2 text-xs text-rose-600">{errors.location}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
          <Link
            to="/assets"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? "Saving..." : "Register Asset"}
          </button>
        </div>
      </form>
    </div>
  );
}
