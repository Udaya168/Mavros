import { Database } from "lucide-react";

export function DataUnavailable({ title, description }: { title: string; description: string }) {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-[#cbd6e5] bg-white p-8 text-center sm:p-12">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#eaf1ff] text-[#1268e8]">
        <Database aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[#102039]">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#68778c]">{description}</p>
      <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-[#8793a5]">
        No sample or fabricated records are shown as live organization data.
      </p>
    </section>
  );
}
