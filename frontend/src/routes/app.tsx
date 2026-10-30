import { createFileRoute, redirect } from "@tanstack/react-router";

import { DeveloperLayout } from "@/developer-portal";
import { getDeveloperSession } from "@/lib/developer-auth";
import { canAccessDeveloperPath } from "@/lib/developer-auth-core";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    const session = await getDeveloperSession();
    if (!session.authenticated && session.status === "unauthenticated") {
      throw redirect({
        to: "/login",
        search: { returnTo: location.href },
      });
    }
    if (session.status === "unavailable") {
      throw new Response(
        "Developer organization access could not be verified. Check the membership migration, RLS policies, and Supabase configuration.",
        { status: 503 },
      );
    }
    if (session.status !== "authorized" || !("memberships" in session)) {
      throw new Response(
        "Developer Portal access requires an active membership in a developer organization.",
        { status: 403 },
      );
    }
    if (
      !canAccessDeveloperPath(
        session.memberships.map((membership) => membership.role),
        location.pathname,
      )
    ) {
      throw new Response("Your developer organization role cannot access this section.", {
        status: 403,
      });
    }
    return { developerSession: session };
  },
  head: () => ({
    meta: [
      { title: "Workspace — Mavros RealtyAI" },
      { name: "description", content: "Developer workspace for projects, inventory and leads." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DeveloperLayout,
});
