import { createFileRoute } from "@tanstack/react-router";

import { ActivityPage } from "@/developer-portal";

export const Route = createFileRoute("/app/activity")({ component: ActivityPage });
