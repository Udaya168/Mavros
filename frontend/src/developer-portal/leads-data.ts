import { createServerFn } from "@tanstack/react-start";

import { z } from "zod";

import {
  leadIdSchema,
  leadInputSchema,
  leadSearchSchema,
} from "@shared/developer-portal/leads-core";

const organizationInputSchema = z.object({ organizationId: z.string().uuid() });

export const listDeveloperLeads = createServerFn({ method: "GET" })
  .validator((input: unknown) => leadSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const { listLeadsServer } = await import("./leads-data.server");
    return listLeadsServer(data);
  });

export const getDeveloperLeadOverview = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { getLeadOverviewServer } = await import("./leads-data.server");
    return getLeadOverviewServer(data.organizationId);
  });

export const getDeveloperLeadFacets = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listLeadFacetsServer } = await import("./leads-data.server");
    return listLeadFacetsServer(data.organizationId);
  });

export const getDeveloperLead = createServerFn({ method: "GET" })
  .validator((input: unknown) => leadIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { getLeadServer } = await import("./leads-data.server");
    return getLeadServer(data);
  });

export const saveDeveloperLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => leadInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { saveLeadServer } = await import("./leads-data.server");
    const { leadId, ...lead } = data;
    return saveLeadServer({ ...lead, ...(leadId ? { leadId } : {}) });
  });
