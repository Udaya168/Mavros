import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, Eyebrow } from "@/components/site-chrome";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform — Mavros RealtyAI" },
      {
        name: "description",
        content:
          "Four surfaces on one platform: marketing site, buyer project pages, developer workspace and Mavros Control Center.",
      },
      { property: "og:title", content: "Platform — Mavros RealtyAI" },
      {
        property: "og:description",
        content: "Tenant-first architecture with role-based access for every team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Platform,
});

const surfaces = [
  {
    t: "Buyer project pages",
    a: "Property buyers",
    d: "Project details, unit discovery, AI advisor, lead capture and visit requests.",
  },
  {
    t: "Developer workspace",
    a: "Owner, admin, marketing, sales",
    d: "Projects, inventory, leads, visits, campaigns, reports and Creative Studio.",
  },
  {
    t: "Mavros Control Center",
    a: "Mavros operations",
    d: "Tenant provisioning, feature flags, usage, support and audit.",
  },
  {
    t: "Veytrix.AI",
    a: "Creators",
    d: "Independent video product; RealtyAI embeds a project-scoped studio.",
  },
];
const roles = [
  ["Owner / Admin", "Full workspace, billing, team and settings"],
  ["Marketing", "Projects, knowledge, campaigns, Creative Studio"],
  ["Sales", "Assigned leads and site visits only; restricted exports"],
  ["Analyst", "Read-only dashboards with sensitive fields masked"],
];

function Platform() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Eyebrow>Platform</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-display text-5xl tracking-tight">
          Four surfaces. One platform. Clear boundaries.
        </h1>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {surfaces.map((s) => (
            <div key={s.t} className="rounded-lg border border-border bg-card p-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.a}</p>
              <h2 className="mt-2 text-2xl font-semibold">{s.t}</h2>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-24 font-display text-3xl">Who sees what</h2>
        <div className="mt-6 divide-y divide-border rounded-lg border border-border">
          {roles.map(([r, d]) => (
            <div key={r} className="grid gap-2 p-5 md:grid-cols-[220px_1fr]">
              <p className="font-semibold">{r}</p>
              <p className="text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
