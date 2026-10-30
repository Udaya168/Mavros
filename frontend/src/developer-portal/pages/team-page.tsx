import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import {
  listDeveloperOrganizationTeam,
  listDeveloperOrganizationTeamAudit,
  manageDeveloperOrganizationTeamMember,
} from "../developer-data";

type DeveloperRole = "owner" | "admin" | "marketing" | "sales" | "analyst";

export function TeamPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const membership = developerSession.memberships[0];
  const organizationId = membership?.organizationId ?? "";
  const canManage = membership?.role === "owner" || membership?.role === "admin";
  const queryClient = useQueryClient();
  const [roleDrafts, setRoleDrafts] = useState<Record<string, DeveloperRole>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const teamQuery = useQuery({
    queryKey: ["developer-team", organizationId],
    queryFn: () => listDeveloperOrganizationTeam({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const auditQuery = useQuery({
    queryKey: ["developer-team-audit", organizationId],
    queryFn: () => listDeveloperOrganizationTeamAudit({ data: { organizationId } }),
    enabled: Boolean(organizationId && canManage),
  });
  const manageMutation = useMutation({
    mutationFn: (input: { targetUserId: string; role: DeveloperRole; isActive: boolean }) =>
      manageDeveloperOrganizationTeamMember({ data: { organizationId, ...input } }),
    onSuccess: async () => {
      setSuccessMessage("Membership changes saved and recorded.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["developer-team", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["developer-team-audit", organizationId] }),
      ]);
    },
    onError: () => setSuccessMessage(""),
  });
  const members = Array.isArray(teamQuery.data) ? teamQuery.data : null;
  const audit = Array.isArray(auditQuery.data) ? auditQuery.data : null;

  if (!canManage) {
    return (
      <section className="rounded-xl border border-amber-200 bg-white p-5" role="alert">
        <h1 className="font-display text-3xl text-[#102039]">Team access denied</h1>
        <p className="mt-2 text-sm text-[#68778c]">
          Only organization owners and admins can view the team directory or manage memberships.
        </p>
      </section>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Team &amp; roles</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Manage existing memberships for {membership?.organizationName ?? "your organization"}.
        Invitations are unavailable because no trusted invitation provider is configured. Email
        addresses for other users are not exposed by the current profile policy.
      </p>
      {manageMutation.error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {manageMutation.error.message}
        </p>
      )}
      {successMessage && (
        <p role="status" className="mt-4 text-sm text-emerald-700">
          {successMessage}
        </p>
      )}
      {teamQuery.isPending ? (
        <p className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
          Loading team members…
        </p>
      ) : teamQuery.isError || !members ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
          <p className="text-sm text-red-800">
            Team members could not be loaded. Apply the team-directory and team-management
            migrations if they have not been applied, then retry.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void teamQuery.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : members.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-[#cbd6e5] bg-white p-8 text-center text-sm text-[#68778c]">
          No membership records were returned for this organization.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#dbe2ec] bg-white">
          <ul className="divide-y divide-[#e6ebf2]">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <p className="font-medium text-[#20314a]">
                    {member.full_name}
                    {member.user_id === developerSession.user.id ? " (you)" : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#8793a5]">
                    {member.user_id === developerSession.user.id
                      ? developerSession.user.email
                      : `Member ID ${member.user_id}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="capitalize text-[#68778c]">{member.role}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      member.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {member.user_id !== developerSession.user.id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`role-${member.user_id}`}>
                      Role for {member.full_name}
                    </label>
                    <select
                      id={`role-${member.user_id}`}
                      value={roleDrafts[member.user_id] ?? member.role}
                      onChange={(event) =>
                        setRoleDrafts((drafts) => ({
                          ...drafts,
                          [member.user_id]: event.target.value as DeveloperRole,
                        }))
                      }
                      disabled={
                        manageMutation.isPending ||
                        (membership?.role === "admin" && member.role === "owner")
                      }
                      className="h-9 rounded-md border border-input bg-white px-2 text-sm"
                    >
                      {(membership?.role === "owner" || member.role === "owner") && (
                        <option value="owner">Owner</option>
                      )}
                      <option value="admin">Admin</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                      <option value="analyst">Analyst</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        manageMutation.isPending ||
                        roleDrafts[member.user_id] === undefined ||
                        roleDrafts[member.user_id] === member.role ||
                        (membership?.role === "admin" && member.role === "owner")
                      }
                      onClick={() => {
                        setSuccessMessage("");
                        manageMutation.mutate({
                          targetUserId: member.user_id,
                          role: roleDrafts[member.user_id] ?? member.role,
                          isActive: member.is_active,
                        });
                      }}
                    >
                      Save role
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        manageMutation.isPending ||
                        (membership?.role === "admin" && member.role === "owner")
                      }
                      onClick={() => {
                        if (
                          member.is_active &&
                          !window.confirm(`Deactivate ${member.full_name} from this organization?`)
                        ) {
                          return;
                        }
                        setSuccessMessage("");
                        manageMutation.mutate({
                          targetUserId: member.user_id,
                          role: roleDrafts[member.user_id] ?? member.role,
                          isActive: !member.is_active,
                        });
                      }}
                    >
                      {member.is_active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {auditQuery.isPending ? (
        <p className="mt-8 text-sm text-[#68778c]">Loading membership change history…</p>
      ) : auditQuery.isError || !audit ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
          <p className="text-sm text-red-800">
            Membership change history could not be loaded. Verify the team-management migration.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void auditQuery.refetch()}
          >
            Retry history
          </Button>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#20314a]">Membership change history</h2>
          {audit.length === 0 ? (
            <p className="mt-3 text-sm text-[#68778c]">No membership changes have been recorded.</p>
          ) : (
            <ul className="mt-3 divide-y rounded-xl border border-[#dbe2ec] bg-white">
              {audit.map((entry) => (
                <li key={entry.id} className="flex flex-wrap justify-between gap-3 p-4 text-sm">
                  <p className="text-[#20314a]">
                    {entry.target_user_id} · {entry.previous_role}
                    {entry.was_active ? " (active)" : " (inactive)"} → {entry.new_role}
                    {entry.is_active ? " (active)" : " (inactive)"}
                  </p>
                  <time className="text-xs text-[#8793a5]" dateTime={entry.created_at}>
                    {new Date(entry.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
