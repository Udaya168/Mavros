import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Sparkles } from "lucide-react";

export function PublicAuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#102039]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden bg-[#102039] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -right-28 top-24 size-96 rounded-full bg-[#1268e8]/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
          <Link
            to="/"
            className="relative inline-flex w-fit items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            aria-label="Mavros RealtyAI home"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.18em]">MAVROS</span>
              <span className="mt-0.5 block text-[10px] font-medium tracking-[0.12em] text-slate-300">
                REALTYAI × VEYTRIX.AI
              </span>
            </span>
          </Link>
          <div className="relative max-w-xl py-16">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-slate-200">
              <Sparkles aria-hidden="true" className="size-4 text-cyan-300" />
              Property sales, thoughtfully connected
            </div>
            <p className="font-display text-5xl leading-[1.08] tracking-tight xl:text-6xl">
              From property interest to <span className="text-cyan-300">sales conversations.</span>
            </p>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              One connected experience for project discovery, buyer conversations and the creative
              work that brings them together.
            </p>
          </div>
          <p className="relative text-xs text-slate-400">
            © 2026 Mavros Tech Pvt Ltd. RealtyAI + Veytrix.AI
          </p>
        </aside>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-20">
          <header className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded text-sm font-semibold text-[#102039] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1268e8] lg:invisible"
              aria-label="Mavros RealtyAI home"
            >
              <Building2 aria-hidden="true" className="size-5" />
              MAVROS <span className="text-[#1268e8]">REALTYAI</span>
            </Link>
            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-2 rounded text-sm text-[#62718a] transition hover:text-[#1268e8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1268e8]"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to home
            </Link>
          </header>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <div className="mb-8 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1268e8]">
                RealtyAI × Veytrix.AI
              </p>
            </div>
            <h1 className="font-display text-4xl tracking-tight text-[#102039]">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
          <p className="text-center text-xs leading-5 text-[#8793a5]">
            Secure account access powered by Supabase Auth.
          </p>
        </section>
      </div>
    </main>
  );
}
