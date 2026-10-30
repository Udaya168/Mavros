import { z } from "zod";

export const PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const projectStatusSchema = z.enum(["draft", "published"]);
export const inventoryStatusSchema = z.enum(["available", "held", "booked", "sold", "unlisted"]);

export const projectSearchSchema = z.object({
  organizationId: z.string().uuid(),
  search: z.string().trim().max(120).default(""),
  status: projectStatusSchema.nullable().default(null),
  page: z.number().int().min(0).max(100_000).default(0),
});

export const projectInputSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(160),
  location: z.string().trim().max(240).default(""),
  reraId: z.string().trim().max(120).nullable().default(null),
  possession: z.string().trim().max(120).nullable().default(null),
  status: projectStatusSchema.default("draft"),
  tagline: z.string().trim().max(240).default(""),
  description: z.string().trim().max(5000).default(""),
  amenities: z.array(z.string().trim().min(1).max(100)).max(40).default([]),
});

export const projectIdInputSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

export const inventorySearchSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid().nullable().default(null),
  status: inventoryStatusSchema.nullable().default(null),
  search: z.string().trim().max(120).default(""),
  page: z.number().int().min(0).max(100_000).default(0),
});

export const inventoryUnitInputSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  towerName: z.string().trim().min(1).max(80),
  unitNumber: z.string().trim().min(1).max(80),
  unitType: z.string().trim().min(1).max(80),
  areaSqft: z.number().positive().max(1_000_000).nullable().default(null),
  approvedPrice: z.number().nonnegative().max(1_000_000_000_000).nullable().default(null),
  status: inventoryStatusSchema.default("available"),
});

export const inventoryUnitUpdateSchema = inventoryUnitInputSchema
  .omit({ projectId: true, towerName: true, unitNumber: true })
  .extend({ id: z.string().uuid() });

export const inventoryTowerUpdateSchema = z.object({
  organizationId: z.string().uuid(),
  projectId: z.string().uuid(),
  towerId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
});

export const organizationInputSchema = z.object({ organizationId: z.string().uuid() });

export const organizationTeamMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "admin", "marketing", "sales", "analyst"]),
  is_active: z.boolean(),
  full_name: z.string(),
});

export const organizationTeamMutationSchema = z.object({
  organizationId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  role: z.enum(["owner", "admin", "marketing", "sales", "analyst"]),
  isActive: z.boolean(),
});

export const organizationTeamAuditSchema = z.object({
  id: z.string().uuid(),
  actor_user_id: z.string().uuid().nullable(),
  target_user_id: z.string().uuid(),
  previous_role: z.enum(["owner", "admin", "marketing", "sales", "analyst"]),
  new_role: z.enum(["owner", "admin", "marketing", "sales", "analyst"]),
  was_active: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export const organizationActivitySchema = z.object({
  id: z.string().uuid(),
  actor_user_id: z.string().uuid().nullable(),
  entity_type: z.enum(["project", "inventory_unit", "lead"]),
  entity_id: z.string().uuid(),
  action: z.enum(["insert", "update", "delete"]),
  created_at: z.string(),
});

export function canManageDeveloperData(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function hasOrganizationMembership(
  memberships: readonly { organizationId: string }[],
  organizationId: string,
): boolean {
  return memberships.some((membership) => membership.organizationId === organizationId);
}

export function escapeLikeSearch(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
