import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import luxuryBuildingImage from "@/assets/luxury-building.jpg";
import "./auth-theme.css";

function LuxuryBuildingVisual() {
  return (
    <div className="luxury-building-visual" aria-hidden="true">
      <img
        src={luxuryBuildingImage}
        alt=""
        className="luxury-building-image"
      />
      <div className="luxury-building-fade-overlay" />
      <div className="luxury-building-horizon-line" />
    </div>
  );
}

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
  const isLogin = appearance === "login";

  return (
    <main className={`public-auth${isLogin ? " public-auth--login" : ""}`}>
      <div className="public-auth__grid">
        <aside className="public-auth__brand">
          {/* Subtle ASCII texture layer near top */}
          <div className="public-auth__ascii-texture" aria-hidden="true">
            {"* . : + x = + * . : + x = + * . : + x = + * . : + x = +\n" +
             ": + x = + * . : + x = + * . : + x = + * . : + x = + * .\n" +
             ". : + x = + * . : + x = + * . : + x = + * . : + x = + *"}
          </div>

          <Link to="/" className="public-auth__logo" aria-label="Mavros RealtyAI home">
            <span className="public-auth__logo-mark">
              {isLogin ? (
                <span className="font-bold text-lg text-[#e7fbff] tracking-tighter">M</span>
              ) : (
                <Building2 aria-hidden="true" className="size-5" />
              )}
            </span>
            <span>
              <span className="public-auth__logo-name">MAVROS</span>
              <span className="public-auth__logo-subtitle">REALTYAI · VEYTRIX.AI</span>
            </span>
          </Link>

          <div className="public-auth__story">
            <div className="public-auth__badge">
              <Building2 aria-hidden="true" className="size-3.5 text-[#27c9cd]" />
              Property sales, thoughtfully connected
            </div>
            <h1 className="public-auth__headline">
              From property interest to{" "}
              <span className="text-[#27c9cd]">sales conversations.</span>
            </h1>
            <p className="public-auth__story-copy">
              One connected experience for project discovery, buyer conversations and the creative
              work that brings them together.
            </p>
          </div>

          {/* Luxury architectural building visual in lower right */}
          {isLogin && <LuxuryBuildingVisual />}

          <p className="public-auth__copyright">
            © 2026 Mavros Tech Pvt. Ltd. RealtyAI + Veytrix.AI
          </p>
        </aside>

        <section className="public-auth__panel">
          <header className="public-auth__header">
            <Link to="/" className="public-auth__mobile-brand" aria-label="Mavros RealtyAI home">
              <span className="public-auth__logo-mark size-7">
                <span className="font-bold text-sm text-[#e7fbff]">M</span>
              </span>
              <span>MAVROS</span>
            </Link>
            <Link to="/" className="public-auth__back">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to home
            </Link>
          </header>

          <div className="public-auth__content">
            <div className="public-auth__card">
              <h2 className="public-auth__title">{title}</h2>
              <p className="public-auth__description">{description}</p>
              <div className="public-auth__form-content">{children}</div>
            </div>
          </div>

          <footer className="public-auth__footer">
            <p className="public-auth__mobile-copyright">
              © 2026 Mavros Tech Pvt. Ltd. RealtyAI + Veytrix.AI
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
