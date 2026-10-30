import { describe, expect, it } from "vitest";

import type { ConfigurationData } from "@/command-center/dashboard";

describe("Command Center configuration contract", () => {
  it("models safe read-only settings and redacts secret values", () => {
    const data: ConfigurationData = {
      status: "available",
      settings: [
        {
          key: "publishable_key",
          name: "Supabase publishable credential",
          description: "Browser-safe credential.",
          source: "VITE_SUPABASE_PUBLISHABLE_KEY",
          state: "configured",
          readOnly: true,
          secret: true,
        },
      ],
    };

    const setting = data.settings[0]!;
    expect(setting.readOnly).toBe(true);
    expect(setting.secret).toBe(true);
    expect(setting).not.toHaveProperty("value");
    expect(setting).not.toHaveProperty("credential");
    expect(setting).not.toHaveProperty("token");
  });

  it("represents unavailable configuration explicitly", () => {
    const data: ConfigurationData = {
      status: "unavailable",
      errorCode: "configuration_unavailable",
    };

    expect(data.status).toBe("unavailable");
  });
});
