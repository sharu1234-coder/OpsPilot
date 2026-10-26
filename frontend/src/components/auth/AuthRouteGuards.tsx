import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/authContextState";
import type { AuthUser } from "../../lib/authApi";

function AuthLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="mt-4 text-sm font-medium text-slate-600">
          Verifying your OpsPilot session...
        </p>
      </div>
    </main>
  );
}

function AuthConnectionError() {
  const { refreshSession } = useAuth();

  async function retry() {
    try {
      await refreshSession();
    } catch {
      // AuthContext retains the error state for display.
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          Unable to verify your session
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          OpsPilot could not contact the authentication service.
          Check that the backend is running and try again.
        </p>

        <button
          type="button"
          onClick={() => void retry()}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

/**
 * Protects authenticated application routes.
 *
 * This is a frontend navigation guard, not a replacement
 * for backend authentication and authorization.
 */
export function RequireAuth() {
  const { status, isAuthenticated } = useAuth();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (status === "error") {
    return <AuthConnectionError />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/**
 * Keeps authenticated users out of login/signup pages.
 */
export function PublicOnlyRoute() {
  const { status, isAuthenticated } = useAuth();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}


/**
 * Frontend role-based route guard.
 *
 * This controls navigation and page visibility.
 * The backend remains responsible for authorization.
 */
export function RequireRole({
  allowedRoles,
}: {
  allowedRoles: readonly AuthUser["role"][];
}) {
  const { status, isAuthenticated, user } = useAuth();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (status === "error") {
    return <AuthConnectionError />;
  }

  if (!isAuthenticated || user === null) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <main
        className="flex min-h-[65vh] items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-red-600">
            403 - Access denied
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            You do not have permission to view this page
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your account does not have the required role
            for this action.
          </p>

          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Return to dashboard
          </a>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
