import { ArrowLeft, Construction } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const title = pathname.split("/").filter(Boolean).join(" / ") || "Page";

  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Construction size={28} />
        </div>
        <h1 className="mt-6 text-3xl font-bold capitalize text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          This module is planned for an upcoming development milestone.
          The navigation is ready, but no live functionality is available yet.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800">
          <ArrowLeft size={17} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
