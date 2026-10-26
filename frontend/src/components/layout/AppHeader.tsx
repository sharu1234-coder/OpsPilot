import { useState } from "react";
import { Bell, LogOut, Menu, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/authContextState";

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setLogoutError(null);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={21} />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">Acme Corporation</p>
          <p className="text-xs text-slate-400">IT Operations Workspace · Demo</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 md:flex">
          <Search size={16} />
          <span className="w-32 text-xs lg:w-44">Search workspace...</span>
          <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px]">Soon</span>
        </div>
        <button
          onClick={() => navigate("/tickets/new")}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-4 sm:text-sm"
        >
          <Plus size={17} /> New Ticket
        </button>
        <button
          aria-label="Notifications (coming soon)"
          title="Notifications coming soon"
          disabled
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-400"
        >
          <Bell size={19} />
        </button>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
          title={user ? `${user.email} (${user.role})` : "OpsPilot account"}
          aria-label="Signed-in account"
        >
          {user?.email.slice(0, 2).toUpperCase() ?? "OP"}
        </div>

        <div className="hidden max-w-36 min-w-0 xl:block">
          <p className="truncate text-xs font-semibold text-slate-800">
            {user?.email ?? "Account"}
          </p>
          <p className="text-[11px] capitalize text-slate-500">
            {user?.role ?? ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={signingOut}
          aria-label="Sign out of OpsPilot"
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={16} aria-hidden="true" />
          <span className="hidden sm:inline">
            {signingOut ? "Signing out..." : "Sign out"}
          </span>
        </button>

        {logoutError && (
          <p
            role="alert"
            className="absolute right-5 top-[72px] z-50 max-w-xs rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 shadow-lg"
          >
            {logoutError}
          </p>
        )}
      </div>
    </header>
  );
}
