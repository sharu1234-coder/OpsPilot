import { ArrowLeft, Info } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const { pathname } = useLocation();

  const isSettings = pathname === "/settings";
  const isHelp = pathname === "/help";

  const title = isSettings
    ? "Settings"
    : isHelp
      ? "Help & Support"
      : "Page Not Found";

  const description = isSettings
    ? "Account and organization settings are managed by your administrator. Self-service settings are not available in this release."
    : isHelp
      ? "To report an IT issue, open Tickets and create a new ticket. For account access or administrative support, contact your IT administrator."
      : "The page you requested does not exist or is no longer available.";

  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Info size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {description}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
