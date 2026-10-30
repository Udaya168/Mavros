import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { repositoryRoot } from "./repository-root";

const migration = readFileSync(
  resolve(repositoryRoot, "supabase/migrations/20261025000000_owner_command_center_metrics.sql"),
  "utf8",
);

describe("Command Center metrics migration contract", () => {
  it("uses the verified owner authorization boundary", () => {
    expect(migration).toContain("create function public.get_mavros_command_center_metrics()");
    expect(migration).not.toContain("p_user_id");
    expect(migration).not.toContain("p_organization_id");
    expect(migration).not.toContain("p_role");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("(select auth.uid())");
    expect(migration).toContain(
      "membership.user_id = 'f2c67a31-2b22-4ba9-86bd-91e9977b4955'::uuid",
    );
    expect(migration).toContain("membership.role = 'owner'");
    expect(migration).toContain("membership.is_active");
    expect(migration).toContain("using errcode = '42501'");
  });

  it("returns only the verified aggregate metrics and status values", () => {
    expect(migration).toContain("returns table");
    for (const column of [
      "organization_count bigint",
      "active_membership_count bigint",
      "project_count bigint",
      "published_project_count bigint",
      "inventory_unit_count bigint",
      "available_inventory_unit_count bigint",
      "lead_count bigint",
    ]) {
      expect(migration).toContain(column);
    }
    expect(migration).toContain("status = 'published'");
    expect(migration).toContain("status = 'available'");
    for (const relation of [
      "public.developer_organizations",
      "public.developer_organization_memberships",
      "public.developer_projects",
      "public.developer_project_units",
      "public.developer_leads",
    ]) {
      expect(migration).toContain(`from ${relation}`);
    }
    expect(migration).not.toMatch(
      /developer_activity_events|developer_tasks|developer_notifications/,
    );
    expect(migration).not.toContain("email");
    expect(migration).not.toContain("full_name");
  });

  it("restricts execution to authenticated callers", () => {
    expect(migration).toContain(
      "revoke all on function public.get_mavros_command_center_metrics() from public, anon, authenticated;",
    );
    expect(migration).toContain(
      "grant execute on function public.get_mavros_command_center_metrics() to authenticated;",
    );
    expect(migration).not.toContain(
      "grant execute on function public.get_mavros_command_center_metrics() to public",
    );
    expect(migration).not.toContain(
      "grant execute on function public.get_mavros_command_center_metrics() to anon",
    );
  });
});
