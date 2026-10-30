import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { SecurityAuditData } from "@/command-center/dashboard";
import { repositoryRoot } from "./repository-root";

const migration = readFileSync(
  resolve(
    repositoryRoot,
    "supabase/migrations/20261026000000_owner_command_center_security_audit.sql",
  ),
  "utf8",
);

describe("Command Center security audit contract", () => {
  it("keeps the RPC owner-only and returns no sensitive identifiers", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("role = 'owner'");
    expect(migration).toContain("is_active");
    expect(migration).toContain("using errcode = '42501'");
    expect(migration).toContain("revoke all on function");
    expect(migration).toContain("grant execute on function");
    const returnsTable = migration.match(/returns table \(([\s\S]*?)\)\nlanguage/)?.[1] ?? "";
    expect(returnsTable).not.toContain("actor_user_id");
    expect(migration).not.toContain("target_user_id");
    expect(migration).not.toContain("entity_id");
  });

  it("supports only schema-backed audit categories", () => {
    expect(migration).toContain("'activity', 'membership'");
    expect(migration).toContain("developer_activity_events");
    expect(migration).toContain("developer_team_membership_audit");
  });

  it("accepts only the protected, non-sensitive event shape", () => {
    const data: SecurityAuditData = {
      status: "available",
      events: [
        {
          eventId: "event-id",
          category: "activity",
          organizationName: "Mavros",
          actorName: "Authenticated user",
          entityType: "project",
          action: "insert",
          details: "Insert project",
          occurredAt: "2026-10-26T00:00:00Z",
        },
      ],
    };

    expect(data.events[0]).not.toHaveProperty("actorUserId");
    expect(data.events[0]).not.toHaveProperty("targetUserId");
    expect(data.events[0]).not.toHaveProperty("entityId");
  });

  it("represents unavailable RPC results explicitly", () => {
    const data: SecurityAuditData = {
      status: "unavailable",
      errorCode: "42501",
    };

    expect(data.status).toBe("unavailable");
    expect(data.errorCode).toBe("42501");
  });
});
