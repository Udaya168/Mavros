import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { tenant } from "@/lib/demo-data";

export const Route = createFileRoute("/app/team")({ component: Team });

function Team() {
  return (
    <div>
      <h1 className="font-display text-4xl">Team & roles</h1>
      <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
        {tenant.members.map((m) => (
          <div key={m.email} className="flex items-center justify-between p-4">
            <div><p className="font-medium">{m.name}</p><p className="text-sm text-muted-foreground">{m.email}</p></div>
            <Badge variant="outline" className="capitalize">{m.role}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
