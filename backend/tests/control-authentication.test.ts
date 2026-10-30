import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("../lib/supabase.server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { getControlSessionServer } from "../auth/control-authentication.server";

describe("control session initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports unavailable authorization when the server client cannot initialize", async () => {
    createSupabaseServerClientMock.mockImplementation(() => {
      throw new Error("missing configuration");
    });

    await expect(getControlSessionServer()).resolves.toMatchObject({
      staff: null,
      authenticated: false,
      authorizationStatus: "unavailable",
      authorizationErrorCode: "Error",
    });
  });
});
