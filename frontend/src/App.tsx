import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import {
  PublicOnlyRoute,
  RequireAuth,
  RequireRole,
} from "./components/auth/AuthRouteGuards";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));

const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const DatabaseTicketDetailsPage = lazy(() => import("./pages/DatabaseTicketDetailsPage"));
const BackendTicketsPage = lazy(() => import("./pages/BackendTicketsPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const CreateAssetPage = lazy(() => import("./pages/CreateAssetPage"));
const AssetDetailsPage = lazy(() => import("./pages/AssetDetailsPage"));
const DatabaseAssetDetailsPage = lazy(() => import("./pages/DatabaseAssetDetailsPage"));
const CreateTicketPage = lazy(() => import("./pages/CreateTicketPage"));
const TicketDetailsPage = lazy(() => import("./pages/TicketDetailsPage"));
const PlaceholderPage = lazy(() => import("./pages/PlaceholderPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const TeamMemberDetailsPage = lazy(() => import("./pages/TeamMemberDetailsPage"));
const EditTeamMemberPage = lazy(() => import("./pages/EditTeamMemberPage"));
const CreateTeamMemberPage = lazy(() => import("./pages/CreateTeamMemberPage"));
const GlobalActivityPage = lazy(() => import("./pages/GlobalActivityPage"));

function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading OpsPilot...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Toaster position="top-right" richColors />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/db/:ticketId" element={<DatabaseTicketDetailsPage />} />
            <Route path="backend-tickets" element={<BackendTicketsPage />} />
            <Route path="tickets/new" element={<CreateTicketPage />} />
            <Route element={<RequireRole allowedRoles={["admin", "agent"]} />}>
              <Route path="tickets/:ticketId" element={<TicketDetailsPage />} />
            </Route>

            <Route element={<RequireRole allowedRoles={["admin", "agent"]} />}>
              <Route path="assets" element={<AssetsPage />} />
              <Route path="assets/new" element={<CreateAssetPage />} />
              <Route path="assets/db/:assetId" element={<DatabaseAssetDetailsPage />} />
              <Route path="assets/:assetId" element={<AssetDetailsPage />} />
            </Route>
            <Route element={<RequireRole allowedRoles={["admin", "agent"]} />}>
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
            <Route element={<RequireRole allowedRoles={["admin", "agent"]} />}>
              <Route path="team" element={<TeamPage />} />
            </Route>
<Route element={<RequireRole allowedRoles={["admin"]} />}>
  <Route path="team/new" element={<CreateTeamMemberPage />} />
</Route>
<Route element={<RequireRole allowedRoles={["admin", "agent"]} />}>
  <Route path="team/:memberId" element={<TeamMemberDetailsPage />} />
</Route>
<Route element={<RequireRole allowedRoles={["admin"]} />}>
  <Route path="team/:memberId/edit" element={<EditTeamMemberPage />} />
</Route>
            <Route element={<RequireRole allowedRoles={["admin", "agent"]} />}>
              <Route path="activity" element={<GlobalActivityPage />} />
            </Route>
            <Route path="settings" element={<PlaceholderPage />} />
            <Route path="help" element={<PlaceholderPage />} />

            <Route path="*" element={<PlaceholderPage />} />
          </Route>
          </Route>
        </Routes>
      </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
