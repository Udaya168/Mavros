import { Bot } from "lucide-react";
import { useRouteContext } from "@tanstack/react-router";

export function HeroBanner() {
  const { developerSession } = useRouteContext({ from: "/app" });
  const firstName = developerSession.user.displayName.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <section className="command-hero" aria-labelledby="hero-heading">
      <div className="command-hero-content">
        <p className="command-hero-greeting">
          {greeting}, {firstName}
        </p>
        <h1 id="hero-heading" className="command-hero-title">
          Build. Manage. Grow.
        </h1>
        <p className="command-hero-subtitle">
          Track projects, leads, inventory and team performance from one place.
        </p>
      </div>
      <div className="command-hero-visual" aria-hidden="true">
        <div className="command-hero-arm">
          <Bot size={48} />
        </div>
      </div>
    </section>
  );
}
