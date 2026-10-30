import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import {
  listDeveloperOrganizationActivity,
  listDeveloperOrganizationTeamAudit,
} from "../developer-data";

export function ActivityPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const organizationId = developerSession.memberships[0]?.organizationId ?? "";
  const activityQuery = useQuery({
    queryKey: ["developer-activity", organizationId],
    queryFn: () => listDeveloperOrganizationActivity({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const membershipAuditQuery = useQuery({
    queryKey: ["developer-team-audit", organizationId],
    queryFn: () => listDeveloperOrganizationTeamAudit({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const events = Array.isArray(activityQuery.data) ? activityQuery.data : null;

  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">Activity log</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Recent project, inventory, and lead changes recorded by the database.
      </p>
      {activityQuery.isPending ? (
        <p className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
          Loading activity…
        </p>
      ) : activityQuery.isError || !events ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
          <p className="text-sm text-red-800">
            Activity could not be loaded. Apply the activity migration if it has not been applied,
            then retry.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void activityQuery.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : events.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-[#cbd6e5] bg-white p-8 text-center text-sm text-[#68778c]">
          No project, inventory, or lead activity has been recorded yet.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-[#e6ebf2] rounded-xl border border-[#dbe2ec] bg-white">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-medium capitalize text-[#20314a]">
                  {event.action} {event.entity_type.replace("_", " ")}
                </p>
                <p className="mt-1 text-xs text-[#8793a5]">
                  Record {event.entity_id} ·{" "}
                  {event.actor_user_id === developerSession.user.id
                    ? "You"
                    : event.actor_user_id
                      ? `User ${event.actor_user_id}`
                      : "System"}
                </p>
              </div>
              <time className="text-xs text-[#8793a5]" dateTime={event.created_at}>
                {new Date(event.created_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ol>
      )}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#20314a]">Membership security changes</h2>
        <p className="mt-1 text-sm text-[#68778c]">
          Role and active-status changes made by organization owners or admins.
        </p>
        {membershipAuditQuery.isPending ? (
          <p className="mt-4 text-sm text-[#68778c]">Loading membership history…</p>
        ) : membershipAuditQuery.isError || !Array.isArray(membershipAuditQuery.data) ? (
          <section className="mt-4 rounded-xl border border-red-200 bg-white p-5" role="alert">
            <p className="text-sm text-red-800">
              Membership security history could not be loaded. Verify the team-management migration.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => void membershipAuditQuery.refetch()}
            >
              Retry
            </Button>
          </section>
        ) : membershipAuditQuery.data.length === 0 ? (
          <p className="mt-4 text-sm text-[#68778c]">No membership changes have been recorded.</p>
        ) : (
          <ol className="mt-4 divide-y divide-[#e6ebf2] rounded-xl border border-[#dbe2ec] bg-white">
            {membershipAuditQuery.data.map((entry) => (
              <li key={entry.id} className="flex flex-wrap justify-between gap-3 p-5">
                <div>
                  <p className="text-sm font-medium text-[#20314a]">
                    {entry.target_user_id}: {entry.previous_role}
                    {entry.was_active ? " (active)" : " (inactive)"} → {entry.new_role}
                    {entry.is_active ? " (active)" : " (inactive)"}
                  </p>
                  <p className="mt-1 text-xs text-[#8793a5]">
                    Changed by {entry.actor_user_id ?? "system"}
                  </p>
                </div>
                <time className="text-xs text-[#8793a5]" dateTime={entry.created_at}>
                  {new Date(entry.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
