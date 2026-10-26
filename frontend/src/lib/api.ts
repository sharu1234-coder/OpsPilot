import { getCsrfToken } from "./authApi";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "")
).replace(/\/+$/, "");

export interface ApiTicket {
  id: number;
  title: string;
  description: string | null;
  requester: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  assignee: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchTickets(): Promise<ApiTicket[]> {
  const response = await fetch(`${API_BASE_URL}/api/tickets/`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch tickets: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiTicket[];
}

export interface CreateApiTicket {
  title: string;
  description?: string;
  requester?: string;
  priority: ApiTicket["priority"];
  assignee?: string;
}

export async function createApiTicket(
  ticket: CreateApiTicket
): Promise<ApiTicket> {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${API_BASE_URL}/api/tickets/`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(ticket),
  });

  if (!response.ok) {
    throw new Error(
      `Unable to create ticket: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiTicket;
}

export async function fetchTicketById(
  id: number
): Promise<ApiTicket> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid ticket ID");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tickets/${id}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    throw new Error("Ticket not found");
  }

  if (!response.ok) {
    throw new Error(
      `Unable to fetch ticket: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiTicket;
}

export interface UpdateApiTicket {
  status: ApiTicket["status"];
  priority: ApiTicket["priority"];
  assignee: string;
}

export async function updateApiTicket(
  id: number,
  changes: UpdateApiTicket
): Promise<ApiTicket> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid ticket ID");
  }

  const assignee = changes.assignee.trim();

  if (!assignee || assignee.length > 100) {
    throw new Error("Assignee must contain 1 to 100 characters");
  }

  const csrfToken = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/api/tickets/${id}`,
    {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({
        ...changes,
        assignee,
      }),
    }
  );

  if (response.status === 404) {
    throw new Error("Ticket not found");
  }

  if (!response.ok) {
    throw new Error(
      `Unable to update ticket: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiTicket;
}

export interface ApiTicketActivity {
  id: number;
  ticket_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export async function fetchTicketActivities(
  ticketId: number
): Promise<ApiTicketActivity[]> {
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
    throw new Error("Invalid ticket ID");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tickets/${ticketId}/activities`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    throw new Error("Ticket not found");
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load activity history: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiTicketActivity[];
}

export interface ApiTicketTrendDay {
  date: string;
  day: string;
  created: number;
  resolved: number;
}

export interface ApiTicketTrendsResponse {
  days: number;
  timezone: string;
  data: ApiTicketTrendDay[];
}

export async function fetchTicketTrends(
  days = 7
): Promise<ApiTicketTrendsResponse> {
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error("Days must be between 1 and 30");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/analytics/ticket-trends?days=${days}`,
    { credentials: "include", cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load ticket trends: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiTicketTrendsResponse;
}


// PostgreSQL Asset Management API

export interface ApiAsset {
  id: number;
  name: string;
  category: "Laptop" | "Desktop" | "Server" | "Monitor" | "Network" | "Other";
  serial_number: string;
  status: "Available" | "Assigned" | "Maintenance" | "Retired";
  assigned_to: string | null;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApiAsset {
  name: string;
  category: ApiAsset["category"];
  serial_number: string;
  status: ApiAsset["status"];
  assigned_to?: string | null;
  location: string;
}

export interface UpdateApiAsset {
  status: ApiAsset["status"];
  assigned_to: string | null;
  location: string;
}

export interface ApiAssetActivity {
  id: number;
  asset_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

function validateAssetId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid asset ID");
  }
}

async function getAssetApiError(
  response: Response,
  fallback: string
): Promise<Error> {
  if (response.status === 404) {
    return new Error("Asset not found");
  }

  if (response.status === 409) {
    return new Error("An asset with this serial number already exists");
  }

  return new Error(`${fallback}: HTTP ${response.status}`);
}

export async function fetchAssets(): Promise<ApiAsset[]> {
  const response = await fetch(`${API_BASE_URL}/api/assets/`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await getAssetApiError(response, "Unable to fetch assets");
  }

  return (await response.json()) as ApiAsset[];
}

export async function createApiAsset(
  asset: CreateApiAsset
): Promise<ApiAsset> {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${API_BASE_URL}/api/assets/`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(asset),
  });

  if (!response.ok) {
    throw await getAssetApiError(response, "Unable to create asset");
  }

  return (await response.json()) as ApiAsset;
}

export async function fetchAssetById(
  id: number
): Promise<ApiAsset> {
  validateAssetId(id);

  const response = await fetch(
    `${API_BASE_URL}/api/assets/${id}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw await getAssetApiError(response, "Unable to fetch asset");
  }

  return (await response.json()) as ApiAsset;
}

export async function updateApiAsset(
  id: number,
  changes: UpdateApiAsset
): Promise<ApiAsset> {
  validateAssetId(id);
  const csrfToken = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/api/assets/${id}`,
    {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(changes),
    }
  );

  if (!response.ok) {
    throw await getAssetApiError(response, "Unable to update asset");
  }

  return (await response.json()) as ApiAsset;
}

export async function fetchAssetActivities(
  id: number
): Promise<ApiAssetActivity[]> {
  validateAssetId(id);

  const response = await fetch(
    `${API_BASE_URL}/api/assets/${id}/activities`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw await getAssetApiError(
      response,
      "Unable to load asset activity history"
    );
  }

  return (await response.json()) as ApiAssetActivity[];
}

// PostgreSQL Global Activity Log API

export type GlobalActivityEntityType = "all" | "ticket" | "asset";

export interface ApiGlobalActivity {
  activity_id: number;
  entity_type: "ticket" | "asset";
  entity_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export async function fetchGlobalActivity(
  entityType: GlobalActivityEntityType = "all",
  limit = 50
): Promise<ApiGlobalActivity[]> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Activity limit must be between 1 and 100");
  }

  const params = new URLSearchParams({
    entity_type: entityType,
    limit: String(limit),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/activity/?${params.toString()}`,
    { credentials: "include", cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load global activity: HTTP ${response.status}`
    );
  }

  return (await response.json()) as ApiGlobalActivity[];
}

// PostgreSQL Team Management API

export type TeamMemberStatus = "Active" | "Inactive";

export interface ApiTeamMember {
  id: number;
  full_name: string;
  email: string;
  department: string;
  role: string;
  status: TeamMemberStatus;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApiTeamMember {
  full_name: string;
  email: string;
  department: string;
  role: string;
  status?: TeamMemberStatus;
  location: string;
}

export interface UpdateApiTeamMember {
  department?: string;
  role?: string;
  status?: TeamMemberStatus;
  location?: string;
}

function validateTeamMemberId(id: number): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid team member ID");
  }
}

async function getTeamApiError(
  response: Response,
  fallback: string
): Promise<Error> {
  try {
    const body: unknown = await response.json();

    if (typeof body === "object" && body !== null) {
      const detail = (body as { detail?: unknown }).detail;

      if (typeof detail === "string") {
        return new Error(detail);
      }

      if (Array.isArray(detail)) {
        const messages = detail
          .map((item: unknown) => {
            if (typeof item !== "object" || item === null) {
              return null;
            }

            const message = (item as { msg?: unknown }).msg;

            return typeof message === "string" ? message : null;
          })
          .filter((message): message is string => message !== null);

        if (messages.length > 0) {
          return new Error(messages.join("; "));
        }
      }
    }
  } catch {
    // Use the fallback when the response is not valid JSON.
  }

  return new Error(`${fallback}: HTTP ${response.status}`);
}

export async function fetchTeamMembers(): Promise<ApiTeamMember[]> {
  const response = await fetch(`${API_BASE_URL}/api/team/`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await getTeamApiError(
      response,
      "Unable to load team members"
    );
  }

  return (await response.json()) as ApiTeamMember[];
}

export async function fetchTeamMemberById(
  id: number
): Promise<ApiTeamMember> {
  validateTeamMemberId(id);

  const response = await fetch(
    `${API_BASE_URL}/api/team/${id}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw await getTeamApiError(
      response,
      "Unable to load team member"
    );
  }

  return (await response.json()) as ApiTeamMember;
}

export async function createApiTeamMember(
  member: CreateApiTeamMember
): Promise<ApiTeamMember> {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${API_BASE_URL}/api/team/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(member),
  });

  if (!response.ok) {
    throw await getTeamApiError(
      response,
      "Unable to create team member"
    );
  }

  return (await response.json()) as ApiTeamMember;
}

export async function updateApiTeamMember(
  id: number,
  changes: UpdateApiTeamMember
): Promise<ApiTeamMember> {
  validateTeamMemberId(id);

  const csrfToken = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/api/team/${id}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(changes),
    }
  );

  if (!response.ok) {
    throw await getTeamApiError(
      response,
      "Unable to update team member"
    );
  }

  return (await response.json()) as ApiTeamMember;
}
