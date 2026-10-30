import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/control/login")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Staff Login — Mavros Control Center" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
