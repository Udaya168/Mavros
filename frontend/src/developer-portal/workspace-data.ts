import { createServerFn } from "@tanstack/react-start";

import {
  articleInputSchema,
  campaignInputSchema,
  contactsSearchSchema,
  notificationIdSchema,
  organizationInputSchema,
  supportRequestInputSchema,
  supportRequestStatusSchema,
  taskInputSchema,
  visitInputSchema,
} from "@shared/developer-portal/workspace-data-core";

export const listDeveloperTasks = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listTasksServer } = await import("./workspace-data.server");
    return listTasksServer(data.organizationId);
  });

export const saveDeveloperTask = createServerFn({ method: "POST" })
  .validator((input: unknown) => taskInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { saveTaskServer } = await import("./workspace-data.server");
    return saveTaskServer(data);
  });

export const listDeveloperVisits = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listVisitsServer } = await import("./workspace-data.server");
    return listVisitsServer(data.organizationId);
  });

export const saveDeveloperVisit = createServerFn({ method: "POST" })
  .validator((input: unknown) => visitInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { saveVisitServer } = await import("./workspace-data.server");
    return saveVisitServer(data);
  });

export const listDeveloperArticles = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listArticlesServer } = await import("./workspace-data.server");
    return listArticlesServer(data.organizationId);
  });

export const saveDeveloperArticle = createServerFn({ method: "POST" })
  .validator((input: unknown) => articleInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { saveArticleServer } = await import("./workspace-data.server");
    return saveArticleServer(data);
  });

export const listDeveloperCampaigns = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listCampaignsServer } = await import("./workspace-data.server");
    return listCampaignsServer(data.organizationId);
  });

export const saveDeveloperCampaign = createServerFn({ method: "POST" })
  .validator((input: unknown) => campaignInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { saveCampaignServer } = await import("./workspace-data.server");
    return saveCampaignServer(data);
  });

export const listDeveloperSupportRequests = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listSupportRequestsServer } = await import("./workspace-data.server");
    return listSupportRequestsServer(data.organizationId);
  });

export const createDeveloperSupportRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) => supportRequestInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { createSupportRequestServer } = await import("./workspace-data.server");
    return createSupportRequestServer(data);
  });

export const updateDeveloperSupportRequestStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => supportRequestStatusSchema.parse(input))
  .handler(async ({ data }) => {
    const { updateSupportRequestStatusServer } = await import("./workspace-data.server");
    return updateSupportRequestStatusServer(data);
  });

export const listDeveloperNotifications = createServerFn({ method: "GET" })
  .validator((input: unknown) => organizationInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { listNotificationsServer } = await import("./workspace-data.server");
    return listNotificationsServer(data.organizationId);
  });

export const markDeveloperNotificationRead = createServerFn({ method: "POST" })
  .validator((input: unknown) => notificationIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { markNotificationReadServer } = await import("./workspace-data.server");
    return markNotificationReadServer(data);
  });

export const listDeveloperContacts = createServerFn({ method: "GET" })
  .validator((input: unknown) => contactsSearchSchema.parse(input))
  .handler(async ({ data }) => {
    const { listContactsServer } = await import("./workspace-data.server");
    return listContactsServer(data);
  });
