import { createSupabaseServerClient } from "../lib/supabase.server";
import { getDeveloperSessionServer } from "../auth/developer-authentication.server";
import {
  canManageDeveloperData,
  escapeLikeSearch,
  hasOrganizationMembership,
  MAX_PAGE_SIZE,
  organizationActivitySchema,
  organizationTeamAuditSchema,
  organizationTeamMutationSchema,
  organizationTeamMemberSchema,
} from "../../shared/developer-portal/developer-data-core";

async function requireOrganizationAccess(organizationId: string, write = false) {
  const session = await getDeveloperSessionServer();
  if (!session.authenticated) {
    throw new Response("Sign in to access developer organization data.", { status: 401 });
  }
  if (session.status === "unavailable") {
    throw new Response("Developer organization access could not be verified.", { status: 503 });
  }
  if (session.status !== "authorized" || !("memberships" in session)) {
    throw new Response("An active developer organization membership is required.", {
      status: 403,
    });
  }
  if (!hasOrganizationMembership(session.memberships, organizationId)) {
    throw new Response("You are not an active member of this organization.", { status: 403 });
  }
  const membership = session.memberships.find(
    (candidate) => candidate.organizationId === organizationId,
  );
  if (!membership) {
    throw new Response("You are not an active member of this organization.", { status: 403 });
  }
  if (write && !canManageDeveloperData(membership.role)) {
    throw new Response("An organization owner or admin role is required for this change.", {
      status: 403,
    });
  }

  return { supabase: createSupabaseServerClient(), membership, userId: session.user.id };
}

function throwDatabaseError(error: { code?: string; message?: string }) {
  console.error("[developer-data]", { code: error.code ?? "unknown" });
  if (error.code === "23505") {
    throw new Response("That project, tower, or unit identifier is already in use.", {
      status: 409,
    });
  }
  if (error.code === "42501") {
    throw new Response("Your organization role cannot perform this operation.", { status: 403 });
  }
  if (error.code === "23503" || error.code === "23514" || error.code === "22P02") {
    throw new Response("Some inventory details are invalid or outside this organization.", {
      status: 400,
    });
  }
  throw new Response("Developer organization data could not be loaded or saved.", { status: 502 });
}

function likePattern(value: string): string {
  return `%${escapeLikeSearch(value)}%`;
}

export async function getDeveloperDashboardServer(organizationId: string) {
  const { supabase } = await requireOrganizationAccess(organizationId);
  const results = await Promise.all([
    supabase
      .from("developer_projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("developer_projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "published"),
    supabase
      .from("developer_project_units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("developer_project_units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "available"),
    supabase
      .from("developer_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);
  const errorResult = results.find((result) => result.error);
  if (errorResult?.error) throwDatabaseError(errorResult.error);

  return {
    projects: results[0].count ?? 0,
    publishedProjects: results[1].count ?? 0,
    units: results[2].count ?? 0,
    availableUnits: results[3].count ?? 0,
    leads: results[4].count ?? 0,
  };
}

export async function getDeveloperReportsServer(organizationId: string) {
  const { supabase } = await requireOrganizationAccess(organizationId);
  const projectStatuses = ["draft", "published"] as const;
  const inventoryStatuses = ["available", "held", "booked", "sold", "unlisted"] as const;
  const leadStatuses = [
    "new",
    "contacted",
    "qualified",
    "site_visit",
    "negotiation",
    "won",
    "lost",
  ] as const;
  const [projectResults, inventoryResults, leadResults] = await Promise.all([
    Promise.all(
      projectStatuses.map((status) =>
        supabase
          .from("developer_projects")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", status),
      ),
    ),
    Promise.all(
      inventoryStatuses.map((status) =>
        supabase
          .from("developer_project_units")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", status),
      ),
    ),
    Promise.all(
      leadStatuses.map((status) =>
        supabase
          .from("developer_leads")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId)
          .eq("status", status),
      ),
    ),
  ]);
  const errorResult = [...projectResults, ...inventoryResults, ...leadResults].find(
    (result) => result.error,
  );
  if (errorResult?.error) throwDatabaseError(errorResult.error);

  const requireCount = (count: number | null) => {
    if (count === null) {
      throw new Response("An organization report count could not be calculated.", {
        status: 502,
      });
    }
    return count;
  };
  const projectBreakdown = Object.fromEntries(
    projectStatuses.map((status, index) => [
      status,
      requireCount(projectResults[index]?.count ?? null),
    ]),
  );
  const inventoryBreakdown = Object.fromEntries(
    inventoryStatuses.map((status, index) => [
      status,
      requireCount(inventoryResults[index]?.count ?? null),
    ]),
  );
  const leadBreakdown = Object.fromEntries(
    leadStatuses.map((status, index) => [status, requireCount(leadResults[index]?.count ?? null)]),
  );

  return {
    projects: {
      total: Object.values(projectBreakdown).reduce((total, count) => total + count, 0),
      byStatus: projectBreakdown,
    },
    inventory: {
      total: Object.values(inventoryBreakdown).reduce((total, count) => total + count, 0),
      byStatus: inventoryBreakdown,
    },
    leads: {
      total: Object.values(leadBreakdown).reduce((total, count) => total + count, 0),
      byStatus: leadBreakdown,
    },
  };
}

export async function listOrganizationTeamServer(organizationId: string) {
  const { supabase } = await requireOrganizationAccess(organizationId, true);
  const { data, error } = await supabase.rpc("list_developer_org_team", {
    p_organization_id: organizationId,
  });
  if (error) throwDatabaseError(error);
  return organizationTeamMemberSchema.array().parse(data ?? []);
}

export async function manageOrganizationTeamMemberServer(input: {
  organizationId: string;
  targetUserId: string;
  role: "owner" | "admin" | "marketing" | "sales" | "analyst";
  isActive: boolean;
}) {
  const validated = organizationTeamMutationSchema.parse(input);
  const { supabase, membership, userId } = await requireOrganizationAccess(
    validated.organizationId,
    true,
  );
  if (membership.role === "admin" && validated.role === "owner") {
    throw new Response("Admins cannot manage owner roles or their own membership.", {
      status: 403,
    });
  }
  if (validated.targetUserId === userId) {
    throw new Response("You cannot change your own organization membership.", { status: 403 });
  }

  const { error } = await supabase.rpc("manage_developer_org_member", {
    p_organization_id: validated.organizationId,
    p_target_user_id: validated.targetUserId,
    p_role: validated.role,
    p_is_active: validated.isActive,
  });
  if (error) {
    console.error("[developer-team]", { code: error.code ?? "unknown" });
    if (error.code === "42501")
      throw new Response("Your organization role cannot perform this membership change.", {
        status: 403,
      });
    if (error.code === "P0002")
      throw new Response("Organization member was not found.", { status: 404 });
    if (error.code === "22023" || error.code === "23514")
      throw new Response("That membership change is not valid.", { status: 400 });
    throw new Response("The organization membership could not be updated.", { status: 502 });
  }
  return { success: true };
}

export async function listOrganizationTeamAuditServer(organizationId: string) {
  const { supabase } = await requireOrganizationAccess(organizationId, true);
  const { data, error } = await supabase
    .from("developer_team_membership_audit")
    .select(
      "id, actor_user_id, target_user_id, previous_role, new_role, was_active, is_active, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throwDatabaseError(error);
  return organizationTeamAuditSchema.array().parse(data ?? []);
}

export async function listOrganizationActivityServer(organizationId: string) {
  const { supabase } = await requireOrganizationAccess(organizationId);
  const { data, error } = await supabase
    .from("developer_activity_events")
    .select("id, actor_user_id, entity_type, entity_id, action, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throwDatabaseError(error);
  return organizationActivitySchema.array().parse(data ?? []);
}

export async function listProjectsServer(input: {
  organizationId: string;
  search: string;
  status: "draft" | "published" | null;
  page: number;
}) {
  const { supabase } = await requireOrganizationAccess(input.organizationId);
  const start = input.page * MAX_PAGE_SIZE;
  let query = supabase
    .from("developer_projects")
    .select(
      "id, organization_id, name, slug, location, rera_id, possession, status, tagline, description, amenities, created_at, updated_at",
      { count: "exact" },
    )
    .eq("organization_id", input.organizationId)
    .order("updated_at", { ascending: false })
    .range(start, start + MAX_PAGE_SIZE - 1);
  if (input.status) query = query.eq("status", input.status);
  if (input.search) query = query.ilike("name", likePattern(input.search));

  const { data, error, count } = await query;
  if (error) throwDatabaseError(error);
  return { projects: data ?? [], total: count ?? 0, page: input.page, pageSize: MAX_PAGE_SIZE };
}

export async function getProjectServer(input: { organizationId: string; id: string }) {
  const { supabase } = await requireOrganizationAccess(input.organizationId);
  const { data, error } = await supabase
    .from("developer_projects")
    .select(
      "id, organization_id, name, slug, location, rera_id, possession, status, tagline, description, amenities, created_at, updated_at",
    )
    .eq("organization_id", input.organizationId)
    .eq("id", input.id)
    .maybeSingle();
  if (error) throwDatabaseError(error);
  if (!data) throw new Response("Project not found in this organization.", { status: 404 });
  return data;
}

export async function saveProjectServer(input: {
  organizationId: string;
  id?: string;
  name: string;
  slug: string;
  location: string;
  reraId: string | null;
  possession: string | null;
  status: "draft" | "published";
  tagline: string;
  description: string;
  amenities: string[];
}) {
  const { supabase } = await requireOrganizationAccess(input.organizationId, true);
  const project = {
    name: input.name,
    slug: input.slug,
    location: input.location,
    rera_id: input.reraId || null,
    possession: input.possession || null,
    status: input.status,
    tagline: input.tagline,
    description: input.description,
    amenities: input.amenities,
  };
  const result = input.id
    ? await supabase
        .from("developer_projects")
        .update(project)
        .eq("organization_id", input.organizationId)
        .eq("id", input.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("developer_projects")
        .insert({ ...project, organization_id: input.organizationId })
        .select("id")
        .single();
  if (result.error) throwDatabaseError(result.error);
  if (!result.data)
    throw new Response("Project was not found in this organization.", { status: 404 });
  return { id: result.data.id };
}

export async function listInventoryServer(input: {
  organizationId: string;
  projectId: string | null;
  status: "available" | "held" | "booked" | "sold" | "unlisted" | null;
  search: string;
  page: number;
}) {
  const { supabase } = await requireOrganizationAccess(input.organizationId);
  const start = input.page * MAX_PAGE_SIZE;
  let query = supabase
    .from("developer_project_units")
    .select(
      "id, organization_id, project_id, tower_id, unit_number, unit_type, area_sqft, approved_price, status, created_at, updated_at, project:developer_projects!developer_project_units_project_fk(name), tower:developer_project_towers!developer_project_units_tower_fk(name)",
      { count: "exact" },
    )
    .eq("organization_id", input.organizationId)
    .order("updated_at", { ascending: false })
    .range(start, start + MAX_PAGE_SIZE - 1);
  if (input.projectId) query = query.eq("project_id", input.projectId);
  if (input.status) query = query.eq("status", input.status);
  if (input.search) query = query.ilike("unit_number", likePattern(input.search));

  const { data, error, count } = await query;
  if (error) throwDatabaseError(error);
  return { units: data ?? [], total: count ?? 0, page: input.page, pageSize: MAX_PAGE_SIZE };
}

export async function createInventoryUnitServer(input: {
  organizationId: string;
  projectId: string;
  towerName: string;
  unitNumber: string;
  unitType: string;
  areaSqft: number | null;
  approvedPrice: number | null;
  status: "available" | "held" | "booked" | "sold" | "unlisted";
}) {
  const { supabase } = await requireOrganizationAccess(input.organizationId, true);

  const projectResult = await supabase
    .from("developer_projects")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("id", input.projectId)
    .maybeSingle();
  if (projectResult.error) throwDatabaseError(projectResult.error);
  if (!projectResult.data) {
    throw new Response("Project not found in this organization.", { status: 404 });
  }

  let towerResult = await supabase
    .from("developer_project_towers")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("project_id", input.projectId)
    .eq("name", input.towerName)
    .maybeSingle();
  if (towerResult.error) throwDatabaseError(towerResult.error);
  if (!towerResult.data) {
    towerResult = await supabase
      .from("developer_project_towers")
      .insert({
        organization_id: input.organizationId,
        project_id: input.projectId,
        name: input.towerName,
      })
      .select("id")
      .single();
    if (towerResult.error?.code === "23505") {
      towerResult = await supabase
        .from("developer_project_towers")
        .select("id")
        .eq("organization_id", input.organizationId)
        .eq("project_id", input.projectId)
        .eq("name", input.towerName)
        .single();
    }
    if (towerResult.error) throwDatabaseError(towerResult.error);
  }
  if (!towerResult.data) {
    throw new Response("Tower could not be resolved for this project.", { status: 409 });
  }

  const { data, error } = await supabase
    .from("developer_project_units")
    .insert({
      organization_id: input.organizationId,
      project_id: input.projectId,
      tower_id: towerResult.data.id,
      unit_number: input.unitNumber,
      unit_type: input.unitType,
      area_sqft: input.areaSqft,
      approved_price: input.approvedPrice,
      status: input.status,
    })
    .select("id")
    .single();
  if (error) throwDatabaseError(error);
  if (!data) throw new Response("Inventory unit could not be created.", { status: 502 });
  return { id: data.id };
}

export async function updateInventoryUnitServer(input: {
  organizationId: string;
  id: string;
  unitType: string;
  areaSqft: number | null;
  approvedPrice: number | null;
  status: "available" | "held" | "booked" | "sold" | "unlisted";
}) {
  const { supabase } = await requireOrganizationAccess(input.organizationId, true);
  const { data, error } = await supabase
    .from("developer_project_units")
    .update({
      unit_type: input.unitType,
      area_sqft: input.areaSqft,
      approved_price: input.approvedPrice,
      status: input.status,
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.id)
    .select("id")
    .maybeSingle();
  if (error) throwDatabaseError(error);
  if (!data)
    throw new Response("Inventory unit was not found in this organization.", { status: 404 });
  return { id: data.id };
}

export async function updateInventoryTowerServer(input: {
  organizationId: string;
  projectId: string;
  towerId: string;
  name: string;
}) {
  const { supabase } = await requireOrganizationAccess(input.organizationId, true);
  const { data, error } = await supabase
    .from("developer_project_towers")
    .update({ name: input.name })
    .eq("organization_id", input.organizationId)
    .eq("project_id", input.projectId)
    .eq("id", input.towerId)
    .select("id")
    .maybeSingle();
  if (error) throwDatabaseError(error);
  if (!data)
    throw new Response("Project tower was not found in this organization.", { status: 404 });
  return { id: data.id };
}
