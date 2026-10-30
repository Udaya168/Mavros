import { useState } from "react";
import { Link, useParams, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getDeveloperProject,
  listDeveloperInventory,
  saveDeveloperProject,
} from "../developer-data";
import { ProjectForm, type ProjectDraft } from "./projects-page";

export function ProjectDetailsPage() {
  const { id } = useParams({ from: "/app/projects/$id" });
  const { developerSession } = useRouteContext({ from: "/app" });
  const membership = developerSession.memberships[0];
  const organizationId = membership?.organizationId ?? "";
  const canEdit = membership?.role === "owner" || membership?.role === "admin";
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const projectQuery = useQuery({
    queryKey: ["developer-project", organizationId, id],
    queryFn: () => getDeveloperProject({ data: { organizationId, id } }),
    enabled: Boolean(organizationId),
  });
  const inventoryQuery = useQuery({
    queryKey: ["developer-inventory", organizationId, id, null, "", 0],
    queryFn: () =>
      listDeveloperInventory({
        data: { organizationId, projectId: id, status: null, search: "", page: 0 },
      }),
    enabled: Boolean(organizationId),
  });
  const saveMutation = useMutation({
    mutationFn: (project: ProjectDraft) =>
      saveDeveloperProject({
        data: {
          organizationId,
          id,
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
        queryClient.invalidateQueries({ queryKey: ["developer-project", organizationId, id] }),
        queryClient.invalidateQueries({ queryKey: ["developer-projects", organizationId] }),
      ]);
    },
  });

  if (projectQuery.isPending) {
    return (
      <p className="rounded-xl border border-[#dbe2ec] bg-white p-8 text-sm text-[#68778c]">
        Loading project…
      </p>
    );
  }
  if (projectQuery.isError) {
    return (
      <section className="rounded-xl border border-red-200 bg-white p-6" role="alert">
        <h1 className="font-semibold text-[#102039]">Project could not be loaded</h1>
        <p className="mt-2 text-sm text-[#68778c]">{projectQuery.error.message}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void projectQuery.refetch()}
        >
          <RefreshCw aria-hidden="true" className="mr-2 size-4" />
          Retry
        </Button>
      </section>
    );
  }

  const project = projectQuery.data;
  return (
    <div>
      <Link to="/app/projects" className="text-sm font-semibold text-[#1268e8] hover:underline">
        ← Projects
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-[#102039]">{project.name}</h1>
          <p className="mt-2 text-sm text-[#68778c]">
            {project.location || "Location not provided"} ·{" "}
            <span className="capitalize">{project.status}</span>
          </p>
        </div>
        {canEdit && !draft && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
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
              saveMutation.reset();
            }}
          >
            Edit project
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

      <section className="mt-7 rounded-xl border border-[#dbe2ec] bg-white p-5">
        <h2 className="font-semibold text-[#102039]">Approved project information</h2>
        {project.tagline && <p className="mt-3 text-[#20314a]">{project.tagline}</p>}
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#68778c]">
          {project.description || "No project description has been added."}
        </p>
        <dl className="mt-5 grid gap-4 border-t border-[#e6ebf2] pt-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#8793a5]">RERA ID</dt>
            <dd className="mt-1 text-sm text-[#20314a]">{project.rera_id || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8793a5]">Possession</dt>
            <dd className="mt-1 text-sm text-[#20314a]">{project.possession || "Not provided"}</dd>
          </div>
        </dl>
        {project.amenities.length > 0 && (
          <div className="mt-5 border-t border-[#e6ebf2] pt-4">
            <h3 className="text-xs text-[#8793a5]">Amenities</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.amenities.map((amenity: string) => (
                <span
                  key={amenity}
                  className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs text-[#1268e8]"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-[#102039]">Inventory</h2>
            <p className="mt-1 text-sm text-[#68778c]">
              Units currently recorded for this project.
            </p>
          </div>
          <Link
            to="/app/$module"
            params={{ module: "inventory" }}
            className="text-sm font-semibold text-[#1268e8] hover:underline"
          >
            View inventory
          </Link>
        </div>
        {inventoryQuery.isPending ? (
          <p className="mt-4 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
            Loading inventory…
          </p>
        ) : inventoryQuery.isError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-white p-5 text-sm text-red-700"
          >
            Inventory could not be loaded. {inventoryQuery.error.message}
          </p>
        ) : inventoryQuery.data.units.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-[#cbd6e5] bg-white p-5 text-sm text-[#68778c]">
            No units have been added to this project.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#dbe2ec] bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f8faff] text-xs text-[#68778c]">
                <tr>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Tower</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf2]">
                {inventoryQuery.data.units.slice(0, 10).map((unit) => (
                  <tr key={unit.id}>
                    <td className="px-4 py-3 font-medium text-[#20314a]">{unit.unit_number}</td>
                    <td className="px-4 py-3 text-[#68778c]">{unit.tower?.[0]?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#68778c]">{unit.unit_type}</td>
                    <td className="px-4 py-3 text-[#68778c]">
                      {unit.area_sqft ? `${unit.area_sqft} sq ft` : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-[#68778c]">{unit.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
