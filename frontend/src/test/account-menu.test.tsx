import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountMenu } from "@/components/public-app/account-menu";
import { signOutPublicUser } from "@/lib/public-auth";

vi.mock("@/lib/public-auth", () => ({
  getPublicUserSession: vi.fn(),
  signOutPublicUser: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  const React = await import("react");
  return {
    ...actual,
    Link: ({ to, ...props }: { to: string } & Record<string, unknown>) =>
      React.createElement("a", { ...props, href: to }),
  };
});

function renderAccountMenu(session: Parameters<typeof AccountMenu>[0]["session"]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountMenu session={session} />
    </QueryClientProvider>,
  );
}

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.mocked(signOutPublicUser).mockReset();
  });

  it("shows the existing Login action when signed out", () => {
    renderAccountMenu({
      user: null,
      role: null,
      authorizationStatus: "unauthenticated",
    });

    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });

  it("shows the authenticated name and the Profile and Sign Out actions", () => {
    renderAccountMenu({
      user: {
        id: "user-123",
        email: "person@example.com",
        displayName: "Ada Lovelace",
      },
      role: "user",
      authorizationStatus: "normal-user",
    });

    fireEvent.keyDown(screen.getByRole("button", { name: "Ada Lovelace" }), {
      key: "ArrowDown",
    });

    expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("menuitem", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("keeps the account visible and reports an unsuccessful sign-out", async () => {
    vi.mocked(signOutPublicUser).mockResolvedValue({ success: false });
    renderAccountMenu({
      user: {
        id: "user-123",
        email: "person@example.com",
        displayName: "Ada Lovelace",
      },
      role: "user",
      authorizationStatus: "normal-user",
    });

    fireEvent.keyDown(screen.getByRole("button", { name: "Ada Lovelace" }), {
      key: "ArrowDown",
    });
    const signOutItem = screen.getByRole("menuitem", { name: "Sign Out" });
    signOutItem.focus();
    fireEvent.keyDown(signOutItem, { key: "Enter", code: "Enter" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not sign you out. Please try again.",
    );
    expect(screen.getByRole("menuitem", { name: "Profile" })).toBeInTheDocument();
  });
});
