import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { repositoryRoot } from "./repository-root";

const migration = readFileSync(
  resolve(
    repositoryRoot,
    "supabase/migrations/20261027000000_owner_command_center_support_requests.sql",
  ),
  "utf8",
);

describe("Command Center support request contract", () => {
  it("restricts the RPC to the verified active owner", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("role = 'owner'");
    expect(migration).toContain("is_active");
    expect(migration).toContain("using errcode = '42501'");
    expect(migration).toContain("revoke all on function");
    expect(migration).toContain("grant execute on function");
  });

  it("uses only schema-verified statuses and safe display fields", () => {
    expect(migration).toContain("'open', 'in_progress', 'resolved', 'closed'");
    expect(migration).toContain("developer_support_requests");
    expect(migration).toContain("subject");
    expect(migration).toContain("left(support_request.message, 240)");
    expect(migration).not.toContain("requested_by uuid");
    expect(migration).not.toContain("organization_id uuid");
    expect(migration).not.toContain("priority");
  });
});
