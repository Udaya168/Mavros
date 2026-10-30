import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import { getDeveloperDashboard } from "../developer-data";

export function OverviewPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const organizationId = developerSession.memberships[0]?.organizationId ?? "";
  const dashboardQuery = useQuery({
    queryKey: ["developer-dashboard", organizationId],
    queryFn: () => getDeveloperDashboard({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });

  return (
    <div>
      <p className="text-sm font-semibold text-[#1268e8]">Developer workspace</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102039]">Overview</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Signed in as {developerSession.user.email ?? "your developer account"}.
      </p>
      <div className="mt-7 rounded-xl border border-[#dbe2ec] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#102039]">Authorized organizations</h2>
        <ul className="mt-3 space-y-2">
          {developerSession.memberships.map((membership) => (
            <li
              key={membership.organizationId}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span className="font-medium text-[#20314a]">{membership.organizationName}</span>
              <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs capitalize text-[#1268e8]">
                {membership.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <section className="mt-7" aria-labelledby="workspace-metrics-heading">
        <h2 id="workspace-metrics-heading" className="text-sm font-semibold text-[#102039]">
          Workspace metrics
        </h2>
        {dashboardQuery.isPending ? (
          <p className="mt-3 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
            Loading organization metrics…
          </p>
        ) : dashboardQuery.isError ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-white p-5" role="alert">
            <p className="text-sm text-red-800">
              Organization metrics could not be loaded. Check database access and retry.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => void dashboardQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Projects"
              value={dashboardQuery.data.projects}
              detail={`${dashboardQuery.data.publishedProjects} published`}
            />
            <MetricCard
              label="Inventory units"
              value={dashboardQuery.data.units}
              detail={`${dashboardQuery.data.availableUnits} available`}
            />
            <MetricCard label="Leads" value={dashboardQuery.data.leads} />
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <article className="rounded-xl border border-[#dbe2ec] bg-white p-5">
      <p className="text-sm text-[#68778c]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#102039]">{value}</p>
      {detail && <p className="mt-1 text-xs text-[#8793a5]">{detail}</p>}
    </article>
  );
}
