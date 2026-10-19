import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteLayout, Eyebrow } from "@/components/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mavros RealtyAI — AI sales platform for property developers" },
      { name: "description", content: "Branded project pages, a grounded AI property advisor, lead qualification, site visits and Veytrix video — in one workspace." },
      { property: "og:title", content: "Mavros RealtyAI — AI sales platform for property developers" },
      { property: "og:description", content: "Turn campaign traffic into qualified site visits with one approved project knowledge base." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const journey = ["Campaign", "Project page", "AI advisor", "Qualified lead", "WhatsApp handoff", "Site visit"];
const pillars = [
  { t: "Grounded AI advisor", d: "Answers come only from facts your team approved — prices, availability and RERA details are never invented." },
  { t: "Lead qualification", d: "Budget, configuration and timeline captured automatically, scored and routed to the right sales owner." },
  { t: "Site-visit booking", d: "Live slots with capacity limits, confirmations and outcome tracking — no double bookings." },
  { t: "Veytrix Creative Studio", d: "Turn approved project media into reels and ad variants with your brand kit applied." },
];

function Home() {
  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-20 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <Eyebrow>For property developers</Eyebrow>
          <h1 className="mt-5 font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Every enquiry, answered truthfully. Every buyer, walked to the site.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            RealtyAI gives each project a branded buyer page and an AI advisor that only speaks from your approved facts — then hands warm leads to your sales team.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link to="/demo">Book a pilot demo</Link></Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/p/$tenantSlug/$projectSlug" params={{ tenantSlug: "aranya-developers", projectSlug: "aranya-greens" }}>See a buyer page</Link>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&q=80&auto=format&fit=crop" alt="Residential towers with landscaped gardens" className="aspect-[4/5] w-full object-cover" />
        </div>
      </section>

      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-6 text-sm">
          {journey.map((j, i) => (
            <span key={j} className="flex items-center gap-4">
              <span className="font-medium">{j}</span>
              {i < journey.length - 1 && <span className="text-accent">→</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Eyebrow>One knowledge base, every touchpoint</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-4xl tracking-tight">Built around the facts your team signs off.</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
          {pillars.map((p, i) => (
            <div key={p.t} className="bg-card p-8">
              <p className="font-display text-sm text-accent">0{i + 1}</p>
              <h3 className="mt-3 text-xl font-semibold">{p.t}</h3>
              <p className="mt-2 text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <div className="rounded-lg bg-secondary p-12 md:flex md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl">Start with one project.</h2>
            <p className="mt-2 text-muted-foreground">A guided pilot: approved facts, branded page, AI advisor and visit booking in weeks.</p>
          </div>
          <Button asChild size="lg" className="mt-6 md:mt-0"><Link to="/demo">Request a demo</Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
