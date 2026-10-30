import { useState, type FormEvent } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDeveloperSupportRequest,
  listDeveloperArticles,
  listDeveloperCampaigns,
  listDeveloperContacts,
  listDeveloperNotifications,
  listDeveloperSupportRequests,
  listDeveloperTasks,
  listDeveloperVisits,
  markDeveloperNotificationRead,
  saveDeveloperArticle,
  saveDeveloperCampaign,
  saveDeveloperTask,
  saveDeveloperVisit,
  updateDeveloperSupportRequestStatus,
} from "../workspace-data";
import { listDeveloperProjects } from "../developer-data";

function useOrganization() {
  const { developerSession } = useRouteContext({ from: "/app" });
  return {
    organizationId: developerSession.memberships[0]?.organizationId ?? "",
    role: developerSession.memberships[0]?.role ?? "",
    userId: developerSession.user.id,
  };
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
      <p className="text-sm text-red-800">{message}</p>
      <Button type="button" variant="outline" className="mt-3" onClick={retry}>
        Retry
      </Button>
    </section>
  );
}

function Loading() {
  return (
    <p className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
      Loading organization data…
    </p>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <p className="mt-6 rounded-xl border border-dashed border-[#cbd6e5] bg-white p-8 text-center text-sm text-[#68778c]">
      {children}
    </p>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "No due date";
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function taskTiming(value: string | null, status: string) {
  if (!value || status === "done" || status === "cancelled") return null;
  const due = new Date(value);
  const now = new Date();
  if (due < now) return "Overdue";
  if (due.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) return "Upcoming";
  return null;
}

export function TasksPage() {
  const { organizationId, role, userId } = useOrganization();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const query = useQuery({
    queryKey: ["developer-tasks", organizationId],
    queryFn: () => listDeveloperTasks({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const save = useMutation({
    mutationFn: (input: {
      id?: string;
      title: string;
      description: string;
      dueAt: string | null;
      assignedTo: string | null;
      status: "open" | "in_progress" | "done" | "cancelled";
    }) => saveDeveloperTask({ data: { organizationId, ...input } }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setDueAt("");
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["developer-tasks", organizationId] });
      await queryClient.invalidateQueries({
        queryKey: ["developer-notifications", organizationId],
      });
    },
    onError: (error) => setErrorMessage(error.message),
  });
  const canCreate = ["owner", "admin", "sales"].includes(role);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    save.mutate({
      title,
      description,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      assignedTo: userId,
      status: "open",
    });
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Tasks &amp; follow-ups</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Stored organization tasks. These records do not send email or external reminders.
      </p>
      {canCreate && (
        <form
          onSubmit={submit}
          className="mt-6 grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2"
        >
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Task title
            <Input
              required
              maxLength={180}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Due date
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a] sm:col-span-2">
            Description
            <textarea
              maxLength={5000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20 w-full rounded-md border p-3"
            />
          </label>
          {errorMessage && (
            <p role="alert" className="text-sm text-red-700 sm:col-span-2">
              {errorMessage}
            </p>
          )}
          <Button
            type="submit"
            disabled={save.isPending}
            className="w-fit bg-[#1268e8] text-white hover:bg-[#0d58cb]"
          >
            {save.isPending ? "Saving…" : "Create task"}
          </Button>
        </form>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.isError || !Array.isArray(query.data) ? (
        <LoadError
          message="Tasks could not be loaded. Apply the workflow migration if it has not been applied."
          retry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <Empty>No tasks have been recorded for this organization.</Empty>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-white">
          {query.data.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-[#20314a]">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-sm text-[#68778c]">{task.description}</p>
                )}
                <p className="mt-1 text-xs text-[#8793a5]">
                  {formatDate(task.due_at)} ·{" "}
                  {task.assigned_to === userId
                    ? "Assigned to you"
                    : task.assigned_to
                      ? "Assigned to a team member"
                      : "Unassigned"}
                  {taskTiming(task.due_at, task.status) && (
                    <span
                      className={`ml-2 font-semibold ${taskTiming(task.due_at, task.status) === "Overdue" ? "text-red-700" : "text-amber-700"}`}
                    >
                      {taskTiming(task.due_at, task.status)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm capitalize text-[#68778c]">
                  {task.status.replace("_", " ")}
                </span>
                {task.status !== "done" &&
                  task.status !== "cancelled" &&
                  (role === "owner" || role === "admin" || task.assigned_to === userId) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={save.isPending}
                      onClick={() =>
                        save.mutate({
                          id: task.id,
                          title: task.title,
                          description: task.description,
                          dueAt: task.due_at,
                          assignedTo: task.assigned_to,
                          status: "done",
                        })
                      }
                    >
                      Mark done
                    </Button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VisitsPage() {
  const { organizationId, role, userId } = useOrganization();
  const queryClient = useQueryClient();
  const projects = useQuery({
    queryKey: ["developer-projects", organizationId, "visit-options"],
    queryFn: () =>
      listDeveloperProjects({ data: { organizationId, search: "", status: null, page: 0 } }),
    enabled: Boolean(organizationId),
  });
  const visits = useQuery({
    queryKey: ["developer-visits", organizationId],
    queryFn: () => listDeveloperVisits({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const [visitId, setVisitId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [visitStatus, setVisitStatus] = useState<
    "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
  >("scheduled");
  const [assignedTo, setAssignedTo] = useState<string | null>(userId);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const save = useMutation({
    mutationFn: (input: {
      id?: string;
      projectId: string;
      scheduledAt: string;
      durationMinutes: number;
      status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
      assignedTo: string | null;
      leadId: string | null;
      notes: string;
    }) => saveDeveloperVisit({ data: { organizationId, ...input } }),
    onSuccess: async (_result, input) => {
      if (!input.id || input.id === visitId) {
        setVisitId("");
        setScheduledAt("");
        setDurationMinutes("60");
        setVisitStatus("scheduled");
        setAssignedTo(userId);
        setLeadId(null);
        setNotes("");
      }
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["developer-visits", organizationId] });
    },
    onError: (error) => setErrorMessage(error.message),
  });

  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Site visits</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Schedule and track visits for projects in this organization.
      </p>
      {projects.isError && (
        <LoadError
          message="Projects could not be loaded, so a site visit cannot be scheduled."
          retry={() => void projects.refetch()}
        />
      )}
      {["owner", "admin", "sales"].includes(role) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage("");
            save.mutate({
              ...(visitId ? { id: visitId } : {}),
              projectId,
              leadId,
              assignedTo,
              scheduledAt: new Date(scheduledAt).toISOString(),
              durationMinutes: Number(durationMinutes),
              status: visitStatus,
              notes,
            });
          }}
          className="mt-6 grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2"
        >
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Project
            <select
              required
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-10 w-full rounded-md border bg-white px-3"
            >
              <option value="">Select a project</option>
              {projects.data?.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Date and time
            <Input
              required
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Duration in minutes
            <Input
              required
              type="number"
              min="15"
              max="480"
              step="15"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Status
            <select
              value={visitStatus}
              onChange={(event) =>
                setVisitStatus(
                  event.target.value as
                    "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show",
                )
              }
              className="h-10 w-full rounded-md border bg-white px-3"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a] sm:col-span-2">
            Notes
            <Input
              maxLength={5000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          {errorMessage && (
            <p role="alert" className="text-sm text-red-700 sm:col-span-2">
              {errorMessage}
            </p>
          )}
          <Button
            type="submit"
            disabled={save.isPending || !projects.data?.projects.length}
            className="w-fit bg-[#1268e8] text-white hover:bg-[#0d58cb]"
          >
            {save.isPending ? "Saving…" : visitId ? "Save visit changes" : "Schedule visit"}
          </Button>
          {visitId && (
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={() => {
                setVisitId("");
                setProjectId("");
                setScheduledAt("");
                setDurationMinutes("60");
                setVisitStatus("scheduled");
                setAssignedTo(userId);
                setLeadId(null);
                setNotes("");
              }}
            >
              Cancel editing
            </Button>
          )}
        </form>
      )}
      {visits.isPending ? (
        <Loading />
      ) : visits.isError || !Array.isArray(visits.data) ? (
        <LoadError
          message="Site visits could not be loaded. Apply the workflow migration if it has not been applied."
          retry={() => void visits.refetch()}
        />
      ) : visits.data.length === 0 ? (
        <Empty>No site visits have been scheduled.</Empty>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-white">
          {visits.data.map((visit) => (
            <li key={visit.id} className="flex flex-wrap justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-[#20314a]">
                  {visit.project?.[0]?.name ?? "Project visit"}
                </p>
                <p className="mt-1 text-sm text-[#68778c]">
                  {formatDate(visit.scheduled_at)} · {visit.duration_minutes} minutes
                </p>
                {visit.notes && <p className="mt-1 text-sm text-[#68778c]">{visit.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm capitalize text-[#68778c]">
                  {visit.status.replace("_", " ")}
                </span>
                {(role === "owner" || role === "admin" || visit.assigned_to === userId) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={save.isPending}
                    onClick={() => {
                      setVisitId(visit.id);
                      setProjectId(visit.project_id);
                      setScheduledAt(toDatetimeLocalValue(visit.scheduled_at));
                      setDurationMinutes(String(visit.duration_minutes));
                      setVisitStatus(visit.status);
                      setAssignedTo(visit.assigned_to);
                      setLeadId(visit.lead_id);
                      setNotes(visit.notes);
                    }}
                  >
                    Edit
                  </Button>
                )}
                {visit.status !== "completed" &&
                  visit.status !== "cancelled" &&
                  visit.status !== "no_show" &&
                  (role === "owner" || role === "admin" || visit.assigned_to === userId) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={save.isPending}
                      onClick={() =>
                        save.mutate({
                          id: visit.id,
                          projectId: visit.project_id,
                          leadId: visit.lead_id,
                          assignedTo: visit.assigned_to,
                          scheduledAt: visit.scheduled_at,
                          durationMinutes: visit.duration_minutes,
                          status: "completed",
                          notes: visit.notes,
                        })
                      }
                    >
                      Mark completed
                    </Button>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export function KnowledgeBasePage() {
  const { organizationId, role } = useOrganization();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["developer-articles", organizationId],
    queryFn: () => listDeveloperArticles({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [articleId, setArticleId] = useState("");
  const [articleStatus, setArticleStatus] = useState<"draft" | "published" | "archived">("draft");
  const [message, setMessage] = useState("");
  const save = useMutation({
    mutationFn: (status: "draft" | "published" | "archived") =>
      saveDeveloperArticle({
        data: {
          organizationId,
          id: articleId || undefined,
          title,
          category,
          content,
          status,
        },
      }),
    onSuccess: async () => {
      setArticleId("");
      setTitle("");
      setCategory("general");
      setContent("");
      setArticleStatus("draft");
      setMessage(articleId ? "Article changes saved." : "Article saved.");
      await queryClient.invalidateQueries({ queryKey: ["developer-articles", organizationId] });
    },
    onError: (error) => setMessage(error.message),
  });
  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Knowledge base</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Organization articles are stored in Supabase. Document uploads and AI retrieval are not
        configured.
      </p>
      {["owner", "admin", "marketing"].includes(role) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(articleStatus);
          }}
          className="mt-6 space-y-3 rounded-xl border bg-white p-5"
        >
          <label className="block space-y-1 text-sm font-medium text-[#20314a]">
            Article title
            <Input
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm font-medium text-[#20314a]">
            Category
            <Input
              required
              maxLength={80}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm font-medium text-[#20314a]">
            Content
            <textarea
              required
              maxLength={50000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-36 w-full rounded-md border p-3"
            />
          </label>
          <label className="block space-y-1 text-sm font-medium text-[#20314a]">
            Status
            <select
              value={articleStatus}
              onChange={(event) =>
                setArticleStatus(event.target.value as "draft" | "published" | "archived")
              }
              className="h-10 w-full rounded-md border bg-white px-3"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          {message && (
            <p role={save.isError ? "alert" : "status"} className="text-sm text-[#68778c]">
              {message}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending} variant="outline">
              {articleId ? "Save changes" : "Save article"}
            </Button>
            <Button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate("published")}
              className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
            >
              {articleId ? "Save and publish" : "Publish"}
            </Button>
            {articleId && (
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={() => {
                  setArticleId("");
                  setTitle("");
                  setCategory("general");
                  setContent("");
                  setArticleStatus("draft");
                  setMessage("");
                }}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </form>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.isError || !Array.isArray(query.data) ? (
        <LoadError
          message="Articles could not be loaded. Apply the workflow migration if it has not been applied."
          retry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <Empty>No knowledge articles are stored yet.</Empty>
      ) : (
        <ul className="mt-6 space-y-3">
          {query.data.map((article) => (
            <li key={article.id} className="rounded-xl border bg-white p-5">
              <div className="flex justify-between gap-3">
                <h2 className="font-semibold text-[#20314a]">{article.title}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm capitalize text-[#68778c]">{article.status}</span>
                  {["owner", "admin", "marketing"].includes(role) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setArticleId(article.id);
                        setTitle(article.title);
                        setCategory(article.category);
                        setContent(article.content);
                        setArticleStatus(article.status);
                        setMessage("");
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-[#8793a5]">{article.category}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#68778c]">{article.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CampaignsPage() {
  const { organizationId, role } = useOrganization();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["developer-campaigns", organizationId],
    queryFn: () => listDeveloperCampaigns({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");
  const [budget, setBudget] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaignProjectId, setCampaignProjectId] = useState<string | null>(null);
  const [campaignStatus, setCampaignStatus] = useState<
    "planned" | "active" | "paused" | "completed"
  >("planned");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const save = useMutation({
    mutationFn: () =>
      saveDeveloperCampaign({
        data: {
          organizationId,
          id: campaignId || undefined,
          projectId: campaignProjectId,
          name,
          channel,
          status: campaignStatus,
          plannedBudget: budget ? Number(budget) : null,
          startsOn: startsOn || null,
          endsOn: endsOn || null,
        },
      }),
    onSuccess: async () => {
      setCampaignId("");
      setCampaignProjectId(null);
      setName("");
      setChannel("");
      setBudget("");
      setCampaignStatus("planned");
      setStartsOn("");
      setEndsOn("");
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["developer-campaigns", organizationId] });
    },
    onError: (error) => setErrorMessage(error.message),
  });
  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Campaigns</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Campaign plans and planned budgets only. No ad delivery, actual spend, or performance data
        is connected.
      </p>
      {["owner", "admin", "marketing"].includes(role) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
          className="mt-6 grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-3"
        >
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Campaign name
            <Input
              required
              maxLength={180}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Channel
            <Input
              required
              maxLength={80}
              placeholder="For example: email or social"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Planned budget
            <Input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Status
            <select
              value={campaignStatus}
              onChange={(event) =>
                setCampaignStatus(
                  event.target.value as "planned" | "active" | "paused" | "completed",
                )
              }
              className="h-10 w-full rounded-md border bg-white px-3"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Starts on
            <Input
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[#20314a]">
            Ends on
            <Input type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
          </label>
          {errorMessage && (
            <p role="alert" className="text-sm text-red-700 sm:col-span-3">
              {errorMessage}
            </p>
          )}
          <Button
            type="submit"
            disabled={save.isPending}
            className="w-fit bg-[#1268e8] text-white hover:bg-[#0d58cb]"
          >
            {save.isPending
              ? "Saving…"
              : campaignId
                ? "Save campaign changes"
                : "Save campaign plan"}
          </Button>
          {campaignId && (
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={() => {
                setCampaignId("");
                setCampaignProjectId(null);
                setName("");
                setChannel("");
                setBudget("");
                setCampaignStatus("planned");
                setStartsOn("");
                setEndsOn("");
              }}
            >
              Cancel editing
            </Button>
          )}
        </form>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.isError || !Array.isArray(query.data) ? (
        <LoadError
          message="Campaign plans could not be loaded. Apply the workflow migration if it has not been applied."
          retry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <Empty>No campaign plans have been recorded.</Empty>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-white">
          {query.data.map((campaign) => (
            <li key={campaign.id} className="flex flex-wrap justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-[#20314a]">{campaign.name}</p>
                <p className="mt-1 text-sm text-[#68778c]">
                  {campaign.channel} · Planned budget:{" "}
                  {campaign.planned_budget === null
                    ? "Not set"
                    : new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(Number(campaign.planned_budget))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm capitalize text-[#68778c]">{campaign.status}</span>
                {["owner", "admin", "marketing"].includes(role) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCampaignId(campaign.id);
                      setCampaignProjectId(campaign.project_id);
                      setName(campaign.name);
                      setChannel(campaign.channel);
                      setBudget(
                        campaign.planned_budget === null ? "" : String(campaign.planned_budget),
                      );
                      setCampaignStatus(campaign.status);
                      setStartsOn(campaign.starts_on ?? "");
                      setEndsOn(campaign.ends_on ?? "");
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ContactsPage() {
  const { organizationId } = useOrganization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["developer-contacts", organizationId, search, page],
    queryFn: () => listDeveloperContacts({ data: { organizationId, search, page } }),
    enabled: Boolean(organizationId),
  });
  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Contacts</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Contacts are currently the names and contact details recorded on leads; no separate customer
        directory exists.
      </p>
      <label className="mt-6 block max-w-lg">
        <span className="sr-only">Search contacts by name, email, or phone</span>
        <Input
          value={search}
          maxLength={120}
          placeholder="Search name, email, or phone"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
        />
      </label>
      {query.isPending ? (
        <Loading />
      ) : query.isError || !query.data || !Array.isArray(query.data.contacts) ? (
        <LoadError
          message="Lead contacts could not be loaded."
          retry={() => void query.refetch()}
        />
      ) : query.data.contacts.length === 0 ? (
        <Empty>
          {search ? "No contacts match this search." : "No lead contacts have been recorded."}
        </Empty>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-[#f8faff] text-[#68778c]">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Lead</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {query.data.contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="p-4 font-medium text-[#20314a]">{contact.full_name}</td>
                  <td className="p-4 text-[#68778c]">{contact.email ?? "—"}</td>
                  <td className="p-4 text-[#68778c]">{contact.phone ?? "—"}</td>
                  <td className="p-4 capitalize text-[#68778c]">
                    {contact.status.replace("_", " ")}
                  </td>
                  <td className="p-4">
                    <Link to="/app/leads" className="text-[#1268e8] hover:underline">
                      View leads
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-[#68778c]">
            <span>
              {page * query.data.pageSize + 1}–
              {Math.min((page + 1) * query.data.pageSize, query.data.total)} of {query.data.total}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={(page + 1) * query.data.pageSize >= query.data.total}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["developer-notifications", organizationId],
    queryFn: () => listDeveloperNotifications({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const markRead = useMutation({
    mutationFn: (notificationId: string) =>
      markDeveloperNotificationRead({ data: { organizationId, notificationId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["developer-notifications", organizationId],
      });
    },
  });
  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Notifications</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        In-app alerts for task assignments only. Email, WhatsApp, push, and scheduled reminders are
        not connected.
      </p>
      {markRead.isError && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {markRead.error.message}
        </p>
      )}
      {query.isPending ? (
        <Loading />
      ) : query.isError || !Array.isArray(query.data) ? (
        <LoadError
          message="Notifications could not be loaded. Apply the workflow migration if it has not been applied."
          retry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <Empty>No in-app notifications are available.</Empty>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-white">
          {query.data.map((notice) => (
            <li key={notice.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-[#20314a]">{notice.title}</p>
                <p className="mt-1 text-sm text-[#68778c]">{notice.body}</p>
                <time className="mt-1 block text-xs text-[#8793a5]">
                  {formatDate(notice.created_at)}
                </time>
              </div>
              {notice.read_at ? (
                <span className="text-xs text-[#8793a5]">Read</span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={markRead.isPending}
                  onClick={() => markRead.mutate(notice.id)}
                >
                  Mark read
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SupportPage() {
  const { organizationId, role } = useOrganization();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["developer-support", organizationId],
    queryFn: () => listDeveloperSupportRequests({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [statusFeedback, setStatusFeedback] = useState("");
  const create = useMutation({
    mutationFn: () => createDeveloperSupportRequest({ data: { organizationId, subject, message } }),
    onSuccess: async () => {
      setSubject("");
      setMessage("");
      setFeedback("Support request saved for your organization.");
      await queryClient.invalidateQueries({ queryKey: ["developer-support", organizationId] });
    },
    onError: (error) => setFeedback(error.message),
  });
  const updateStatus = useMutation({
    mutationFn: (input: {
      requestId: string;
      status: "open" | "in_progress" | "resolved" | "closed";
    }) => updateDeveloperSupportRequestStatus({ data: { organizationId, ...input } }),
    onSuccess: async () => {
      setStatusFeedback("Support request status updated.");
      await queryClient.invalidateQueries({ queryKey: ["developer-support", organizationId] });
    },
    onError: (error) => setStatusFeedback(error.message),
  });
  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Help &amp; Support</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Requests are stored in the organization workspace. No external ticket delivery or response
        SLA is configured.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
        className="mt-6 space-y-3 rounded-xl border bg-white p-5"
      >
        <label className="block space-y-1 text-sm font-medium text-[#20314a]">
          Subject
          <Input
            required
            maxLength={180}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm font-medium text-[#20314a]">
          Message
          <textarea
            required
            maxLength={10000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-28 w-full rounded-md border p-3"
          />
        </label>
        {feedback && (
          <p role={create.isError ? "alert" : "status"} className="text-sm text-[#68778c]">
            {feedback}
          </p>
        )}
        <Button
          type="submit"
          disabled={create.isPending}
          className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
        >
          {create.isPending ? "Submitting…" : "Submit request"}
        </Button>
      </form>
      {query.isPending ? (
        <Loading />
      ) : query.isError || !Array.isArray(query.data) ? (
        <LoadError
          message="Support requests could not be loaded. Apply the workflow migration if it has not been applied."
          retry={() => void query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <Empty>No support requests have been submitted.</Empty>
      ) : (
        <>
          {statusFeedback && (
            <p
              role={updateStatus.isError ? "alert" : "status"}
              className="mt-4 text-sm text-[#68778c]"
            >
              {statusFeedback}
            </p>
          )}
          <ul className="mt-6 divide-y rounded-xl border bg-white">
            {query.data.map((request) => (
              <li key={request.id} className="p-5">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-[#20314a]">{request.subject}</p>
                  {role === "owner" || role === "admin" ? (
                    <label className="flex items-center gap-2 text-sm text-[#68778c]">
                      Status
                      <select
                        value={request.status}
                        disabled={updateStatus.isPending}
                        onChange={(event) => {
                          setStatusFeedback("");
                          updateStatus.mutate({
                            requestId: request.id,
                            status: event.target.value as
                              "open" | "in_progress" | "resolved" | "closed",
                          });
                        }}
                        className="h-9 rounded-md border bg-white px-2"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </label>
                  ) : (
                    <span className="text-sm capitalize text-[#68778c]">
                      {request.status.replace("_", " ")}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#68778c]">{request.message}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
