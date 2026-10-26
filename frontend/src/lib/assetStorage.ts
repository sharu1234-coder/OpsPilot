import { initialAssets, type Asset } from "../data/assets";

const STORAGE_KEY = "opspilot-demo-assets-v1";

function isAsset(value: unknown): value is Asset {
  if (value === null || typeof value !== "object") return false;

  const asset = value as Record<string, unknown>;

  return (
    typeof asset.id === "string" &&
    typeof asset.name === "string" &&
    ["Laptop", "Desktop", "Server", "Monitor", "Network", "Other"].includes(
      String(asset.category)
    ) &&
    typeof asset.serialNumber === "string" &&
    ["Available", "Assigned", "Maintenance", "Retired"].includes(
      String(asset.status)
    ) &&
    typeof asset.assignedTo === "string" &&
    typeof asset.location === "string" &&
    typeof asset.createdAt === "string" &&
    typeof asset.updatedAt === "string"
  );
}

export function getAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) return [...initialAssets];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed) || !parsed.every(isAsset)) {
      return [...initialAssets];
    }

    return parsed;
  } catch {
    return [...initialAssets];
  }
}

export function saveAssets(assets: Asset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function createAsset(
  input: Pick<
    Asset,
    "name" | "category" | "serialNumber" | "status" | "assignedTo" | "location"
  >
): Asset {
  const assets = getAssets();

  const serialNumber = input.serialNumber.trim();

  if (
    assets.some(
      (asset) =>
        asset.serialNumber.toLowerCase() === serialNumber.toLowerCase()
    )
  ) {
    throw new Error("An asset with this serial number already exists");
  }

  if (input.status === "Assigned" && !input.assignedTo.trim()) {
    throw new Error("Assigned assets require an assignee");
  }

  const nextNumber =
    Math.max(
      1005,
      ...assets.map((asset) => {
        const match = /^AST-(\d+)$/.exec(asset.id);
        return match ? Number(match[1]) : 0;
      })
    ) + 1;

  const now = new Date().toISOString();

  const asset: Asset = {
    ...input,
    id: `AST-${nextNumber}`,
    serialNumber,
    name: input.name.trim(),
    assignedTo: input.status === "Assigned" ? input.assignedTo.trim() : "",
    location: input.location.trim(),
    createdAt: now,
    updatedAt: now,
  };

  saveAssets([asset, ...assets]);

  return asset;
}
