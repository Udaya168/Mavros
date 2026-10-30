import { createServerFn } from "@tanstack/react-start";

import {
  inventorySearchSchema,
  inventoryTowerUpdateSchema,
  inventoryUnitInputSchema,
  inventoryUnitUpdateSchema,
  organizationInputSchema,
  organizationTeamMutationSchema,
  projectIdInputSchema,
  projectInputSchema,
  projectSearchSchema,
} from "@shared/developer-portal/developer-data-core";

export const getDeveloperDashboard = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { getDeveloperDashboardServer } = await import("./developer-data.server");
    return getDeveloperDashboardServer(data.organizationId);
  });

export const getDeveloperReports = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { getDeveloperReportsServer } = await import("./developer-data.server");
    return getDeveloperReportsServer(data.organizationId);
  });

export const listDeveloperOrganizationTeam = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listOrganizationTeamServer } = await import("./developer-data.server");
    return listOrganizationTeamServer(data.organizationId);
  });

export const manageDeveloperOrganizationTeamMember = createServerFn({ method: "POST" })
  .validator((input: unknown) => organizationTeamMutationSchema.parse(input))
  .handler(async ({ data }) => {
    const { manageOrganizationTeamMemberServer } = await import("./developer-data.server");
    return manageOrganizationTeamMemberServer(data);
  });

export const listDeveloperOrganizationTeamAudit = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listOrganizationTeamAuditServer } = await import("./developer-data.server");
    return listOrganizationTeamAuditServer(data.organizationId);
  });

export const listDeveloperOrganizationActivity = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listOrganizationActivityServer } = await import("./developer-data.server");
    return listOrganizationActivityServer(data.organizationId);
  });

export const listDeveloperProjects = createServerFn({ method: "GET" })
  .validator((input: unknown) => projectSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const { listProjectsServer } = await import("./developer-data.server");
    return listProjectsServer(data);
  });

export const getDeveloperProject = createServerFn({ method: "GET" })
  .validator((input: unknown) => projectIdInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { getProjectServer } = await import("./developer-data.server");
    return getProjectServer(data);
  });

export const saveDeveloperProject = createServerFn({ method: "POST" })
  .validator((input: unknown) => projectInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { saveProjectServer } = await import("./developer-data.server");
    const { id, ...project } = data;
    return saveProjectServer({
      ...project,
      ...(id ? { id } : {}),
    });
  });

export const listDeveloperInventory = createServerFn({ method: "GET" })
  .validator((input: unknown) => inventorySearchSchema.parse(input))
  .handler(async ({ data }) => {
    const { listInventoryServer } = await import("./developer-data.server");
    return listInventoryServer(data);
  });

export const createDeveloperInventoryUnit = createServerFn({ method: "POST" })
  .validator((input: unknown) => inventoryUnitInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { createInventoryUnitServer } = await import("./developer-data.server");
    return createInventoryUnitServer(data);
  });

export const updateDeveloperInventoryUnit = createServerFn({ method: "POST" })
  .validator((input: unknown) => inventoryUnitUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { updateInventoryUnitServer } = await import("./developer-data.server");
    return updateInventoryUnitServer(data);
  });

export const updateDeveloperInventoryTower = createServerFn({ method: "POST" })
  .validator((input: unknown) => inventoryTowerUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { updateInventoryTowerServer } = await import("./developer-data.server");
    return updateInventoryTowerServer(data);
  });
