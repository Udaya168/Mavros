import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";

import { PublicAuthLayout } from "@/components/public-auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicUserSession, signUpPublicUser } from "@/lib/public-auth";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const session = await getPublicUserSession();
    if (!session.user) return;
    if (session.role === "owner") throw redirect({ to: "/control" });
    if (session.role === "developer") throw redirect({ to: "/app" });
    if (session.authorizationStatus === "normal-user") throw redirect({ to: "/" });
    if (session.authorizationStatus === "unavailable") {
      throw new Response("Account authorization could not be checked. Please try again shortly.", {
        status: 503,
      });
    }
    throw new Response(
      "This account has no valid owner or developer membership. Review its membership in Supabase.",
      { status: 403 },
    );
  },
  head: () => ({
    meta: [
      { title: "Create account — Mavros RealtyAI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Choose a password with at least 12 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUpPublicUser({ data: { fullName, email, password } });
      if (!result.success) {
        setError(result.message);
        return;
      }
      if (!result.confirmationRequired) {
        await navigate({ to: "/" });
        return;
      }
      setSuccessMessage(result.message);
    } catch {
      setError("We could not create your account. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicAuthLayout
      title="Create your account"
      description="Set up a Mavros account to get started."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            autoComplete="name"
            required
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-11 border-[#d5deea] bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email address</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 border-[#d5deea] bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 border-[#d5deea] bg-white pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-[#64748b] hover:text-[#1268e8] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#1268e8]"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-[#77869b]">Use at least 12 characters.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-confirm">Confirm password</Label>
          <Input
            id="signup-confirm"
            type={showPassword ? "text" : "password"}
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
        {successMessage && (
          <p className="text-sm text-emerald-800" role="status">
            {successMessage}
          </p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full bg-[#1268e8] text-white hover:bg-[#0d58cb]"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-sm text-[#64748b]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#1268e8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1268e8]"
          >
            Sign in
          </Link>
        </p>
      </form>
    </PublicAuthLayout>
  );
}
