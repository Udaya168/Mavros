import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Users, History, Settings } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { tenant } from "@/lib/demo-data";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Workspace — Mavros RealtyAI" },
      { name: "description", content: "Developer workspace for projects, inventory and leads." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

const items = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Projects", icon: Building2 },
  { to: "/app/leads", label: "Leads", icon: Users },
  { to: "/app/activity", label: "Activity log", icon: History },
  { to: "/app/team", label: "Team & roles", icon: Settings },
] as const;

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="px-6 py-5 font-display text-lg">Mavros<span className="text-sidebar-primary">·</span>RealtyAI</Link>
        <div className="mx-4 rounded-md border border-sidebar-border px-3 py-2 text-sm">
          <p className="text-xs opacity-60">Organization</p>
          <p className="font-medium">{tenant.name}</p>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {items.map((i) => (
            <Link key={i.to} to={i.to} activeOptions={{ exact: "exact" in i }} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100" activeProps={{ className: "bg-sidebar-accent opacity-100" }}>
              <i.icon className="h-4 w-4" />{i.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-6 py-5 text-xs opacity-60">Signed in as Priya Menon (Owner) · sample data</p>
      </aside>
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 overflow-x-auto border-b border-border px-4 py-3 text-sm md:hidden">
          {items.map((i) => <Link key={i.to} to={i.to} className="whitespace-nowrap">{i.label}</Link>)}
        </div>
        <div className="mx-auto max-w-6xl p-6 md:p-10"><BackButton className="mb-6" /><Outlet /></div>
      </div>
    </div>
  );
}
