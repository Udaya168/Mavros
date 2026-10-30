import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";

import { PublicAuthLayout } from "@/components/public-auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasPublicRecoverySession, updatePublicPassword } from "@/lib/public-auth";

export const Route = createFileRoute("/reset-password")({
  beforeLoad: async () => {
    const recovery = await hasPublicRecoverySession();
    if (!recovery.success) throw redirect({ to: "/forgot-password" });
  },
  head: () => ({
    meta: [
      { title: "Choose a new password — Mavros RealtyAI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePublicPassword({ data: { password } });
      if (!result.success) {
        setError(
          result.message ?? "Your password could not be updated. Request a new link and try again.",
        );
        return;
      }
      setUpdated(true);
    } catch {
      setError("We could not update your password. Request a new reset link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (updated) {
    return (
      <PublicAuthLayout
        title="Password updated"
        description="Your password has been changed. You can now sign in with your new password."
      >
        <Button
          type="button"
          className="h-11 w-full bg-[#1268e8] text-white hover:bg-[#0d58cb]"
          onClick={() => navigate({ to: "/login" })}
        >
          Continue to sign in
        </Button>
      </PublicAuthLayout>
    );
  }

  return (
    <PublicAuthLayout
      title="Choose a new password"
      description="Use at least 12 characters for your new password."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 border-[#d5deea] bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-11 border-[#d5deea] bg-white"
          />
        </div>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full bg-[#1268e8] text-white hover:bg-[#0d58cb]"
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </PublicAuthLayout>
  );
}
