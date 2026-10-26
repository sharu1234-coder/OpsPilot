export type AssetActivity = {
  id: string;
  assetId: string;
  action: string;
  timestamp: string;
};

const STORAGE_KEY = "opspilot-demo-asset-activity-v1";

export function getAllAssetActivity(): AssetActivity[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is AssetActivity =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.assetId === "string" &&
        typeof item.action === "string" &&
        typeof item.timestamp === "string"
    );
  } catch {
    return [];
  }
}

export function getAssetActivity(assetId: string): AssetActivity[] {
  return getAllAssetActivity()
    .filter((activity) => activity.assetId === assetId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    );
}

export function addAssetActivity(
  assetId: string,
  action: string
): AssetActivity {
  const activity: AssetActivity = {
    id: crypto.randomUUID(),
    assetId,
    action,
    timestamp: new Date().toISOString(),
  };

  const existing = getAllAssetActivity();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([activity, ...existing])
  );

  return activity;
}
