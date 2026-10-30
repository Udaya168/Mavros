const moduleDetails: Record<string, { title: string; description: string }> = {
  tasks: {
    title: "Tasks & follow-ups",
    description:
      "Track organization-scoped tasks and due dates. Assignment alerts are in-app only; external reminders are not connected.",
  },
  contacts: {
    title: "Contacts",
    description:
      "Review contact details already stored on organization leads. A separate customer directory is not connected.",
  },
  notifications: {
    title: "Notifications",
    description:
      "View and mark in-app task assignment notifications as read. Email, push, and scheduled reminders are not connected.",
  },
  inventory: {
    title: "Inventory",
    description:
      "Review organization-scoped units, approved pricing, and availability. Owners and admins can add and update units.",
  },
  "knowledge-base": {
    title: "Knowledge base",
    description:
      "Create and manage organization knowledge articles. Document uploads, private storage, and AI retrieval are not connected.",
  },
  "ai-advisor": {
    title: "AI Advisor",
    description:
      "No server-side AI provider, configuration, or approved-knowledge retrieval service is connected.",
  },
  conversations: {
    title: "Conversations",
    description:
      "No organization-scoped conversation history or messaging integration is connected.",
  },
  visits: {
    title: "Site visits",
    description:
      "Schedule project site visits and track their status. Calendar availability and external reminders are not connected.",
  },
  "creative-studio": {
    title: "Creative Studio",
    description:
      "No authenticated Veytrix job service, media storage, or job-status integration is connected.",
  },
  campaigns: {
    title: "Campaigns",
    description:
      "Record campaign plans and planned budgets. Ad delivery, attribution, and actual spend are not connected.",
  },
  analytics: {
    title: "Analytics",
    description:
      "Review live totals for saved projects, inventory units, and leads. Historical trends and campaign attribution are not available.",
  },
  reports: {
    title: "Reports",
    description:
      "Review current organization-scoped project, inventory, and lead counts by status. Historical trends and exports are not available.",
  },
  integrations: {
    title: "Integrations",
    description:
      "No integration-connection registry or server-side credential service exists in the current schema.",
  },
  billing: {
    title: "Billing",
    description: "No organization billing, invoice, or usage-metering service is connected.",
  },
  settings: {
    title: "Settings",
    description:
      "Update your own profile. Organization-level preferences are not part of the current database schema.",
  },
  help: {
    title: "Help & support",
    description:
      "Submit and review organization-scoped support requests. External ticket delivery and response tracking are not connected.",
  },
};

export function getDeveloperModule(module: string) {
  return moduleDetails[module];
}
