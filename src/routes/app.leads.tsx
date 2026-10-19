import { createFileRoute } from "@tanstack/react-router";
import { getProject, leads, type LeadStage } from "@/lib/demo-data";

export const Route = createFileRoute("/app/leads")({ component: Leads });

const stages: LeadStage[] = ["New", "Contacted", "Qualified", "Visit Booked", "Visited", "Negotiation"];

function Leads() {
  return (
    <div>
      <h1 className="font-display text-4xl">Lead pipeline</h1>
      <p className="mt-1 text-muted-foreground">Phone numbers are masked for your role.</p>
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        {stages.map((s) => (
          <div key={s} className="w-64 shrink-0 rounded-lg bg-secondary p-3">
            <p className="px-1 text-sm font-semibold">{s} <span className="text-muted-foreground">({leads.filter((l) => l.stage === s).length})</span></p>
            <div className="mt-3 space-y-3">
              {leads.filter((l) => l.stage === s).map((l) => (
                <div key={l.id} className="rounded-md border border-border bg-card p-3 text-sm">
                  <div className="flex justify-between"><p className="font-medium">{l.name}</p><span className="text-xs text-accent">{l.score}</span></div>
                  <p className="mt-1 text-xs text-muted-foreground">{l.config} · {l.budget}</p>
                  <p className="text-xs text-muted-foreground">{getProject(l.projectId)?.name} · {l.source}</p>
                  <p className="mt-2 text-xs">Owner: {l.owner}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
