import { DataUnavailable } from "../components/data-unavailable";
import { getDeveloperModule } from "../module-config";
import { AnalyticsPage } from "./analytics-page";
import { InventoryPage } from "./inventory-page";
import { SettingsPage } from "./settings-page";
import { ReportsPage } from "./reports-page";
import {
  CampaignsPage,
  ContactsPage,
  KnowledgeBasePage,
  NotificationsPage,
  SupportPage,
  TasksPage,
  VisitsPage,
} from "./workspace-pages";

export function DeveloperModulePage({ module }: { module: string }) {
  if (module === "inventory") return <InventoryPage />;
  if (module === "analytics") return <AnalyticsPage />;
  if (module === "reports") return <ReportsPage />;
  if (module === "settings") return <SettingsPage />;
  if (module === "tasks") return <TasksPage />;
  if (module === "contacts") return <ContactsPage />;
  if (module === "notifications") return <NotificationsPage />;
  if (module === "knowledge-base") return <KnowledgeBasePage />;
  if (module === "visits") return <VisitsPage />;
  if (module === "campaigns") return <CampaignsPage />;
  if (module === "help") return <SupportPage />;
  const details = getDeveloperModule(module);
  if (!details) return null;

  return (
    <div>
      <h1 className="font-display text-4xl text-[#102039]">{details.title}</h1>
      <DataUnavailable
        title={`${details.title} is not connected`}
        description={details.description}
      />
    </div>
  );
}
