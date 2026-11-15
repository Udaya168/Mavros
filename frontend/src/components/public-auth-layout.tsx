import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Sparkles } from "lucide-react";
import "./auth-theme.css";

export function PublicAuthLayout({
  title,
  description,
  children,
  appearance = "default",
}: {
  title: string;
  description: string;
  children: ReactNode;
  appearance?: "default" | "login";
}) {
  return (
    <main className={`public-auth${appearance === "login" ? " public-auth--login" : ""}`}>
      <div className="public-auth__grid">
        <aside className="public-auth__brand">
          <Link to="/" className="public-auth__logo" aria-label="Mavros RealtyAI home">
            <span className="public-auth__logo-mark">
              <Building2 aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="public-auth__logo-name">MAVROS</span>
              <span className="public-auth__logo-subtitle">REALTYAI × VEYTRIX.AI</span>
            </span>
          </Link>
          <div className="public-auth__story">
            <div className="public-auth__badge">
              <Sparkles aria-hidden="true" className="size-4" />
              Property sales, thoughtfully connected
            </div>
            <p className="public-auth__headline">
              From property interest to <span className="text-cyan-300">sales conversations.</span>
            </p>
            <p className="public-auth__story-copy">
              One connected experience for project discovery, buyer conversations and the creative
              work that brings them together.
            </p>
          </div>
          <p className="public-auth__copyright">
            © 2026 Mavros Tech Pvt Ltd. RealtyAI + Veytrix.AI
          </p>
        </aside>

        <section className="public-auth__panel">
          <header className="public-auth__header">
            <Link to="/" className="public-auth__mobile-brand" aria-label="Mavros RealtyAI home">
              <Building2 aria-hidden="true" className="size-5" />
              <span>MAVROS REALTYAI</span>
            </Link>
            <Link to="/" className="public-auth__back">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to home
            </Link>
          </header>
          <div className="public-auth__content">
            <div className="public-auth__mobile-kicker">
              <p>RealtyAI × Veytrix.AI</p>
            </div>
            <h1 className="public-auth__title">{title}</h1>
            <p className="public-auth__description">{description}</p>
            <div className="public-auth__form-content">{children}</div>
          </div>
          <footer className="public-auth__footer">
            <p className="public-auth__security">Secure account access powered by Supabase Auth.</p>
            <p className="public-auth__mobile-copyright">
              © 2026 Mavros Tech Pvt Ltd. RealtyAI + Veytrix.AI
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
