import { useMemo } from "react";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Home,
  PackageOpen,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { canAccessDeveloperPath } from "@/lib/developer-auth-core";
import residenceBalcony from "@/assets/residence-balcony.jpg";

import { HeroBanner } from "../components/hero-banner";
import {
  getDeveloperDashboard,
  getDeveloperReports,
  listDeveloperOrganizationActivity,
  listDeveloperProjects,
} from "../developer-data";
import { listDeveloperTasks, listDeveloperVisits } from "../workspace-data";
import { listDeveloperLeads } from "../leads-data";

const inventoryColors: Record<string, string> = {
  available: "#39d5e5",
  held: "#42b8a8",
  booked: "#8295a1",
  sold: "#a790e7",
  unlisted: "#49595e",
};

const leadLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit: "Site visit",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const sourceLabelMap: Record<string, string> = {
  website: "Website",
  web: "Website",
  referral: "Referral",
  referrals: "Referral",
  campaign: "Campaign",
  campaigns: "Campaign",
  google: "Website",
  facebook: "Website",
  instagram: "Website",
  linkedin: "Website",
  whatsapp: "Referral",
  email: "Campaign",
  sms: "Campaign",
  walkin: "Other",
  walk_in: "Other",
  other: "Other",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(
    undefined,
    options ?? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  ).format(date);
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function getPriorityLabel(task: { due_at: string | null; status: string }) {
  if (task.status === "done") return "Completed";
  if (!task.due_at) return "Upcoming";
  const due = new Date(task.due_at).getTime();
  const now = Date.now();
  const daysDiff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (daysDiff < 0) return "Overdue";
  if (daysDiff <= 3) return "Due soon";
  return "Upcoming";
}

function aggregateLeadSources(leads: Array<{ source: string }>) {
  const buckets: Record<string, number> = {
    Website: 0,
    Referral: 0,
    Campaign: 0,
    Other: 0,
  };
  for (const lead of leads) {
    const normalized = lead.source.toLowerCase().trim();
    const mapped = sourceLabelMap[normalized] ?? "Other";
    buckets[mapped] = (buckets[mapped] ?? 0) + 1;
  }
  return Object.entries(buckets)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));
}

export function OverviewPage() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const membership = developerSession.memberships[0];
  const organizationId = membership?.organizationId ?? "";
  const roles = developerSession.memberships.map((item) => item.role);
  const canViewLeads = canAccessDeveloperPath(roles, "/app/leads");
  const canViewVisits = canAccessDeveloperPath(roles, "/app/visits");
  const canViewTasks = canAccessDeveloperPath(roles, "/app/tasks");

  const dashboardQuery = useQuery({
    queryKey: ["developer-dashboard", organizationId],
    queryFn: () => getDeveloperDashboard({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const reportsQuery = useQuery({
    queryKey: ["developer-reports", organizationId],
    queryFn: () => getDeveloperReports({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const projectsQuery = useQuery({
    queryKey: ["developer-projects", organizationId, "overview"],
    queryFn: () =>
      listDeveloperProjects({
        data: { organizationId, search: "", status: "published", page: 0 },
      }),
    enabled: Boolean(organizationId),
  });
  const visitsQuery = useQuery({
    queryKey: ["developer-visits", organizationId],
    queryFn: () => listDeveloperVisits({ data: { organizationId } }),
    enabled: Boolean(organizationId && canViewVisits),
  });
  const tasksQuery = useQuery({
    queryKey: ["developer-tasks", organizationId],
    queryFn: () => listDeveloperTasks({ data: { organizationId } }),
    enabled: Boolean(organizationId && canViewTasks),
  });
  const activityQuery = useQuery({
    queryKey: ["developer-activity", organizationId],
    queryFn: () => listDeveloperOrganizationActivity({ data: { organizationId } }),
    enabled: Boolean(organizationId),
  });
  const leadsQuery = useQuery({
    queryKey: ["developer-leads-sources", organizationId],
    queryFn: () =>
      listDeveloperLeads({
        data: {
          organizationId,
          search: "",
          projectId: null,
          status: null,
          source: null,
          assignedTo: null,
          page: 0,
        },
      }),
    enabled: Boolean(organizationId && canViewLeads),
  });

  const projectById = useMemo(
    () => new Map((projectsQuery.data?.projects ?? []).map((project) => [project.id, project])),
    [projectsQuery.data],
  );
  const now = Date.now();
  const upcomingVisits =
    visitsQuery.data
      ?.filter((visit) => {
        const scheduledAt = new Date(visit.scheduled_at).getTime();
        return (
          scheduledAt >= now &&
          visit.status !== "cancelled" &&
          visit.status !== "completed" &&
          visit.status !== "no_show"
        );
      })
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)) ?? [];
  const activeLeads = reportsQuery.data
    ? reportsQuery.data.leads.total -
      (reportsQuery.data.leads.byStatus["won"] ?? 0) -
      (reportsQuery.data.leads.byStatus["lost"] ?? 0)
    : null;
  const activeProjects = projectsQuery.data?.projects ?? [];
  const projectStatusData = reportsQuery.data
    ? Object.entries(reportsQuery.data.projects.byStatus).map(([status, count]) => ({
        name: statusLabel(status),
        value: count,
      }))
    : [];
  const inventoryData = reportsQuery.data
    ? Object.entries(reportsQuery.data.inventory.byStatus).map(([status, count]) => ({
        name: statusLabel(status),
        value: count,
        color: inventoryColors[status] ?? "#657579",
      }))
    : [];
  const leadSourcesData = leadsQuery.data ? aggregateLeadSources(leadsQuery.data.leads) : [];
  const openTasks = tasksQuery.data?.filter(
    (task) => task.status === "open" || task.status === "in_progress",
  );
  const doneTasks = tasksQuery.data?.filter((task) => task.status === "done");
  const generatedSignals = useMemo(() => {
    if (!dashboardQuery.data || !reportsQuery.data) return [];
    const signals: Array<{ title: string; detail: string; tone?: "attention" }> = [];
    const availableUnits = dashboardQuery.data.availableUnits;
    const totalUnits = dashboardQuery.data.units;
    if (totalUnits === 0) {
      signals.push({
        title: "Inventory data is not available yet",
        detail: "Add unit records to enable inventory distribution and availability signals.",
      });
    } else if (availableUnits === 0) {
      signals.push({
        title: "No units are currently marked available",
        detail: `${formatNumber(totalUnits)} total units are recorded. Review availability if inventory has changed.`,
        tone: "attention",
      });
    } else {
      signals.push({
        title: "Availability snapshot",
        detail: `${formatNumber(availableUnits)} of ${formatNumber(totalUnits)} recorded units are marked available.`,
      });
    }

    const unresolvedLeads = activeLeads ?? 0;
    if (unresolvedLeads > 0) {
      signals.push({
        title: "Buyer pipeline",
        detail: `${formatNumber(unresolvedLeads)} leads remain outside Won or Lost statuses.`,
      });
    } else {
      signals.push({
        title: "Buyer pipeline is clear",
        detail: "No active leads are currently recorded in the open pipeline stages.",
      });
    }

    const published = dashboardQuery.data.publishedProjects;
    const projectTotal = dashboardQuery.data.projects;
    signals.push({
      title: "Project publishing",
      detail:
        projectTotal > 0
          ? `${formatNumber(published)} of ${formatNumber(projectTotal)} projects are published.`
          : "Add a project to begin tracking published portfolio activity.",
    });
    return signals;
  }, [activeLeads, dashboardQuery.data, reportsQuery.data]);

  return (
    <div className="developer-command-center">
      <HeroBanner />

      <DashboardDataError
        isError={dashboardQuery.isError}
        message="Core workspace metrics could not be loaded."
        onRetry={() => void dashboardQuery.refetch()}
      />

      <section className="command-kpi-grid" aria-label="Workspace key metrics">
        <KpiCard
          label="Total Projects"
          value={dashboardQuery.isPending ? null : dashboardQuery.data?.projects}
          detail={
            dashboardQuery.data
              ? `${formatNumber(dashboardQuery.data.publishedProjects)} published`
              : "Organization portfolio"
          }
          icon={<Building2 size={18} />}
          color="cyan"
          href="/app/projects"
        />
        <KpiCard
          label="Active Leads"
          value={reportsQuery.isPending ? null : reportsQuery.isError ? undefined : activeLeads}
          detail={
            reportsQuery.data
              ? `${formatNumber(reportsQuery.data.leads.total)} total in pipeline`
              : "Won and lost excluded"
          }
          icon={<Users size={18} />}
          color="violet"
          href="/app/leads"
          disabled={!canViewLeads}
        />
        <KpiCard
          label="Inventory Units"
          value={dashboardQuery.isPending ? null : dashboardQuery.data?.units}
          detail={
            dashboardQuery.data
              ? `${formatNumber(dashboardQuery.data.availableUnits)} available`
              : "Recorded units"
          }
          icon={<PackageOpen size={18} />}
          color="teal"
          href="/app/$module"
          module="inventory"
        />
        <KpiCard
          label="Upcoming Visits"
          value={
            canViewVisits
              ? visitsQuery.isPending
                ? null
                : visitsQuery.isError
                  ? undefined
                  : upcomingVisits.length
              : "—"
          }
          detail={
            canViewVisits
              ? "Future visits from the loaded schedule (up to 100)"
              : "Not available for this role"
          }
          icon={<CalendarDays size={18} />}
          color="green"
          href="/app/$module"
          module="visits"
          disabled={!canViewVisits}
        />
      </section>

      <section className="command-section" aria-labelledby="command-analytics-heading">
        <SectionHeading
          id="command-analytics-heading"
          title="Portfolio analytics"
          detail="Current organization records"
        />
        {reportsQuery.isPending || leadsQuery.isPending ? (
          <ChartSkeletons count={2} />
        ) : reportsQuery.isError || leadsQuery.isError ? (
          <InlineQueryError
            message="Analytics data could not be loaded."
            onRetry={() => {
              void reportsQuery.refetch();
              void leadsQuery.refetch();
            }}
          />
        ) : (
          <div className="command-chart-grid-two">
            <Panel
              title="Project Status"
              subtitle="Projects by current status"
              icon={<Building2 size={16} />}
            >
              <StatusBarChart data={projectStatusData} />
            </Panel>
            <Panel
              title="Lead Sources"
              subtitle="Leads grouped by source"
              icon={<Users size={16} />}
            >
              <LeadSourcesDonut data={leadSourcesData} total={leadsQuery.data?.leads.length ?? 0} />
            </Panel>
          </div>
        )}
      </section>

      <div className="command-three-column">
        <section className="command-section" aria-labelledby="command-visits-heading">
          <SectionHeading
            id="command-visits-heading"
            title="Upcoming visits"
            detail="Scheduled visits from organization records"
            action={
              <Link to="/app/$module" params={{ module: "visits" }} className="command-view-all">
                View schedule <ArrowRight size={14} />
              </Link>
            }
          />
          {!canViewVisits ? (
            <EmptyPanel
              icon={<CalendarDays size={20} />}
              title="Site visits are not available"
              detail="Your current organization role does not have access to this section."
            />
          ) : visitsQuery.isPending ? (
            <PanelLoading rows={3} />
          ) : visitsQuery.isError ? (
            <InlineQueryError
              message="Site visits could not be loaded."
              onRetry={() => void visitsQuery.refetch()}
            />
          ) : upcomingVisits.length === 0 ? (
            <EmptyPanel
              icon={<CalendarDays size={20} />}
              title="No upcoming visits"
              detail="New scheduled visits will appear here."
            />
          ) : (
            <div className="command-list-panel">
              {upcomingVisits.slice(0, 5).map((visit) => {
                const project = projectById.get(visit.project_id);
                const leadName = visit.lead?.[0]?.full_name;
                return (
                  <div className="command-visit-row" key={visit.id}>
                    <div className="command-date-tile">
                      <strong>{formatDate(visit.scheduled_at, { day: "2-digit" })}</strong>
                      <span>{formatDate(visit.scheduled_at, { month: "short" })}</span>
                    </div>
                    <div className="command-row-main">
                      <strong>{leadName ?? "Client not visible or not recorded"}</strong>
                      <span>{project?.name ?? visit.project?.[0]?.name ?? "Project"}</span>
                      <small>
                        <Clock3 size={12} />{" "}
                        {formatDate(visit.scheduled_at, { hour: "numeric", minute: "2-digit" })}
                      </small>
                    </div>
                    <span
                      className={`command-status-pill ${visit.status === "confirmed" ? "is-success" : "is-neutral"}`}
                    >
                      <span /> {statusLabel(visit.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="command-section" aria-labelledby="command-tasks-heading">
          <SectionHeading
            id="command-tasks-heading"
            title="Pending tasks"
            detail="Latest stored tasks (maximum 100 records)"
            action={
              <Link to="/app/$module" params={{ module: "tasks" }} className="command-view-all">
                Open tasks <ArrowRight size={14} />
              </Link>
            }
          />
          {!canViewTasks ? (
            <EmptyPanel
              icon={<CheckCircle2 size={20} />}
              title="Tasks are not available"
              detail="Your current organization role does not have access to this section."
            />
          ) : tasksQuery.isPending ? (
            <PanelLoading rows={3} />
          ) : tasksQuery.isError ? (
            <InlineQueryError
              message="Tasks could not be loaded."
              onRetry={() => void tasksQuery.refetch()}
            />
          ) : (
            <>
              <div className="command-task-counts">
                <div>
                  <span>Open in loaded set</span>
                  <strong>{openTasks?.length ?? 0}</strong>
                </div>
                <div>
                  <span>Completed in loaded set</span>
                  <strong>{doneTasks?.length ?? 0}</strong>
                </div>
              </div>
              {!tasksQuery.data.length ? (
                <EmptyPanel
                  icon={<CheckCircle2 size={20} />}
                  title="No tasks recorded"
                  detail="Tasks created in the workspace will appear here."
                />
              ) : (
                <div className="command-list-panel">
                  {tasksQuery.data.slice(0, 4).map((task) => (
                    <div className="command-task-row" key={task.id}>
                      <span
                        className={`command-task-check ${task.status === "done" ? "is-done" : ""}`}
                      >
                        {task.status === "done" ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <CircleAlert size={15} />
                        )}
                      </span>
                      <span className="command-row-main">
                        <strong>{task.title}</strong>
                        <span>{task.description || "No additional details"}</span>
                      </span>
                      <span
                        className={`command-status-pill ${task.status === "done" ? "is-success" : "is-neutral"}`}
                      >
                        <span /> {statusLabel(task.status)}
                      </span>
                      <span
                        className={`command-priority-badge ${getPriorityLabel(task).toLowerCase().replace(" ", "-")}`}
                      >
                        {getPriorityLabel(task)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <section className="command-advisor-panel" aria-labelledby="command-advisor-heading">
          <div className="command-advisor-heading">
            <span className="command-advisor-icon">
              <Bot size={19} />
            </span>
            <div>
              <p className="command-eyebrow">REALTYAI</p>
              <h2 id="command-advisor-heading">AI Advisor</h2>
            </div>
            <span className="command-advisor-state">SIGNALS</span>
          </div>
          <p className="command-advisor-disclaimer">
            Data-backed workspace signals. AI-generated insights are unavailable until an AI
            provider is connected.
          </p>
          {dashboardQuery.isError || reportsQuery.isError ? (
            <InlineQueryError
              message="Signals require current dashboard and report data."
              onRetry={() => {
                void dashboardQuery.refetch();
                void reportsQuery.refetch();
              }}
            />
          ) : dashboardQuery.isPending || reportsQuery.isPending ? (
            <PanelLoading rows={3} />
          ) : (
            <div className="command-signals-list">
              {generatedSignals.map((signal, index) => (
                <div
                  className={`command-signal ${signal.tone === "attention" ? "is-attention" : ""}`}
                  key={signal.title}
                >
                  <span className="command-signal-index">0{index + 1}</span>
                  <span>
                    <strong>{signal.title}</strong>
                    <small>{signal.detail}</small>
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/app/$module"
            params={{ module: "ai-advisor" }}
            className="command-advisor-link"
          >
            Explore AI Advisor <ArrowUpRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  detail,
  action,
}: {
  id: string;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="command-section-heading">
      <div>
        <h2 id={id}>{title}</h2>
        <p>{detail}</p>
      </div>
      {action}
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon,
  color,
  href,
  module,
  disabled = false,
}: {
  label: string;
  value: number | string | null | undefined;
  detail: string;
  icon: ReactNode;
  color: string;
  href: "/app/projects" | "/app/leads" | "/app/$module";
  module?: "inventory" | "visits" | "billing";
  disabled?: boolean;
}) {
  const card = (
    <>
      <span className="command-kpi-icon">{icon}</span>
      <span className="command-kpi-copy">
        <span className="command-kpi-label">{label}</span>
        <strong>
          {value === null ? (
            <span className="command-shimmer" />
          ) : value === undefined ? (
            "—"
          ) : typeof value === "number" ? (
            formatNumber(value)
          ) : (
            value
          )}
        </strong>
        <small>{detail}</small>
      </span>
      {!disabled && <ArrowUpRight className="command-kpi-arrow" size={15} />}
      <span className="command-kpi-glow" />
    </>
  );
  const className = `command-kpi-card tone-${color}${disabled ? " is-disabled" : ""}`;
  if (disabled) return <div className={className}>{card}</div>;
  if (module) {
    return (
      <Link to={href} params={{ module }} className={className}>
        {card}
      </Link>
    );
  }
  return (
    <Link to={href} className={className}>
      {card}
    </Link>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="command-chart-panel">
      <div className="command-panel-heading">
        <span className="command-panel-icon">{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="command-chart-content">{children}</div>
    </article>
  );
}

function StatusBarChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="command-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(220,240,235,0.07)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#91a09e", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#778381", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(57,213,229,0.06)" }}
            contentStyle={{
              background: "#182121",
              border: "1px solid rgba(220,240,235,0.12)",
              borderRadius: 10,
              color: "#f4f0e8",
            }}
          />
          <Bar
            dataKey="value"
            name="Projects"
            fill="#39d5e5"
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LeadSourcesDonut({
  data,
  total,
}: {
  data: Array<{ name: string; value: number }>;
  total: number;
}) {
  const colors: Record<string, string> = {
    Website: "#39d5e5",
    Referral: "#35bdab",
    Campaign: "#a895e8",
    Other: "#8295a1",
  };
  return (
    <div className="command-donut-layout">
      <div className="command-donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="67%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={colors[item.name] ?? "#657579"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#182121",
                border: "1px solid rgba(220,240,235,0.12)",
                borderRadius: 10,
                color: "#f4f0e8",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="command-donut-total">
          <strong>{formatNumber(total)}</strong>
          <small>leads</small>
        </div>
      </div>
      <div className="command-donut-legend">
        {data.map((item) => (
          <div key={item.name}>
            <span>
              <i style={{ backgroundColor: colors[item.name] ?? "#657579" }} />
              {item.name}
            </span>
            <strong>{formatNumber(item.value)}</strong>
          </div>
        ))}
        {data.length === 0 && (
          <div className="command-donut-empty">
            <span>No lead source data</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartSkeletons({ count }: { count: number }) {
  return (
    <div className="command-chart-grid-two" aria-label="Loading analytics">
      {Array.from({ length: count }, (_, item) => (
        <div className="command-chart-skeleton" key={item} />
      ))}
    </div>
  );
}

function DashboardDataError({
  isError,
  message,
  onRetry,
}: {
  isError: boolean;
  message: string;
  onRetry: () => void;
}) {
  if (!isError) return null;
  return (
    <div className="command-global-error" role="alert">
      <CircleAlert size={17} />
      <span>{message}</span>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function InlineQueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="command-inline-error" role="alert">
      <CircleAlert size={17} />
      <span>{message}</span>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  detail,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="command-empty-panel">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {action}
    </div>
  );
}

function PanelLoading({ rows }: { rows: number }) {
  return (
    <div className="command-panel-loading" aria-label="Loading records">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
