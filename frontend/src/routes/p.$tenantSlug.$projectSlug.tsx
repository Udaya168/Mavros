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
import residence2bhk from "@/assets/residence-2bhk.jpg";
import residence3bhk from "@/assets/residence-3bhk.jpg";
import residenceBedroom from "@/assets/residence-bedroom.jpg";
import residenceBalcony from "@/assets/residence-balcony.jpg";

const amenityImages: Record<string, string> = {
  Clubhouse: amenityClubhouse,
  "Lap pool": amenityPool,
  "Jogging loop": amenityJogging,
  "Co-working lounge": amenityCoworking,
  "Kids' play": amenityKids,
};

type Photo = { src: string; label: string };

// Sample interiors rotate through the cards so the grid isn't repetitive.
// Replace with the developer's approved unit images once storage is connected.
const photosByConfig: Record<string, Photo[]> = {
  "2 BHK": [
    { src: residence2bhk, label: "2 BHK living room" },
    { src: residenceBedroom, label: "Master bedroom" },
    { src: residenceBalcony, label: "Balcony view" },
  ],
  "3 BHK": [
    { src: residence3bhk, label: "3 BHK living room" },
    { src: residenceBedroom, label: "Master bedroom" },
    { src: residenceBalcony, label: "Balcony view" },
  ],
};

const unitPhoto = (config: string, i: number): Photo => {
  const list = photosByConfig[config] ?? photosByConfig["2 BHK"] ?? [];
  return list[i % list.length] ?? { src: residence2bhk, label: "2 BHK living room" };
};

import { formatInr, getProjectBySlug, tenant } from "@/lib/demo-data";

export const Route = createFileRoute("/p/$tenantSlug/$projectSlug")({
  loader: ({ params }) => {
    const project = getProjectBySlug(params.projectSlug);
    // Only published projects of the matching tenant are public.
    if (!project || project.status !== "published" || params.tenantSlug !== tenant.slug)
      throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Project unavailable" }, { name: "robots", content: "noindex" }] };
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
      <div>
        <h1 className="font-display text-3xl">Project not available</h1>
        <Link to="/" className="mt-4 inline-block underline">
          Back home
        </Link>
      </div>
    </div>
  ),
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const [config, setConfig] = useState("All");
  const [sent, setSent] = useState(false);
  const units = useMemo(
    () =>
      project.units.filter(
        (u) => u.status !== "booked" && (config === "All" || u.config === config),
      ),
    [project, config],
  );
  const from = Math.min(
    ...project.units.filter((u) => u.status === "available").map((u) => u.priceInr),
  );
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    toast.info("Demo only: your request wasn't sent or stored.");
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 md:flex md:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <div className="shrink-0">
              <BackButton />
            </div>
            <p className="truncate font-display text-base sm:text-lg">{tenant.name}</p>
          </div>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#residences">Residences</a>
            <a href="#gallery">Gallery</a>
            <a href="#amenities">Amenities</a>
            <a href="#visit">Book a visit</a>
          </nav>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href="#visit">Book a visit</a>
          </Button>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-border px-4 py-2 text-sm text-muted-foreground [scrollbar-width:none] md:hidden">
          <a href="#residences" className="shrink-0">
            Residences
          </a>
          <a href="#gallery" className="shrink-0">
            Gallery
          </a>
          <a href="#amenities" className="shrink-0">
            Amenities
          </a>
          <a href="#visit" className="shrink-0">
            Book a visit
          </a>
        </nav>
      </header>

      <section className="relative">
        <img
          src={project.image}
          alt={project.name}
          className="h-[62svh] min-h-[420px] w-full object-cover md:h-[70vh]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 text-background sm:px-6 md:pb-12">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80 sm:text-sm">
            {project.location}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl md:text-7xl">
            {project.name}
          </h1>
          <p className="mt-3 max-w-xl text-base opacity-90 sm:text-lg">{project.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="rounded bg-background/15 px-3 py-1">2 & 3 BHK</span>
            <span className="rounded bg-background/15 px-3 py-1">From {formatInr(from)}</span>
            <span className="rounded bg-background/15 px-3 py-1">
              Possession {project.possession}
            </span>
          </div>
        </div>
      </section>

      <section
        id="residences"
        className="mx-auto max-w-6xl scroll-mt-28 px-4 py-12 sm:px-6 md:py-20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <h2 className="font-display text-3xl sm:text-4xl">Available residences</h2>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            {["All", "2 BHK", "3 BHK"].map((c) => (
              <Button
                key={c}
                size="sm"
                variant={config === c ? "default" : "outline"}
                onClick={() => setConfig(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u, i) => {
            const photo = unitPhoto(u.config, i);
            return (
              <div key={u.id} className="overflow-hidden rounded-lg border border-border bg-card">
                <figure className="relative overflow-hidden">
                  <img
                    src={photo.src}
                    alt={`${photo.label} — artistic impression`}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-105 sm:aspect-[4/3]"
                  />
                  <figcaption className="absolute left-3 top-3 rounded bg-background/85 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground backdrop-blur">
                    Artistic impression
                  </figcaption>
                </figure>
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">Unit {u.number}</p>
                    <Badge variant={u.status === "available" ? "default" : "secondary"}>
                      {u.status === "available" ? "Available" : "On hold"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{photo.label}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {u.config} · {u.carpetSqft} sq ft carpet
                  </p>
                  <p className="mt-1 font-display text-2xl">{formatInr(u.priceInr)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Residence images are artistic impressions. Availability and prices are indicative and
          confirmed by the sales team.
        </p>
      </section>

      <section id="gallery" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-12 sm:px-6 md:pb-20">
        <h2 className="font-display text-3xl sm:text-4xl">Gallery</h2>
        <p className="mt-1 text-xs text-muted-foreground md:hidden">Swipe to see more →</p>
        <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:mt-8 md:grid md:grid-cols-3 md:grid-rows-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
          {[
            { src: interior, alt: "Living room with park views", big: true },
            { src: pool, alt: "Rooftop lap pool at sunset" },
            { src: garden, alt: "Central park and jogging loop" },
          ].map((g) => (
            <figure
              key={g.alt}
              className={`w-[85%] shrink-0 snap-center overflow-hidden rounded-lg md:w-auto ${g.big ? "md:col-span-2 md:row-span-2" : ""}`}
            >
              <img
                src={g.src}
                alt={g.alt}
                loading="lazy"
                width={1280}
                height={896}
                className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 hover:scale-105 md:aspect-auto"
              />
            </figure>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Images are artistic impressions.</p>
      </section>

      <section id="amenities" className="scroll-mt-28 bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <h2 className="font-display text-3xl">Amenities</h2>
          <p className="mt-1 text-xs text-muted-foreground sm:hidden">Swipe to see more →</p>
          <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-8 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {project.amenities.map((a) => (
              <figure
                key={a}
                className="group relative w-[75%] shrink-0 snap-center overflow-hidden rounded-lg sm:w-auto"
              >
                <img
                  src={amenityImages[a]}
                  alt={a}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:aspect-[4/3]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent px-4 pb-3 pt-10 text-background">
                  {a}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Images are artistic impressions.</p>
        </div>
      </section>

      <section
        id="visit"
        className="mx-auto grid max-w-6xl scroll-mt-28 gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-10 md:py-20"
      >
        <div>
          <h2 className="font-display text-3xl sm:text-4xl">Book a site visit</h2>
          <p className="mt-3 text-muted-foreground">
            Preview the visit-request flow. This demo does not send or store your details.
          </p>
        </div>
        {sent ? (
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <p className="font-display text-2xl">Demo preview</p>
            <p className="mt-2 text-muted-foreground">
              This preview does not send or store your request.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-6"
          >
            <p className="text-sm text-muted-foreground">
              Demo form only — your information will not be sent or stored.
            </p>
            <Input name="name" required placeholder="Full name" maxLength={100} className="h-11" />
            <Input
              name="phone"
              required
              type="tel"
              inputMode="tel"
              placeholder="Mobile number"
              minLength={5}
              maxLength={20}
              className="h-11"
            />
            <Input name="date" type="date" required className="h-11" />
            <label className="flex gap-2 text-xs text-muted-foreground">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0" /> I agree to be
              contacted by {tenant.name} about this project.
            </label>
            <Button type="submit" className="h-11 w-full">
              Preview request
            </Button>
          </form>
        )}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground sm:px-6">
          <p>RERA: {project.reraId}. Details as provided by the developer.</p>
          <p className="mt-1">Powered by Mavros RealtyAI</p>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="truncate font-display text-lg">{formatInr(from)}</p>
          </div>
          <Button asChild className="h-11 shrink-0 px-6">
            <a href="#visit">Book a visit</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
