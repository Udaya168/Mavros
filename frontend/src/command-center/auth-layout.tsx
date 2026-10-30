import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function ControlAuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to Mavros
        </Link>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
            Mavros Control Center
          </p>
          <h1 className="mt-3 font-display text-3xl text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          <div className="mt-7">{children}</div>
        </section>
        <p className="mt-5 text-center text-xs text-slate-500">
          Restricted to authorized Mavros staff.
        </p>
      </div>
    </main>
  );
}
