import { createSupabaseServerClient } from "../lib/supabase.server";
import { getDeveloperSessionServer } from "../auth/developer-authentication.server";
import {
  canManageLeads,
  buildLeadSearchFilter,
  canTransitionLeadStatus,
  developerLeadAssigneeSchema,
  developerLeadProjectFacetSchema,
  developerLeadRecordSchema,
  hasLeadOrganizationAccess,
  leadDatabaseErrorStatus,
  LEAD_STATUSES,
} from "../../shared/developer-portal/leads-core";

const PAGE_SIZE = 25;
const LEAD_COLUMNS =
  "id, organization_id, project_id, assigned_to, full_name, email, phone, source, status, budget_min, budget_max, preferred_configuration, notes, next_follow_up_at, created_at, updated_at";

async function requireLeadAccess(organizationId: string, write = false) {
  const session = await getDeveloperSessionServer();
  if (!session.authenticated) {
    throw new Response("Sign in to access leads.", { status: 401 });
  }
  if (session.status === "unavailable") {
    throw new Response("Developer organization access could not be verified.", { status: 503 });
  }
  if (session.status !== "authorized" || !("memberships" in session)) {
    throw new Response("An active developer organization membership is required.", { status: 403 });
  }
  if (!hasLeadOrganizationAccess(session.memberships, organizationId)) {
    throw new Response("You are not an active member of this organization.", { status: 403 });
  }
  const membership = session.memberships.find((item) => item.organizationId === organizationId);
  if (!membership) {
    throw new Response("You are not an active member of this organization.", { status: 403 });
  }
  if (write && !canManageLeads(membership.role)) {
    throw new Response("Your organization role cannot create or update leads.", { status: 403 });
  }
  return {
    supabase: createSupabaseServerClient(),
    userId: session.user.id,
    role: membership.role,
  };
}

function throwLeadDatabaseError(error: { code?: string }) {
  console.error("[developer-leads]", { code: error.code ?? "unknown" });
  const status = leadDatabaseErrorStatus(error.code);
  const message =
    status === 409
      ? "A lead with the same unique value already exists."
      : status === 400
        ? "Some lead details are invalid, or the selected project or assignee is outside this organization."
        : status === 403
          ? "Your organization role does not allow this lead operation."
          : "Lead data could not be loaded or saved. Please retry.";
  throw new Response(message, { status });
}

export async function listLeadFacetsServer(organizationId: string) {
  const { supabase } = await requireLeadAccess(organizationId);
  const [projectsResult, assigneesResult] = await Promise.all([
    supabase
      .from("developer_projects")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase.rpc("list_developer_org_lead_assignees", {
      p_organization_id: organizationId,
    }),
  ]);
  if (projectsResult.error) throwLeadDatabaseError(projectsResult.error);
  if (assigneesResult.error) throwLeadDatabaseError(assigneesResult.error);
  return {
    projects: developerLeadProjectFacetSchema.array().parse(projectsResult.data ?? []),
    assignees: developerLeadAssigneeSchema.array().parse(assigneesResult.data ?? []),
  };
}

export async function listLeadsServer(input: {
  organizationId: string;
  search: string;
  projectId: string | null;
  status: (typeof LEAD_STATUSES)[number] | null;
  source: string | null;
  assignedTo: string | "unassigned" | null;
  page: number;
}) {
  const { supabase } = await requireLeadAccess(input.organizationId);
  const start = input.page * PAGE_SIZE;
  let query = supabase
    .from("developer_leads")
    .select(LEAD_COLUMNS, { count: "exact" })
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .range(start, start + PAGE_SIZE - 1);
  if (input.projectId) query = query.eq("project_id", input.projectId);
  if (input.status) query = query.eq("status", input.status);
  if (input.source) query = query.eq("source", input.source);
  if (input.assignedTo === "unassigned") query = query.is("assigned_to", null);
  else if (input.assignedTo) query = query.eq("assigned_to", input.assignedTo);
  if (input.search) {
    query = query.or(buildLeadSearchFilter(input.search));
  }

  const { data, error, count } = await query;
  if (error) throwLeadDatabaseError(error);
  return {
    leads: developerLeadRecordSchema.array().parse(data ?? []),
    total: count ?? 0,
    page: input.page,
    pageSize: PAGE_SIZE,
  };
}

export async function getLeadOverviewServer(organizationId: string) {
  const { supabase } = await requireLeadAccess(organizationId);
  const [totalResult, ...statusResults] = await Promise.all([
    supabase
      .from("developer_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    ...LEAD_STATUSES.map((status) =>
      supabase
        .from("developer_leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", status),
    ),
  ]);
  if (totalResult.error) throwLeadDatabaseError(totalResult.error);
  const counts = Object.fromEntries(
    LEAD_STATUSES.map((status, index) => {
      const result = statusResults[index];
      if (result?.error) throwLeadDatabaseError(result.error);
      return [status, result?.count ?? 0];
    }),
  );

  const now = new Date().toISOString();
  const [overdueResult, upcomingResult] = await Promise.all([
    supabase
      .from("developer_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .not("next_follow_up_at", "is", null)
      .lt("next_follow_up_at", now)
      .not("status", "in", "(won,lost)"),
    supabase
      .from("developer_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .not("next_follow_up_at", "is", null)
      .gte("next_follow_up_at", now)
      .not("status", "in", "(won,lost)"),
  ]);
  if (overdueResult.error) throwLeadDatabaseError(overdueResult.error);
  if (upcomingResult.error) throwLeadDatabaseError(upcomingResult.error);

  return {
    total: totalResult.count ?? 0,
    counts,
    overdueFollowUps: overdueResult.count ?? 0,
    upcomingFollowUps: upcomingResult.count ?? 0,
  };
}

export async function getLeadServer(input: { organizationId: string; leadId: string }) {
  const { supabase } = await requireLeadAccess(input.organizationId);
  const { data, error } = await supabase
    .from("developer_leads")
    .select(LEAD_COLUMNS)
    .eq("organization_id", input.organizationId)
    .eq("id", input.leadId)
    .maybeSingle();
  if (error) throwLeadDatabaseError(error);
  if (!data) throw new Response("Lead not found in this organization.", { status: 404 });
  return developerLeadRecordSchema.parse(data);
}

export async function saveLeadServer(input: {
  organizationId: string;
  leadId?: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  projectId: string | null;
  assignedTo: string | null;
  source: string;
  status: (typeof LEAD_STATUSES)[number];
  budgetMin: number | null;
  budgetMax: number | null;
  preferredConfiguration: string | null;
  notes: string | null;
  nextFollowUpAt: string | null;
}) {
  const { supabase, userId, role } = await requireLeadAccess(input.organizationId, true);
  if (!input.leadId && input.status !== "new") {
    throw new Response("New leads must start in the New status.", { status: 400 });
  }
  if (input.assignedTo) {
    const { data: assigneeIsMember, error } = await supabase.rpc("is_active_developer_org_member", {
      p_organization_id: input.organizationId,
      p_user_id: input.assignedTo,
    });
    if (error) throwLeadDatabaseError(error);
    if (!assigneeIsMember) {
      throw new Response("The selected assignee is not an active member of this organization.", {
        status: 400,
      });
    }
    if (role === "sales" && input.assignedTo !== userId) {
      throw new Response("Sales members may assign leads only to themselves.", { status: 403 });
    }
  }

  const lead = {
    project_id: input.projectId,
    assigned_to: input.assignedTo,
    full_name: input.fullName,
    email: input.email,
    phone: input.phone,
    source: input.source,
    status: input.status,
    budget_min: input.budgetMin,
    budget_max: input.budgetMax,
    preferred_configuration: input.preferredConfiguration || null,
    notes: input.notes || null,
    next_follow_up_at: input.nextFollowUpAt,
  };

  if (!input.leadId) {
    const { data, error } = await supabase
      .from("developer_leads")
      .insert({
        ...lead,
        organization_id: input.organizationId,
        ...(role === "sales" && !lead.assigned_to ? { assigned_to: userId } : {}),
      })
      .select(LEAD_COLUMNS)
      .single();
    if (error) throwLeadDatabaseError(error);
    return developerLeadRecordSchema.parse(data);
  }

  const existing = await getLeadServer({
    organizationId: input.organizationId,
    leadId: input.leadId,
  });
  if (role === "sales" && existing.assigned_to !== userId) {
    throw new Response("Sales members may update only leads assigned to them.", { status: 403 });
  }
  if (!canTransitionLeadStatus(existing.status, input.status)) {
    throw new Response(
      `Lead status cannot move from ${existing.status.replace("_", " ")} to ${input.status.replace("_", " ")}.`,
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("developer_leads")
    .update(lead)
    .eq("organization_id", input.organizationId)
    .eq("id", input.leadId)
    .select(LEAD_COLUMNS)
    .maybeSingle();
  if (error) throwLeadDatabaseError(error);
  if (!data) throw new Response("Lead was not found in this organization.", { status: 404 });
  return developerLeadRecordSchema.parse(data);
}
