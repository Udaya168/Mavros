import { useState, type FormEvent } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listDeveloperProjects, saveDeveloperProject } from "../developer-data";
import { MAX_PAGE_SIZE } from "@shared/developer-portal/developer-data-core";

export type ProjectDraft = {
  id?: string;
  name: string;
  slug: string;
  location: string;
  reraId: string;
  possession: string;
  status: "draft" | "published";
  tagline: string;
  description: string;
  amenities: string;
};

const emptyDraft: ProjectDraft = {
  name: "",
  slug: "",
  location: "",
  reraId: "",
  possession: "",
  status: "draft",
  tagline: "",
  description: "",
  amenities: "",
};

export function ProjectsPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const organizationId = developerSession.memberships[0]?.organizationId ?? "";
  const role = developerSession.memberships[0]?.role;
  const canEdit = role === "owner" || role === "admin";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "draft" | "published">("");
  const [page, setPage] = useState(0);
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const query = useQuery({
    queryKey: ["developer-projects", organizationId, search, status, page],
    queryFn: () =>
      listDeveloperProjects({
        data: { organizationId, search, status: status || null, page },
      }),
    enabled: Boolean(organizationId),
  });
  const saveMutation = useMutation({
    mutationFn: (project: ProjectDraft) =>
      saveDeveloperProject({
        data: {
          organizationId,
          ...(project.id ? { id: project.id } : {}),
          name: project.name,
          slug: project.slug,
          location: project.location,
          reraId: project.reraId || null,
          possession: project.possession || null,
          status: project.status,
          tagline: project.tagline,
          description: project.description,
          amenities: project.amenities
            .split(",")
            .map((amenity) => amenity.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: async () => {
      setDraft(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["developer-projects", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-dashboard", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-reports", organizationId] }),
      ]);
    },
  });

  function startEditing(project: NonNullable<typeof query.data>["projects"][number]) {
    setDraft({
      id: project.id,
      name: project.name,
      slug: project.slug,
      location: project.location,
      reraId: project.rera_id ?? "",
      possession: project.possession ?? "",
      status: project.status,
      tagline: project.tagline,
      description: project.description,
      amenities: project.amenities.join(", "),
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1268e8]">Organization workspace</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102039]">Projects</h1>
        </div>
        {canEdit && (
          <Button
            type="button"
            onClick={() => {
              setDraft({ ...emptyDraft });
              saveMutation.reset();
            }}
            className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
          >
            <Plus aria-hidden="true" className="mr-2 size-4" />
            New project
          </Button>
        )}
      </div>

      {draft && (
        <ProjectForm
          draft={draft}
          busy={saveMutation.isPending}
          error={saveMutation.error}
          onCancel={() => {
            setDraft(null);
            saveMutation.reset();
          }}
          onChange={setDraft}
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate(draft);
          }}
        />
      )}

      <div className="mt-7 flex flex-wrap gap-3 rounded-xl border border-[#dbe2ec] bg-white p-4">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search projects</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8793a5]"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Search by project name"
            className="pl-9"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#68778c]">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | "draft" | "published");
              setPage(0);
            }}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm text-[#20314a]"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      {query.isPending ? (
        <div className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-8 text-sm text-[#68778c]">
          Loading projects…
        </div>
      ) : query.isError ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-6" role="alert">
          <h2 className="font-semibold text-[#102039]">Projects could not be loaded</h2>
          <p className="mt-2 text-sm text-[#68778c]">
            {query.error.message || "Check your connection and organization access, then retry."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void query.refetch()}
          >
            <RefreshCw aria-hidden="true" className="mr-2 size-4" />
            Retry
          </Button>
        </section>
      ) : query.data.projects.length === 0 ? (
        <section className="mt-6 rounded-xl border border-dashed border-[#cbd6e5] bg-white p-8 text-center">
          <h2 className="font-semibold text-[#102039]">
            {search || status ? "No matching projects" : "No projects yet"}
          </h2>
          <p className="mt-2 text-sm text-[#68778c]">
            {search || status
              ? "Try adjusting the search or status filter."
              : "Create a project to start maintaining organization-approved project information."}
          </p>
        </section>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#dbe2ec] bg-white">
          <ul className="divide-y divide-[#e6ebf2]">
            {query.data.projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <Link
                    to="/app/projects/$id"
                    params={{ id: project.id }}
                    className="font-semibold text-[#102039] hover:text-[#1268e8]"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-1 text-sm text-[#68778c]">
                    {project.location || "Location not provided"} · Updated{" "}
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      project.status === "published"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {project.status}
                  </span>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(project)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-[#e6ebf2] px-5 py-3 text-sm text-[#68778c]">
            <span>
              {page * MAX_PAGE_SIZE + 1}–{Math.min((page + 1) * MAX_PAGE_SIZE, query.data.total)} of{" "}
              {query.data.total}
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
                disabled={(page + 1) * MAX_PAGE_SIZE >= query.data.total}
                onClick={() => setPage(page + 1)}
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

export function ProjectForm({
  draft,
  busy,
  error,
  onCancel,
  onChange,
  onSubmit,
}: {
  draft: ProjectDraft;
  busy: boolean;
  error: Error | null;
  onCancel: () => void;
  onChange: (draft: ProjectDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function field<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-4 rounded-xl border border-[#dbe2ec] bg-white p-5"
    >
      <div>
        <h2 className="font-semibold text-[#102039]">
          {draft.id ? "Edit project" : "Create project"}
        </h2>
        <p className="mt-1 text-sm text-[#68778c]">
          Project information is private to this organization unless published.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
          Project name
          <Input
            required
            maxLength={160}
            value={draft.name}
            onChange={(event) => field("name", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
          URL slug
          <Input
            required
            maxLength={160}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={draft.slug}
            onChange={(event) => field("slug", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
          Location
          <Input
            maxLength={240}
            value={draft.location}
            onChange={(event) => field("location", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
          RERA ID
          <Input
            maxLength={120}
            value={draft.reraId}
            onChange={(event) => field("reraId", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
          Possession
          <Input
            maxLength={120}
            value={draft.possession}
            onChange={(event) => field("possession", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
          Status
          <select
            value={draft.status}
            onChange={(event) => field("status", event.target.value as ProjectDraft["status"])}
            className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a] sm:col-span-2">
          Tagline
          <Input
            maxLength={240}
            value={draft.tagline}
            onChange={(event) => field("tagline", event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a] sm:col-span-2">
          Description
          <textarea
            maxLength={5000}
            rows={4}
            value={draft.description}
            onChange={(event) => field("description", event.target.value)}
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-[#20314a] sm:col-span-2">
          Amenities (comma-separated)
          <Input
            value={draft.amenities}
            onChange={(event) => field("amenities", event.target.value)}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={busy}
          className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
        >
          {busy ? "Saving…" : draft.id ? "Save changes" : "Create project"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
