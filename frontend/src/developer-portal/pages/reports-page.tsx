import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

import { getDeveloperReports } from "../developer-data";

const reportSections = [
  { key: "projects", title: "Projects" },
  { key: "inventory", title: "Inventory units" },
  { key: "leads", title: "Leads" },
] as const;

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ReportsPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const organizationId = developerSession.memberships[0]?.organizationId ?? "";
  const query = useQuery({
    queryKey: ["developer-reports", organizationId],
    queryFn: () => getDeveloperReports({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });

  return (
    <div>
      <p className="text-sm font-semibold text-[#1268e8]">Organization workspace</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[#102039]">Reports</h1>
      <p className="mt-2 text-sm text-[#68778c]">
        Current status counts from this organization’s saved projects, inventory units, and leads.
        Historical trends, exports, campaign attribution, and stock movement history are not
        available in the current data model.
      </p>

      {query.isPending ? (
        <p className="mt-6 rounded-xl border border-[#dbe2ec] bg-white p-5 text-sm text-[#68778c]">
          Loading organization reports…
        </p>
      ) : query.isError ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-white p-5" role="alert">
          <p className="text-sm text-red-800">Reports could not be loaded. Retry the query.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </section>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {reportSections.map(({ key, title }) => {
            const section = query.data[key];
            const entries = Object.entries(section.byStatus);

            return (
              <section
                key={key}
                className="overflow-hidden rounded-xl border border-[#dbe2ec] bg-white"
              >
                <div className="border-b border-[#e6ebf2] p-5">
                  <h2 className="text-sm font-medium text-[#68778c]">{title}</h2>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-[#102039]">
                    {section.total}
                  </p>
                  <p className="mt-1 text-xs text-[#8793a5]">Current total</p>
                </div>
                <dl className="divide-y divide-[#e6ebf2] px-5">
                  {entries.map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between py-3 text-sm">
                      <dt className="text-[#68778c]">{formatStatus(status)}</dt>
                      <dd className="font-medium tabular-nums text-[#20314a]">{count}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
