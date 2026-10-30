import { describe, expect, it } from "vitest";

import {
  canManageDeveloperData,
  escapeLikeSearch,
  hasOrganizationMembership,
  inventoryUnitInputSchema,
  inventoryTowerUpdateSchema,
  inventoryUnitUpdateSchema,
  organizationActivitySchema,
  organizationTeamMemberSchema,
  projectInputSchema,
} from "@shared/developer-portal/developer-data-core";

describe("developer data authorization helpers and validation", () => {
  it("allows writes only for organization owners and admins", () => {
    expect(canManageDeveloperData("owner")).toBe(true);
    expect(canManageDeveloperData("admin")).toBe(true);
    expect(canManageDeveloperData("sales")).toBe(false);
    expect(canManageDeveloperData("analyst")).toBe(false);
    expect(canManageDeveloperData("unknown")).toBe(false);
  });

  it("does not treat a different organization membership as authorization", () => {
    const activeMemberships = [{ organizationId: "org-a" }];
    expect(hasOrganizationMembership(activeMemberships, "org-a")).toBe(true);
    expect(hasOrganizationMembership(activeMemberships, "org-b")).toBe(false);
  });

  it("validates project payloads and status values", () => {
    const valid = projectInputSchema.safeParse({
      organizationId: "35f8836f-3133-4e9c-875b-84dadad1ca6b",
      name: "Mavros Residences",
      slug: "mavros-residences",
    });
    expect(valid.success).toBe(true);
    expect(
      projectInputSchema.safeParse({
        organizationId: "35f8836f-3133-4e9c-875b-84dadad1ca6b",
        name: "Invalid",
        slug: "INVALID slug",
      }).success,
    ).toBe(false);
    expect(
      projectInputSchema.safeParse({
        organizationId: "not-a-uuid",
        name: "Invalid",
        slug: "valid-slug",
      }).success,
    ).toBe(false);
  });

  it("rejects fabricated or invalid unit values", () => {
    const base = {
      organizationId: "35f8836f-3133-4e9c-875b-84dadad1ca6b",
      projectId: "15f8836f-3133-4e9c-875b-84dadad1ca6b",
      towerName: "Tower A",
      unitNumber: "A-101",
      unitType: "2 BHK",
      areaSqft: 900,
      approvedPrice: null,
      status: "available",
    };
    expect(inventoryUnitInputSchema.safeParse(base).success).toBe(true);
    expect(
      inventoryUnitInputSchema.safeParse({ ...base, organizationId: "not-a-uuid" }).success,
    ).toBe(false);
    expect(inventoryUnitInputSchema.safeParse({ ...base, projectId: "not-a-uuid" }).success).toBe(
      false,
    );
    expect(inventoryUnitInputSchema.safeParse({ ...base, areaSqft: -5 }).success).toBe(false);
    expect(inventoryUnitInputSchema.safeParse({ ...base, approvedPrice: -1 }).success).toBe(false);
    expect(inventoryUnitInputSchema.safeParse({ ...base, status: "reserved" }).success).toBe(false);
  });

  it("validates organization-scoped inventory updates and read models", () => {
    const update = {
      organizationId: "35f8836f-3133-4e9c-875b-84dadad1ca6b",
      id: "15f8836f-3133-4e9c-875b-84dadad1ca6b",
      unitType: "3 BHK",
      areaSqft: 1200,
      approvedPrice: null,
      status: "held",
    };
    expect(inventoryUnitUpdateSchema.safeParse(update).success).toBe(true);
    expect(inventoryUnitUpdateSchema.safeParse({ ...update, id: "not-a-uuid" }).success).toBe(
      false,
    );
    expect(inventoryUnitUpdateSchema.safeParse({ ...update, approvedPrice: -1 }).success).toBe(
      false,
    );
    expect(
      inventoryTowerUpdateSchema.safeParse({
        organizationId: update.organizationId,
        projectId: update.id,
        towerId: update.id,
        name: "North Tower",
      }).success,
    ).toBe(true);
    expect(
      inventoryTowerUpdateSchema.safeParse({
        organizationId: update.organizationId,
        projectId: update.id,
        towerId: "invalid",
        name: "North Tower",
      }).success,
    ).toBe(false);
    expect(
      inventoryTowerUpdateSchema.safeParse({
        organizationId: update.organizationId,
        projectId: update.id,
        towerId: update.id,
        name: " ",
      }).success,
    ).toBe(false);
    expect(
      organizationTeamMemberSchema.safeParse({
        user_id: "15f8836f-3133-4e9c-875b-84dadad1ca6b",
        role: "owner",
        is_active: true,
        full_name: "Organization Member",
      }).success,
    ).toBe(true);
    expect(
      organizationActivitySchema.safeParse({
        id: "15f8836f-3133-4e9c-875b-84dadad1ca6b",
        actor_user_id: null,
        entity_type: "lead",
        entity_id: "25f8836f-3133-4e9c-875b-84dadad1ca6b",
        action: "update",
        created_at: "2026-10-22T00:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("escapes wildcard characters in user-entered search text", () => {
    expect(escapeLikeSearch("Tower_50%\\A")).toBe("Tower\\_50\\%\\\\A");
  });
});
