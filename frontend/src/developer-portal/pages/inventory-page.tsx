import { useState, type FormEvent } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDeveloperInventoryUnit,
  listDeveloperInventory,
  listDeveloperProjects,
  updateDeveloperInventoryTower,
  updateDeveloperInventoryUnit,
} from "../developer-data";
import { MAX_PAGE_SIZE } from "@shared/developer-portal/developer-data-core";

type InventoryStatus = "" | "available" | "held" | "booked" | "sold" | "unlisted";
type InventoryUnitDraft = {
  id: string;
  unitType: string;
  areaSqft: string;
  approvedPrice: string;
  status: Exclude<InventoryStatus, "">;
};
type InventoryTowerDraft = {
  towerId: string;
  projectId: string;
  name: string;
};

export function InventoryPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const organizationId = developerSession.memberships[0]?.organizationId ?? "";
  const role = developerSession.memberships[0]?.role;
  const canEdit = role === "owner" || role === "admin";
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<InventoryStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [towerName, setTowerName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [approvedPrice, setApprovedPrice] = useState("");
  const [newUnitStatus, setNewUnitStatus] = useState<Exclude<InventoryStatus, "">>("available");
  const [unitDraft, setUnitDraft] = useState<InventoryUnitDraft | null>(null);
  const [towerDraft, setTowerDraft] = useState<InventoryTowerDraft | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState("");
  const projectsQuery = useQuery({
    queryKey: ["developer-projects", organizationId, "all-for-inventory"],
    queryFn: () =>
      listDeveloperProjects({
        data: { organizationId, search: "", status: null, page: 0 },
      }),
    enabled: Boolean(organizationId),
  });
  const inventoryQuery = useQuery({
    queryKey: ["developer-inventory", organizationId, projectId, status, search, page],
    queryFn: () =>
      listDeveloperInventory({
        data: {
          organizationId,
          projectId: projectId || null,
          status: status || null,
          search,
          page,
        },
      }),
    enabled: Boolean(organizationId),
  });
  const addUnitMutation = useMutation({
    mutationFn: () =>
      createDeveloperInventoryUnit({
        data: {
          organizationId,
          projectId,
          towerName,
          unitNumber,
          unitType,
          areaSqft: areaSqft ? Number(areaSqft) : null,
          approvedPrice: approvedPrice ? Number(approvedPrice) : null,
          status: newUnitStatus,
        },
      }),
    onSuccess: async () => {
      setShowAddUnit(false);
      setTowerName("");
      setUnitNumber("");
      setUnitType("");
      setAreaSqft("");
      setApprovedPrice("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["developer-inventory", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-dashboard", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-reports", organizationId] }),
      ]);
    },
  });
  const updateUnitMutation = useMutation({
    mutationFn: (draft: InventoryUnitDraft) =>
      updateDeveloperInventoryUnit({
        data: {
          organizationId,
          id: draft.id,
          unitType: draft.unitType,
          areaSqft: draft.areaSqft ? Number(draft.areaSqft) : null,
          approvedPrice: draft.approvedPrice ? Number(draft.approvedPrice) : null,
          status: draft.status,
        },
      }),
    onSuccess: async () => {
      setUnitDraft(null);
      setUpdateSuccess("Inventory unit updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["developer-inventory", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-dashboard", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-reports", organizationId] }),
      ]);
    },
  });
  const updateTowerMutation = useMutation({
    mutationFn: (draft: InventoryTowerDraft) =>
      updateDeveloperInventoryTower({
        data: {
          organizationId,
          projectId: draft.projectId,
          towerId: draft.towerId,
          name: draft.name,
        },
      }),
    onSuccess: async () => {
      setTowerDraft(null);
      setUpdateSuccess("Tower name updated.");
      await queryClient.invalidateQueries({ queryKey: ["developer-inventory", organizationId] });
    },
  });

  function submitNewUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addUnitMutation.mutate();
  }

  return (
    <div>
      <p className="text-sm font-semibold text-[#1268e8]">Organization workspace</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102039]">Inventory</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Units, approved pricing, and availability recorded for your organization.
      </p>

      {canEdit && (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowAddUnit((shown) => !shown);
              addUnitMutation.reset();
            }}
          >
            <Plus aria-hidden="true" className="mr-2 size-4" />
            Add unit
          </Button>
          {showAddUnit && (
            <form
              onSubmit={submitNewUnit}
              className="mt-4 space-y-4 rounded-xl border border-[#dbe2ec] bg-white p-5"
            >
              <div>
                <h2 className="font-semibold text-[#102039]">Add inventory unit</h2>
                <p className="mt-1 text-sm text-[#68778c]">
                  Pricing is optional and remains unset until approved.
                </p>
              </div>
              {addUnitMutation.error && (
                <p role="alert" className="text-sm text-red-700">
                  {addUnitMutation.error.message}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
                  Project
                  <select
                    required
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="">Select a project</option>
                    {projectsQuery.data?.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
                  Tower
                  <Input
                    required
                    maxLength={80}
                    value={towerName}
                    onChange={(event) => setTowerName(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
                  Unit number
                  <Input
                    required
                    maxLength={80}
                    value={unitNumber}
                    onChange={(event) => setUnitNumber(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
                  Unit type
                  <Input
                    required
                    maxLength={80}
                    placeholder="e.g. 2 BHK"
                    value={unitType}
                    onChange={(event) => setUnitType(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
                  Area (sq ft)
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={areaSqft}
                    onChange={(event) => setAreaSqft(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
                  Approved price (INR)
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={approvedPrice}
                    onChange={(event) => setApprovedPrice(event.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
                  Availability
                  <select
                    value={newUnitStatus}
                    onChange={(event) =>
                      setNewUnitStatus(event.target.value as Exclude<InventoryStatus, "">)
                    }
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="held">Held</option>
                    <option value="booked">Booked</option>
                    <option value="sold">Sold</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addUnitMutation.isPending || projectsQuery.isPending}
                  className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
                >
                  {addUnitMutation.isPending ? "Saving…" : "Save unit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddUnit(false)}
                  disabled={addUnitMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {unitDraft && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateUnitMutation.mutate(unitDraft);
          }}
          className="mt-4 space-y-4 rounded-xl border border-[#dbe2ec] bg-white p-5"
        >
          <div>
            <h2 className="font-semibold text-[#102039]">Update inventory unit</h2>
            <p className="mt-1 text-sm text-[#68778c]">
              Changes are limited to this organization’s unit details and availability.
            </p>
          </div>
          {updateUnitMutation.error && (
            <p role="alert" className="text-sm text-red-700">
              {updateUnitMutation.error.message}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
              Unit type
              <Input
                required
                maxLength={80}
                value={unitDraft.unitType}
                onChange={(event) => setUnitDraft({ ...unitDraft, unitType: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
              Area (sq ft)
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={unitDraft.areaSqft}
                onChange={(event) => setUnitDraft({ ...unitDraft, areaSqft: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
              Approved price (INR)
              <Input
                type="number"
                min="0"
                step="0.01"
                value={unitDraft.approvedPrice}
                onChange={(event) =>
                  setUnitDraft({ ...unitDraft, approvedPrice: event.target.value })
                }
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-[#20314a]">
              Availability
              <select
                value={unitDraft.status}
                onChange={(event) =>
                  setUnitDraft({
                    ...unitDraft,
                    status: event.target.value as Exclude<InventoryStatus, "">,
                  })
                }
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="available">Available</option>
                <option value="held">Held</option>
                <option value="booked">Booked</option>
                <option value="sold">Sold</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={updateUnitMutation.isPending}
              className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
            >
              {updateUnitMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={updateUnitMutation.isPending}
              onClick={() => {
                setUnitDraft(null);
                updateUnitMutation.reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {canEdit && towerDraft && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateTowerMutation.mutate(towerDraft);
          }}
          className="mt-4 space-y-4 rounded-xl border border-[#dbe2ec] bg-white p-5"
        >
          <div>
            <h2 className="font-semibold text-[#102039]">Rename tower</h2>
            <p className="mt-1 text-sm text-[#68778c]">
              The tower name changes for every unit linked to this tower.
            </p>
          </div>
          {updateTowerMutation.error && (
            <p role="alert" className="text-sm text-red-700">
              {updateTowerMutation.error.message}
            </p>
          )}
          <label className="block max-w-md space-y-1.5 text-sm font-medium text-[#20314a]">
            Tower name
            <Input
              required
              maxLength={80}
              value={towerDraft.name}
              onChange={(event) => setTowerDraft({ ...towerDraft, name: event.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={updateTowerMutation.isPending}
              className="bg-[#1268e8] text-white hover:bg-[#0d58cb]"
            >
              {updateTowerMutation.isPending ? "Saving…" : "Save tower"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={updateTowerMutation.isPending}
              onClick={() => {
                setTowerDraft(null);
                updateTowerMutation.reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-7 flex flex-wrap gap-3 rounded-xl border border-[#dbe2ec] bg-white p-4">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search unit number</span>
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
            placeholder="Search unit number"
            className="pl-9"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#68778c]">
          Project
          <select
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              setPage(0);
            }}
            className="h-10 min-w-40 rounded-md border border-input bg-white px-3 text-sm text-[#20314a]"
          >
            <option value="">All projects</option>
            {projectsQuery.data?.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-[#68778c]">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as InventoryStatus);
              setPage(0);
            }}
            className="h-10 rounded-md border border-input bg-white px-3 text-sm text-[#20314a]"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="held">Held</option>
            <option value="booked">Booked</option>
            <option value="sold">Sold</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </label>
      </div>

      {projectsQuery.isError && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          Project filter options could not be loaded.
        </p>
      )}
      {updateSuccess && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {updateSuccess}
        </p>
      )}
      {inventoryQuery.isPending ? (
        <div className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-8 text-sm text-[#68778c]">
          Loading inventory…
        </div>
      ) : inventoryQuery.isError ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-6" role="alert">
          <h2 className="font-semibold text-[#102039]">Inventory could not be loaded</h2>
          <p className="mt-2 text-sm text-[#68778c]">{inventoryQuery.error.message}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void inventoryQuery.refetch()}
          >
            <RefreshCw aria-hidden="true" className="mr-2 size-4" />
            Retry
          </Button>
        </section>
      ) : inventoryQuery.data.units.length === 0 ? (
        <section className="mt-6 rounded-xl border border-dashed border-[#cbd6e5] bg-white p-8 text-center">
          <h2 className="font-semibold text-[#102039]">
            {search || status || projectId ? "No matching units" : "No inventory records yet"}
          </h2>
          <p className="mt-2 text-sm text-[#68778c]">
            {search || status || projectId
              ? "Try adjusting the search or filters."
              : "Add project, tower, and unit records to the organization inventory before availability or pricing appears here."}
          </p>
          {projectsQuery.data?.total === 0 && (
            <Link
              to="/app/projects"
              className="mt-4 inline-block text-sm font-semibold text-[#1268e8] hover:underline"
            >
              Create a project
            </Link>
          )}
        </section>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[#dbe2ec] bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#f8faff] text-xs text-[#68778c]">
              <tr>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Tower</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Approved price</th>
                <th className="px-4 py-3 font-medium">Availability</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                {canEdit && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf2]">
              {inventoryQuery.data.units.map((unit) => (
                <tr key={unit.id}>
                  <td className="px-4 py-3 font-medium text-[#20314a]">{unit.unit_number}</td>
                  <td className="px-4 py-3 text-[#68778c]">{unit.project?.[0]?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-[#68778c]">{unit.tower?.[0]?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-[#68778c]">{unit.unit_type}</td>
                  <td className="px-4 py-3 text-[#68778c]">
                    {unit.area_sqft ? `${unit.area_sqft} sq ft` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#68778c]">
                    {unit.approved_price === null
                      ? "Not approved"
                      : new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(Number(unit.approved_price))}
                  </td>
                  <td className="px-4 py-3 capitalize text-[#68778c]">{unit.status}</td>
                  <td className="px-4 py-3 text-[#68778c]">
                    {new Date(unit.updated_at).toLocaleDateString()}
                  </td>
                  {canEdit && (
                    <td className="space-x-2 px-4 py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUpdateSuccess("");
                          updateUnitMutation.reset();
                          setUnitDraft({
                            id: unit.id,
                            unitType: unit.unit_type,
                            areaSqft: unit.area_sqft === null ? "" : String(unit.area_sqft),
                            approvedPrice:
                              unit.approved_price === null ? "" : String(unit.approved_price),
                            status: unit.status,
                          });
                        }}
                      >
                        Edit unit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUpdateSuccess("");
                          updateTowerMutation.reset();
                          setTowerDraft({
                            towerId: unit.tower_id,
                            projectId: unit.project_id,
                            name: unit.tower?.[0]?.name ?? "",
                          });
                        }}
                      >
                        Rename tower
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-[#e6ebf2] px-5 py-3 text-sm text-[#68778c]">
            <span>
              {page * MAX_PAGE_SIZE + 1}–
              {Math.min((page + 1) * MAX_PAGE_SIZE, inventoryQuery.data.total)} of{" "}
              {inventoryQuery.data.total}
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
                disabled={(page + 1) * MAX_PAGE_SIZE >= inventoryQuery.data.total}
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
