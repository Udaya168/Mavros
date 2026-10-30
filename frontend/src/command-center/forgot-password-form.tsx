import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";

import { ControlAuthLayout } from "@/command-center/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestControlPasswordRecovery } from "@/lib/control-auth";

export function ControlForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const result = await requestControlPasswordRecovery({ data: { email } });
      if (result.success) setMessage(result.message);
      else setError(result.message);
    } catch {
      setError("We could not process that request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ControlAuthLayout
      title="Reset your password"
      description="Enter the email associated with your staff account. If eligible, you’ll receive a secure reset link."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="recovery-email" className="text-slate-200">
            Work email
          </Label>
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </div>
        {message && (
          <p className="text-sm text-emerald-300" role="status">
            {message}
          </p>
        )}
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
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-center text-sm">
          <Link
            to="/control/login"
            className="text-cyan-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Return to staff sign in
          </Link>
        </p>
      </form>
    </ControlAuthLayout>
  );
}
