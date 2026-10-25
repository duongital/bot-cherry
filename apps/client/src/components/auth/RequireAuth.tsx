import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "../../lib/auth-client";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const session = authClient.useSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
        <span className="sr-only">Checking your session</span>
      </div>
    );
  }

  if (!session.data) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
