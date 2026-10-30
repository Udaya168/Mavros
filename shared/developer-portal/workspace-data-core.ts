import { z } from "zod";

const id = z.string().uuid();
export const organizationInputSchema = z.object({ organizationId: id });
const organization = organizationInputSchema;

export const contactsSearchSchema = organization.extend({
  search: z.string().trim().max(120).default(""),
  page: z.number().int().min(0).max(100_000).default(0),
});

export const taskStatuses = ["open", "in_progress", "done", "cancelled"] as const;
export const visitStatuses = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
export const campaignStatuses = ["planned", "active", "paused", "completed"] as const;
export const articleStatuses = ["draft", "published", "archived"] as const;

export const taskInputSchema = organization.extend({
  id: id.optional(),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).default(""),
  dueAt: z.string().datetime().nullable().default(null),
  assignedTo: id.nullable().default(null),
  status: z.enum(taskStatuses).default("open"),
});

export const visitInputSchema = organization.extend({
  id: id.optional(),
  projectId: id,
  leadId: id.nullable().default(null),
  assignedTo: id.nullable().default(null),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  status: z.enum(visitStatuses).default("scheduled"),
  notes: z.string().trim().max(5000).default(""),
});

export const articleInputSchema = organization.extend({
  id: id.optional(),
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(80).default("general"),
  content: z.string().trim().min(1).max(50_000),
  status: z.enum(articleStatuses).default("draft"),
});

export const campaignInputSchema = organization
  .extend({
    id: id.optional(),
    projectId: id.nullable().default(null),
    name: z.string().trim().min(1).max(180),
    channel: z.string().trim().min(1).max(80),
    status: z.enum(campaignStatuses).default("planned"),
    plannedBudget: z
      .number()
      .finite()
      .nonnegative()
      .max(1_000_000_000_000)
      .nullable()
      .default(null),
    startsOn: z.string().date().nullable().default(null),
    endsOn: z.string().date().nullable().default(null),
  })
  .refine(
    (campaign) => !campaign.startsOn || !campaign.endsOn || campaign.startsOn <= campaign.endsOn,
    { message: "Campaign end date cannot precede its start date.", path: ["endsOn"] },
  );

export const supportRequestInputSchema = organization.extend({
  subject: z.string().trim().min(1).max(180),
  message: z.string().trim().min(1).max(10_000),
});

export const supportRequestStatusSchema = organization.extend({
  requestId: id,
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export const notificationIdSchema = organization.extend({ notificationId: id });
