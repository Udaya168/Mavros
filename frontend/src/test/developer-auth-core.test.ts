import { describe, expect, it } from "vitest";

import {
  canAccessDeveloperPath,
  INITIAL_MAVROS_DEVELOPER_ID,
  INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID,
  isActiveDeveloperMembership,
  isIntendedDeveloperOrganizationMembership,
} from "@/lib/developer-auth-core";

describe("developer organization membership authorization", () => {
  it("accepts an active membership tied to the authenticated user", () => {
    expect(
      isActiveDeveloperMembership(INITIAL_MAVROS_DEVELOPER_ID, {
        user_id: INITIAL_MAVROS_DEVELOPER_ID,
        role: "owner",
        is_active: true,
      }),
    ).toBe(true);
  });

  it("requires the known developer account to belong to the intended organization", () => {
    expect(
      isIntendedDeveloperOrganizationMembership(INITIAL_MAVROS_DEVELOPER_ID, {
        organization_id: INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID,
        user_id: INITIAL_MAVROS_DEVELOPER_ID,
        role: "owner",
        is_active: true,
      }),
    ).toBe(true);
    expect(
      isIntendedDeveloperOrganizationMembership(INITIAL_MAVROS_DEVELOPER_ID, {
        organization_id: "different-organization",
        user_id: INITIAL_MAVROS_DEVELOPER_ID,
        role: "owner",
        is_active: true,
      }),
    ).toBe(false);
    expect(
      isIntendedDeveloperOrganizationMembership("another-user", {
        organization_id: "their-organization",
        user_id: "another-user",
        role: "owner",
        is_active: true,
      }),
    ).toBe(true);
  });

  it("rejects inactive, mismatched, and unsupported roles", () => {
    expect(
      isActiveDeveloperMembership(INITIAL_MAVROS_DEVELOPER_ID, {
        user_id: INITIAL_MAVROS_DEVELOPER_ID,
        role: "owner",
        is_active: false,
      }),
    ).toBe(false);
    expect(
      isActiveDeveloperMembership(INITIAL_MAVROS_DEVELOPER_ID, {
        user_id: "different-user",
        role: "owner",
        is_active: true,
      }),
    ).toBe(false);
    expect(
      isActiveDeveloperMembership(INITIAL_MAVROS_DEVELOPER_ID, {
        user_id: INITIAL_MAVROS_DEVELOPER_ID,
        role: "superuser",
        is_active: true,
      }),
    ).toBe(false);
  });

  it("restricts portal sections according to each membership role", () => {
    expect(canAccessDeveloperPath(["sales"], "/app/leads")).toBe(true);
    expect(canAccessDeveloperPath(["sales"], "/app/billing")).toBe(false);
    expect(canAccessDeveloperPath(["marketing"], "/app/campaigns")).toBe(true);
    expect(canAccessDeveloperPath(["marketing"], "/app/leads")).toBe(false);
    expect(canAccessDeveloperPath(["owner"], "/app/billing")).toBe(true);
    expect(canAccessDeveloperPath(["owner", "sales"], "/app/billing")).toBe(false);
    expect(canAccessDeveloperPath(["owner", "sales"], "/app/leads")).toBe(true);
  });
});
