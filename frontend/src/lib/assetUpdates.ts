import type { Asset, AssetStatus } from "../data/assets";
import { getAssets, saveAssets } from "./assetStorage";
import { addAssetActivity } from "./assetActivity";

export type AssetUpdate = Pick<
  Asset,
  "status" | "assignedTo" | "location"
>;

export function getAssetById(id: string): Asset | undefined {
  return getAssets().find((asset) => asset.id === id);
}

export function updateAsset(
  id: string,
  changes: AssetUpdate
): Asset {
  const assets = getAssets();
  const index = assets.findIndex((asset) => asset.id === id);

  if (index === -1) {
    throw new Error("Asset not found");
  }

  const allowedStatuses: AssetStatus[] = [
    "Available",
    "Assigned",
    "Maintenance",
    "Retired",
  ];

  if (!allowedStatuses.includes(changes.status)) {
    throw new Error("Invalid asset status");
  }

  const assignedTo = changes.assignedTo.trim();
  const location = changes.location.trim();

  if (location.length < 2 || location.length > 150) {
    throw new Error("Location must contain 2 to 150 characters");
  }

  if (assignedTo.length > 100) {
    throw new Error("Employee name cannot exceed 100 characters");
  }

  if (changes.status === "Assigned" && !assignedTo) {
    throw new Error("Assigned assets require an employee name");
  }

  const previous = assets[index];

  const updatedAsset: Asset = {
    ...previous,
    status: changes.status,
    assignedTo: changes.status === "Assigned" ? assignedTo : "",
    location,
    updatedAt: new Date().toISOString(),
  };

  const changesMade: string[] = [];

  if (previous.status !== updatedAsset.status) {
    changesMade.push(
      `Status changed from ${previous.status} to ${updatedAsset.status}`
    );
  }

  if (previous.assignedTo !== updatedAsset.assignedTo) {
    changesMade.push(
      `Assignment changed from ${previous.assignedTo || "Unassigned"} to ${updatedAsset.assignedTo || "Unassigned"}`
    );
  }

  if (previous.location !== updatedAsset.location) {
    changesMade.push(
      `Location changed from ${previous.location} to ${updatedAsset.location}`
    );
  }

  if (changesMade.length === 0) {
    return previous;
  }

  const updatedAssets = [...assets];
  updatedAssets[index] = updatedAsset;

  saveAssets(updatedAssets);

  try {
    for (const action of changesMade) {
      addAssetActivity(id, action);
    }
  } catch (error) {
    console.error("Asset saved, but activity logging failed:", error);
  }

  return updatedAsset;
}
