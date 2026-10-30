import { createFileRoute } from "@tanstack/react-router";

import { ProjectsPage } from "@/developer-portal";

export const Route = createFileRoute("/app/projects/")({ component: ProjectsPage });
