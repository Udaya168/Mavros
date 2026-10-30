import { useState } from "react";
import { Link, Outlet, useRouteContext } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  CheckSquare,
  Contact,
  CreditCard,
  Film,
  History,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  Package,
  Plug,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { BackButton } from "@/components/back-button";
import { canAccessDeveloperPath } from "@/lib/developer-auth-core";
import { signOutPublicUser } from "@/lib/public-auth";

const items = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Projects", icon: Building2 },
  { to: "/app/$module", module: "inventory", label: "Inventory", icon: Package },
  { to: "/app/$module", module: "tasks", label: "Tasks & follow-ups", icon: CheckSquare },
  { to: "/app/$module", module: "knowledge-base", label: "Knowledge base", icon: BookOpen },
  { to: "/app/$module", module: "ai-advisor", label: "AI Advisor", icon: Bot },
  { to: "/app/leads", label: "Leads", icon: Users },
  { to: "/app/$module", module: "contacts", label: "Contacts", icon: Contact },
  { to: "/app/$module", module: "conversations", label: "Conversations", icon: MessageCircle },
  { to: "/app/$module", module: "notifications", label: "Notifications", icon: Bell },
  { to: "/app/$module", module: "visits", label: "Site visits", icon: CalendarDays },
  { to: "/app/$module", module: "creative-studio", label: "Creative Studio", icon: Film },
  { to: "/app/$module", module: "campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/app/$module", module: "analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/$module", module: "reports", label: "Reports", icon: ScrollText },
  { to: "/app/activity", label: "Activity log", icon: History },
  { to: "/app/team", label: "Team & roles", icon: Settings },
  { to: "/app/$module", module: "integrations", label: "Integrations", icon: Plug },
  { to: "/app/$module", module: "billing", label: "Billing", icon: CreditCard },
  { to: "/app/$module", module: "settings", label: "Settings", icon: SlidersHorizontal },
  { to: "/app/$module", module: "help", label: "Help & support", icon: LifeBuoy },
] as const;

export function DeveloperLayout() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const primaryMembership = developerSession.memberships[0];
  const [signOutError, setSignOutError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const visibleItems = items.filter((item) =>
    canAccessDeveloperPath(
      developerSession.memberships.map((membership) => membership.role),
      "module" in item ? `/app/${item.module}` : item.to,
    ),
  );

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
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="px-6 py-5 font-display text-lg">
          Mavros<span className="text-sidebar-primary">·</span>RealtyAI
        </Link>
        <div className="mx-4 rounded-md border border-sidebar-border px-3 py-2 text-sm">
          <p className="text-xs opacity-60">Organization</p>
          {developerSession.memberships.map((membership) => (
            <p key={membership.organizationId} className="font-medium">
              {membership.organizationName}
            </p>
          ))}
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {visibleItems.map((item) => (
            <DeveloperNavLink key={"module" in item ? item.module : item.to} item={item} />
          ))}
        </nav>
        <div className="mt-auto px-6 py-5 text-xs">
          <p className="font-medium">{developerSession.user.displayName}</p>
          <p className="mt-1 opacity-70">{developerSession.user.email ?? "Developer account"}</p>
          <p className="mt-1 capitalize opacity-70">{primaryMembership?.role ?? "member"}</p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-3 font-semibold text-sidebar-foreground underline-offset-4 hover:underline disabled:opacity-60"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
          {signOutError && (
            <p role="alert" className="mt-2 text-red-300">
              {signOutError}
            </p>
          )}
        </div>
      </aside>
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm md:hidden">
          <div className="min-w-0">
            <p className="truncate font-semibold">{developerSession.user.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {developerSession.user.email ?? "Developer account"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="shrink-0 font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-60"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
        <nav
          aria-label="Developer workspace"
          className="flex gap-4 overflow-x-auto border-b border-border px-4 py-3 text-sm md:hidden"
        >
          {visibleItems.map((item) => (
            <DeveloperNavLink key={"module" in item ? item.module : item.to} item={item} mobile />
          ))}
        </nav>
        <div className="mx-auto max-w-6xl p-6 md:p-10">
          <BackButton className="mb-6" />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function DeveloperNavLink({
  item,
  mobile = false,
}: {
  item: (typeof items)[number];
  mobile?: boolean;
}) {
  const className = mobile
    ? "whitespace-nowrap"
    : "flex items-center gap-3 rounded-md px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100";
  if ("module" in item) {
    return (
      <Link to="/app/$module" params={{ module: item.module }} className={className}>
        {!mobile && <item.icon className="h-4 w-4" />}
        {item.label}
      </Link>
    );
  }
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: "exact" in item }}
      className={className}
      {...(!mobile ? { activeProps: { className: "bg-sidebar-accent opacity-100" } } : {})}
    >
      {!mobile && <item.icon className="h-4 w-4" />}
      {item.label}
    </Link>
  );
}
