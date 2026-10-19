import { Link, useLocation } from "@tanstack/react-router";
import { BackButton } from "@/components/back-button";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function SiteLayout({ children }: { children: ReactNode }) {
  const isHome = useLocation({ select: (l) => l.pathname === "/" });
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            Mavros<span className="text-accent">·</span>RealtyAI
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <Link to="/platform" className="text-muted-foreground hover:text-foreground">Platform</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link to="/p/$tenantSlug/$projectSlug" params={{ tenantSlug: "aranya-developers", projectSlug: "aranya-greens" }} className="text-muted-foreground hover:text-foreground">Sample project</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/app">Workspace</Link></Button>
            <Button asChild size="sm"><Link to="/demo">Request demo</Link></Button>
          </div>
        </div>
      </header>
      {!isHome && (
        <div className="mx-auto max-w-6xl px-6 pt-6"><BackButton /></div>
      )}
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
