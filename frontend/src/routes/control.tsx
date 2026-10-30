import { useState } from "react";
import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";

import { ControlCenterDashboard, ControlCenterLoading } from "@/command-center/dashboard";
import {
  getControlDashboard,
  getControlConfiguration,
  getControlBackgroundJobs,
  getControlSession,
  getControlUsageBilling,
  listControlSecurityAudit,
  listControlSupportRequests,
  signOutControlStaff,
} from "@/lib/control-auth";

function isAuthorizationFailure(error: unknown): error is Response {
  return error instanceof Response && (error.status === 401 || error.status === 403);
}

async function loadControlSection<T, F>(loader: () => Promise<T>, fallback: F): Promise<T | F> {
  try {
    return await loader();
  } catch (error) {
    if (isAuthorizationFailure(error)) throw error;
    console.error("[control-route]", { stage: "section-loader" });
    return fallback;
  }
}

export const Route = createFileRoute("/control")({
  beforeLoad: async ({ location }) => {
    if (!/^\/control\/?$/.test(location.pathname)) return;
    const session = await getControlSession();
    if (!session.authenticated && session.authorizationStatus === "unauthenticated") {
      throw redirect({ to: "/control/login" });
    }
    if (!session.authenticated && session.authorizationStatus === "unavailable") {
      throw new Response(
        "Control Center access could not be verified. Check the server Supabase configuration and try again.",
        { status: 503 },
      );
    }
    if (!session.authenticated) {
      throw new Response("Control Center authentication could not be verified.", { status: 401 });
    }
    const { staff } = session;
    if (!staff) throw redirect({ to: "/control/access-denied" });

    const dashboard = await loadControlSection(() => getControlDashboard(), {
      staff,
      metrics: {
        status: "unavailable",
        errorCode: "request_failed",
      },
    } as const);
    const [securityAudit, supportRequests, configuration, backgroundJobs, usageBilling] =
      await Promise.all([
        loadControlSection(() => listControlSecurityAudit({ data: { category: "all" } }), {
          status: "unavailable",
          errorCode: "request_failed",
        } as const),
        loadControlSection(() => listControlSupportRequests({ data: { status: "all" } }), {
          status: "unavailable",
          errorCode: "request_failed",
        } as const),
        loadControlSection(() => getControlConfiguration(), {
          status: "unavailable",
          errorCode: "request_failed",
        } as const),
        loadControlSection(() => getControlBackgroundJobs(), {
          status: "unavailable",
          reason: "Control Center section could not be loaded.",
        } as const),
        loadControlSection(() => getControlUsageBilling(), {
          status: "unavailable",
          reason: "Control Center section could not be loaded.",
        } as const),
      ]);
    return {
      dashboard: {
        ...dashboard,
        securityAudit,
        supportRequests,
        configuration,
        backgroundJobs,
        usageBilling,
      },
    };
  },
  pendingComponent: ControlCenterLoading,
  head: () => ({
    meta: [
      { title: "Control Center — Mavros" },
      { name: "description", content: "Restricted Mavros operations console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Control,
});

function Control() {
  const location = useLocation();
  const routeContext = Route.useRouteContext();
  const dashboard = "dashboard" in routeContext ? routeContext.dashboard : undefined;
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    setSignOutError("");
    try {
      const result = await signOutControlStaff();
      if (!result.success) {
        setSignOutError("Sign out could not be completed. Please try again.");
        return;
      }
      window.location.assign("/control/login");
    } catch {
      setSignOutError("Sign out could not be completed. Please try again.");
    }
  }

  if (!/^\/control\/?$/.test(location.pathname) || !dashboard) return <Outlet />;

  return (
    <ControlCenterDashboard
      dashboard={dashboard}
      onSignOut={handleSignOut}
      signOutError={signOutError}
    />
  );
}
