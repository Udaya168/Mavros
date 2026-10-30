import { createFileRoute } from "@tanstack/react-router";

import { LeadsPage } from "@/developer-portal";

export const Route = createFileRoute("/app/leads")({ component: LeadsPage });
