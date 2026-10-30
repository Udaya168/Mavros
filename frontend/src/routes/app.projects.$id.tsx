import { createFileRoute } from "@tanstack/react-router";

import { ProjectDetailsPage } from "@/developer-portal";

export const Route = createFileRoute("/app/projects/$id")({
  component: ProjectDetailsPage,
});
