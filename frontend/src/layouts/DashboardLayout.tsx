import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "../components/layout/AppSidebar";
import AppHeader from "../components/layout/AppHeader";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={`min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-[82px]" : "lg:pl-[258px]"}`}>
        <AppHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1600px] px-5 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
