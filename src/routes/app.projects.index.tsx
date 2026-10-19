import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/lib/demo-data";

export const Route = createFileRoute("/app/projects/")({ component: Projects });

function Projects() {
  return (
    <div>
      <h1 className="font-display text-4xl">Projects</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {projects.map((p) => (
          <Link key={p.id} to="/app/projects/$id" params={{ id: p.id }} className="overflow-hidden rounded-lg border border-border bg-card transition hover:shadow-md">
            <img src={p.image} alt={p.name} className="h-44 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{p.name}</h2><Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge></div>
              <p className="mt-1 text-sm text-muted-foreground">{p.location} · {p.units.length} units · Possession {p.possession}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
