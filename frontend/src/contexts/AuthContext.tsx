import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";
import { AuthContext } from "./authContextState";
import type { AuthContextValue, AuthStatus } from "./authContextState";

import {
  AuthApiError,
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  signup as signupApi,
} from "../lib/authApi";

import type {
  AuthCredentials,
  AuthUser,
} from "../lib/authApi";

/**
 * A 401 response means no valid authenticated session.
 * Other errors are not treated as an intentional logout.
 */
async function readCurrentSession(): Promise<AuthUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof AuthApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  /**
   * Restore the session when the application starts.
   *
   * The cancellation flag prevents stale updates when
   * React StrictMode re-runs effects during development.
   */
  useEffect(() => {
    let active = true;

    void readCurrentSession().then(
      (currentUser) => {
        if (!active) {
          return;
        }

        setUser(currentUser);
        setStatus(
          currentUser ? "authenticated" : "anonymous"
        );
      },
      () => {
        if (!active) {
          return;
        }

        setUser(null);
        setStatus("error");
      }
    );

    return () => {
      active = false;
    };
  }, []);

  /**
   * Revalidate the session with the backend.
   */
  const refreshSession = useCallback(async () => {
    setStatus("loading");

    try {
      const currentUser = await readCurrentSession();

      setUser(currentUser);
      setStatus(
        currentUser ? "authenticated" : "anonymous"
      );
    } catch (error) {
      setUser(null);
      setStatus("error");
      throw error;
    }
  }, []);

  /**
   * Login sets the authenticated user after
   * the backend successfully creates a session.
   */
  const login = useCallback(
    async (credentials: AuthCredentials): Promise<AuthUser> => {
      const authenticatedUser = await loginApi(credentials);

      setUser(authenticatedUser);
      setStatus("authenticated");

      return authenticatedUser;
    },
    []
  );

  /**
   * Public signup creates an employee account.
   * Signup does not automatically log the user in.
   */
  const signup = useCallback(
    async (credentials: AuthCredentials): Promise<AuthUser> => {
      return signupApi(credentials);
    },
    []
  );

  /**
   * Logout revokes the session on the backend first.
   *
   * If the request fails, retain the existing UI state
   * rather than incorrectly claiming logout succeeded.
   */
  const logout = useCallback(async () => {
    await logoutApi();

    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated:
        status === "authenticated" && user !== null,
      login,
      signup,
      logout,
      refreshSession,
    }),
    [
      user,
      status,
      login,
      signup,
      logout,
      refreshSession,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
