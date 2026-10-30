import { createFileRoute } from "@tanstack/react-router";

import { ControlAccessDenied } from "@/command-center/access-denied";
import { getControlSession } from "@/lib/control-auth";

export const Route = createFileRoute("/control/access-denied")({
  loader: () => getControlSession(),
  head: () => ({
    meta: [
      { title: "Access denied — Mavros Control Center" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccessDeniedRoute,
});

function AccessDeniedRoute() {
  const session = Route.useLoaderData();
  return (
    <ControlAccessDenied
      authorizationUnavailable={session.authorizationStatus === "unavailable"}
      authorizationErrorCode={
        "authorizationErrorCode" in session ? session.authorizationErrorCode : undefined
      }
    />
  );
}
