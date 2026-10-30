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
  listContactsServer,
  saveArticleServer,
  saveCampaignServer,
  saveTaskServer,
  updateSupportRequestStatusServer,
} from "@/developer-portal/workspace-data.server";

const organizationId = "35f8836f-3133-4e9c-875b-84dadad1ca6b";
const otherOrganizationId = "45f8836f-3133-4e9c-875b-84dadad1ca6b";
const userId = "15f8836f-3133-4e9c-875b-84dadad1ca6b";
const otherUserId = "25f8836f-3133-4e9c-875b-84dadad1ca6b";
const recordId = "35f8836f-3133-4e9c-875b-84dadad1ca6b";

function makeUpdateQuery(data: { id: string } | null, error: { code: string } | null = null) {
  const query = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data, error });
  return query;
}

function setSession(role: string, sessionOrganizationId = organizationId) {
  getDeveloperSessionServerMock.mockResolvedValue({
    authenticated: true,
    status: "authorized",
    user: { id: userId },
    memberships: [{ organizationId: sessionOrganizationId, role }],
  });
}

describe("organization workflow server authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSession("owner");
  });

  it("scopes contact search and pagination to the active organization", async () => {
    const queryResult = {
      data: [{ id: "lead-id", full_name: "Test Contact" }],
      count: 1,
      error: null,
    };
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      range: vi.fn(() => query),
      or: vi.fn(() => query),
      then: (resolve: (result: typeof queryResult) => unknown) =>
        Promise.resolve(queryResult).then(resolve),
    };
    createSupabaseServerClientMock.mockReturnValue({
      from: vi.fn(() => query),
    });

    const result = await listContactsServer({ organizationId, search: "Test", page: 0 });

    expect(result.contacts).toHaveLength(1);
    expect(query.eq).toHaveBeenCalledWith("organization_id", organizationId);
    expect(query.or).toHaveBeenCalled();
    expect(query.range).toHaveBeenCalledWith(0, 99);
  });

  it("rejects contact access to a different organization before querying data", async () => {
    const from = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ from });

    await expect(
      listContactsServer({ organizationId: otherOrganizationId, search: "", page: 0 }),
    ).rejects.toMatchObject({ status: 403 });
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects sales assignment to another user", async () => {
    setSession("sales");
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const from = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc, from });

    await expect(
      saveTaskServer({
        organizationId,
        title: "Follow up",
        description: "",
        dueAt: null,
        assignedTo: otherUserId,
        status: "open",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(rpc).toHaveBeenCalledWith("is_active_developer_org_member", {
      p_organization_id: organizationId,
      p_user_id: otherUserId,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects task creation for an organization without active membership", async () => {
    const rpc = vi.fn();
    const from = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ rpc, from });

    await expect(
      saveTaskServer({
        organizationId: otherOrganizationId,
        title: "Follow up",
        description: "",
        dueAt: null,
        assignedTo: userId,
        status: "open",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("updates a campaign only through the caller's authorized organization scope", async () => {
    const query = makeUpdateQuery({ id: recordId });
    const from = vi.fn(() => query);
    createSupabaseServerClientMock.mockReturnValue({ from });

    await expect(
      saveCampaignServer({
        organizationId,
        id: recordId,
        projectId: null,
        name: "Spring launch",
        channel: "email",
        status: "planned",
        plannedBudget: 2500,
        startsOn: "2026-10-22",
        endsOn: "2026-11-01",
      }),
    ).resolves.toEqual({ id: recordId });

    expect(from).toHaveBeenCalledWith("developer_campaigns");
    expect(query.update).toHaveBeenCalledWith({
      project_id: null,
      name: "Spring launch",
      channel: "email",
      status: "planned",
      planned_budget: 2500,
      starts_on: "2026-10-22",
      ends_on: "2026-11-01",
    });
    expect(query.eq).toHaveBeenNthCalledWith(1, "organization_id", organizationId);
    expect(query.eq).toHaveBeenNthCalledWith(2, "id", recordId);
  });

  it("allows article edits only for an authorized marketing-capable role", async () => {
    setSession("sales");
    const from = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ from });

    await expect(
      saveArticleServer({
        organizationId,
        id: recordId,
        title: "Updated article",
        category: "sales",
        content: "Approved content",
        status: "published",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(from).not.toHaveBeenCalled();
  });

  it("updates support-request status for admins and scopes the mutation to the organization", async () => {
    setSession("admin");
    const query = makeUpdateQuery({ id: recordId });
    const from = vi.fn(() => query);
    createSupabaseServerClientMock.mockReturnValue({ from });

    await expect(
      updateSupportRequestStatusServer({
        organizationId,
        requestId: recordId,
        status: "resolved",
      }),
    ).resolves.toEqual({ id: recordId });
    expect(from).toHaveBeenCalledWith("developer_support_requests");
    expect(query.update).toHaveBeenCalledWith({ status: "resolved" });
    expect(query.eq).toHaveBeenNthCalledWith(1, "organization_id", organizationId);
    expect(query.eq).toHaveBeenNthCalledWith(2, "id", recordId);
  });

  it("rejects support status changes by non-admins before querying", async () => {
    setSession("sales");
    const from = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ from });

    await expect(
      updateSupportRequestStatusServer({
        organizationId,
        requestId: recordId,
        status: "closed",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects support status changes across organizations before querying", async () => {
    const from = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ from });

    await expect(
      updateSupportRequestStatusServer({
        organizationId: otherOrganizationId,
        requestId: recordId,
        status: "closed",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(from).not.toHaveBeenCalled();
  });

  it("reports a support request that is not visible in the authorized organization", async () => {
    const query = makeUpdateQuery(null);
    const from = vi.fn(() => query);
    createSupabaseServerClientMock.mockReturnValue({ from });

    await expect(
      updateSupportRequestStatusServer({
        organizationId,
        requestId: recordId,
        status: "resolved",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
