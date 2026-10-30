import { describe, expect, it } from "vitest";

import {
  getPostLoginDestination,
  INITIAL_MAVROS_OWNER_ID,
  isAuthorizedMavrosOwner,
} from "@/lib/control-auth-core";

describe("Mavros owner membership authorization", () => {
  it.each([
    ["owner", "/control"],
    ["developer", "/app"],
    ["user", "/"],
  ] as const)("routes the authorized %s role to %s", (role, destination) => {
    expect(getPostLoginDestination(role)).toBe(destination);
  });

  it("accepts an active owner membership", () => {
    expect(
      isAuthorizedMavrosOwner(INITIAL_MAVROS_OWNER_ID, {
        user_id: INITIAL_MAVROS_OWNER_ID,
        role: "owner",
        is_active: true,
      }),
    ).toBe(true);
  });

  it("rejects inactive, mismatched, missing, and non-owner memberships", () => {
    expect(isAuthorizedMavrosOwner(INITIAL_MAVROS_OWNER_ID, null)).toBe(false);
    expect(
      isAuthorizedMavrosOwner(INITIAL_MAVROS_OWNER_ID, {
        user_id: INITIAL_MAVROS_OWNER_ID,
        role: "owner",
        is_active: false,
      }),
    ).toBe(false);
    expect(
      isAuthorizedMavrosOwner(INITIAL_MAVROS_OWNER_ID, {
        user_id: "someone-else",
        role: "owner",
        is_active: true,
      }),
    ).toBe(false);
    expect(
      isAuthorizedMavrosOwner(INITIAL_MAVROS_OWNER_ID, {
        user_id: INITIAL_MAVROS_OWNER_ID,
        role: "admin",
        is_active: true,
      }),
    ).toBe(false);
    expect(
      isAuthorizedMavrosOwner("normal-user", {
        user_id: "normal-user",
        role: "owner",
        is_active: true,
      }),
    ).toBe(false);
  });
});
