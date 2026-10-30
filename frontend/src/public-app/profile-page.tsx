import { Link } from "@tanstack/react-router";
import { Building2, UserRound } from "lucide-react";

type ProfileData = {
  profile: {
    full_name: string | null;
  } | null;
  user: {
    email: string | null;
    displayName: string;
  } | null;
};

export function ProfilePage({ data }: { data: ProfileData }) {
  const displayName = data.profile?.full_name?.trim() || data.user?.displayName || "My Account";

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-8 text-[#102039] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-[#dbe2ec] pb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1268e8]"
            aria-label="Mavros RealtyAI home"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#102039] text-white">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.18em]">MAVROS</span>
              <span className="block text-[10px] font-medium tracking-[0.12em] text-[#68778c]">
                REALTYAI
              </span>
            </span>
          </Link>
          <Link
            to="/"
            className="rounded text-sm font-semibold text-[#1268e8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1268e8]"
          >
            Back to home
          </Link>
        </header>

        <section className="mt-10 rounded-2xl border border-[#dbe2ec] bg-white p-6 shadow-[0_12px_36px_rgba(16,32,57,0.06)] sm:p-9">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eaf1ff] text-[#1268e8]">
              <UserRound aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#68778c]">
                Your profile
              </p>
              <h1 className="mt-1 font-display text-3xl tracking-tight">{displayName}</h1>
            </div>
          </div>

          <dl className="mt-8 grid gap-5 border-t border-[#e6ebf2] pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#68778c]">Name</dt>
              <dd className="mt-2 text-sm font-medium text-[#20314a]">{displayName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#68778c]">
                Email
              </dt>
              <dd className="mt-2 break-all text-sm font-medium text-[#20314a]">
                {data.user?.email || "Email unavailable"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-5 rounded-2xl border border-dashed border-[#cbd6e5] bg-white/70 p-6 sm:p-8">
          <h2 className="text-base font-semibold text-[#20314a]">Additional profile details</h2>
          <p className="mt-2 text-sm leading-6 text-[#68778c]">
            Additional profile fields can be added here later.
          </p>
        </section>
      </div>
    </main>
  );
}
