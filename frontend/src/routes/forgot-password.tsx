import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicAuthLayout } from "@/components/public-auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPublicPasswordRecovery } from "@/lib/public-auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Password recovery — Mavros RealtyAI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
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
      const result = await requestPublicPasswordRecovery({ data: { email } });
      if (result.success) setMessage(result.message);
      else setError(result.message);
    } catch {
      setError("We could not process the request. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicAuthLayout
      title="Reset your password"
      description="Enter your account email and we’ll send a secure password-reset link if the account is eligible."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email address</Label>
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 border-[#d5deea] bg-white"
          />
        </div>
        {message && (
          <p className="text-sm text-emerald-800" role="status">
            {message}
          </p>
        )}
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
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-center text-sm text-[#64748b]">
          <Link
            to="/login"
            className="font-semibold text-[#1268e8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8]"
          >
            Return to sign in
          </Link>
        </p>
      </form>
    </PublicAuthLayout>
  );
}
