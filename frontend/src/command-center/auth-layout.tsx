import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import "@/components/auth-theme.css";

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
    <main className="control-auth">
      <div className="control-auth__container">
        <Link to="/" className="control-auth__back">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to Mavros
        </Link>
        <section className="control-auth__card">
          <div className="control-auth__mark">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </div>
          <p className="control-auth__eyebrow">Mavros Control Center</p>
          <h1 className="control-auth__title">{title}</h1>
          <p className="control-auth__description">{description}</p>
          <div className="control-auth__content">{children}</div>
        </section>
        <p className="control-auth__restriction">Restricted to authorized Mavros staff.</p>
      </div>
    </main>
  );
}
