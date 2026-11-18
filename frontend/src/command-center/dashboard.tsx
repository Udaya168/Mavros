import { useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownWideNarrow,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  Database,
  ExternalLink,
  FileClock,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Cell, Pie, PieChart } from "recharts";

import { BackButton } from "@/components/back-button";
import { PortalBackground } from "@/components/portal-background";
import { listControlSecurityAudit, listControlSupportRequests } from "@/lib/control-auth";

import "./control-center.css";

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

type AuditCategory = "all" | "activity" | "membership";
type SupportStatus = "all" | "open" | "in_progress" | "resolved" | "closed";
type SortOrder = "newest" | "oldest";

const pageSize = 8;

const sections: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "access", label: "Users & access", icon: UsersRound },
  { id: "tenants", label: "Tenants", icon: Building2 },
  { id: "services", label: "Platform services", icon: Server },
  { id: "jobs", label: "Background jobs", icon: FileClock },
  { id: "billing", label: "Usage & billing", icon: CircleDollarSign },
  { id: "audit", label: "Security & audit", icon: ShieldCheck },
  { id: "configuration", label: "Features & config", icon: Settings2 },
  { id: "support", label: "Support & issues", icon: LifeBuoy },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "M"
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  status,
}: {
  eyebrow: string;
  title: string;
  description: string;
  status?: { label: string; available: boolean };
}) {
  return (
    <div className="control-section-heading">
      <div>
        <p className="control-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="control-section-description">{description}</p>
      </div>
      {status && (
        <span className={`control-status ${status.available ? "is-available" : "is-unavailable"}`}>
          {status.available ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <AlertCircle aria-hidden="true" />
          )}
          {status.label}
        </span>
      )}
    </div>
  );
}

function DataState({ unavailable, empty }: { unavailable?: string; empty?: string }) {
  return (
    <div className="control-data-state" role={unavailable ? "alert" : "status"}>
      {unavailable ? <AlertCircle aria-hidden="true" /> : <Database aria-hidden="true" />}
      <p>{unavailable ?? empty}</p>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  itemCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  itemCount: number;
  onChange: (page: number) => void;
}) {
  if (itemCount <= pageSize) return null;
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, itemCount);
  return (
    <div className="control-pagination">
      <span>
        Showing {firstItem}–{lastItem} of {formatNumber(itemCount)}
      </span>
      <div>
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <span>
          {page} / {pageCount}
        </span>
        <button
          type="button"
          aria-label="Next page"
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function ControlCenterLoading() {
  return (
    <main className="control-loading" role="status" aria-live="polite">
      <PortalBackground />
      <div className="control-loading-mark">
        <Command aria-hidden="true" />
      </div>
      <p>Verifying owner access…</p>
      <span className="control-loading-track" />
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
  const [auditCategory, setAuditCategory] = useState<AuditCategory>("all");
  const [auditData, setAuditData] = useState<SecurityAuditData>(dashboard.securityAudit);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditSort, setAuditSort] = useState<SortOrder>("newest");
  const [auditPage, setAuditPage] = useState(1);
  const [supportStatus, setSupportStatus] = useState<SupportStatus>("all");
  const [supportData, setSupportData] = useState<SupportRequestsData>(dashboard.supportRequests);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSearch, setSupportSearch] = useState("");
  const [supportSort, setSupportSort] = useState<SortOrder>("newest");
  const [supportPage, setSupportPage] = useState(1);
  const [sectionSearch, setSectionSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const filteredSections = sections.filter((section) =>
    section.label.toLowerCase().includes(sectionSearch.trim().toLowerCase()),
  );
  const availableMetrics = dashboard.metrics.status === "available" ? dashboard.metrics : null;
  const metricsErrorCode =
    dashboard.metrics.status === "unavailable" ? dashboard.metrics.errorCode : "unavailable";
  const auditEvents =
    auditData.status === "available"
      ? auditData.events
          .filter((event) =>
            [
              event.details,
              event.organizationName,
              event.actorName,
              event.category,
              event.entityType,
              event.action,
            ]
              .join(" ")
              .toLowerCase()
              .includes(auditSearch.trim().toLowerCase()),
          )
          .sort((a, b) => {
            const difference = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);
            return auditSort === "newest" ? -difference : difference;
          })
      : [];
  const supportRequests =
    supportData.status === "available"
      ? supportData.requests
          .filter((request) =>
            [
              request.subject,
              request.summary,
              request.organizationName,
              request.requesterName,
              request.status,
            ]
              .join(" ")
              .toLowerCase()
              .includes(supportSearch.trim().toLowerCase()),
          )
          .sort((a, b) => {
            const difference = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
            return supportSort === "newest" ? -difference : difference;
          })
      : [];
  const auditPageCount = Math.max(1, Math.ceil(auditEvents.length / pageSize));
  const supportPageCount = Math.max(1, Math.ceil(supportRequests.length / pageSize));
  const pagedAuditEvents = auditEvents.slice((auditPage - 1) * pageSize, auditPage * pageSize);
  const pagedSupportRequests = supportRequests.slice(
    (supportPage - 1) * pageSize,
    supportPage * pageSize,
  );
  const latestEvents = auditData.status === "available" ? auditData.events.slice(0, 5) : [];
  const metrics = availableMetrics
    ? [
        {
          label: "Total organizations",
          value: availableMetrics.organizationCount,
          icon: Building2,
          note: "Current organization count",
          tone: "cyan",
        },
        {
          label: "Memberships",
          value: availableMetrics.activeMembershipCount,
          icon: UsersRound,
          note: "Active organization memberships",
          tone: "violet",
        },
        {
          label: "Total projects",
          value: availableMetrics.projectCount,
          icon: FolderKanban,
          note: `${formatNumber(availableMetrics.publishedProjectCount)} published`,
          tone: "blue",
        },
        {
          label: "Total leads",
          value: availableMetrics.leadCount,
          icon: Activity,
          note: "All recorded project leads",
          tone: "teal",
        },
      ]
    : [];
  const configuredSettings =
    dashboard.configuration.status === "available" ? dashboard.configuration.settings : [];
  const detailMetrics: Array<{ label: string; value: number; icon: LucideIcon }> = availableMetrics
    ? [
        { label: "Organizations", value: availableMetrics.organizationCount, icon: Building2 },
        {
          label: "Active memberships",
          value: availableMetrics.activeMembershipCount,
          icon: UsersRound,
        },
        { label: "Projects", value: availableMetrics.projectCount, icon: FolderKanban },
        {
          label: "Published projects",
          value: availableMetrics.publishedProjectCount,
          icon: CheckCircle2,
        },
        { label: "Inventory units", value: availableMetrics.inventoryUnitCount, icon: Gauge },
        {
          label: "Available units",
          value: availableMetrics.availableInventoryUnitCount,
          icon: Activity,
        },
        { label: "Leads", value: availableMetrics.leadCount, icon: UsersRound },
      ]
    : [];
  const openSupportCount =
    dashboard.supportRequests.status === "available"
      ? dashboard.supportRequests.requests.filter((request) => request.status === "open").length
      : null;

  async function handleAuditCategoryChange(category: AuditCategory) {
    setAuditCategory(category);
    setAuditPage(1);
    setAuditLoading(true);
    try {
      setAuditData(await listControlSecurityAudit({ data: { category } }));
    } catch {
      setAuditData({ status: "unavailable", errorCode: "request_failed" });
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleSupportStatusChange(status: SupportStatus) {
    setSupportStatus(status);
    setSupportPage(1);
    setSupportLoading(true);
    try {
      setSupportData(await listControlSupportRequests({ data: { status } }));
    } catch {
      setSupportData({ status: "unavailable", errorCode: "request_failed" });
    } finally {
      setSupportLoading(false);
    }
  }

  function navigateToSection(id: string) {
    setActiveSection(id);
    setMobileNavOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(false);
  }

  return (
    <div className={`control-center${collapsed ? " is-collapsed" : ""}`}>
      <PortalBackground />
      {mobileNavOpen && (
        <button
          type="button"
          className="control-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        className={`control-sidebar${mobileNavOpen ? " is-mobile-open" : ""}`}
        aria-label="Mavros Control Center"
      >
        <div className="control-brand">
          <div className="control-brand-mark" aria-hidden="true">
            <span>M</span>
          </div>
          <div className="control-brand-copy">
            <strong>MAVROS</strong>
            <span>REALTYAI · CONTROL</span>
          </div>
          <button
            type="button"
            className="control-icon-button control-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="control-workspace-label">WORKSPACE</div>
        <nav className="control-nav" aria-label="Command Center sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`control-nav-link${activeSection === id ? " is-active" : ""}`}
              title={collapsed ? label : undefined}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => navigateToSection(id)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {activeSection === id && <span className="control-nav-indicator" />}
            </a>
          ))}
        </nav>

        <div className="control-sidebar-foot">
          <div className="control-owner-chip">
            <span className="control-owner-icon">
              <ShieldCheck aria-hidden="true" />
            </span>
            <span className="control-owner-copy">
              <strong>Owner access</strong>
              <small>Verified for this session</small>
            </span>
            <span className="control-owner-dot" aria-label="Active" />
          </div>
          <BackButton className="control-back-link" />
          <button
            type="button"
            className="control-collapse-button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
            <span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </button>
        </div>
      </aside>

      <main className="control-main">
        <header className="control-topbar">
          <div className="control-mobile-brand">
            <button
              type="button"
              className="control-icon-button control-mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu aria-hidden="true" />
            </button>
            <div className="control-brand-mark" aria-hidden="true">
              <span>M</span>
            </div>
            <strong>MAVROS</strong>
          </div>

          <label className="control-global-search">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={sectionSearch}
              onChange={(event) => setSectionSearch(event.target.value)}
              placeholder="Find a section..."
              aria-label="Find a Control Center section"
            />
            <kbd>⌘ K</kbd>
          </label>

          <div className="control-topbar-actions">
            <span className="control-snapshot-label">
              <span />
              Current snapshot
            </span>
            <div className="control-popover-wrap">
              <button
                type="button"
                className={`control-icon-button${notificationsOpen ? " is-selected" : ""}`}
                aria-label="Open recent activity"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setAccountOpen(false);
                }}
              >
                <Bell aria-hidden="true" />
              </button>
              {notificationsOpen && (
                <div className="control-popover control-notifications">
                  <div className="control-popover-heading">
                    <div>
                      <strong>Recent activity</strong>
                      <span>From the owner audit feed</span>
                    </div>
                    <button
                      type="button"
                      className="control-icon-button"
                      aria-label="Close recent activity"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                  {auditData.status === "unavailable" ? (
                    <DataState
                      unavailable={`Activity feed unavailable (${auditData.errorCode}).`}
                    />
                  ) : latestEvents.length === 0 ? (
                    <DataState empty="No recorded activity is available yet." />
                  ) : (
                    <ul className="control-notification-list">
                      {latestEvents.map((event) => (
                        <li key={event.eventId}>
                          <span className="control-activity-icon">
                            <Activity aria-hidden="true" />
                          </span>
                          <span>
                            <strong>
                              {event.action} {event.entityType.replaceAll("_", " ")}
                            </strong>
                            <small>
                              {event.organizationName} · {formatDate(event.occurredAt)}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {openSupportCount !== null && (
                    <a
                      href="#support"
                      className="control-notification-footer"
                      onClick={() => navigateToSection("support")}
                    >
                      <LifeBuoy aria-hidden="true" />
                      {formatNumber(openSupportCount)} open support requests
                      <ChevronRight aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="control-popover-wrap">
              <button
                type="button"
                className="control-profile-trigger"
                aria-expanded={accountOpen}
                onClick={() => {
                  setAccountOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
              >
                <span className="control-avatar">{initials(dashboard.staff.displayName)}</span>
                <span className="control-profile-copy">
                  <strong>{dashboard.staff.displayName}</strong>
                  <small>Owner</small>
                </span>
                <ChevronDown aria-hidden="true" />
              </button>
              {accountOpen && (
                <div className="control-popover control-account-menu">
                  <div className="control-account-identity">
                    <span className="control-avatar">{initials(dashboard.staff.displayName)}</span>
                    <span>
                      <strong>{dashboard.staff.displayName}</strong>
                      <small>{dashboard.staff.email ?? "Owner account"}</small>
                    </span>
                  </div>
                  <Link to="/app" className="control-menu-link">
                    <ExternalLink aria-hidden="true" />
                    Developer Portal
                  </Link>
                  <button type="button" className="control-menu-link" onClick={onSignOut}>
                    <LogOut aria-hidden="true" />
                    Sign out
                  </button>
                  {signOutError && (
                    <p className="control-inline-error" role="alert">
                      {signOutError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          {sectionSearch.trim() && (
            <div className="control-search-results">
              <span className="control-search-caption">
                {filteredSections.length
                  ? `${filteredSections.length} matching sections`
                  : "No matching sections"}
              </span>
              {filteredSections.map(({ id, label, icon: Icon }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => {
                    navigateToSection(id);
                    setSectionSearch("");
                  }}
                >
                  <Icon aria-hidden="true" />
                  {label}
                  <ChevronRight aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </header>

        <div className="control-content">
          {signOutError && (
            <p className="control-alert" role="alert">
              {signOutError}
            </p>
          )}

          <section id="overview" className="control-section control-overview">
            <div className="control-page-heading">
              <div>
                <p className="control-eyebrow">MAVROS · INTERNAL OPERATIONS</p>
                <h1>Command Center</h1>
                <p>One clear view of your platform, organizations, and operational signals.</p>
              </div>
              <span className="control-current-period">
                <Clock3 aria-hidden="true" />
                Current aggregate
              </span>
            </div>

            <div className="control-metric-grid">
              {metrics.length
                ? metrics.map(({ label, value, icon: Icon, note, tone }) => (
                    <article className={`control-metric-card tone-${tone}`} key={label}>
                      <div className="control-metric-top">
                        <span className="control-metric-icon">
                          <Icon aria-hidden="true" />
                        </span>
                        <span className="control-metric-period">All-time total</span>
                      </div>
                      <p className="control-metric-label">{label}</p>
                      <p className="control-metric-value">{formatNumber(value)}</p>
                      <p className="control-metric-note">{note}</p>
                    </article>
                  ))
                : ["Organizations", "Memberships", "Projects", "Leads"].map((label) => (
                    <article className="control-metric-card is-loading" key={label}>
                      <span className="control-skeleton control-skeleton-icon" />
                      <span className="control-metric-label">{label}</span>
                      <span className="control-skeleton control-skeleton-value" />
                      <span className="control-metric-note">Aggregate metrics unavailable</span>
                    </article>
                  ))}
            </div>

            <div className="control-overview-grid">
              <section
                className="control-panel control-wide-panel"
                aria-labelledby="portfolio-heading"
              >
                <div className="control-panel-heading">
                  <div>
                    <p className="control-eyebrow">PORTFOLIO SNAPSHOT</p>
                    <h2 id="portfolio-heading">Platform at a glance</h2>
                  </div>
                  <span className="control-chart-note">
                    <Gauge aria-hidden="true" />
                    Current totals
                  </span>
                </div>
                {availableMetrics ? (
                  <div className="control-distribution-grid">
                    <Distribution
                      title="Project publishing"
                      detail="Published projects compared with all other project states."
                      primaryLabel="Published"
                      secondaryLabel="Other states"
                      primaryValue={availableMetrics.publishedProjectCount}
                      total={availableMetrics.projectCount}
                      color="cyan"
                    />
                    <Distribution
                      title="Inventory availability"
                      detail="Available units compared with units in other recorded states."
                      primaryLabel="Available"
                      secondaryLabel="Other states"
                      primaryValue={availableMetrics.availableInventoryUnitCount}
                      total={availableMetrics.inventoryUnitCount}
                      color="violet"
                    />
                  </div>
                ) : (
                  <DataState unavailable="Portfolio aggregates are unavailable; see Tenants for status details." />
                )}
                <div className="control-trend-unavailable">
                  <span>
                    <Activity aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Historical performance charts are not available</strong>
                    <p>
                      The authorized metrics service returns current totals only. Dated
                      organization, engagement, and usage history is not connected.
                    </p>
                  </div>
                </div>
              </section>

              <section
                className="control-panel control-health-panel"
                aria-labelledby="health-heading"
              >
                <div className="control-panel-heading">
                  <div>
                    <p className="control-eyebrow">SYSTEM STATUS</p>
                    <h2 id="health-heading">Operational health</h2>
                  </div>
                  <span className="control-health-pulse" aria-label="Access verified">
                    <span />
                  </span>
                </div>
                <div className="control-health-list">
                  <HealthRow
                    icon={ShieldCheck}
                    label="Owner authorization"
                    detail="Verified for this session"
                    state="Verified"
                    tone="good"
                  />
                  <HealthRow
                    icon={Database}
                    label="Organization metrics"
                    detail="Owner-authorized aggregate"
                    state={availableMetrics ? "Connected" : "Unavailable"}
                    tone={availableMetrics ? "good" : "warning"}
                  />
                  <HealthRow
                    icon={Server}
                    label="Background workers"
                    detail="No worker status source"
                    state="Not configured"
                    tone="neutral"
                  />
                  <HealthRow
                    icon={CircleDollarSign}
                    label="Billing & metering"
                    detail="No billing integration"
                    state="Not configured"
                    tone="neutral"
                  />
                </div>
              </section>

              <section
                className="control-panel control-activity-panel"
                aria-labelledby="activity-heading"
              >
                <div className="control-panel-heading">
                  <div>
                    <p className="control-eyebrow">AUDIT FEED</p>
                    <h2 id="activity-heading">Recent activity</h2>
                  </div>
                  <a href="#audit" onClick={() => navigateToSection("audit")}>
                    View audit log <ChevronRight aria-hidden="true" />
                  </a>
                </div>
                {auditData.status === "unavailable" ? (
                  <DataState unavailable={`Audit feed unavailable (${auditData.errorCode}).`} />
                ) : latestEvents.length === 0 ? (
                  <DataState empty="No database-recorded activity is available yet." />
                ) : (
                  <ol className="control-activity-list">
                    {latestEvents.slice(0, 4).map((event) => (
                      <li key={event.eventId}>
                        <span className="control-activity-icon">
                          <Activity aria-hidden="true" />
                        </span>
                        <div>
                          <strong>
                            {event.action} {event.entityType.replaceAll("_", " ")}
                          </strong>
                          <span>{event.organizationName}</span>
                        </div>
                        <time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section
                className="control-panel control-source-panel"
                aria-labelledby="source-heading"
              >
                <div className="control-panel-heading">
                  <div>
                    <p className="control-eyebrow">SAFE CONFIGURATION</p>
                    <h2 id="source-heading">Connected sources</h2>
                  </div>
                  <a href="#configuration" onClick={() => navigateToSection("configuration")}>
                    Details <ChevronRight aria-hidden="true" />
                  </a>
                </div>
                {dashboard.configuration.status === "unavailable" ? (
                  <DataState
                    unavailable={`Configuration unavailable (${dashboard.configuration.errorCode}).`}
                  />
                ) : (
                  <div className="control-source-summary">
                    {configuredSettings.slice(0, 3).map((setting, index) => (
                      <HealthRow
                        key={setting.key}
                        icon={setting.secret ? ShieldCheck : Database}
                        label={
                          setting.secret ? "Credential status" : `Service connection ${index + 1}`
                        }
                        detail={setting.source}
                        state={setting.state === "configured" ? "Configured" : "Not configured"}
                        tone={setting.state === "configured" ? "good" : "warning"}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>

          <section id="access" className="control-section control-panel">
            <SectionHeading
              eyebrow="IDENTITY & PERMISSIONS"
              title="Users & access"
              description="Owner access is verified against the protected staff membership record."
              status={{ label: "Owner session verified", available: true }}
            />
            <div className="control-info-callout">
              <ShieldCheck aria-hidden="true" />
              <div>
                <strong>Account directory and role changes are not exposed here.</strong>
                <p>
                  This portal has no user-directory or role-management interface. Active membership
                  counts are shown in the overview; access decisions remain server-authorized.
                </p>
              </div>
            </div>
          </section>

          <section id="tenants" className="control-section control-panel">
            <SectionHeading
              eyebrow="ORGANIZATION OVERVIEW"
              title="Tenants"
              description="Organization and project totals returned by the owner-authorized metrics service."
              status={{
                label: availableMetrics ? "Connected" : "Unavailable",
                available: Boolean(availableMetrics),
              }}
            />
            <h3 className="control-subsection-title">Organizations & projects</h3>
            {availableMetrics ? (
              <div className="control-detail-metrics">
                {detailMetrics.map(({ label, value, icon: MetricIcon }) => {
                  return (
                    <article className="control-detail-metric" key={label}>
                      <span>
                        <MetricIcon aria-hidden="true" />
                      </span>
                      <div>
                        <p>{label}</p>
                        <strong>{formatNumber(value)}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <DataState
                unavailable={`Organization metrics are temporarily unavailable (${metricsErrorCode}).`}
              />
            )}
          </section>

          <section id="services" className="control-section control-panel">
            <SectionHeading
              eyebrow="PLATFORM OPERATIONS"
              title="Platform services"
              description="Service health is shown only when a configured health-check source is available."
              status={{ label: "Not connected", available: false }}
            />
            <DataState empty="No service health-check integrations are configured." />
          </section>

          <section id="jobs" className="control-section control-panel">
            <SectionHeading
              eyebrow="ASYNC OPERATIONS"
              title="Background jobs"
              description="Worker and scheduler status from configured job infrastructure."
              status={{ label: "Not configured", available: false }}
            />
            <DataState empty={dashboard.backgroundJobs.reason} />
          </section>

          <section id="billing" className="control-section control-panel">
            <SectionHeading
              eyebrow="METERING & REVENUE"
              title="Usage & billing"
              description="Billing, subscription, payment, and usage-metering status."
              status={{ label: "Not configured", available: false }}
            />
            <DataState empty={dashboard.usageBilling.reason} />
          </section>

          <section id="audit" className="control-section control-panel">
            <SectionHeading
              eyebrow="PLATFORM ACTIVITY"
              title="Security & audit"
              description="Recent database-recorded organization changes and membership security events."
              status={{
                label: auditData.status === "available" ? "Connected" : "Unavailable",
                available: auditData.status === "available",
              }}
            />
            <div className="control-table-toolbar">
              <div className="control-filter-group" aria-label="Audit event filters">
                {(
                  [
                    ["all", "All events"],
                    ["activity", "Data activity"],
                    ["membership", "Membership security"],
                  ] as const
                ).map(([category, label]) => (
                  <button
                    key={category}
                    type="button"
                    className={auditCategory === category ? "is-active" : ""}
                    onClick={() => void handleAuditCategoryChange(category)}
                    disabled={auditLoading}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="control-table-tools">
                <label className="control-table-search">
                  <Search aria-hidden="true" />
                  <input
                    type="search"
                    value={auditSearch}
                    onChange={(event) => {
                      setAuditSearch(event.target.value);
                      setAuditPage(1);
                    }}
                    placeholder="Search audit events"
                    aria-label="Search audit events"
                  />
                </label>
                <label className="control-sort-select">
                  <ArrowDownWideNarrow aria-hidden="true" />
                  <select
                    value={auditSort}
                    onChange={(event) => {
                      setAuditSort(event.target.value as SortOrder);
                      setAuditPage(1);
                    }}
                    aria-label="Sort audit events"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </label>
              </div>
            </div>
            {auditLoading ? (
              <div className="control-table-loading" role="status">
                <span className="control-skeleton" />
                <span className="control-skeleton" />
                <span className="control-skeleton" />
              </div>
            ) : auditData.status === "unavailable" ? (
              <DataState
                unavailable={`Security and audit data is unavailable (${auditData.errorCode}).`}
              />
            ) : auditEvents.length === 0 ? (
              <DataState empty="No recorded events match this filter." />
            ) : (
              <>
                <div className="control-table-wrap">
                  <table className="control-table">
                    <thead>
                      <tr>
                        <th scope="col">Event</th>
                        <th scope="col">Organization</th>
                        <th scope="col">Category</th>
                        <th scope="col">Occurred</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedAuditEvents.map((event) => (
                        <tr key={event.eventId}>
                          <td>
                            <strong>{event.details}</strong>
                            <small>
                              {event.organizationName} · {event.category} · {event.entityType} ·{" "}
                              {event.actorName}
                            </small>
                            <small>
                              {event.action} · {event.entityType.replaceAll("_", " ")}
                            </small>
                          </td>
                          <td>{event.organizationName}</td>
                          <td>
                            <span className="control-category-tag">{event.category}</span>
                          </td>
                          <td>
                            <time dateTime={event.occurredAt}>{formatDate(event.occurredAt)}</time>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={auditPage}
                  pageCount={auditPageCount}
                  itemCount={auditEvents.length}
                  onChange={setAuditPage}
                />
              </>
            )}
          </section>

          <section id="configuration" className="control-section control-panel">
            <SectionHeading
              eyebrow="RUNTIME"
              title="Features & configuration"
              description="Safe runtime configuration status. Values and credentials are never displayed."
              status={{
                label: dashboard.configuration.status === "available" ? "Connected" : "Unavailable",
                available: dashboard.configuration.status === "available",
              }}
            />
            {dashboard.configuration.status === "unavailable" ? (
              <DataState
                unavailable={`Configuration status is temporarily unavailable (${dashboard.configuration.errorCode}).`}
              />
            ) : configuredSettings.length === 0 ? (
              <DataState empty="No safe configuration settings are available." />
            ) : (
              <div className="control-config-grid">
                {configuredSettings.map((setting) => (
                  <article className="control-config-card" key={setting.key}>
                    <div className="control-config-heading">
                      <span className="control-config-icon">
                        {setting.secret ? (
                          <ShieldCheck aria-hidden="true" />
                        ) : (
                          <Database aria-hidden="true" />
                        )}
                      </span>
                      <span
                        className={`control-status ${
                          setting.state === "configured" ? "is-available" : "is-unavailable"
                        }`}
                      >
                        {setting.state === "configured" ? "Configured" : "Not configured"}
                      </span>
                    </div>
                    <h3>{setting.name}</h3>
                    <p>{setting.description}</p>
                    <small>
                      Source: {setting.source} · {setting.readOnly ? "Read-only" : "Editable"}
                      {setting.secret ? " · Value redacted" : ""}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="support" className="control-section control-panel">
            <SectionHeading
              eyebrow="CUSTOMER OPERATIONS"
              title="Support & issues"
              description="Organization-submitted support requests reviewed by the owner."
              status={{
                label: supportData.status === "available" ? "Connected" : "Unavailable",
                available: supportData.status === "available",
              }}
            />
            <div className="control-table-toolbar">
              <div className="control-filter-group" aria-label="Support request filters">
                {(
                  [
                    ["all", "All requests"],
                    ["open", "Open"],
                    ["in_progress", "In progress"],
                    ["resolved", "Resolved"],
                    ["closed", "Closed"],
                  ] as const
                ).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    className={supportStatus === status ? "is-active" : ""}
                    onClick={() => void handleSupportStatusChange(status)}
                    disabled={supportLoading}
                  >
                    {status === "all" ? label : status.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
              <div className="control-table-tools">
                <label className="control-table-search">
                  <Search aria-hidden="true" />
                  <input
                    type="search"
                    value={supportSearch}
                    onChange={(event) => {
                      setSupportSearch(event.target.value);
                      setSupportPage(1);
                    }}
                    placeholder="Search requests"
                    aria-label="Search support requests"
                  />
                </label>
                <label className="control-sort-select">
                  <ArrowDownWideNarrow aria-hidden="true" />
                  <select
                    value={supportSort}
                    onChange={(event) => {
                      setSupportSort(event.target.value as SortOrder);
                      setSupportPage(1);
                    }}
                    aria-label="Sort support requests"
                  >
                    <option value="newest">Recently updated</option>
                    <option value="oldest">Least recent</option>
                  </select>
                </label>
              </div>
            </div>
            {supportLoading ? (
              <div className="control-table-loading" role="status">
                <span className="control-skeleton" />
                <span className="control-skeleton" />
                <span className="control-skeleton" />
              </div>
            ) : supportData.status === "unavailable" ? (
              <DataState
                unavailable={`Support requests are unavailable (${supportData.errorCode}).`}
              />
            ) : supportRequests.length === 0 ? (
              <DataState empty="No support requests match this search and filter." />
            ) : (
              <>
                <div className="control-table-wrap">
                  <table className="control-table">
                    <thead>
                      <tr>
                        <th scope="col">Request</th>
                        <th scope="col">Organization</th>
                        <th scope="col">Requester</th>
                        <th scope="col">Status</th>
                        <th scope="col">Last updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSupportRequests.map((request) => (
                        <tr key={request.requestId}>
                          <td className="control-request-cell">
                            <strong>{request.subject}</strong>
                            <small>{request.summary}</small>
                          </td>
                          <td>{request.organizationName}</td>
                          <td>{request.requesterName}</td>
                          <td>
                            <span
                              className={`control-request-status status-${request.status.replace(
                                "_",
                                "-",
                              )}`}
                            >
                              <span />
                              {request.status.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            <time dateTime={request.updatedAt}>
                              {formatDate(request.updatedAt)}
                            </time>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={supportPage}
                  pageCount={supportPageCount}
                  itemCount={supportRequests.length}
                  onChange={setSupportPage}
                />
              </>
            )}
          </section>

          <section id="owner" className="control-section control-owner-footer">
            <div>
              <span className="control-owner-icon">
                <ShieldCheck aria-hidden="true" />
              </span>
              <div>
                <strong>Owner account</strong>
                <p>Current session has an active owner membership.</p>
              </div>
            </div>
            <button type="button" className="control-signout-button" onClick={onSignOut}>
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </section>
          <footer className="control-footer">
            MAVROS RealtyAI <span>·</span> Internal administration <span>·</span> Data access is
            owner-authorized
          </footer>
        </div>
      </main>
    </div>
  );
}

function Distribution({
  title,
  detail,
  primaryLabel,
  secondaryLabel,
  primaryValue,
  total,
  color,
}: {
  title: string;
  detail: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryValue: number;
  total: number;
  color: "cyan" | "violet";
}) {
  const remainder = Math.max(0, total - primaryValue);
  const chartData = [
    { name: primaryLabel, value: primaryValue },
    { name: secondaryLabel, value: remainder },
  ];
  const primaryColor = color === "cyan" ? "#39d5e5" : "#a78bfa";
  return (
    <article className={`control-distribution tone-${color}`}>
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <div className="control-donut-row">
        <div
          className="control-donut"
          role="img"
          aria-label={`${primaryValue} ${primaryLabel.toLowerCase()} out of ${total} total`}
        >
          {total > 0 ? (
            <div className="control-donut-chart" aria-hidden="true">
              <PieChart width={108} height={108}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={39}
                  outerRadius={52}
                  paddingAngle={1}
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell fill={primaryColor} />
                  <Cell fill="#2a3550" />
                </Pie>
              </PieChart>
            </div>
          ) : (
            <span className="control-donut-empty-ring" aria-hidden="true" />
          )}
          <span>
            <strong>{formatNumber(primaryValue)}</strong>
            <small>of {formatNumber(total)}</small>
          </span>
        </div>
        <div className="control-donut-legend">
          <span>
            <i />
            <span>{primaryLabel}</span>
            <strong>{formatNumber(primaryValue)}</strong>
          </span>
          <span>
            <i />
            <span>{secondaryLabel}</span>
            <strong>{formatNumber(remainder)}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}

function HealthRow({
  icon: Icon,
  label,
  detail,
  state,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  state: string;
  tone: "good" | "warning" | "neutral";
}) {
  return (
    <div className="control-health-row">
      <span className="control-health-icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="control-health-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className={`control-health-state tone-${tone}`}>{state}</span>
    </div>
  );
}
