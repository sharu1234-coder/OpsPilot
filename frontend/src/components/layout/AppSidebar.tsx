import {
  Activity, BarChart3, ChevronLeft, ChevronRight,
  CircleHelp, LayoutDashboard, LifeBuoy, Monitor,
  Settings2, ShieldCheck, Users, X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/authContextState";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, to: "/" },
  { label: "Tickets", icon: LifeBuoy, to: "/tickets" },
  { label: "Assets", icon: Monitor, to: "/assets" },
  { label: "Analytics", icon: BarChart3, to: "/analytics" },
  { label: "Team", icon: Users, to: "/team" },
];

type Props = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
};

export default function AppSidebar({
  collapsed, setCollapsed, mobileOpen, setMobileOpen
}: Props) {
  const { user } = useAuth();

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-[#0B1220] text-slate-300 transition-all duration-300
        ${collapsed ? "lg:w-[82px]" : "lg:w-[258px]"}
        w-[258px] ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={22} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-lg font-bold tracking-tight text-white">OpsPilot</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">
                  Enterprise Cloud
                </p>
              </div>
            )}
          </div>
          <button className="lg:hidden" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>}
          <nav className="space-y-1" aria-label="Main navigation">
            {navigation
              .filter(({ to }) =>
                (to !== "/team" && to !== "/analytics" && to !== "/assets") ||
                user?.role === "admin" ||
                user?.role === "agent"
              )
              .map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                onClick={() => setMobileOpen(false)}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors
                  ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "hover:bg-white/8 hover:text-white"}`
                }
              >
                <Icon size={19} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="my-6 border-t border-white/10" />
          {!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">System</p>}
          <nav className="space-y-1" aria-label="System navigation">
            {[
              { label: "Activity Log", icon: Activity, to: "/activity" },
              { label: "Settings", icon: Settings2, to: "/settings" },
              { label: "Help & Support", icon: CircleHelp, to: "/help" },
            ]
              .filter(({ to }) =>
                to !== "/activity" ||
                user?.role === "admin" ||
                user?.role === "agent"
              )
              .map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors
                  ${isActive ? "bg-blue-600 text-white" : "hover:bg-white/8 hover:text-white"}`
                }
              >
                <Icon size={19} className="shrink-0" />
                {!collapsed && label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <Activity size={18} />
            </div>
            {!collapsed && (
              <div>
                <p className="text-xs font-semibold text-white">System Operational</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Demo environment</p>
              </div>
            )}
          </div>
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
            className="mt-3 hidden w-full items-center justify-center rounded-lg py-2 text-slate-400 hover:bg-white/10 hover:text-white lg:flex"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
