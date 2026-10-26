import { createContext, useContext } from "react";
import type { AuthCredentials, AuthUser } from "../lib/authApi";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "anonymous"
  | "error";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthUser>;
  signup: (credentials: AuthCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Access authentication state inside React components.
 *
 * Must be called inside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}
