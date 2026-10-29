import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("../lib/supabase.server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => new Request("http://localhost:5173/login"),
}));

import {
  exchangePublicAuthCodeServer,
  getOwnProfileServer,
  requestPublicPasswordRecoveryServer,
  signOutPublicUserServer,
  signUpPublicUserServer,
  updateOwnProfileServer,
  updatePublicPasswordServer,
} from "../auth/public-authentication.server";

describe("public profile authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats a missing session as an unauthenticated profile request", async () => {
    const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const getUser = vi.fn();
    createSupabaseServerClientMock.mockReturnValue({ auth: { getSession, getUser } });

    await expect(getOwnProfileServer()).resolves.toEqual({ profile: null, user: null });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("surfaces session restoration failures as a service-unavailable response", async () => {
    const getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: { code: "network_error" },
    });
    createSupabaseServerClientMock.mockReturnValue({ auth: { getSession } });

    await expect(getOwnProfileServer()).rejects.toMatchObject({ status: 503 });
  });

  it("uses the verified callback origin for signup and recovery links", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    });
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    createSupabaseServerClientMock.mockReturnValue({
      auth: { signUp, resetPasswordForEmail },
    });

    await expect(
      signUpPublicUserServer({
        fullName: "Ada Developer",
        email: "ada@example.com",
        password: "a-secure-password",
      }),
    ).resolves.toMatchObject({ success: true, confirmationRequired: true });
    await expect(requestPublicPasswordRecoveryServer({ email: "ada@example.com" })).resolves.toEqual(
      expect.objectContaining({ success: true }),
    );
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: "http://localhost:5173/auth/callback",
        }),
      }),
    );
    expect(resetPasswordForEmail).toHaveBeenCalledWith("ada@example.com", {
      redirectTo: "http://localhost:5173/auth/callback?next=%2Freset-password",
    });
  });

  it("does not claim success when auth operations fail", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "user_already_exists" },
    });
    const signOut = vi.fn().mockResolvedValue({ error: { message: "network failure" } });
    const exchangeCodeForSession = vi
      .fn()
      .mockResolvedValue({ error: { code: "invalid_grant" } });
    createSupabaseServerClientMock.mockReturnValue({
      auth: { signUp, signOut, exchangeCodeForSession },
    });

    await expect(
      signUpPublicUserServer({
        fullName: "Ada Developer",
        email: "ada@example.com",
        password: "a-secure-password",
      }),
    ).resolves.toMatchObject({ success: false });
    await expect(signOutPublicUserServer()).resolves.toEqual({ success: false });
    await expect(exchangePublicAuthCodeServer({ code: "expired-code" })).resolves.toEqual({
      success: false,
    });
  });

  it("requires a verified user for password updates and persists only that user profile", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", email: "ada@example.com", user_metadata: {} } },
      error: null,
    });
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "user-1",
          full_name: "Ada Updated",
          created_at: "2026-01-01",
          updated_at: "2026-01-02",
        },
        error: null,
      }),
    };
    const from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue(profileUpdate) });
    createSupabaseServerClientMock.mockReturnValue({
      auth: { getUser, updateUser },
      from,
    });

    await expect(updatePublicPasswordServer({ password: "a-new-secure-password" })).resolves.toEqual({
      success: true,
    });
    await expect(updatePublicPasswordServer({ password: "another-secure-password" })).resolves.toEqual({
      success: true,
    });
    await expect(updateOwnProfileServer({ fullName: "Ada Updated" })).resolves.toMatchObject({
      success: true,
      profile: { id: "user-1", full_name: "Ada Updated" },
    });
    expect(updateUser).toHaveBeenCalledTimes(2);
    expect(from).toHaveBeenCalledWith("profiles");
    expect(profileUpdate.eq).toHaveBeenCalledWith("id", "user-1");
  });
});
