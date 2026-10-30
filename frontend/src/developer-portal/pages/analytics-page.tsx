import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import { getDeveloperDashboard } from "../developer-data";

export function AnalyticsPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const organizationId = developerSession.memberships[0]?.organizationId ?? "";
  const analyticsQuery = useQuery({
    queryKey: ["developer-dashboard", organizationId],
    queryFn: () => getDeveloperDashboard({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });

  return (
    <div>
      <p className="text-sm font-semibold text-[#1268e8]">Organization workspace</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102039]">Analytics</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Current totals are calculated from this organization’s saved projects, units, and leads.
        Historical trends and campaign attribution are not available.
      </p>
      {analyticsQuery.isPending ? (
        <p className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
          Loading organization analytics…
        </p>
      ) : analyticsQuery.isError ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
          <p className="text-sm text-red-800">Analytics could not be loaded. Retry the query.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void analyticsQuery.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Projects"
            value={analyticsQuery.data.projects}
            detail={`${analyticsQuery.data.publishedProjects} published`}
          />
          <MetricCard
            label="Inventory units"
            value={analyticsQuery.data.units}
            detail={`${analyticsQuery.data.availableUnits} available`}
          />
          <MetricCard label="Leads" value={analyticsQuery.data.leads} />
        </div>
      )}
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
