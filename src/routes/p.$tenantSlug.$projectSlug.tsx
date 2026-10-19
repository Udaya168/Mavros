import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/back-button";
import interior from "@/assets/interior.jpg";
import pool from "@/assets/pool.jpg";
import garden from "@/assets/garden.jpg";
import amenityClubhouse from "@/assets/amenity-clubhouse.jpg";
import amenityPool from "@/assets/amenity-pool.jpg";
import amenityJogging from "@/assets/amenity-jogging.jpg";
import amenityCoworking from "@/assets/amenity-coworking.jpg";
import amenityKids from "@/assets/amenity-kids.jpg";
const amenityImages: Record<string, string> = {
  "Clubhouse": amenityClubhouse,
  "Lap pool": amenityPool,
  "Jogging loop": amenityJogging,
  "Co-working lounge": amenityCoworking,
  "Kids' play": amenityKids,
};
import { formatInr, getProjectBySlug, tenant } from "@/lib/demo-data";

export const Route = createFileRoute("/p/$tenantSlug/$projectSlug")({
  loader: ({ params }) => {
    const project = getProjectBySlug(params.projectSlug);
    // Only published projects of the matching tenant are public.
    if (!project || project.status !== "published" || params.tenantSlug !== tenant.slug) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Project unavailable" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.project;
    const t = `${p.name}, ${p.location} — ${tenant.name}`;
    return {
      meta: [
        { title: t },
        { name: "description", content: p.tagline },
        { property: "og:title", content: t },
        { property: "og:description", content: p.tagline },
        { property: "og:type", content: "website" },
        { property: "og:image", content: p.image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: p.image },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div><h1 className="font-display text-3xl">Project not available</h1><Link to="/" className="mt-4 inline-block underline">Back home</Link></div>
    </div>
  ),
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const [config, setConfig] = useState("All");
  const [sent, setSent] = useState(false);
  const units = useMemo(
    () => project.units.filter((u) => u.status !== "booked" && (config === "All" || u.config === config)),
    [project, config],
  );
  const from = Math.min(...project.units.filter((u) => u.status === "available").map((u) => u.priceInr));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Thank you! A sales advisor will contact you shortly.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-5"><BackButton /><p className="font-display text-lg">{tenant.name}</p></div>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#residences">Residences</a><a href="#gallery">Gallery</a><a href="#amenities">Amenities</a><a href="#visit">Book a visit</a>
          </nav>
          <Button asChild size="sm"><a href="#visit">Book a visit</a></Button>
        </div>
      </header>

      <section className="relative">
        <img src={project.image} alt={project.name} className="h-[70vh] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-12 text-background">
          <p className="text-sm uppercase tracking-[0.2em] opacity-80">{project.location}</p>
          <h1 className="mt-2 font-display text-5xl md:text-7xl">{project.name}</h1>
          <p className="mt-3 max-w-xl text-lg opacity-90">{project.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded bg-background/15 px-3 py-1">2 & 3 BHK</span>
            <span className="rounded bg-background/15 px-3 py-1">From {formatInr(from)}</span>
            <span className="rounded bg-background/15 px-3 py-1">Possession {project.possession}</span>
          </div>
        </div>
      </section>

      <section id="residences" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-4xl">Available residences</h2>
          <div className="flex gap-2">
            {["All", "2 BHK", "3 BHK"].map((c) => (
              <Button key={c} size="sm" variant={config === c ? "default" : "outline"} onClick={() => setConfig(c)}>{c}</Button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => (
            <div key={u.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Unit {u.number}</p>
                <Badge variant={u.status === "available" ? "default" : "secondary"}>{u.status === "available" ? "Available" : "On hold"}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{u.config} · {u.carpetSqft} sq ft carpet</p>
              <p className="mt-1 font-display text-2xl">{formatInr(u.priceInr)}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Availability and prices are indicative and confirmed by the sales team.</p>
      </section>

      <section id="gallery" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="font-display text-4xl">Gallery</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3 md:grid-rows-2">
          <figure className="overflow-hidden rounded-lg md:col-span-2 md:row-span-2">
            <img src={interior} alt="Living room with park views" loading="lazy" width={1280} height={896} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
          </figure>
          <figure className="overflow-hidden rounded-lg">
            <img src={pool} alt="Rooftop lap pool at sunset" loading="lazy" width={1280} height={896} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
          </figure>
          <figure className="overflow-hidden rounded-lg">
            <img src={garden} alt="Central park and jogging loop" loading="lazy" width={1280} height={896} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
          </figure>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Images are artistic impressions.</p>
      </section>

      <section id="amenities" className="bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-3xl">Amenities</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {project.amenities.map((a) => <span key={a} className="rounded-full border border-border bg-card px-4 py-2 text-sm">{a}</span>)}
          </div>
        </div>
      </section>

      <section id="visit" className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl">Book a site visit</h2>
          <p className="mt-3 text-muted-foreground">Share your details and preferred configuration. An advisor will confirm a slot on WhatsApp or call.</p>
        </div>
        {sent ? (
          <div className="rounded-lg border border-border bg-card p-8"><p className="font-display text-2xl">Request received</p><p className="mt-2 text-muted-foreground">We'll be in touch soon.</p></div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-6">
            <Input required placeholder="Full name" maxLength={100} />
            <Input required type="tel" placeholder="Mobile number" maxLength={20} />
            <Input type="date" required />
            <label className="flex gap-2 text-xs text-muted-foreground"><input type="checkbox" required /> I agree to be contacted by {tenant.name} about this project.</label>
            <Button type="submit" className="w-full">Request visit</Button>
          </form>
        )}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
          <p>RERA: {project.reraId}. Details as provided by the developer.</p>
          <p className="mt-1">Powered by Mavros RealtyAI</p>
        </div>
      </footer>
    </div>
  );
}
