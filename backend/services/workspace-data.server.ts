import { createSupabaseServerClient } from "../lib/supabase.server";
import { getDeveloperSessionServer } from "../auth/developer-authentication.server";
import {
  escapeLikeSearch,
  hasOrganizationMembership,
  MAX_PAGE_SIZE,
} from "../../shared/developer-portal/developer-data-core";

type Role = "owner" | "admin" | "marketing" | "sales" | "analyst";

async function requireWorkflowAccess(organizationId: string, roles?: readonly Role[]) {
  const session = await getDeveloperSessionServer();
  if (!session.authenticated)
    throw new Response("Sign in to access organization workflows.", { status: 401 });
  if (session.status === "unavailable")
    throw new Response("Organization access could not be verified.", { status: 503 });
  if (session.status !== "authorized" || !("memberships" in session)) {
    throw new Response("An active organization membership is required.", { status: 403 });
  }
  if (!hasOrganizationMembership(session.memberships, organizationId)) {
    throw new Response("You are not an active member of this organization.", { status: 403 });
  }
  const membership = session.memberships.find((item) => item.organizationId === organizationId);
  if (!membership)
    throw new Response("An active organization membership is required.", { status: 403 });
  if (roles && !roles.includes(membership.role as Role)) {
    throw new Response("Your organization role cannot perform this operation.", { status: 403 });
  }
  return { supabase: createSupabaseServerClient(), membership, userId: session.user.id };
}

function throwWorkflowError(error: { code?: string }) {
  console.error("[developer-workflows]", { code: error.code ?? "unknown" });
  if (error.code === "23505")
    throw new Response("A record with those details already exists.", { status: 409 });
  if (error.code === "23503" || error.code === "23514" || error.code === "22P02") {
    throw new Response(
      "Some details are invalid or reference a record outside this organization.",
      { status: 400 },
    );
  }
  if (error.code === "42501")
    throw new Response("Your organization role cannot perform this operation.", { status: 403 });
  throw new Response(
    "Organization workflow data could not be loaded or saved. The required migration may not be applied.",
    { status: 502 },
  );
}

async function verifyAssignee(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  organizationId: string,
  assigneeId: string | null,
  role: string,
  userId: string,
) {
  if (!assigneeId) return;
  const { data, error } = await supabase.rpc("is_active_developer_org_member", {
    p_organization_id: organizationId,
    p_user_id: assigneeId,
  });
  if (error) throwWorkflowError(error);
  if (!data)
    throw new Response("The assignee is not an active member of this organization.", {
      status: 400,
    });
  if (role === "sales" && assigneeId !== userId) {
    throw new Response("Sales members can assign work only to themselves.", { status: 403 });
  }
}

export async function listTasksServer(organizationId: string) {
  const { supabase } = await requireWorkflowAccess(organizationId);
  const { data, error } = await supabase
    .from("developer_tasks")
    .select("id, title, description, due_at, assigned_to, status, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throwWorkflowError(error);
  return data ?? [];
}

export async function saveTaskServer(input: {
  organizationId: string;
  id?: string | undefined;
  title: string;
  description: string;
  dueAt: string | null;
  assignedTo: string | null;
  status: "open" | "in_progress" | "done" | "cancelled";
}) {
  const { supabase, membership, userId } = await requireWorkflowAccess(input.organizationId, [
    "owner",
    "admin",
    "sales",
  ]);
  await verifyAssignee(supabase, input.organizationId, input.assignedTo, membership.role, userId);
  const fields = {
    title: input.title,
    description: input.description,
    due_at: input.dueAt,
    assigned_to: input.assignedTo ?? (membership.role === "sales" ? userId : null),
    status: input.status,
  };
  const result = input.id
    ? await supabase
        .from("developer_tasks")
        .update(fields)
        .eq("organization_id", input.organizationId)
        .eq("id", input.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("developer_tasks")
        .insert({
          ...fields,
          organization_id: input.organizationId,
        })
        .select("id")
        .single();
  if (result.error) throwWorkflowError(result.error);
  if (!result.data) throw new Response("Task was not found in this organization.", { status: 404 });
  return { id: result.data.id };
}

export async function listVisitsServer(organizationId: string) {
  const { supabase } = await requireWorkflowAccess(organizationId);
  const { data, error } = await supabase
    .from("developer_site_visits")
    .select(
      "id, project_id, lead_id, assigned_to, scheduled_at, duration_minutes, status, notes, created_at, project:developer_projects!developer_site_visits_project_fk(name)",
    )
    .eq("organization_id", organizationId)
    .order("scheduled_at", { ascending: true })
    .limit(100);
  if (error) throwWorkflowError(error);
  return data ?? [];
}

export async function saveVisitServer(input: {
  organizationId: string;
  id?: string | undefined;
  projectId: string;
  leadId: string | null;
  assignedTo: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string;
}) {
  const { supabase, membership, userId } = await requireWorkflowAccess(input.organizationId, [
    "owner",
    "admin",
    "sales",
  ]);
  await verifyAssignee(supabase, input.organizationId, input.assignedTo, membership.role, userId);
  if (input.leadId) {
    const { data, error } = await supabase
      .from("developer_leads")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("id", input.leadId)
      .maybeSingle();
    if (error) throwWorkflowError(error);
    if (!data) throw new Response("Lead was not found in this organization.", { status: 400 });
  }
  const fields = {
    project_id: input.projectId,
    lead_id: input.leadId,
    assigned_to: input.assignedTo ?? (membership.role === "sales" ? userId : null),
    scheduled_at: input.scheduledAt,
    duration_minutes: input.durationMinutes,
    status: input.status,
    notes: input.notes,
  };
  const result = input.id
    ? await supabase
        .from("developer_site_visits")
        .update(fields)
        .eq("organization_id", input.organizationId)
        .eq("id", input.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("developer_site_visits")
        .insert({
          ...fields,
          organization_id: input.organizationId,
        })
        .select("id")
        .single();
  if (result.error) throwWorkflowError(result.error);
  if (!result.data)
    throw new Response("Site visit was not found in this organization.", { status: 404 });
  return { id: result.data.id };
}

export async function listArticlesServer(organizationId: string) {
  const { supabase } = await requireWorkflowAccess(organizationId);
  const { data, error } = await supabase
    .from("developer_knowledge_articles")
    .select("id, title, category, content, status, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throwWorkflowError(error);
  return data ?? [];
}

export async function saveArticleServer(input: {
  organizationId: string;
  id?: string | undefined;
  title: string;
  category: string;
  content: string;
  status: "draft" | "published" | "archived";
}) {
  const { supabase } = await requireWorkflowAccess(input.organizationId, [
    "owner",
    "admin",
    "marketing",
  ]);
  const fields = {
    title: input.title,
    category: input.category,
    content: input.content,
    status: input.status,
  };
  const result = input.id
    ? await supabase
        .from("developer_knowledge_articles")
        .update(fields)
        .eq("organization_id", input.organizationId)
        .eq("id", input.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("developer_knowledge_articles")
        .insert({
          ...fields,
          organization_id: input.organizationId,
        })
        .select("id")
        .single();
  if (result.error) throwWorkflowError(result.error);
  if (!result.data)
    throw new Response("Article was not found in this organization.", { status: 404 });
  return { id: result.data.id };
}

export async function listCampaignsServer(organizationId: string) {
  const { supabase } = await requireWorkflowAccess(organizationId);
  const { data, error } = await supabase
    .from("developer_campaigns")
    .select(
      "id, project_id, name, channel, status, planned_budget, starts_on, ends_on, created_at, updated_at",
    )
    .eq("organization_id", organizationId)
    .order("starts_on", { ascending: false })
    .limit(100);
  if (error) throwWorkflowError(error);
  return data ?? [];
}

export async function saveCampaignServer(input: {
  organizationId: string;
  id?: string | undefined;
  projectId: string | null;
  name: string;
  channel: string;
  status: "planned" | "active" | "paused" | "completed";
  plannedBudget: number | null;
  startsOn: string | null;
  endsOn: string | null;
}) {
  const { supabase } = await requireWorkflowAccess(input.organizationId, [
    "owner",
    "admin",
    "marketing",
  ]);
  const fields = {
    project_id: input.projectId,
    name: input.name,
    channel: input.channel,
    status: input.status,
    planned_budget: input.plannedBudget,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
  };
  const result = input.id
    ? await supabase
        .from("developer_campaigns")
        .update(fields)
        .eq("organization_id", input.organizationId)
        .eq("id", input.id)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("developer_campaigns")
        .insert({
          ...fields,
          organization_id: input.organizationId,
        })
        .select("id")
        .single();
  if (result.error) throwWorkflowError(result.error);
  if (!result.data)
    throw new Response("Campaign was not found in this organization.", { status: 404 });
  return { id: result.data.id };
}

export async function listSupportRequestsServer(organizationId: string) {
  const { supabase } = await requireWorkflowAccess(organizationId);
  const { data, error } = await supabase
    .from("developer_support_requests")
    .select("id, requested_by, subject, message, status, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throwWorkflowError(error);
  return data ?? [];
}

export async function createSupportRequestServer(input: {
  organizationId: string;
  subject: string;
  message: string;
}) {
  const { supabase } = await requireWorkflowAccess(input.organizationId);
  const { data, error } = await supabase
    .from("developer_support_requests")
    .insert({
      organization_id: input.organizationId,
      subject: input.subject,
      message: input.message,
    })
    .select("id")
    .single();
  if (error) throwWorkflowError(error);
  if (!data) throw new Response("The support request could not be confirmed.", { status: 502 });
  return { id: data.id };
}

export async function updateSupportRequestStatusServer(input: {
  organizationId: string;
  requestId: string;
  status: "open" | "in_progress" | "resolved" | "closed";
}) {
  const { supabase } = await requireWorkflowAccess(input.organizationId, ["owner", "admin"]);
  const { data, error } = await supabase
    .from("developer_support_requests")
    .update({ status: input.status })
    .eq("organization_id", input.organizationId)
    .eq("id", input.requestId)
    .select("id")
    .maybeSingle();
  if (error) throwWorkflowError(error);
  if (!data)
    throw new Response("Support request was not found in this organization.", { status: 404 });
  return { id: data.id };
}

export async function listNotificationsServer(organizationId: string) {
  const { supabase } = await requireWorkflowAccess(organizationId);
  const { data, error } = await supabase
    .from("developer_notifications")
    .select("id, kind, title, body, entity_id, read_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throwWorkflowError(error);
  return data ?? [];
}

export async function markNotificationReadServer(input: {
  organizationId: string;
  notificationId: string;
}) {
  const { supabase } = await requireWorkflowAccess(input.organizationId);
  const { data, error } = await supabase
    .from("developer_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", input.organizationId)
    .eq("id", input.notificationId)
    .select("id")
    .maybeSingle();
  if (error) throwWorkflowError(error);
  if (!data)
    throw new Response("Notification was not found in this organization.", { status: 404 });
  return { id: data.id };
}

export async function listContactsServer(input: {
  organizationId: string;
  search: string;
  page: number;
}) {
  const { supabase } = await requireWorkflowAccess(input.organizationId);
  const start = input.page * MAX_PAGE_SIZE;
  let query = supabase
    .from("developer_leads")
    .select("id, full_name, email, phone, source, status, created_at", { count: "exact" })
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .range(start, start + MAX_PAGE_SIZE - 1);
  if (input.search) {
    const search = escapeLikeSearch(input.search).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
    const quotedPattern = `"%${search}%"`;
    query = query.or(
      `full_name.ilike.${quotedPattern},email.ilike.${quotedPattern},phone.ilike.${quotedPattern}`,
    );
  }
  const { data, error, count } = await query;
  if (error) throwWorkflowError(error);
  return { contacts: data ?? [], total: count ?? 0, page: input.page, pageSize: MAX_PAGE_SIZE };
}
