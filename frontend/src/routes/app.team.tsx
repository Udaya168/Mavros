import { createFileRoute } from "@tanstack/react-router";

import { TeamPage } from "@/developer-portal";

export const Route = createFileRoute("/app/team")({ component: TeamPage });
