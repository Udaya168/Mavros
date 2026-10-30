import { describe, expect, it } from "vitest";

import {
  canDeleteLeads,
  canManageLeads,
  canTransitionLeadStatus,
  buildLeadSearchFilter,
  escapeLeadSearch,
  hasLeadOrganizationAccess,
  isLeadVisibleForFilters,
  leadDatabaseErrorStatus,
  leadFollowUpState,
  leadInputSchema,
  leadSearchSchema,
} from "@shared/developer-portal/leads-core";

const organizationId = "35f8836f-3133-4e9c-875b-84dadad1ca6b";

describe("developer lead validation and permissions", () => {
  it("normalizes email and phone and rejects invalid values or budget ranges", () => {
    const parsed = leadInputSchema.safeParse({
      organizationId,
      fullName: "  Ada Developer  ",
      email: "  ADA@EXAMPLE.COM ",
      phone: "+1 (415) 555-0123",
      budgetMin: "100",
      budgetMax: "200",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.fullName).toBe("Ada Developer");
      expect(parsed.data.email).toBe("ada@example.com");
      expect(parsed.data.phone).toBe("+14155550123");
      expect(parsed.data.budgetMin).toBe(100);
      expect(parsed.data.budgetMax).toBe(200);
    }
    expect(
      leadInputSchema.safeParse({
        organizationId,
        fullName: "Invalid",
        email: "not-an-email",
        phone: "not-a-phone",
      }).success,
    ).toBe(false);
    expect(
      leadInputSchema.safeParse({
        organizationId,
        fullName: "Invalid budget",
        budgetMin: 200,
        budgetMax: 100,
      }).success,
    ).toBe(false);
    expect(
      leadInputSchema.safeParse({
        organizationId,
        fullName: "Invalid follow up",
        nextFollowUpAt: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("enforces membership isolation and separates edit from delete permissions", () => {
    expect(hasLeadOrganizationAccess([{ organizationId, role: "owner" }], organizationId)).toBe(
      true,
    );
    expect(
      hasLeadOrganizationAccess(
        [{ organizationId: "different-org", role: "owner" }],
        organizationId,
      ),
    ).toBe(false);
    expect(canManageLeads("sales")).toBe(true);
    expect(canManageLeads("analyst")).toBe(false);
    expect(canDeleteLeads("owner")).toBe(true);
    expect(canDeleteLeads("admin")).toBe(false);
    expect(canDeleteLeads("sales")).toBe(false);
  });

  it("enforces the lead workflow and terminal outcomes", () => {
    expect(canTransitionLeadStatus("new", "contacted")).toBe(true);
    expect(canTransitionLeadStatus("contacted", "qualified")).toBe(true);
    expect(canTransitionLeadStatus("qualified", "site_visit")).toBe(true);
    expect(canTransitionLeadStatus("site_visit", "negotiation")).toBe(true);
    expect(canTransitionLeadStatus("negotiation", "won")).toBe(true);
    expect(canTransitionLeadStatus("new", "won")).toBe(false);
    expect(canTransitionLeadStatus("won", "new")).toBe(false);
    expect(canTransitionLeadStatus("lost", "contacted")).toBe(false);
  });

  it("validates search filters and escapes PostgREST search syntax", () => {
    expect(
      leadSearchSchema.safeParse({
        organizationId,
        search: "ada@example.com",
        assignedTo: "unassigned",
        page: 1,
      }).success,
    ).toBe(true);
    expect(leadSearchSchema.safeParse({ organizationId, page: -1 }).success).toBe(false);
    expect(escapeLeadSearch('test,(x)."y"')).toBe(String.raw`test,(x).\"y\"`);
    expect(buildLeadSearchFilter("ada@example.com")).toBe(
      'full_name.ilike."%ada@example.com%",email.ilike."%ada@example.com%",phone.ilike."%ada@example.com%"',
    );
    expect(
      isLeadVisibleForFilters(
        {
          project_id: null,
          status: "new",
          source: "website",
          assigned_to: null,
        },
        {
          projectId: null,
          status: "new",
          source: "website",
          assignedTo: "unassigned",
        },
      ),
    ).toBe(true);
    expect(
      isLeadVisibleForFilters(
        {
          project_id: null,
          status: "new",
          source: "website",
          assigned_to: "user-1",
        },
        {
          projectId: null,
          status: "new",
          source: "website",
          assignedTo: "unassigned",
        },
      ),
    ).toBe(false);
  });

  it("maps database errors to visible client-safe response categories", () => {
    expect(leadDatabaseErrorStatus("23505")).toBe(409);
    expect(leadDatabaseErrorStatus("23503")).toBe(400);
    expect(leadDatabaseErrorStatus("23514")).toBe(400);
    expect(leadDatabaseErrorStatus("42501")).toBe(403);
    expect(leadDatabaseErrorStatus("unexpected")).toBe(502);
  });

  it("classifies follow-ups as overdue, upcoming, or absent", () => {
    const now = Date.parse("2026-10-21T12:00:00.000Z");
    expect(leadFollowUpState("2026-10-21T11:00:00.000Z", now)).toBe("overdue");
    expect(leadFollowUpState("2026-10-21T13:00:00.000Z", now)).toBe("upcoming");
    expect(leadFollowUpState(null, now)).toBe("none");
  });
});
