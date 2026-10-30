import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each([
    ["/control", "/control"],
    ["/control/login", "/control/login"],
    ["/control/forgot-password", "/control/forgot-password"],
    ["/control/reset-password", "/control/reset-password"],
    ["/control/access-denied", "/control/access-denied"],
    ["/login", "/login"],
    ["/signup", "/signup"],
    ["/profile", "/profile"],
    ["/app", "/app/"],
    ["/app/projects", "/app/projects/"],
    ["/app/projects/prj-1", "/app/projects/$id"],
    ["/app/inventory", "/app/$module"],
    ["/app/knowledge-base", "/app/$module"],
    ["/app/ai-advisor", "/app/$module"],
    ["/app/leads", "/app/leads"],
    ["/app/conversations", "/app/$module"],
    ["/app/visits", "/app/$module"],
    ["/app/creative-studio", "/app/$module"],
    ["/app/campaigns", "/app/$module"],
    ["/app/analytics", "/app/$module"],
    ["/app/team", "/app/team"],
    ["/app/activity", "/app/activity"],
    ["/app/integrations", "/app/$module"],
    ["/app/billing", "/app/$module"],
    ["/app/settings", "/app/$module"],
    ["/app/help", "/app/$module"],
    ["/forgot-password", "/forgot-password"],
    ["/reset-password", "/reset-password"],
    ["/auth/callback", "/auth/callback"],
  ])("matches %s to its Control Center route", (path, routeId) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    expect(router.matchRoutes(path).at(-1)?.routeId).toBe(routeId);
  });
});
