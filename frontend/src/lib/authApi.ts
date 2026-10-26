/**
 * OpsPilot authentication API client.
 * Sessions are managed by the backend using HttpOnly cookies.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "")
).replace(/\/+$/, "");

export interface AuthUser {
  id: number;
  email: string;
  role: "admin" | "agent" | "employee";
  is_active: boolean;
  created_at: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export class AuthApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

async function authRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Authentication request failed: HTTP ${response.status}`;

    try {
      const body: unknown = await response.json();

      if (
        typeof body === "object" &&
        body !== null &&
        "detail" in body &&
        typeof body.detail === "string"
      ) {
        message = body.detail;
      }
    } catch {
      // Keep the fallback message for non-JSON responses.
    }

    throw new AuthApiError(message, response.status);
  }

  return response;
}

export async function signup(
  credentials: AuthCredentials
): Promise<AuthUser> {
  const response = await authRequest("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  return (await response.json()) as AuthUser;
}

export async function login(
  credentials: AuthCredentials
): Promise<AuthUser> {
  const response = await authRequest("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  return (await response.json()) as AuthUser;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await authRequest("/api/auth/me");

  return (await response.json()) as AuthUser;
}

export async function getCsrfToken(): Promise<string> {
  const response = await authRequest("/api/auth/csrf");

  const body: unknown = await response.json();

  if (
    typeof body !== "object" ||
    body === null ||
    !("csrf_token" in body) ||
    typeof body.csrf_token !== "string" ||
    !/^[0-9a-f]{64}$/.test(body.csrf_token)
  ) {
    throw new Error("Invalid CSRF token response.");
  }

  return body.csrf_token;
}

export async function logout(): Promise<void> {
  const csrfToken = await getCsrfToken();

  await authRequest("/api/auth/logout", {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
}
