import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Contact,
  CreditCard,
  Film,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircle,
  Megaphone,
  Package,
  Plug,
  ScrollText,
  Search,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { canAccessDeveloperPath } from "@/lib/developer-auth-core";
import { signOutPublicUser } from "@/lib/public-auth";
import { listDeveloperProjects } from "../developer-data";
import { listDeveloperLeads } from "../leads-data";
import { listDeveloperNotifications } from "../workspace-data";
import { PortalBackground } from "@/components/portal-background";
import "./developer-portal.css";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      { to: "/app", label: "Command Center", icon: LayoutDashboard, exact: true },
      { to: "/app/projects", label: "Projects", icon: Building2 },
      { to: "/app/$module", module: "inventory", label: "Inventory", icon: Package },
      { to: "/app/$module", module: "tasks", label: "Tasks & Follow-ups", icon: CheckSquare },
      { to: "/app/$module", module: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
      { to: "/app/$module", module: "ai-advisor", label: "AI Advisor", icon: Bot },
    ],
  },
  {
    label: "Sales & Marketing",
    items: [
      { to: "/app/leads", label: "Leads", icon: Users },
      { to: "/app/$module", module: "contacts", label: "Contacts", icon: Contact },
      { to: "/app/$module", module: "conversations", label: "Conversations", icon: MessageCircle },
      { to: "/app/$module", module: "notifications", label: "Notifications", icon: Bell },
      { to: "/app/$module", module: "visits", label: "Site Visits", icon: CalendarDays },
      { to: "/app/$module", module: "creative-studio", label: "Creative Studio", icon: Film },
      { to: "/app/$module", module: "campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/app/$module", module: "analytics", label: "Analytics", icon: BarChart3 },
      { to: "/app/$module", module: "reports", label: "Reports", icon: ScrollText },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/app/activity", label: "Activity Log", icon: Activity },
      { to: "/app/team", label: "Team & Roles", icon: Settings },
      { to: "/app/$module", module: "integrations", label: "Integrations", icon: Plug },
      { to: "/app/$module", module: "billing", label: "Billing", icon: CreditCard },
      { to: "/app/$module", module: "settings", label: "Settings", icon: SlidersHorizontal },
      { to: "/app/$module", module: "help", label: "Help & Support", icon: LifeBuoy },
    ],
  },
] as const;

type NavigationItem = (typeof navigationGroups)[number]["items"][number];

export function DeveloperLayout() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const membership = developerSession.memberships[0];
  const organizationId = membership?.organizationId ?? "";
  const roles = developerSession.memberships.map((item) => item.role);
  const visibleGroups: Array<{ label: string; items: NavigationItem[] }> = navigationGroups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) =>
        canAccessDeveloperPath(roles, "module" in item ? `/app/${item.module}` : item.to),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const visibleItems = visibleGroups.flatMap((group) => group.items);
  const canSearchLeads = canAccessDeveloperPath(roles, "/app/leads");
  const notificationsVisible = visibleItems.some(
    (item) => "module" in item && item.module === "notifications",
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const shouldSearch = searchFocused && debouncedSearch.length >= 2;
  const projectSearchQuery = useQuery({
    queryKey: ["developer-project-search", organizationId, debouncedSearch],
    queryFn: () =>
      listDeveloperProjects({
        data: { organizationId, search: debouncedSearch, status: null, page: 0 },
      }),
    enabled: Boolean(organizationId && shouldSearch),
  });
  const leadSearchQuery = useQuery({
    queryKey: ["developer-lead-search", organizationId, debouncedSearch],
    queryFn: () =>
      listDeveloperLeads({
        data: {
          organizationId,
          search: debouncedSearch,
          projectId: null,
          status: null,
          source: null,
          assignedTo: null,
          page: 0,
        },
      }),
    enabled: Boolean(organizationId && shouldSearch && canSearchLeads),
  });
  const notificationsQuery = useQuery({
    queryKey: ["developer-notifications", organizationId],
    queryFn: () => listDeveloperNotifications({ data: { organizationId } }),
    enabled: Boolean(organizationId && notificationsVisible),
    staleTime: 30_000,
  });
  const unreadNotifications =
    notificationsQuery.data?.filter((notification) => !notification.read_at).length ?? 0;
  const searchResults = useMemo(() => {
    const projectResults = projectSearchQuery.data?.projects ?? [];
    const leadResults = canSearchLeads ? (leadSearchQuery.data?.leads ?? []) : [];
    return { projects: projectResults, leads: leadResults };
  }, [canSearchLeads, leadSearchQuery.data, projectSearchQuery.data]);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError("");
    try {
      const result = await signOutPublicUser();
      if (!result.success) {
        setSignOutError("We could not sign you out. Please try again.");
        return;
      }
      window.location.assign("/");
    } catch {
      setSignOutError("We could not sign you out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className={`developer-portal${sidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <PortalBackground />
      {sidebarOpen && (
        <button
          type="button"
          className="developer-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`developer-sidebar${sidebarOpen ? " is-mobile-open" : ""}`}>
        <div className="developer-sidebar-brand">
          <Link to="/app" className="developer-brand" aria-label="MAVROS RealtyAI Command Center">
            <span className="developer-brand-mark">M</span>
            <span className="developer-brand-copy">
              <span className="developer-brand-name">MAVROS</span>
              <span className="developer-brand-product">REALTYAI</span>
            </span>
          </Link>
          <button
            type="button"
            className="developer-collapse-button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <div className="developer-organization">
          <span className="developer-organization-indicator" />
          <span className="developer-organization-copy">
            <small>WORKSPACE</small>
            <strong>{membership?.organizationName ?? "Organization"}</strong>
          </span>
          <ChevronDown aria-hidden="true" size={14} />
        </div>
        <nav className="developer-sidebar-nav" aria-label="Developer workspace">
          {visibleGroups.map((group) => (
            <div className="developer-nav-group" key={group.label}>
              <p className="developer-nav-group-label">{group.label}</p>
              {group.items.map((item) => (
                <DeveloperNavLink
                  key={"module" in item ? item.module : item.to}
                  item={item}
                  collapsed={sidebarCollapsed}
                  onNavigate={() => setSidebarOpen(false)}
                  badge={
                    "module" in item && item.module === "notifications"
                      ? unreadNotifications
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </nav>
        <div className="developer-sidebar-bottom">
          <div className="developer-sidebar-profile">
            <span className="developer-avatar" aria-hidden="true">
              {developerSession.user.displayName.trim().charAt(0).toUpperCase() || "M"}
            </span>
            <span className="developer-sidebar-profile-copy">
              <strong>{developerSession.user.displayName}</strong>
              <small>{membership?.role ?? "member"}</small>
            </span>
            <button
              type="button"
              className="developer-signout-icon"
              aria-label={isSigningOut ? "Signing out" : "Sign out"}
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut size={15} />
            </button>
          </div>
          {signOutError && (
            <p className="developer-signout-error" role="alert">
              {signOutError}
            </p>
          )}
        </div>
      </aside>

      <div className="developer-workspace">
        <header className="developer-topbar">
          <div className="developer-topbar-title">
            <button
              type="button"
              className="developer-mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <span className="developer-topbar-pulse" />
            <span className="developer-topbar-kicker">MAVROS</span>
            <span className="developer-topbar-divider">/</span>
            <span>COMMAND CENTER</span>
          </div>
          <div className="developer-topbar-actions">
            <label className="developer-global-search">
              <Search aria-hidden="true" size={16} />
              <input
                type="search"
                value={search}
                placeholder="Search projects or leads"
                aria-label="Search projects or leads"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>/</kbd>
            </label>
            {searchFocused && search.trim().length >= 2 && (
              <div className="developer-search-popover">
                <p className="developer-popover-heading">Organization records</p>
                {projectSearchQuery.isPending || (canSearchLeads && leadSearchQuery.isPending) ? (
                  <p className="developer-popover-message">Searching…</p>
                ) : projectSearchQuery.isError || (canSearchLeads && leadSearchQuery.isError) ? (
                  <p className="developer-popover-message is-error" role="alert">
                    Search failed. Try again or open the relevant section.
                  </p>
                ) : (
                  <>
                    {searchResults.projects.map((project) => (
                      <Link
                        key={project.id}
                        to="/app/projects/$id"
                        params={{ id: project.id }}
                        className="developer-search-result"
                        onClick={() => setSearch("")}
                      >
                        <Building2 size={16} aria-hidden="true" />
                        <span>
                          <strong>{project.name}</strong>
                          <small>{project.location || "Project"}</small>
                        </span>
                      </Link>
                    ))}
                    {searchResults.leads.map((lead) => (
                      <Link
                        key={lead.id}
                        to="/app/leads"
                        className="developer-search-result"
                        onClick={() => setSearch("")}
                      >
                        <Users size={16} aria-hidden="true" />
                        <span>
                          <strong>{lead.full_name}</strong>
                          <small>{lead.email || lead.phone || "Lead"}</small>
                        </span>
                      </Link>
                    ))}
                    {!searchResults.projects.length && !searchResults.leads.length && (
                      <p className="developer-popover-message">No matching records.</p>
                    )}
                  </>
                )}
              </div>
            )}
            <span className="developer-topbar-date">
              {new Intl.DateTimeFormat(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date())}
            </span>
            {notificationsVisible && (
              <Link
                to="/app/$module"
                params={{ module: "notifications" }}
                aria-label={`Notifications${notificationsQuery.isError ? ", count unavailable" : unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
                className="developer-topbar-icon"
              >
                <Bell size={17} aria-hidden="true" />
                {notificationsQuery.isError ? (
                  <span
                    className="developer-notification-error"
                    title="Notification count unavailable"
                  >
                    !
                  </span>
                ) : unreadNotifications > 0 ? (
                  <span className="developer-notification-badge">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
            )}
            <div className="developer-account-wrap">
              <button
                type="button"
                className="developer-account-button"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="developer-avatar" aria-hidden="true">
                  {developerSession.user.displayName.trim().charAt(0).toUpperCase() || "M"}
                </span>
                <span className="developer-account-name">{developerSession.user.displayName}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {profileOpen && (
                <div className="developer-account-menu">
                  <strong>{developerSession.user.displayName}</strong>
                  <small>{developerSession.user.email ?? "Developer account"}</small>
                  <span>{membership?.organizationName ?? "Organization"}</span>
                  <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
                    <LogOut size={15} /> {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                  {signOutError && <p role="alert">{signOutError}</p>}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="developer-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DeveloperNavLink({
  item,
  collapsed,
  badge,
  onNavigate,
}: {
  item: NavigationItem;
  collapsed: boolean;
  badge?: number | undefined;
  onNavigate: () => void;
}) {
  const className = `developer-nav-link${collapsed ? " is-collapsed" : ""}`;
  const content = (
    <>
      <item.icon aria-hidden="true" size={17} />
      <span className="developer-nav-link-label">{item.label}</span>
      {!!badge && <span className="developer-nav-badge">{badge > 9 ? "9+" : badge}</span>}
    </>
  );
  const title = collapsed ? item.label : undefined;
  if ("module" in item) {
    return (
      <Link
        to="/app/$module"
        params={{ module: item.module }}
        className={className}
        activeProps={{ className: `${className} is-active` }}
        title={title}
        onClick={onNavigate}
      >
        {content}
      </Link>
    );
  }
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: "exact" in item }}
      className={className}
      activeProps={{ className: `${className} is-active` }}
      title={title}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}
