import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { repositoryRoot } from "./repository-root";

const dashboard = readFileSync(
  resolve(repositoryRoot, "frontend/src/command-center/dashboard.tsx"),
  "utf8",
);
const serverAuth = readFileSync(
  resolve(repositoryRoot, "backend/auth/control-authentication.server.ts"),
  "utf8",
);
const route = readFileSync(resolve(repositoryRoot, "frontend/src/routes/control.tsx"), "utf8");
const migrationDirectory = resolve(repositoryRoot, "supabase/migrations");

describe("Command Center full integration contract", () => {
  it("keeps all six sections in the owner dashboard contract", () => {
    for (const section of [
      "Organizations & projects",
      "Security & audit",
      "Support & issues",
      "Features & configuration",
      "Background jobs",
      "Usage & billing",
    ]) {
      expect(dashboard).toContain(section);
    }

    for (const property of [
      "securityAudit",
      "supportRequests",
      "configuration",
      "backgroundJobs",
      "usageBilling",
    ]) {
      expect(dashboard).toContain(property);
    }
  });

  it("loads every section through the authenticated route path", () => {
    for (const loader of [
      "getControlDashboard",
      "listControlSecurityAudit",
      "listControlSupportRequests",
      "getControlConfiguration",
      "getControlBackgroundJobs",
      "getControlUsageBilling",
    ]) {
      expect(route).toContain(loader);
    }

    expect(route).toContain('session.authorizationStatus === "unauthenticated"');
    expect(route).toContain("Control Center access could not be verified.");
    expect(route).toContain('if (!staff) throw redirect({ to: "/control/access-denied" })');
    expect(route).toContain("function loadControlSection");
    expect(route).toContain("await Promise.all([");
    expect(route).toContain("if (isAuthorizationFailure(error)) throw error;");
  });

  it("rechecks owner authorization in every server-side section helper", () => {
    for (const helper of [
      "getControlDashboardServer",
      "listControlSecurityAuditServer",
      "listControlSupportRequestsServer",
      "getControlConfigurationServer",
      "getControlBackgroundJobsServer",
      "getControlUsageBillingServer",
    ]) {
      const start = serverAuth.indexOf(`export async function ${helper}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const body = serverAuth.slice(
        start,
        serverAuth.indexOf("\nexport async function", start + 1),
      );
      expect(body).toContain("getAuthenticatedStaff(supabase)");
      expect(body).toContain(
        'throw new Response("Control Center access denied.", { status: 403 })',
      );
    }
  });

  it("keeps the expected deployed RPC migration files local and separate", () => {
    expect(
      readFileSync(
        resolve(migrationDirectory, "20261025000000_owner_command_center_metrics.sql"),
        "utf8",
      ),
    ).toContain("create function public.get_mavros_command_center_metrics()");
    expect(
      readFileSync(
        resolve(migrationDirectory, "20261026000000_owner_command_center_security_audit.sql"),
        "utf8",
      ),
    ).toContain("create function public.list_mavros_command_center_security_audit(");
    expect(
      readFileSync(
        resolve(migrationDirectory, "20261027000000_owner_command_center_support_requests.sql"),
        "utf8",
      ),
    ).toContain("create function public.list_mavros_command_center_support_requests(");
  });
});
