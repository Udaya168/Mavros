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
  createInventoryUnitServer,
  updateInventoryTowerServer,
  updateInventoryUnitServer,
} from "@/developer-portal/developer-data.server";

const organizationId = "35f8836f-3133-4e9c-875b-84dadad1ca6b";
const projectId = "15f8836f-3133-4e9c-875b-84dadad1ca6b";
const towerId = "25f8836f-3133-4e9c-875b-84dadad1ca6b";
const unitId = "45f8836f-3133-4e9c-875b-84dadad1ca6b";
const userId = "55f8836f-3133-4e9c-875b-84dadad1ca6b";

function queryBuilder(result: { data: unknown; error: { code?: string } | null }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  };
  return builder;
}

function configureSupabase(
  resultsByTable: Record<string, Array<{ data: unknown; error: { code?: string } | null }>>,
) {
  const client = {
    from: vi.fn((table: string) => {
      const result = resultsByTable[table]?.shift();
      if (!result) throw new Error(`Unexpected query for ${table}`);
      return queryBuilder(result);
    }),
  };
  createSupabaseServerClientMock.mockReturnValue(client);
  return client;
}

function setMembership(role: string) {
  getDeveloperSessionServerMock.mockResolvedValue({
    authenticated: true,
    status: "authorized",
    user: { id: userId },
    memberships: [{ organizationId, role }],
  });
}

const successful = (data: unknown) => ({ data, error: null });

describe("organization-scoped inventory server operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMembership("owner");
  });

  it("creates a unit only after resolving its project and tower in the organization", async () => {
    const client = configureSupabase({
      developer_projects: [successful({ id: projectId })],
      developer_project_towers: [successful(null), successful({ id: towerId })],
      developer_project_units: [successful({ id: unitId })],
    });

    await expect(
      createInventoryUnitServer({
        organizationId,
        projectId,
        towerName: "Tower A",
        unitNumber: "A-101",
        unitType: "2 BHK",
        areaSqft: 900,
        approvedPrice: 12_500_000,
        status: "available",
      }),
    ).resolves.toEqual({ id: unitId });
    expect(client.from).toHaveBeenNthCalledWith(1, "developer_projects");
    expect(client.from).toHaveBeenNthCalledWith(2, "developer_project_towers");
    expect(client.from).toHaveBeenNthCalledWith(3, "developer_project_towers");
    expect(client.from).toHaveBeenNthCalledWith(4, "developer_project_units");
    expect(client.from.mock.results[0]?.value.eq).toHaveBeenCalledWith(
      "organization_id",
      organizationId,
    );
    expect(client.from.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", projectId);
    expect(client.from.mock.results[1]?.value.eq).toHaveBeenCalledWith(
      "organization_id",
      organizationId,
    );
    expect(client.from.mock.results[1]?.value.eq).toHaveBeenCalledWith("project_id", projectId);
  });

  it("rejects a project that is not visible in the requested organization", async () => {
    const client = configureSupabase({
      developer_projects: [successful(null)],
    });

    await expect(
      createInventoryUnitServer({
        organizationId,
        projectId,
        towerName: "Tower A",
        unitNumber: "A-101",
        unitType: "2 BHK",
        areaSqft: null,
        approvedPrice: null,
        status: "available",
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it("denies inventory creation to non-owner and non-admin roles", async () => {
    setMembership("sales");
    const client = configureSupabase({});

    await expect(
      createInventoryUnitServer({
        organizationId,
        projectId,
        towerName: "Tower A",
        unitNumber: "A-101",
        unitType: "2 BHK",
        areaSqft: null,
        approvedPrice: null,
        status: "available",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("updates only supported unit fields within the requested organization", async () => {
    const client = configureSupabase({
      developer_project_units: [successful({ id: unitId })],
    });

    await expect(
      updateInventoryUnitServer({
        organizationId,
        id: unitId,
        unitType: "3 BHK",
        areaSqft: 1250,
        approvedPrice: 15_000_000,
        status: "held",
      }),
    ).resolves.toEqual({ id: unitId });
    expect(client.from).toHaveBeenCalledWith("developer_project_units");
  });

  it("returns not-found for a tower outside the requested project scope", async () => {
    const client = configureSupabase({
      developer_project_towers: [successful(null)],
    });

    await expect(
      updateInventoryTowerServer({
        organizationId,
        projectId,
        towerId,
        name: "North Tower",
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(client.from.mock.results[0]?.value.eq).toHaveBeenCalledWith(
      "organization_id",
      organizationId,
    );
    expect(client.from.mock.results[0]?.value.eq).toHaveBeenCalledWith("project_id", projectId);
    expect(client.from.mock.results[0]?.value.eq).toHaveBeenCalledWith("id", towerId);
  });

  it("surfaces database authorization failures without treating the mutation as successful", async () => {
    configureSupabase({
      developer_project_units: [{ data: null, error: { code: "42501" } }],
    });

    await expect(
      updateInventoryUnitServer({
        organizationId,
        id: unitId,
        unitType: "3 BHK",
        areaSqft: 1250,
        approvedPrice: 15_000_000,
        status: "held",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("surfaces unexpected database failures for retry instead of reporting success", async () => {
    configureSupabase({
      developer_project_units: [{ data: null, error: { code: "XX000" } }],
    });

    await expect(
      updateInventoryUnitServer({
        organizationId,
        id: unitId,
        unitType: "3 BHK",
        areaSqft: 1250,
        approvedPrice: 15_000_000,
        status: "held",
      }),
    ).rejects.toMatchObject({ status: 502 });
  });
});
