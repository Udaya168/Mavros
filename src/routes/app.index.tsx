import { createFileRoute, Link } from "@tanstack/react-router";
import { activity, leads, projects } from "@/lib/demo-data";

export const Route = createFileRoute("/app/")({ component: Overview });

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function Overview() {
  const units = projects.flatMap((p) => p.units);
  const qualified = leads.filter((l) => ["Qualified", "Visit Booked", "Visited", "Negotiation", "Won"].includes(l.stage)).length;
  return (
    <div>
      <h1 className="font-display text-4xl">Good evening, Priya</h1>
      <p className="mt-1 text-muted-foreground">Here's what needs attention today.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active leads" value={leads.length} />
        <Stat label="Qualified" value={qualified} />
        <Stat label="Visits booked" value={leads.filter((l) => l.stage === "Visit Booked").length} />
        <Stat label="Units available" value={units.filter((u) => u.status === "available").length} />
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex justify-between"><h2 className="font-semibold">Unassigned & new leads</h2><Link to="/app/leads" className="text-sm text-accent">View all</Link></div>
          <ul className="mt-4 divide-y divide-border text-sm">
            {leads.filter((l) => l.stage === "New" || l.owner === "Unassigned").map((l) => (
              <li key={l.id} className="flex justify-between py-3"><span>{l.name} · {l.config}</span><span className="text-muted-foreground">{l.source}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex justify-between"><h2 className="font-semibold">Recent activity</h2><Link to="/app/activity" className="text-sm text-accent">Full log</Link></div>
          <ul className="mt-4 space-y-3 text-sm">
            {activity.slice(0, 4).map((a) => <li key={a.id}><span className="font-medium">{a.actor}</span> {a.action} — <span className="text-muted-foreground">{a.entity}</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
