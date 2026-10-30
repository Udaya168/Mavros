import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock, getDeveloperSessionServerMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getDeveloperSessionServerMock: vi.fn(),
}));

vi.mock("../../../backend/lib/supabase.server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("../../../backend/auth/developer-authentication.server", () => ({
  getDeveloperSessionServer: getDeveloperSessionServerMock,
}));

import {
  listOrganizationTeamServer,
  manageOrganizationTeamMemberServer,
} from "@/developer-portal/developer-data.server";
import { organizationTeamMutationSchema } from "@shared/developer-portal/developer-data-core";

const organizationId = "35f8836f-3133-4e9c-875b-84dadad1ca6b";
const otherOrganizationId = "45f8836f-3133-4e9c-875b-84dadad1ca6b";
const currentUserId = "15f8836f-3133-4e9c-875b-84dadad1ca6b";
const teamMemberId = "25f8836f-3133-4e9c-875b-84dadad1ca6b";

describe("developer team directory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDeveloperSessionServerMock.mockResolvedValue({
      authenticated: true,
      status: "authorized",
      user: { id: currentUserId },
      memberships: [{ organizationId, role: "owner" }],
    });
  });

  it("validates target user, organization, role, and active status before a mutation", () => {
    const valid = {
      organizationId,
      targetUserId: teamMemberId,
      role: "sales",
      isActive: true,
    };
    expect(organizationTeamMutationSchema.safeParse(valid).success).toBe(true);
    expect(
      organizationTeamMutationSchema.safeParse({ ...valid, targetUserId: "invalid" }).success,
    ).toBe(false);
    expect(organizationTeamMutationSchema.safeParse({ ...valid, role: "superuser" }).success).toBe(
      false,
    );
  });

  it("returns only the fields exposed by the narrow team directory RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          user_id: currentUserId,
          role: "owner",
          is_active: true,
          full_name: "Current Owner",
          email: "private@example.com",
        },
        {
          user_id: teamMemberId,
          role: "sales",
          is_active: false,
          full_name: "Former Sales Member",
        },
      ],
      error: null,
    });
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    const members = await listOrganizationTeamServer(organizationId);

    expect(rpc).toHaveBeenCalledWith("list_developer_org_team", {
      p_organization_id: organizationId,
    });
    expect(members).toEqual([
      {
        user_id: currentUserId,
        role: "owner",
        is_active: true,
        full_name: "Current Owner",
      },
      {
        user_id: teamMemberId,
        role: "sales",
        is_active: false,
        full_name: "Former Sales Member",
      },
    ]);
  });

  it("rejects cross-organization directory lookups before calling the RPC", async () => {
    const rpc = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(listOrganizationTeamServer(otherOrganizationId)).rejects.toMatchObject({
      status: 403,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not expose the team directory to non-admin members", async () => {
    getDeveloperSessionServerMock.mockResolvedValue({
      authenticated: true,
      status: "authorized",
      user: { id: currentUserId },
      memberships: [{ organizationId, role: "sales" }],
    });
    const rpc = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(listOrganizationTeamServer(organizationId)).rejects.toMatchObject({
      status: 403,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects access when the session is not authorized", async () => {
    getDeveloperSessionServerMock.mockResolvedValue({
      authenticated: true,
      status: "missing",
      user: { id: currentUserId },
    });
    const rpc = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(listOrganizationTeamServer(organizationId)).rejects.toMatchObject({
      status: 403,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects malformed member records rather than displaying unvalidated roles", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ user_id: teamMemberId, role: "superuser", is_active: true, full_name: "Member" }],
      error: null,
    });
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(listOrganizationTeamServer(organizationId)).rejects.toThrow();
  });

  it("does not permit a member to change their own role or status", async () => {
    const rpc = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(
      manageOrganizationTeamMemberServer({
        organizationId,
        targetUserId: currentUserId,
        role: "admin",
        isActive: true,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects role changes by non-admin membership roles", async () => {
    getDeveloperSessionServerMock.mockResolvedValue({
      authenticated: true,
      status: "authorized",
      user: { id: currentUserId },
      memberships: [{ organizationId, role: "sales" }],
    });
    const rpc = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(
      manageOrganizationTeamMemberServer({
        organizationId,
        targetUserId: teamMemberId,
        role: "admin",
        isActive: true,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("prevents admins from granting owner roles", async () => {
    getDeveloperSessionServerMock.mockResolvedValue({
      authenticated: true,
      status: "authorized",
      user: { id: currentUserId },
      memberships: [{ organizationId, role: "admin" }],
    });
    const rpc = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(
      manageOrganizationTeamMemberServer({
        organizationId,
        targetUserId: teamMemberId,
        role: "owner",
        isActive: true,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects membership mutation outside the manager's organization", async () => {
    const rpc = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(
      manageOrganizationTeamMemberServer({
        organizationId: otherOrganizationId,
        targetUserId: teamMemberId,
        role: "sales",
        isActive: false,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends permitted membership changes only through the scoped database RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    createSupabaseServerClientMock.mockReturnValue({ rpc });

    await expect(
      manageOrganizationTeamMemberServer({
        organizationId,
        targetUserId: teamMemberId,
        role: "marketing",
        isActive: true,
      }),
    ).resolves.toEqual({ success: true });
    expect(rpc).toHaveBeenCalledWith("manage_developer_org_member", {
      p_organization_id: organizationId,
      p_target_user_id: teamMemberId,
      p_role: "marketing",
      p_is_active: true,
    });
  });
});
