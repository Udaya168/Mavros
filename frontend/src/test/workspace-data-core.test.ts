import { describe, expect, it } from "vitest";

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
import { canAccessDeveloperPath } from "@/lib/developer-auth-core";

const organizationId = "35f8836f-3133-4e9c-875b-84dadad1ca6b";
const recordId = "15f8836f-3133-4e9c-875b-84dadad1ca6b";

describe("developer workflow validation", () => {
  it("validates organization and notification identifiers", () => {
    expect(organizationInputSchema.safeParse({ organizationId }).success).toBe(true);
    expect(organizationInputSchema.safeParse({ organizationId: "not-an-id" }).success).toBe(false);
    expect(
      notificationIdSchema.safeParse({ organizationId, notificationId: recordId }).success,
    ).toBe(true);
  });

  it("validates contact search and pagination inputs", () => {
    expect(
      contactsSearchSchema.safeParse({ organizationId, search: "Person", page: 1 }).success,
    ).toBe(true);
    expect(
      contactsSearchSchema.safeParse({ organizationId, search: "x".repeat(121) }).success,
    ).toBe(false);
    expect(contactsSearchSchema.safeParse({ organizationId, page: -1 }).success).toBe(false);
  });

  it("validates task, assignment, and status input", () => {
    const task = {
      organizationId,
      title: "Call prospect",
      description: "Discuss available units",
      dueAt: "2026-10-22T12:00:00.000Z",
      assignedTo: recordId,
      status: "open",
    };
    expect(taskInputSchema.safeParse(task).success).toBe(true);
    expect(taskInputSchema.safeParse({ ...task, title: " " }).success).toBe(false);
    expect(taskInputSchema.safeParse({ ...task, assignedTo: "invalid" }).success).toBe(false);
    expect(taskInputSchema.safeParse({ ...task, status: "unknown" }).success).toBe(false);
  });

  it("validates project visit bounds and date values", () => {
    const visit = {
      organizationId,
      projectId: recordId,
      scheduledAt: "2026-10-22T12:00:00.000Z",
      durationMinutes: 60,
    };
    expect(visitInputSchema.safeParse(visit).success).toBe(true);
    expect(visitInputSchema.safeParse({ ...visit, durationMinutes: 5 }).success).toBe(false);
    expect(visitInputSchema.safeParse({ ...visit, scheduledAt: "tomorrow" }).success).toBe(false);
  });

  it("validates knowledge article content and campaign budget/date range", () => {
    expect(
      articleInputSchema.safeParse({
        organizationId,
        title: "Sales guide",
        content: "Approved content",
      }).success,
    ).toBe(true);
    const campaign = {
      organizationId,
      name: "Launch",
      channel: "email",
      plannedBudget: 100,
      startsOn: "2026-10-20",
      endsOn: "2026-10-22",
    };
    expect(campaignInputSchema.safeParse(campaign).success).toBe(true);
    expect(campaignInputSchema.safeParse({ ...campaign, plannedBudget: -1 }).success).toBe(false);
    expect(campaignInputSchema.safeParse({ ...campaign, startsOn: "2026-10-23" }).success).toBe(
      false,
    );
  });

  it("validates support request text", () => {
    expect(
      supportRequestInputSchema.safeParse({
        organizationId,
        subject: "Need assistance",
        message: "Please contact me.",
      }).success,
    ).toBe(true);
    expect(
      supportRequestInputSchema.safeParse({
        organizationId,
        subject: " ",
        message: "Missing subject",
      }).success,
    ).toBe(false);
    expect(
      supportRequestStatusSchema.safeParse({
        organizationId,
        requestId: recordId,
        status: "resolved",
      }).success,
    ).toBe(true);
    expect(
      supportRequestStatusSchema.safeParse({
        organizationId,
        requestId: "not-an-id",
        status: "resolved",
      }).success,
    ).toBe(false);
    expect(
      supportRequestStatusSchema.safeParse({
        organizationId,
        requestId: recordId,
        status: "deleted",
      }).success,
    ).toBe(false);
  });
});

describe("developer workflow route authorization", () => {
  it("allows sales to access assigned-work and contact workflows only", () => {
    expect(canAccessDeveloperPath(["sales"], "/app/tasks")).toBe(true);
    expect(canAccessDeveloperPath(["sales"], "/app/contacts")).toBe(true);
    expect(canAccessDeveloperPath(["sales"], "/app/notifications")).toBe(true);
    expect(canAccessDeveloperPath(["sales"], "/app/campaigns")).toBe(false);
  });

  it("does not grant workflow access to normal users", () => {
    expect(canAccessDeveloperPath([], "/app/tasks")).toBe(false);
  });
});
