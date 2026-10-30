import { createFileRoute } from "@tanstack/react-router";

import { ControlResetPasswordForm } from "@/command-center/reset-password-form";
import { exchangeControlRecoveryCode, hasControlRecoverySession } from "@/lib/control-auth";

export const Route = createFileRoute("/control/reset-password")({
  loader: async ({ location }) => {
    const callbackUrl = new URL(location.href, "http://localhost");
    const code = callbackUrl.searchParams.get("code");
    if (code) return exchangeControlRecoveryCode({ data: { code } });
    return hasControlRecoverySession();
  },
  head: () => ({
    meta: [
      { title: "Choose a New Password — Mavros Control Center" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  return <ControlResetPasswordForm recovery={Route.useLoaderData()} />;
}
