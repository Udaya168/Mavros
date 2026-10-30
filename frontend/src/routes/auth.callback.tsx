import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { PublicAuthLayout } from "@/components/public-auth-layout";
import { Button } from "@/components/ui/button";
import { exchangePublicAuthCode } from "@/lib/public-auth";

export const Route = createFileRoute("/auth/callback")({
  loader: async ({ location }) => {
    const search = new URLSearchParams(location.searchStr);
    const code = search.get("code");
    const next = search.get("next");
    if (!code) return { success: false };

    const result = await exchangePublicAuthCode({ data: { code } });
    if (!result.success) return { success: false };

    if (next === "/reset-password") {
      throw redirect({ to: "/reset-password" });
    }
    throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Confirming account — Mavros RealtyAI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  return (
    <PublicAuthLayout
      title="Link unavailable"
      description="This sign-in or verification link is invalid or has expired. You can request a new link or sign in again."
    >
      <div className="space-y-3">
        <Button asChild className="h-11 w-full bg-[#1268e8] text-white hover:bg-[#0d58cb]">
          <Link to="/login">Go to sign in</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link to="/forgot-password">Request a password reset</Link>
        </Button>
      </div>
    </PublicAuthLayout>
  );
}
