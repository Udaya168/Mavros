import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { z } from "zod";

import { PublicAuthLayout } from "@/components/public-auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INITIAL_MAVROS_DEVELOPER_ID,
  INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID,
} from "@/lib/developer-auth-core";
import { getPublicUserSession, signInPublicUser } from "@/lib/public-auth";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ returnTo: z.string().optional() }).catch({}),
  loader: async () => {
    const session = await getPublicUserSession();
    if (session.user && session.role === "owner") throw redirect({ to: "/control" });
    if (session.user && session.role === "developer") throw redirect({ to: "/app" });
    const error =
      session.authorizationStatus === "unavailable"
        ? "We could not verify your account access. Please try again shortly."
        : session.authorizationStatus === "missing-owner"
          ? "The owner account is signed in but has no owner membership. Verify its UUID and existing membership record in Supabase."
          : session.authorizationStatus === "inactive-owner"
            ? "The owner account's membership is inactive. Review the existing membership record in Supabase."
            : session.authorizationStatus === "invalid-owner-role"
              ? "The owner account does not have an active owner role. Review its existing membership record in Supabase."
              : session.authorizationStatus === "missing-developer-membership"
                ? `No active membership was found for Auth user ${INITIAL_MAVROS_DEVELOPER_ID} in organization ${INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID}. Apply the organization-membership migration, verify the organization row, then add an active membership for this user with a permitted role.`
                : session.authorizationStatus === "invalid-developer-membership"
                  ? `The developer account's membership must match organization ${INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID} and use a permitted role. Verify public.developer_organization_memberships in Supabase.`
                  : session.authorizationStatus === "inactive-developer-membership"
                    ? `The developer account's membership in organization ${INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID} is inactive. Review its is_active value in public.developer_organization_memberships.`
                    : "";
    return { error };
  },
  head: () => ({
    meta: [
      { title: "Sign in — Mavros RealtyAI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Login,
});

function Login() {
  const initialState = Route.useLoaderData();
  const { returnTo } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialState.error);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await signInPublicUser({ data: { email, password } });
      if (!result.success) {
        setError(
          result.message ??
            "Sign-in failed. Check your credentials and confirm your email address if requested.",
        );
        return;
      }
      if (
        result.destination !== "/app" &&
        result.destination !== "/control" &&
        result.destination !== "/"
      ) {
        setError("Your sign-in succeeded, but your account destination could not be verified.");
        return;
      }
      let safeDeveloperReturn = "/app";
      if (returnTo) {
        try {
          const target = new URL(returnTo, window.location.origin);
          if (
            target.origin === window.location.origin &&
            (target.pathname === "/app" || target.pathname.startsWith("/app/"))
          ) {
            safeDeveloperReturn = `${target.pathname}${target.search}${target.hash}`;
          }
        } catch {
          safeDeveloperReturn = "/app";
        }
      }
      window.location.assign(
        result.destination === "/app" ? safeDeveloperReturn : result.destination,
      );
    } catch {
      setError("We could not complete sign-in. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicAuthLayout
      title="Welcome back"
      description="Sign in to continue to your Mavros account."
      appearance="login"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-sm font-medium text-[#dce4e2]">
            Email address
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 inline-flex w-11 items-center justify-center text-[#6e8580]">
              <Mail aria-hidden="true" className="size-4" />
            </span>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="admin@mavros.com"
              required
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 border-[#163832] bg-[#081513]/70 pl-11 text-sm text-[#f4f7f6] placeholder:text-[#556c67] focus-visible:border-[#27c9cd] focus-visible:ring-[#27c9cd]/20"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="login-password" className="text-sm font-medium text-[#dce4e2]">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="rounded text-xs font-semibold text-[#27c9cd] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#27c9cd]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 inline-flex w-11 items-center justify-center text-[#6e8580]">
              <Lock aria-hidden="true" className="size-4" />
            </span>
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 border-[#163832] bg-[#081513]/70 pl-11 pr-12 text-sm text-[#f4f7f6] placeholder:text-[#556c67] focus-visible:border-[#27c9cd] focus-visible:ring-[#27c9cd]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-[#6e8580] hover:text-[#27c9cd] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#27c9cd]"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </div>
        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full gap-2 rounded-xl bg-[#27c9cd] font-semibold text-[#040807] shadow-lg shadow-[#27c9cd]/15 hover:bg-[#34d9dd] hover:shadow-[#27c9cd]/25"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
          {!isSubmitting && <ArrowRight aria-hidden="true" className="size-4" />}
        </Button>
        <p className="pt-1 text-center text-sm text-[#8ba09b]">
          New to Mavros?{" "}
          <Link
            to="/signup"
            className="font-semibold text-[#27c9cd] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#27c9cd]"
          >
            Create an account
          </Link>
        </p>
      </form>
    </PublicAuthLayout>
  );
}
