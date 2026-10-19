import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatInr, getProject, tenant } from "@/lib/demo-data";

export const Route = createFileRoute("/app/projects/$id")({
  loader: ({ params }) => {
    const project = getProject(params.id);
    if (!project) throw notFound();
    return { project };
  },
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project: p } = Route.useLoaderData();
  const count = (s: string) => p.units.filter((u) => u.status === s).length;
  return (
    <div>
      <Link to="/app/projects" className="text-sm text-muted-foreground">← Projects</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{p.name}</h1>
          <p className="mt-1 text-muted-foreground">{p.location} · RERA {p.reraId}</p>
        </div>
        {p.status === "published" ? (
          <Button asChild variant="outline"><Link to="/p/$tenantSlug/$projectSlug" params={{ tenantSlug: tenant.slug, projectSlug: p.slug }}>View buyer page</Link></Button>
        ) : <Badge variant="secondary">Draft — facts awaiting approval</Badge>}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {(["available", "held", "booked"] as const).map((s) => (
          <div key={s} className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase text-muted-foreground">{s}</p><p className="font-display text-2xl">{count(s)}</p></div>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-semibold">Inventory</h2>
      <div className="mt-3 rounded-lg border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Unit</TableHead><TableHead>Config</TableHead><TableHead>Carpet</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {p.units.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.number}</TableCell><TableCell>{u.config}</TableCell><TableCell>{u.carpetSqft} sq ft</TableCell><TableCell>{formatInr(u.priceInr)}</TableCell>
                <TableCell><Badge variant={u.status === "available" ? "default" : u.status === "held" ? "outline" : "secondary"}>{u.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
