import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/platform", label: "Platform" },
  { to: "/pricing", label: "Pricing" },
  { to: "/p/$tenantSlug/$projectSlug", label: "Sample project", params: { tenantSlug: "aranya-developers", projectSlug: "aranya-greens" } },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            Mavros<span className="text-accent">·</span>RealtyAI
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {nav.map((n) => (
              <Link key={n.label} to={n.to} params={"params" in n ? n.params : undefined} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/app">Workspace</Link></Button>
            <Button asChild size="sm"><Link to="/demo">Request demo</Link></Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>© 2026 Mavros Tech Pvt Ltd. RealtyAI + Veytrix.AI</p>
          <div className="flex gap-6">
            <Link to="/platform">Platform</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/demo">Contact</Link>
            <Link to="/control">Control Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{children}</p>;
}
