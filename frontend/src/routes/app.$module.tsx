import { createFileRoute, notFound } from "@tanstack/react-router";

import { DeveloperModulePage } from "@/developer-portal/pages/developer-module-page";
import { getDeveloperModule } from "@/developer-portal/module-config";

export const Route = createFileRoute("/app/$module")({
  beforeLoad: ({ params }) => {
    if (!getDeveloperModule(params.module)) throw notFound();
  },
  component: ModuleRoute,
});

function ModuleRoute() {
  const { module } = Route.useParams();
  return <DeveloperModulePage module={module} />;
}
