import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDeveloperLead,
  getDeveloperLeadFacets,
  getDeveloperLeadOverview,
  listDeveloperLeads,
  saveDeveloperLead,
} from "../leads-data";
import {
  canManageLeads,
  canTransitionLeadStatus,
  LEAD_PAGE_SIZE,
  LEAD_SOURCES,
  LEAD_STATUSES,
  leadFollowUpState,
  type LeadSource,
  type LeadStatus,
} from "@shared/developer-portal/leads-core";

type LeadFormValues = {
  fullName: string;
  email: string;
  phone: string;
  projectId: string;
  assignedTo: string;
  source: LeadSource;
  status: LeadStatus;
  budgetMin: string;
  budgetMax: string;
  preferredConfiguration: string;
  notes: string;
  nextFollowUpAt: string;
};

const emptyLead: LeadFormValues = {
  fullName: "",
  email: "",
  phone: "",
  projectId: "",
  assignedTo: "",
  source: "website",
  status: "new",
  budgetMin: "",
  budgetMax: "",
  preferredConfiguration: "",
  notes: "",
  nextFollowUpAt: "",
};

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit: "Site Visit",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export function LeadsPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const membership = developerSession.memberships[0];
  const organizationId = membership?.organizationId ?? "";
  const userId = developerSession.user.id;
  const canEdit = membership ? canManageLeads(membership.role) : false;
  const canAssignOthers = membership?.role === "owner" || membership?.role === "admin";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<"" | LeadStatus>("");
  const [source, setSource] = useState<"" | LeadSource>("");
  const [assignedTo, setAssignedTo] = useState("");
  const [page, setPage] = useState(0);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [form, setForm] = useState<LeadFormValues | null>(null);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const overviewQuery = useQuery({
    queryKey: ["developer-lead-overview", organizationId],
    queryFn: () => getDeveloperLeadOverview({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const facetsQuery = useQuery({
    queryKey: ["developer-lead-facets", organizationId],
    queryFn: () => getDeveloperLeadFacets({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const leadsQuery = useQuery({
    queryKey: [
      "developer-leads",
      organizationId,
      search,
      projectId,
      status,
      source,
      assignedTo,
      page,
    ],
    queryFn: () =>
      listDeveloperLeads({
        data: {
          organizationId,
          search,
          projectId: projectId || null,
          status: status || null,
          source: source || null,
          assignedTo: assignedTo || null,
          page,
        },
      }),
    enabled: Boolean(organizationId),
  });
  const selectedLeadQuery = useQuery({
    queryKey: ["developer-lead", organizationId, selectedLeadId],
    queryFn: () => getDeveloperLead({ data: { organizationId, leadId: selectedLeadId } }),
    enabled: Boolean(organizationId && selectedLeadId && !form),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveDeveloperLead({
        data: {
          organizationId,
          ...(selectedLeadId ? { leadId: selectedLeadId } : {}),
          fullName: form?.fullName ?? "",
          email: form?.email ?? "",
          phone: form?.phone ?? "",
          projectId: form?.projectId || null,
          assignedTo: form?.assignedTo || null,
          source: form?.source ?? "other",
          status: form?.status ?? "new",
          budgetMin: form?.budgetMin ?? "",
          budgetMax: form?.budgetMax ?? "",
          preferredConfiguration: form?.preferredConfiguration || null,
          notes: form?.notes || null,
          nextFollowUpAt: localDateTimeToIso(form?.nextFollowUpAt ?? ""),
        },
      }),
    onSuccess: async () => {
      setForm(null);
      setFormError("");
      setSuccessMessage(selectedLeadId ? "Lead changes saved." : "Lead created.");
      setSelectedLeadId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["developer-leads", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-lead-overview", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-lead", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-dashboard", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-reports", organizationId] }),
      ]);
    },
    onError: (error) => setFormError(error.message || "Lead could not be saved. Please retry."),
  });

  const currentLead = selectedLeadQuery.data;
  const availableStatusTransitions = useMemo(
    () =>
      currentLead
        ? LEAD_STATUSES.filter((candidate) =>
            canTransitionLeadStatus(currentLead.status, candidate),
          )
        : LEAD_STATUSES,
    [currentLead],
  );

  function resetPageAndSuccess() {
    setPage(0);
    setSuccessMessage("");
  }

  function beginCreate() {
    setSelectedLeadId("");
    setForm({ ...emptyLead, assignedTo: canAssignOthers ? "" : userId });
    setFormError("");
    setSuccessMessage("");
    saveMutation.reset();
  }

  function beginEdit() {
    if (!currentLead) return;
    setForm({
      fullName: currentLead.full_name,
      email: currentLead.email ?? "",
      phone: currentLead.phone ?? "",
      projectId: currentLead.project_id ?? "",
      assignedTo: currentLead.assigned_to ?? "",
      source: currentLead.source,
      status: currentLead.status,
      budgetMin: currentLead.budget_min === null ? "" : String(currentLead.budget_min),
      budgetMax: currentLead.budget_max === null ? "" : String(currentLead.budget_max),
      preferredConfiguration: currentLead.preferred_configuration ?? "",
      notes: currentLead.notes ?? "",
      nextFollowUpAt: isoToLocalDateTime(currentLead.next_follow_up_at),
    });
    setFormError("");
    setSuccessMessage("");
    saveMutation.reset();
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    saveMutation.mutate();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1268e8]">Organization workspace</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102039]">
            Lead pipeline
          </h1>
          <p className="mt-2 text-sm text-[#68778c]">
            Manage inquiries, qualification, ownership, and follow-up tasks.
          </p>
        </div>
        {canEdit && (
          <Button
            type="button"
            onClick={beginCreate}
            className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
          >
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Add lead
          </Button>
        )}
      </div>

      {overviewQuery.isPending ? (
        <div className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
          Loading lead overview…
        </div>
      ) : overviewQuery.isError ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
          <p className="text-sm text-red-800">Lead counts could not be loaded.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void overviewQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" className="mr-2 size-4" /> Retry
          </Button>
        </section>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="All leads" value={overviewQuery.data.total} />
          <OverviewCard label="New" value={overviewQuery.data.counts["new"] ?? 0} />
          <OverviewCard
            label="Overdue follow-ups"
            value={overviewQuery.data.overdueFollowUps}
            emphasis={overviewQuery.data.overdueFollowUps > 0}
          />
          <OverviewCard label="Upcoming follow-ups" value={overviewQuery.data.upcomingFollowUps} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3 rounded-xl border border-[#dbe2ec] bg-white p-4">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search leads</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8793a5]"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
              setSuccessMessage("");
            }}
            placeholder="Search name, email, or phone"
            className="pl-9"
          />
        </label>
        <FilterSelect
          label="Project"
          value={projectId}
          onChange={(value) => {
            setProjectId(value);
            resetPageAndSuccess();
          }}
        >
          <option value="">All projects</option>
          {facetsQuery.data?.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value as "" | LeadStatus);
            resetPageAndSuccess();
          }}
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((item) => (
            <option key={item} value={item}>
              {statusLabels[item]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Source"
          value={source}
          onChange={(value) => {
            setSource(value as "" | LeadSource);
            resetPageAndSuccess();
          }}
        >
          <option value="">All sources</option>
          {LEAD_SOURCES.map((item) => (
            <option key={item} value={item}>
              {sourceLabel(item)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Assignee"
          value={assignedTo}
          onChange={(value) => {
            setAssignedTo(value);
            resetPageAndSuccess();
          }}
        >
          <option value="">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {facetsQuery.data?.assignees.map((assignee) => (
            <option key={assignee.user_id} value={assignee.user_id}>
              {assignee.full_name}
              {assignee.user_id === userId ? " (you)" : ""}
            </option>
          ))}
        </FilterSelect>
      </div>

      {successMessage && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {successMessage}
        </p>
      )}
      {facetsQuery.isError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          Project and assignee filters could not be loaded.
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => void facetsQuery.refetch()}
          >
            Retry
          </button>
        </p>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-[#dbe2ec] bg-white">
          {leadsQuery.isPending ? (
            <p className="p-7 text-sm text-[#68778c]">Loading leads…</p>
          ) : leadsQuery.isError ? (
            <div className="p-6" role="alert">
              <h2 className="font-semibold text-[#102039]">Leads could not be loaded</h2>
              <p className="mt-2 text-sm text-[#68778c]">{leadsQuery.error.message}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void leadsQuery.refetch()}
              >
                <RefreshCw aria-hidden="true" className="mr-2 size-4" /> Retry
              </Button>
            </div>
          ) : leadsQuery.data.leads.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="font-semibold text-[#102039]">
                {search || projectId || status || source || assignedTo
                  ? "No matching leads"
                  : "No leads yet"}
              </h2>
              <p className="mt-2 text-sm text-[#68778c]">
                {search || projectId || status || source || assignedTo
                  ? "Try adjusting the search or filters."
                  : "New inquiries recorded for this organization will appear here."}
              </p>
              {canEdit && !search && !projectId && !status && !source && !assignedTo && (
                <Button type="button" variant="outline" className="mt-4" onClick={beginCreate}>
                  <Plus aria-hidden="true" className="mr-2 size-4" /> Add first lead
                </Button>
              )}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-[#e6ebf2]">
                {leadsQuery.data.leads.map((lead) => {
                  const followUp = leadFollowUpState(lead.next_follow_up_at);
                  const project = facetsQuery.data?.projects.find(
                    (item) => item.id === lead.project_id,
                  );
                  const assignee = facetsQuery.data?.assignees.find(
                    (item) => item.user_id === lead.assigned_to,
                  );
                  return (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setForm(null);
                          setFormError("");
                          setSuccessMessage("");
                        }}
                        aria-pressed={selectedLeadId === lead.id}
                        className={`w-full p-4 text-left transition hover:bg-[#f8faff] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#1268e8] ${
                          selectedLeadId === lead.id ? "bg-[#f2f6ff]" : ""
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#102039]">
                              {lead.full_name}
                            </p>
                            <p className="mt-1 truncate text-xs text-[#68778c]">
                              {lead.email || lead.phone || "No contact details"} ·{" "}
                              {project?.name ?? "No project"}
                            </p>
                          </div>
                          <StatusPill status={lead.status} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#68778c]">
                          <span>Source: {sourceLabel(lead.source)}</span>
                          <span>
                            Assigned:{" "}
                            {assignee?.full_name ?? (lead.assigned_to ? "Member" : "Unassigned")}
                          </span>
                          {followUp !== "none" && (
                            <span
                              className={
                                followUp === "overdue"
                                  ? "font-semibold text-red-700"
                                  : "text-[#1268e8]"
                              }
                            >
                              {followUp === "overdue" ? "Overdue" : "Follow-up"}{" "}
                              {new Date(lead.next_follow_up_at!).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between border-t border-[#e6ebf2] px-4 py-3 text-sm text-[#68778c]">
                <span>
                  {page * LEAD_PAGE_SIZE + 1}–
                  {Math.min((page + 1) * LEAD_PAGE_SIZE, leadsQuery.data.total)} of{" "}
                  {leadsQuery.data.total}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={(page + 1) * LEAD_PAGE_SIZE >= leadsQuery.data.total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-[#dbe2ec] bg-white p-5">
          {form ? (
            <LeadForm
              values={form}
              isEditing={Boolean(selectedLeadId)}
              isPending={saveMutation.isPending}
              error={formError}
              projects={facetsQuery.data?.projects ?? []}
              assignees={facetsQuery.data?.assignees ?? []}
              canAssignOthers={canAssignOthers}
              userId={userId}
              statusOptions={selectedLeadId ? availableStatusTransitions : ["new"]}
              onChange={setForm}
              onSubmit={submitForm}
              onCancel={() => {
                setForm(null);
                setFormError("");
                setSelectedLeadId("");
              }}
            />
          ) : !selectedLeadId ? (
            <div className="py-10 text-center">
              <h2 className="font-semibold text-[#102039]">Lead details</h2>
              <p className="mt-2 text-sm text-[#68778c]">
                Select a lead to review qualification and follow-up details.
              </p>
            </div>
          ) : selectedLeadQuery.isPending ? (
            <p className="py-8 text-sm text-[#68778c]">Loading lead details…</p>
          ) : selectedLeadQuery.isError ? (
            <div role="alert">
              <h2 className="font-semibold text-[#102039]">Lead details could not be loaded</h2>
              <p className="mt-2 text-sm text-[#68778c]">{selectedLeadQuery.error.message}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void selectedLeadQuery.refetch()}
                >
                  <RefreshCw aria-hidden="true" className="mr-2 size-4" /> Retry
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeadId("")}
                >
                  <X aria-hidden="true" className="mr-2 size-4" /> Close
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[#102039]">{currentLead?.full_name}</h2>
                  <p className="mt-1 text-sm text-[#68778c]">
                    {currentLead?.email || "No email"} · {currentLead?.phone || "No phone"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close lead details"
                  onClick={() => setSelectedLeadId("")}
                  className="rounded p-1 text-[#68778c] hover:bg-[#f1f5fa]"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusPill status={currentLead!.status} />
                {canEdit && (
                  <Button type="button" size="sm" variant="outline" onClick={beginEdit}>
                    Edit lead
                  </Button>
                )}
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#e6ebf2] pt-4 text-sm">
                <Detail label="Source" value={sourceLabel(currentLead!.source)} />
                <Detail
                  label="Project"
                  value={
                    facetsQuery.data?.projects.find((item) => item.id === currentLead!.project_id)
                      ?.name ?? "Not selected"
                  }
                />
                <Detail
                  label="Configuration"
                  value={currentLead!.preferred_configuration || "Not provided"}
                />
                <Detail
                  label="Budget"
                  value={formatBudget(currentLead!.budget_min, currentLead!.budget_max)}
                />
                <Detail
                  label="Assigned to"
                  value={
                    facetsQuery.data?.assignees.find(
                      (item) => item.user_id === currentLead!.assigned_to,
                    )?.full_name ??
                    (currentLead!.assigned_to ? "Organization member" : "Unassigned")
                  }
                />
                <Detail
                  label="Created"
                  value={new Date(currentLead!.created_at).toLocaleString()}
                />
              </dl>
              <div className="mt-4 border-t border-[#e6ebf2] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8793a5]">
                  Notes
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#20314a]">
                  {currentLead!.notes || "No notes recorded."}
                </p>
              </div>
              <FollowUpIndicator followUpAt={currentLead!.next_follow_up_at} />
              <p className="mt-4 text-xs text-[#8793a5]">
                Follow-ups are shown in this workspace only. No email, WhatsApp, or automatic
                reminders are configured.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#dbe2ec] bg-white p-4">
      <p className="text-xs font-medium text-[#68778c]">{label}</p>
      <p className={`mt-2 font-display text-3xl ${emphasis ? "text-red-700" : "text-[#102039]"}`}>
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#68778c]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 max-w-44 rounded-md border border-input bg-white px-3 text-sm text-[#20314a]"
      >
        {children}
      </select>
    </label>
  );
}

function StatusPill({ status }: { status: LeadStatus }) {
  const color =
    status === "won"
      ? "bg-emerald-50 text-emerald-700"
      : status === "lost"
        ? "bg-slate-100 text-slate-600"
        : status === "negotiation" || status === "site_visit"
          ? "bg-violet-50 text-violet-700"
          : status === "qualified"
            ? "bg-blue-50 text-blue-700"
            : status === "contacted"
              ? "bg-amber-50 text-amber-800"
              : "bg-[#edf2f8] text-[#52627a]";
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      {statusLabels[status]}
    </span>
  );
}

function LeadForm({
  values,
  isEditing,
  isPending,
  error,
  projects,
  assignees,
  canAssignOthers,
  userId,
  statusOptions,
  onChange,
  onSubmit,
  onCancel,
}: {
  values: LeadFormValues;
  isEditing: boolean;
  isPending: boolean;
  error: string;
  projects: { id: string; name: string }[];
  assignees: { user_id: string; full_name: string }[];
  canAssignOthers: boolean;
  userId: string;
  statusOptions: readonly LeadStatus[];
  onChange: (values: LeadFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  function set<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-[#102039]">
            {isEditing ? "Update lead" : "Create lead"}
          </h2>
          <p className="mt-1 text-xs text-[#68778c]">Contact and qualification details</p>
        </div>
        <button
          type="button"
          aria-label="Close lead form"
          onClick={onCancel}
          className="rounded p-1 text-[#68778c] hover:bg-[#f1f5fa]"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-[#52627a] sm:col-span-2">
          Full name *
          <Input
            required
            maxLength={160}
            value={values.fullName}
            onChange={(event) => set("fullName", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Email
          <Input
            type="email"
            maxLength={320}
            value={values.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Phone
          <Input
            type="tel"
            maxLength={40}
            value={values.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Project
          <select
            value={values.projectId}
            onChange={(event) => set("projectId", event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20314a]"
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Source
          <select
            value={values.source}
            onChange={(event) => set("source", event.target.value as LeadSource)}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20314a]"
          >
            {LEAD_SOURCES.map((item) => (
              <option key={item} value={item}>
                {sourceLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Status
          <select
            value={values.status}
            onChange={(event) => set("status", event.target.value as LeadStatus)}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20314a]"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Assign to
          <select
            value={values.assignedTo}
            disabled={!canAssignOthers}
            onChange={(event) => set("assignedTo", event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20314a] disabled:bg-slate-50"
          >
            <option value="">Unassigned</option>
            {assignees
              .filter((person) => canAssignOthers || person.user_id === userId)
              .map((person) => (
                <option key={person.user_id} value={person.user_id}>
                  {person.full_name}
                  {person.user_id === userId ? " (you)" : ""}
                </option>
              ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Budget minimum
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.budgetMin}
            onChange={(event) => set("budgetMin", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a]">
          Budget maximum
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.budgetMax}
            onChange={(event) => set("budgetMax", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a] sm:col-span-2">
          Preferred configuration
          <Input
            maxLength={120}
            placeholder="e.g. 2 BHK"
            value={values.preferredConfiguration}
            onChange={(event) => set("preferredConfiguration", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a] sm:col-span-2">
          Next follow-up
          <Input
            type="datetime-local"
            value={values.nextFollowUpAt}
            onChange={(event) => set("nextFollowUpAt", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-[#52627a] sm:col-span-2">
          Notes
          <textarea
            maxLength={10_000}
            rows={4}
            value={values.notes}
            onChange={(event) => set("notes", event.target.value)}
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-[#20314a]"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
        >
          {isPending ? "Saving…" : isEditing ? "Save changes" : "Create lead"}
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-[#8793a5]">{label}</dt>
      <dd className="mt-1 break-words text-sm text-[#20314a]">{value}</dd>
    </div>
  );
}

function FollowUpIndicator({ followUpAt }: { followUpAt: string | null }) {
  const state = leadFollowUpState(followUpAt);
  if (!followUpAt) {
    return (
      <p className="mt-4 border-t border-[#e6ebf2] pt-4 text-sm text-[#68778c]">
        No follow-up scheduled.
      </p>
    );
  }
  return (
    <p
      className={`mt-4 border-t border-[#e6ebf2] pt-4 text-sm ${state === "overdue" ? "font-semibold text-red-700" : "text-[#1268e8]"}`}
    >
      {state === "overdue" ? "Overdue follow-up" : "Upcoming follow-up"}:{" "}
      {new Date(followUpAt).toLocaleString()}
    </p>
  );
}

function sourceLabel(source: string): string {
  return source === "walk_in" ? "Walk-in" : source.charAt(0).toUpperCase() + source.slice(1);
}

function formatBudget(minimum: number | string | null, maximum: number | string | null): string {
  const format = (value: number | string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value));
  if (minimum === null && maximum === null) return "Not provided";
  if (minimum === null) return `Up to ${format(maximum!)}`;
  if (maximum === null) return `From ${format(minimum)}`;
  return `${format(minimum)} – ${format(maximum)}`;
}

function localDateTimeToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function isoToLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
