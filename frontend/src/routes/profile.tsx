import { createFileRoute, redirect } from "@tanstack/react-router";

import { ProfilePage } from "@/public-app/profile-page";
import { getOwnProfile } from "@/lib/public-auth";

export const Route = createFileRoute("/profile")({
  loader: async () => {
    const data = await getOwnProfile();
    if (!data.user) throw redirect({ to: "/login" });
    return data;
  },
  head: () => ({
    meta: [
      { title: "Your profile — Mavros RealtyAI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const data = Route.useLoaderData();
  return <ProfilePage data={data} />;
}
