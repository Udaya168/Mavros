import { createFileRoute } from "@tanstack/react-router";
import { OverviewPage } from "@/developer-portal";

export const Route = createFileRoute("/app/")({ component: OverviewPage });
