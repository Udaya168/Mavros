import { createFileRoute } from "@tanstack/react-router";
import { activity } from "@/lib/demo-data";

export const Route = createFileRoute("/app/activity")({ component: ActivityLog });

function ActivityLog() {
  return (
    <div>
      <h1 className="font-display text-4xl">Activity log</h1>
      <p className="mt-1 text-muted-foreground">Every change made by your team, in order.</p>
      <ol className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
        {activity.map((a) => (
          <li key={a.id} className="grid gap-1 p-4 text-sm md:grid-cols-[160px_1fr]">
            <span className="text-muted-foreground">{a.at}</span>
            <span><span className="font-medium">{a.actor}</span> {a.action} — {a.entity}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
