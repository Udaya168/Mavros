import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteLayout, Eyebrow } from "@/components/site-chrome";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Request a demo — Mavros RealtyAI" },
      { name: "description", content: "Book a pilot demo of RealtyAI for your next residential project." },
      { property: "og:title", content: "Request a demo — Mavros RealtyAI" },
      { property: "og:description", content: "See the AI advisor, lead pipeline and site-visit booking on your own project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});

function Demo() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Thanks — our team will reach out within one business day.");
  };
  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <Eyebrow>Pilot programme</Eyebrow>
          <h1 className="mt-4 font-display text-5xl tracking-tight">Let's set up your first project.</h1>
          <p className="mt-4 text-muted-foreground">Tell us about your project and current lead process. We'll show RealtyAI working with your own inventory.</p>
        </div>
        {sent ? (
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Request received</h2>
            <p className="mt-2 text-muted-foreground">We'll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-card p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="n">Full name</Label><Input id="n" required maxLength={100} /></div>
              <div className="space-y-1.5"><Label htmlFor="c">Company</Label><Input id="c" required maxLength={100} /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="e">Work email</Label><Input id="e" type="email" required maxLength={255} /></div>
              <div className="space-y-1.5"><Label htmlFor="p">Phone</Label><Input id="p" type="tel" required maxLength={20} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="m">Project & city</Label><Textarea id="m" maxLength={1000} placeholder="e.g. 240-unit residential project in Pune, launching Q1" /></div>
            <Button type="submit" className="w-full">Request demo</Button>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
