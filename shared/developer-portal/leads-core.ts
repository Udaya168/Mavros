import { z } from "zod";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "site_visit",
  "negotiation",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  "website",
  "phone",
  "referral",
  "campaign",
  "walk_in",
  "other",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_PAGE_SIZE = 25;
export const leadStatusSchema = z.enum(LEAD_STATUSES);
export const leadSourceSchema = z.enum(LEAD_SOURCES);

const optionalEmailSchema = z
  .string()
  .trim()
  .max(320)
  .transform((email) => (email ? email.toLowerCase() : null))
  .pipe(z.string().email().max(320).nullable());

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(40)
  .transform((phone) => {
    if (!phone) return null;
    const normalized = phone.replace(/[\s().-]/g, "");
    return normalized.startsWith("+")
      ? `+${normalized.slice(1).replace(/\+/g, "")}`
      : normalized.replace(/\+/g, "");
  })
  .pipe(
    z
      .string()
      .regex(/^\+?\d{7,15}$/)
      .nullable(),
  );

const currencyInputSchema = z
  .union([z.number(), z.string().trim(), z.null()])
  .transform((value) => (value === "" || value === null ? null : Number(value)))
  .pipe(z.number().finite().nonnegative().max(1_000_000_000_000).nullable());

const followUpInputSchema = z
  .union([z.string().trim(), z.null()])
  .transform((value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  })
  .pipe(z.string().datetime().nullable());

export const leadSearchSchema = z.object({
  organizationId: z.string().uuid(),
  search: z.string().trim().max(120).default(""),
  projectId: z.string().uuid().nullable().default(null),
  status: leadStatusSchema.nullable().default(null),
  source: leadSourceSchema.nullable().default(null),
  assignedTo: z
    .union([z.string().uuid(), z.literal("unassigned")])
    .nullable()
    .default(null),
  page: z.number().int().min(0).max(100_000).default(0),
});

export const leadIdSchema = z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
});

export const leadInputSchema = z
  .object({
    organizationId: z.string().uuid(),
    leadId: z.string().uuid().optional(),
    fullName: z.string().trim().min(1).max(160),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    projectId: z.string().uuid().nullable().default(null),
    assignedTo: z.string().uuid().nullable().default(null),
    source: leadSourceSchema.default("other"),
    status: leadStatusSchema.default("new"),
    budgetMin: currencyInputSchema.default(null),
    budgetMax: currencyInputSchema.default(null),
    preferredConfiguration: z.string().trim().max(120).nullable().default(null),
    notes: z.string().trim().max(10_000).nullable().default(null),
    nextFollowUpAt: followUpInputSchema.default(null),
  })
  .refine(
    (lead) =>
      lead.budgetMin === null || lead.budgetMax === null || lead.budgetMin <= lead.budgetMax,
    { message: "Minimum budget cannot exceed maximum budget.", path: ["budgetMax"] },
  );

export const developerLeadRecordSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
  assigned_to: z.string().uuid().nullable(),
  full_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  source: leadSourceSchema,
  status: leadStatusSchema,
  budget_min: z.union([z.number(), z.string()]).nullable(),
  budget_max: z.union([z.number(), z.string()]).nullable(),
  preferred_configuration: z.string().nullable(),
  notes: z.string().nullable(),
  next_follow_up_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const developerLeadProjectFacetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const developerLeadAssigneeSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string(),
});

const leadTransitions: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["contacted", "lost"],
  contacted: ["qualified", "site_visit", "lost"],
  qualified: ["contacted", "site_visit", "negotiation", "lost"],
  site_visit: ["qualified", "negotiation", "won", "lost"],
  negotiation: ["site_visit", "won", "lost"],
  won: [],
  lost: [],
};

export function canTransitionLeadStatus(from: LeadStatus, to: LeadStatus): boolean {
  return from === to || leadTransitions[from].includes(to);
}

export function canManageLeads(role: string): boolean {
  return role === "owner" || role === "admin" || role === "sales";
}

export function canDeleteLeads(role: string): boolean {
  return role === "owner";
}

export function hasLeadOrganizationAccess(
  memberships: readonly { organizationId: string; role: string }[],
  organizationId: string,
): boolean {
  return memberships.some((membership) => membership.organizationId === organizationId);
}

export function leadDatabaseErrorStatus(code: string | undefined): number {
  if (code === "23505") return 409;
  if (code === "23503" || code === "23514" || code === "22P02") return 400;
  if (code === "42501") return 403;
  return 502;
}

export function escapeLeadSearch(value: string): string {
  return value.replace(/[\\"]/g, "\\$&").replace(/[%_*]/g, "\\$&");
}

export function buildLeadSearchFilter(value: string): string {
  const pattern = `"%${escapeLeadSearch(value)}%"`;
  return ["full_name", "email", "phone"].map((column) => `${column}.ilike.${pattern}`).join(",");
}

export function leadFollowUpState(
  followUpAt: string | null,
  now = Date.now(),
): "none" | "overdue" | "upcoming" {
  if (!followUpAt) return "none";
  return new Date(followUpAt).getTime() < now ? "overdue" : "upcoming";
}

export function matchesLeadSearch(
  lead: { full_name: string; email: string | null; phone: string | null },
  search: string,
): boolean {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  if (!normalizedSearch) return true;
  return [lead.full_name, lead.email, lead.phone].some((value) =>
    value?.toLocaleLowerCase().includes(normalizedSearch),
  );
}

export function isLeadVisibleForFilters(
  lead: {
    project_id: string | null;
    status: LeadStatus;
    source: string;
    assigned_to: string | null;
  },
  filters: {
    projectId: string | null;
    status: LeadStatus | null;
    source: string | null;
    assignedTo: string | null;
  },
): boolean {
  return (
    (!filters.projectId || lead.project_id === filters.projectId) &&
    (!filters.status || lead.status === filters.status) &&
    (!filters.source || lead.source === filters.source) &&
    (!filters.assignedTo ||
      (filters.assignedTo === "unassigned"
        ? lead.assigned_to === null
        : lead.assigned_to === filters.assignedTo))
  );
}
