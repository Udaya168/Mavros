import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ControlCenterDashboard, type ControlDashboardData } from "@/command-center/dashboard";

const { listControlSecurityAuditMock, listControlSupportRequestsMock } = vi.hoisted(() => ({
  listControlSecurityAuditMock: vi.fn(),
  listControlSupportRequestsMock: vi.fn(),
}));

vi.mock("@/components/back-button", () => ({
  BackButton: () => <button type="button">Back</button>,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="/app">{children}</a>,
}));

vi.mock("@/lib/control-auth", () => ({
  listControlSecurityAudit: listControlSecurityAuditMock,
  listControlSupportRequests: listControlSupportRequestsMock,
}));

const baseDashboard: ControlDashboardData = {
  staff: { role: "owner", displayName: "Admin", email: "admin@mavros.com" },
  metrics: {
    status: "available",
    organizationCount: 2,
    activeMembershipCount: 4,
    projectCount: 5,
    publishedProjectCount: 3,
    inventoryUnitCount: 20,
    availableInventoryUnitCount: 12,
    leadCount: 7,
  },
  securityAudit: {
    status: "available",
    events: [
      {
        eventId: "audit-event",
        category: "activity",
        organizationName: "Mavros",
        actorName: "Authenticated user",
        entityType: "project",
        action: "insert",
        details: "Insert project",
        occurredAt: "2026-10-26T00:00:00Z",
      },
    ],
  },
  supportRequests: {
    status: "available",
    requests: [],
  },
  configuration: {
    status: "available",
    settings: [
      {
        key: "supabase_url",
        name: "Supabase project URL",
        description: "Server-side authentication and database connection.",
        source: "VITE_SUPABASE_URL",
        state: "configured",
        readOnly: true,
        secret: false,
      },
      {
        key: "feature_flags",
        name: "Feature flags",
        description: "No database-backed or remote feature-flag service is configured.",
        source: "No backing service",
        state: "not_configured",
        readOnly: true,
        secret: false,
      },
      {
        key: "publishable_key",
        name: "Supabase publishable credential",
        description: "Browser-safe publishable credential.",
        source: "VITE_SUPABASE_PUBLISHABLE_KEY",
        state: "configured",
        readOnly: true,
        secret: true,
      },
    ],
  },
  backgroundJobs: {
    status: "unavailable",
    reason: "No persistent job queue, scheduler, or worker-status source is configured.",
  },
  usageBilling: {
    status: "unavailable",
    reason:
      "No billing provider, subscription records, invoices, payments, usage metering, or quota source is configured.",
  },
};

describe("Command Center organization metrics", () => {
  it("renders all seven aggregate metrics", () => {
    render(
      <ControlCenterDashboard dashboard={baseDashboard} onSignOut={vi.fn()} signOutError="" />,
    );

    expect(screen.getByRole("heading", { name: "Organizations & projects" })).toBeInTheDocument();
    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("Active memberships")).toBeInTheDocument();
    expect(screen.getByText("Published projects")).toBeInTheDocument();
    expect(screen.getByText("Available units")).toBeInTheDocument();
    expect(screen.getByText("Leads")).toBeInTheDocument();
    expect(screen.getAllByText("Connected")).not.toHaveLength(0);
  });

  it("renders an explicit unavailable state without fabricated metrics", () => {
    render(
      <ControlCenterDashboard
        dashboard={{
          ...baseDashboard,
          metrics: { status: "unavailable", errorCode: "42501" },
        }}
        onSignOut={vi.fn()}
        signOutError=""
      />,
    );

    expect(screen.getByText(/metrics are temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/42501/)).toBeInTheDocument();
    expect(screen.queryByText("Organizations", { selector: "p" })).not.toBeInTheDocument();
  });

  it("renders audit events with safe actor labels and timestamps", () => {
    render(
      <ControlCenterDashboard dashboard={baseDashboard} onSignOut={vi.fn()} signOutError="" />,
    );

    expect(screen.getByText("Insert project")).toBeInTheDocument();
    expect(screen.getByText(/Authenticated user/)).toBeInTheDocument();
    expect(
      screen.getByText("Mavros · activity · project · Authenticated user"),
    ).toBeInTheDocument();
  });

  it("renders an empty audit state", () => {
    render(
      <ControlCenterDashboard
        dashboard={{ ...baseDashboard, securityAudit: { status: "available", events: [] } }}
        onSignOut={vi.fn()}
        signOutError=""
      />,
    );

    expect(screen.getByText("No recorded events match this filter.")).toBeInTheDocument();
  });

  it("requests and renders a filtered audit category", async () => {
    listControlSecurityAuditMock.mockResolvedValue({
      status: "available",
      events: [],
    });
    render(
      <ControlCenterDashboard dashboard={baseDashboard} onSignOut={vi.fn()} signOutError="" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Membership security" }));

    await waitFor(() => {
      expect(listControlSecurityAuditMock).toHaveBeenCalledWith({
        data: { category: "membership" },
      });
    });
    expect(screen.getByText("No recorded events match this filter.")).toBeInTheDocument();
  });

  it("renders support requests and applies status filters", async () => {
    listControlSecurityAuditMock.mockResolvedValue({
      status: "available",
      events: [],
    });
    const supportRequest = {
      requestId: "support-request",
      organizationName: "Mavros",
      subject: "Unable to publish listing",
      summary: "The listing remains in draft after publishing.",
      status: "open" as const,
      requesterName: "Authenticated user",
      createdAt: "2026-10-26T00:00:00Z",
      updatedAt: "2026-10-26T01:00:00Z",
    };
    listControlSupportRequestsMock.mockResolvedValue({
      status: "available",
      requests: [supportRequest],
    });

    render(
      <ControlCenterDashboard
        dashboard={{
          ...baseDashboard,
          supportRequests: { status: "available", requests: [supportRequest] },
        }}
        onSignOut={vi.fn()}
        signOutError=""
      />,
    );

    expect(screen.getByText("Unable to publish listing")).toBeInTheDocument();
    expect(screen.getByText(/The listing remains in draft/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "resolved" }));
    await waitFor(() => {
      expect(listControlSupportRequestsMock).toHaveBeenCalledWith({
        data: { status: "resolved" },
      });
    });
  });

  it("renders safe configuration status without exposing values", () => {
    render(
      <ControlCenterDashboard dashboard={baseDashboard} onSignOut={vi.fn()} signOutError="" />,
    );

    expect(screen.getByRole("heading", { name: "Features & configuration" })).toBeInTheDocument();
    expect(screen.getByText("Supabase project URL")).toBeInTheDocument();
    expect(screen.getByText("Feature flags")).toBeInTheDocument();
    expect(screen.getByText(/Value redacted/)).toBeInTheDocument();
  });

  it("renders configuration unavailable state", () => {
    render(
      <ControlCenterDashboard
        dashboard={{
          ...baseDashboard,
          configuration: { status: "unavailable", errorCode: "configuration_unavailable" },
        }}
        onSignOut={vi.fn()}
        signOutError=""
      />,
    );

    expect(screen.getByText(/Configuration status is temporarily unavailable/)).toBeInTheDocument();
  });

  it("renders the honest background-jobs unavailable state", () => {
    render(
      <ControlCenterDashboard dashboard={baseDashboard} onSignOut={vi.fn()} signOutError="" />,
    );

    expect(screen.getByRole("heading", { name: "Background jobs" })).toBeInTheDocument();
    expect(
      screen.getByText(/No persistent job queue, scheduler, or worker-status source is configured/),
    ).toBeInTheDocument();
    expect(screen.queryByText("0 jobs")).not.toBeInTheDocument();
  });

  it("renders the honest usage and billing unavailable state", () => {
    render(
      <ControlCenterDashboard dashboard={baseDashboard} onSignOut={vi.fn()} signOutError="" />,
    );

    expect(screen.getByRole("heading", { name: "Usage & billing" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /No billing provider, subscription records, invoices, payments, usage metering, or quota source is configured/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\$0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 subscriptions/i)).not.toBeInTheDocument();
  });
});
