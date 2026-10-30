import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import { ControlAuthLayout } from "@/command-center/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateControlPassword } from "@/lib/control-auth";

export function ControlResetPasswordForm({ recovery }: { recovery: { success: boolean } }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (recovery.success && window.location.search.includes("code=")) {
      window.history.replaceState(window.history.state, "", "/control/reset-password");
    }
  }, [recovery.success]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateControlPassword({ data: { password } });
      if (result.success) {
        setUpdated(true);
      } else {
        setError(result.message ?? "Your password could not be updated. Please try again.");
      }
    } catch {
      setError("We could not update your password. Request a new reset link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (updated) {
    return (
      <ControlAuthLayout
        title="Password updated"
        description="Your password has been changed. Continue to the staff sign-in page."
      >
        <Button
          type="button"
          className="h-11 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          onClick={() => navigate({ to: "/control/login" })}
        >
          Continue to sign in
        </Button>
      </ControlAuthLayout>
    );
  }

  if (!recovery.success) {
    return (
      <ControlAuthLayout
        title="Reset link unavailable"
        description="This reset link is invalid or has expired. Request a new password reset link."
      >
        <Button asChild className="h-11 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
          <Link to="/control/forgot-password">Request a new link</Link>
        </Button>
      </ControlAuthLayout>
    );
  }

  return (
    <ControlAuthLayout
      title="Choose a new password"
      description="Use at least 12 characters for your new staff account password."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-slate-200">
            New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-slate-200">
            Confirm new password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </div>
        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="h-11 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </ControlAuthLayout>
  );
}
