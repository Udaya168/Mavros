import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BackButton } from "@/components/back-button";
import { tenants } from "@/lib/demo-data";

export const Route = createFileRoute("/control")({
  head: () => ({
    meta: [
      { title: "Control Center — Mavros" },
      { name: "description", content: "Restricted Mavros operations console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Control,
});

function Control() {
  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <BackButton className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
        <h1 className="mt-3 font-display text-4xl">Control Center</h1>
        <p className="mt-1 opacity-70">Tenant provisioning and platform oversight · restricted to Mavros staff</p>
        <div className="mt-8 rounded-lg bg-card text-card-foreground">
          <Table>
            <TableHeader><TableRow><TableHead>Tenant</TableHead><TableHead>Plan</TableHead><TableHead>Projects</TableHead><TableHead>Seats</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.slug}>
                  <TableCell className="font-medium">{t.name}</TableCell><TableCell>{t.plan}</TableCell><TableCell>{t.projects}</TableCell><TableCell>{t.seats}</TableCell>
                  <TableCell><Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
