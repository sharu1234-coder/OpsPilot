import type { Asset } from "../data/assets";
import type { ApiAsset } from "./api";

export function mapApiAssetToAsset(apiAsset: ApiAsset): Asset {
  return {
    id: `AST-${String(apiAsset.id).padStart(4, "0")}`,
    name: apiAsset.name,
    category: apiAsset.category,
    serialNumber: apiAsset.serial_number,
    status: apiAsset.status,
    assignedTo: apiAsset.assigned_to ?? "",
    location: apiAsset.location,
    createdAt: apiAsset.created_at,
    updatedAt: apiAsset.updated_at,
  };
}

export function mapApiAssetsToAssets(
  apiAssets: ApiAsset[]
): Asset[] {
  return apiAssets.map(mapApiAssetToAsset);
}

export function parseDatabaseAssetId(
  assetId: string
): number | null {
  const match = /^AST-(0*[1-9]\d*)$/.exec(assetId);

  if (!match) {
    return null;
  }

  const id = Number(match[1]);

  return Number.isSafeInteger(id) ? id : null;
}
