import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteLayout, Eyebrow } from "@/components/site-chrome";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Mavros RealtyAI" },
      { name: "description", content: "Pilot, Growth and Enterprise plans for property developers. Ad spend is always billed separately." },
      { property: "og:title", content: "Pricing — Mavros RealtyAI" },
      { property: "og:description", content: "Start with a single-project pilot and scale by projects, seats and creative credits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

const plans = [
  { n: "Pilot", d: "One project, guided setup", f: ["1 active project", "5 seats", "AI advisor + lead capture", "Site-visit booking", "Starter creative credits"] },
  { n: "Growth", d: "Multiple live projects", f: ["Up to 5 projects", "20 seats", "WhatsApp handoff", "Campaign attribution", "Expanded creative credits"] },
  { n: "Enterprise", d: "Portfolio developers", f: ["Unlimited projects", "CRM / ERP integration", "Custom domains", "Priority support & SLA", "Custom credit packages"] },
];

function Pricing() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Eyebrow>Pricing</Eyebrow>
        <h1 className="mt-4 font-display text-5xl tracking-tight">Priced per project, not per click.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">Final commercial terms are agreed during the pilot. Ad spend is always separate from Mavros fees.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <div key={p.n} className={`rounded-lg border p-8 ${i === 1 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
              <h2 className="font-display text-3xl">{p.n}</h2>
              <p className={`mt-1 text-sm ${i === 1 ? "opacity-80" : "text-muted-foreground"}`}>{p.d}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.f.map((f) => <li key={f}>— {f}</li>)}
              </ul>
              <Button asChild className="mt-8 w-full" variant={i === 1 ? "secondary" : "default"}><Link to="/demo">Talk to us</Link></Button>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
