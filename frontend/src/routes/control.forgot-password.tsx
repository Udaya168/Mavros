import { createFileRoute } from "@tanstack/react-router";

import { ControlForgotPasswordForm } from "@/command-center/forgot-password-form";

export const Route = createFileRoute("/control/forgot-password")({
  head: () => ({
    meta: [
      { title: "Password Recovery — Mavros Control Center" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ControlForgotPasswordForm,
});
