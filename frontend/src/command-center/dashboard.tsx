import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listControlSecurityAudit, listControlSupportRequests } from "@/lib/control-auth";

export interface ControlDashboardData {
  staff: {
    role: "owner";
    displayName: string;
    email: string | null;
  };
  metrics:
    | {
        status: "available";
        organizationCount: number;
        activeMembershipCount: number;
        projectCount: number;
        publishedProjectCount: number;
        inventoryUnitCount: number;
        availableInventoryUnitCount: number;
        leadCount: number;
      }
    | {
        status: "unavailable";
        errorCode: string;
      };
  securityAudit: SecurityAuditData;
  supportRequests: SupportRequestsData;
  configuration: ConfigurationData;
  backgroundJobs: BackgroundJobsData;
  usageBilling: UsageBillingData;
}

export type SecurityAuditData =
  | {
      status: "available";
      events: Array<{
        eventId: string;
        category: "activity" | "membership";
        organizationName: string;
        actorName: string;
        entityType: string;
        action: string;
        details: string;
        occurredAt: string;
      }>;
    }
  | {
      status: "unavailable";
      errorCode: string;
    };

export type SupportRequestsData =
  | {
      status: "available";
      requests: Array<{
        requestId: string;
        organizationName: string;
        subject: string;
        summary: string;
        status: "open" | "in_progress" | "resolved" | "closed";
        requesterName: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }
  | {
      status: "unavailable";
      errorCode: string;
    };

export type ConfigurationData =
  | {
      status: "available";
      settings: Array<{
        key: string;
        name: string;
        description: string;
        source: string;
        state: "configured" | "not_configured";
        readOnly: boolean;
        secret: boolean;
      }>;
    }
  | {
      status: "unavailable";
      errorCode: string;
    };

export type BackgroundJobsData = {
  status: "unavailable";
  reason: string;
};

export type UsageBillingData = {
  status: "unavailable";
  reason: string;
};

export function ControlCenterLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f3f6fb] text-[#102039]"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium">Verifying owner access…</p>
    </main>
  );
}

export function ControlCenterDashboard({
  dashboard,
  onSignOut,
  signOutError,
}: {
  dashboard: ControlDashboardData;
  onSignOut: () => void;
  signOutError: string;
}) {
  const [auditCategory, setAuditCategory] = useState<"all" | "activity" | "membership">("all");
  const [auditData, setAuditData] = useState<SecurityAuditData>(dashboard.securityAudit);
  const [auditLoading, setAuditLoading] = useState(false);
  const [supportStatus, setSupportStatus] = useState<
    "all" | "open" | "in_progress" | "resolved" | "closed"
  >("all");
  const [supportData, setSupportData] = useState<SupportRequestsData>(dashboard.supportRequests);
  const [supportLoading, setSupportLoading] = useState(false);
  const unavailableSources = [
    ["services", "Platform services", "No service health-check integrations are configured."],
  ] as const;

  async function handleAuditCategoryChange(category: "all" | "activity" | "membership") {
    setAuditCategory(category);
    setAuditLoading(true);
    try {
      setAuditData(await listControlSecurityAudit({ data: { category } }));
    } catch {
      setAuditData({ status: "unavailable", errorCode: "request_failed" });
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleSupportStatusChange(
    status: "all" | "open" | "in_progress" | "resolved" | "closed",
  ) {
    setSupportStatus(status);
    setSupportLoading(true);
    try {
      setSupportData(await listControlSupportRequests({ data: { status } }));
    } catch {
      setSupportData({ status: "unavailable", errorCode: "request_failed" });
    } finally {
      setSupportLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-[#102039] lg:flex">
      <aside className="bg-[#102039] px-5 py-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:px-4 lg:py-6">
        <div className="flex items-center justify-between gap-4 lg:block">
          <div>
            <p className="text-xs font-bold tracking-[0.18em]">MAVROS</p>
            <p className="mt-1 text-[10px] tracking-[0.14em] text-slate-400">
              OWNER COMMAND CENTER
            </p>
          </div>
          <Badge className="border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/10">
            <ShieldCheck aria-hidden="true" className="mr-1 size-3.5" />
            Owner
          </Badge>
        </div>
        <nav
          aria-label="Command Center sections"
          className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:flex-col"
        >
          {[
            ["Overview", "#overview"],
            ["Users & access", "#access"],
            ["Tenants", "#tenants"],
            ["Platform services", "#services"],
            ["Background jobs", "#jobs"],
            ["Usage & billing", "#billing"],
            ["Security & audit", "#audit"],
            ["Features & config", "#configuration"],
            ["Support & issues", "#support"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 pt-5 lg:block">
          <BackButton className="text-slate-400 hover:text-white" />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce3ed] bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1268e8]">
              Mavros internal
            </p>
            <h1 className="mt-1 font-display text-2xl">Command Center</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link to="/app">Developer Portal</Link>
            </Button>
            <div className="text-right">
              <p className="text-sm font-semibold">{dashboard.staff.displayName}</p>
              <p className="text-xs text-[#64748b]">{dashboard.staff.email}</p>
            </div>
            <Button variant="outline" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 px-5 py-7 sm:px-8 sm:py-9">
          {signOutError && (
            <p className="text-sm text-red-700" role="alert">
              {signOutError}
            </p>
          )}
          <section id="overview" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl">Overview</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Owner authorization is verified on the server for this session.
                </p>
              </div>
              <Badge variant="outline">
                {dashboard.metrics.status === "available"
                  ? "Live organization metrics"
                  : "Organization metrics unavailable"}
              </Badge>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ["Owner access", "Active", "Active owner membership verified server-side."],
                ["Authentication", "Verified", "Supabase Auth user verified for this request."],
                [
                  "Operations data",
                  dashboard.metrics.status === "available" ? "Connected" : "Unavailable",
                  dashboard.metrics.status === "available"
                    ? "Aggregate metrics are loaded from the authorized Supabase RPC."
                    : "The authorized metrics service did not return data for this session.",
                ],
              ].map(([label, value, detail]) => (
                <article
                  key={label}
                  className="rounded-xl border border-[#dce3ed] bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-medium text-[#64748b]">{label}</p>
                  <p className="mt-3 text-xl font-semibold">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-[#7b899d]">{detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="tenants"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
            aria-labelledby="organizations-projects-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="organizations-projects-heading" className="text-lg font-semibold">
                  Organizations & projects
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  Aggregate organization and project metrics from the owner-authorized data service.
                </p>
              </div>
              <Badge variant={dashboard.metrics.status === "available" ? "default" : "secondary"}>
                {dashboard.metrics.status === "available" ? "Connected" : "Unavailable"}
              </Badge>
            </div>
            {dashboard.metrics.status === "available" ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["Organizations", dashboard.metrics.organizationCount],
                    ["Active memberships", dashboard.metrics.activeMembershipCount],
                    ["Projects", dashboard.metrics.projectCount],
                    ["Published projects", dashboard.metrics.publishedProjectCount],
                    ["Inventory units", dashboard.metrics.inventoryUnitCount],
                    ["Available units", dashboard.metrics.availableInventoryUnitCount],
                    ["Leads", dashboard.metrics.leadCount],
                  ] as Array<[string, number]>
                ).map(([label, value]) => (
                  <article
                    key={label}
                    className="rounded-lg border border-[#dce3ed] bg-[#f8faff] p-4"
                  >
                    <p className="text-sm font-medium text-[#64748b]">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-amber-800" role="status">
                Organization and project metrics are temporarily unavailable. The owner
                authorization check succeeded, but the aggregate service returned an error (
                {dashboard.metrics.errorCode}).
              </p>
            )}
          </section>

          <section
            id="access"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
          >
            <h2 className="text-lg font-semibold">Users & access</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              Owner authorization is managed through protected membership records. This project has
              no user-directory or role-management interface; account listing and role changes are
              not exposed here.
            </p>
          </section>

          <section
            id="audit"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
            aria-labelledby="security-audit-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="security-audit-heading" className="text-lg font-semibold">
                  Security & audit
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  Recent database-recorded organization changes and membership security events.
                </p>
              </div>
              <Badge variant={auditData.status === "available" ? "default" : "secondary"}>
                {auditData.status === "available" ? "Connected" : "Unavailable"}
              </Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Audit event filters">
              {(["all", "activity", "membership"] as const).map((category) => (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  variant={auditCategory === category ? "default" : "outline"}
                  onClick={() => void handleAuditCategoryChange(category)}
                  disabled={auditLoading}
                >
                  {category === "all"
                    ? "All events"
                    : category === "activity"
                      ? "Data activity"
                      : "Membership security"}
                </Button>
              ))}
            </div>
            {auditLoading ? (
              <p className="mt-5 text-sm text-[#64748b]" role="status">
                Loading audit events…
              </p>
            ) : auditData.status === "unavailable" ? (
              <p className="mt-5 text-sm text-amber-800" role="alert">
                Security and audit data is temporarily unavailable ({auditData.errorCode}).
              </p>
            ) : auditData.events.length === 0 ? (
              <p className="mt-5 text-sm text-[#64748b]">No recorded events match this filter.</p>
            ) : (
              <ol className="mt-5 divide-y divide-[#e6ebf2] rounded-lg border border-[#dce3ed]">
                {auditData.events.map((event) => (
                  <li key={event.eventId} className="flex flex-wrap justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-medium capitalize text-[#20314a]">
                        {event.details}
                      </p>
                      <p className="mt-1 text-xs text-[#8793a5]">
                        {event.organizationName} · {event.category} · {event.entityType} ·{" "}
                        {event.actorName}
                      </p>
                    </div>
                    <time className="text-xs text-[#8793a5]" dateTime={event.occurredAt}>
                      {new Date(event.occurredAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section
            id="support"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
            aria-labelledby="support-issues-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="support-issues-heading" className="text-lg font-semibold">
                  Support & issues
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  Organization-submitted support requests reviewed by the owner.
                </p>
              </div>
              <Badge variant={supportData.status === "available" ? "default" : "secondary"}>
                {supportData.status === "available" ? "Connected" : "Unavailable"}
              </Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Support request filters">
              {(["all", "open", "in_progress", "resolved", "closed"] as const).map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={supportStatus === status ? "default" : "outline"}
                  onClick={() => void handleSupportStatusChange(status)}
                  disabled={supportLoading}
                >
                  {status === "all" ? "All requests" : status.replace("_", " ")}
                </Button>
              ))}
            </div>
            {supportLoading ? (
              <p className="mt-5 text-sm text-[#64748b]" role="status">
                Loading support requests…
              </p>
            ) : supportData.status === "unavailable" ? (
              <p className="mt-5 text-sm text-amber-800" role="alert">
                Support requests are temporarily unavailable ({supportData.errorCode}).
              </p>
            ) : supportData.requests.length === 0 ? (
              <p className="mt-5 text-sm text-[#64748b]">No support requests match this filter.</p>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  {(["open", "in_progress", "resolved", "closed"] as const).map((status) => (
                    <div key={status} className="rounded-lg bg-[#f3f6fb] p-3">
                      <p className="text-xs capitalize text-[#64748b]">
                        {status.replace("_", " ")}
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {supportData.requests.filter((request) => request.status === status).length}
                      </p>
                    </div>
                  ))}
                </div>
                <ol className="mt-5 divide-y divide-[#e6ebf2] rounded-lg border border-[#dce3ed]">
                  {supportData.requests.map((request) => (
                    <li key={request.requestId} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#20314a]">{request.subject}</p>
                          <p className="mt-1 text-xs text-[#8793a5]">
                            {request.organizationName} · {request.requesterName} ·{" "}
                            {request.status.replace("_", " ")}
                          </p>
                        </div>
                        <time className="text-xs text-[#8793a5]" dateTime={request.updatedAt}>
                          Updated {new Date(request.updatedAt).toLocaleString()}
                        </time>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#64748b]">{request.summary}</p>
                      <p className="mt-2 text-xs text-[#8793a5]">
                        Created {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>

          <section
            id="configuration"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
            aria-labelledby="features-configuration-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="features-configuration-heading" className="text-lg font-semibold">
                  Features & configuration
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  Safe runtime configuration status. Values and credentials are never displayed.
                </p>
              </div>
              <Badge
                variant={dashboard.configuration.status === "available" ? "default" : "secondary"}
              >
                {dashboard.configuration.status === "available" ? "Connected" : "Unavailable"}
              </Badge>
            </div>
            {dashboard.configuration.status === "unavailable" ? (
              <p className="mt-5 text-sm text-amber-800" role="alert">
                Configuration status is temporarily unavailable ({dashboard.configuration.errorCode}
                ).
              </p>
            ) : dashboard.configuration.settings.length === 0 ? (
              <p className="mt-5 text-sm text-[#64748b]">
                No safe configuration settings are available.
              </p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {dashboard.configuration.settings.map((setting) => (
                  <article key={setting.key} className="rounded-lg border border-[#dce3ed] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#20314a]">{setting.name}</h3>
                      <Badge variant={setting.state === "configured" ? "default" : "secondary"}>
                        {setting.state === "configured" ? "Configured" : "Not configured"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{setting.description}</p>
                    <p className="mt-3 text-xs text-[#8793a5]">
                      Source: {setting.source} · {setting.readOnly ? "Read-only" : "Editable"}
                      {setting.secret ? " · Value redacted" : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section
            id="jobs"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
            aria-labelledby="background-jobs-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="background-jobs-heading" className="text-lg font-semibold">
                  Background jobs
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  Worker and scheduler status from configured job infrastructure.
                </p>
              </div>
              <Badge variant="secondary">Not configured</Badge>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#64748b]" role="status">
              {dashboard.backgroundJobs.reason}
            </p>
          </section>

          <section
            id="billing"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
            aria-labelledby="usage-billing-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="usage-billing-heading" className="text-lg font-semibold">
                  Usage & billing
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  Billing, subscription, payment, and usage-metering status.
                </p>
              </div>
              <Badge variant="secondary">Not configured</Badge>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#64748b]" role="status">
              {dashboard.usageBilling.reason}
            </p>
          </section>

          {unavailableSources.map(([id, title, detail], index) => (
            <section
              key={title}
              id={id}
              className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
              aria-labelledby={`source-${index}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id={`source-${index}`} className="text-lg font-semibold">
                  {title}
                </h2>
                <Badge variant="secondary">Not connected</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{detail}</p>
            </section>
          ))}
          <section
            id="owner"
            className="scroll-mt-24 rounded-xl border border-[#dce3ed] bg-white p-5 sm:p-6"
          >
            <h2 className="text-lg font-semibold">Owner account</h2>
            <p className="mt-2 text-sm text-[#64748b]">
              Current session has an active owner membership. Sign out to clear this browser
              session.
            </p>
            <Button className="mt-4" variant="outline" onClick={onSignOut}>
              Sign out
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
