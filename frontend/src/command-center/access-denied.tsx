import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { ControlAuthLayout } from "@/command-center/auth-layout";
import { Button } from "@/components/ui/button";
import { signOutControlStaff } from "@/lib/control-auth";

export function ControlAccessDenied({
  authorizationUnavailable = false,
  authorizationErrorCode,
}: {
  authorizationUnavailable?: boolean;
  authorizationErrorCode?: string | undefined;
}) {
  const [error, setError] = useState("");

  async function handleSignOut() {
    setError("");
    try {
      const result = await signOutControlStaff();
      if (!result.success) {
        setError("Sign out could not be completed. Please try again.");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("Sign out could not be completed. Please try again.");
    }
  }

  return (
    <ControlAuthLayout
      title={authorizationUnavailable ? "Owner check unavailable" : "Access not authorized"}
      description={
        authorizationUnavailable
          ? `Your account is signed in, but Supabase could not verify owner authorization. Diagnostic code: ${authorizationErrorCode ?? "unknown"}.`
          : "Your account is signed in, but no active Mavros owner membership was verified. Public account registration never grants Control Center privileges."
      }
    >
      <div className="space-y-3">
        {!authorizationUnavailable && (
          <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
            <p className="font-semibold text-white">Check owner provisioning</p>
            <p className="mt-2">
              In Supabase SQL Editor, confirm this account UUID is{" "}
              <code className="text-cyan-200">f2c67a31-2b22-4ba9-86bd-91e9977b4955</code> and
              inspect its existing membership. The initial-owner migration is{" "}
              <code>20260617000002_provision_initial_mavros_owner.sql</code>; verify its current
              state before considering any rerun.
            </p>
          </div>
        )}
        {authorizationUnavailable && (
          <p className="rounded-lg border border-slate-700 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
            Check server logs for the matching <code>[control-auth]</code> stage and error code.
            Confirm the membership table is exposed to the API, the authenticated role has SELECT,
            and its own-row RLS policy is active. Do not disable RLS.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <Button
          type="button"
          onClick={handleSignOut}
          className="h-11 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        >
          Sign out
        </Button>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link to="/">Return to the homepage</Link>
        </Button>
      </div>
    </ControlAuthLayout>
  );
}
