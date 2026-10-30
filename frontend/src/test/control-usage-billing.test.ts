import { describe, expect, it } from "vitest";

import type { UsageBillingData } from "@/command-center/dashboard";

describe("Command Center usage and billing contract", () => {
  it("does not fabricate billing or usage metrics when infrastructure is absent", () => {
    const data: UsageBillingData = {
      status: "unavailable",
      reason:
        "No billing provider, subscription records, invoices, payments, usage metering, or quota source is configured.",
    };

    expect(data.status).toBe("unavailable");
    expect(data).not.toHaveProperty("revenue");
    expect(data).not.toHaveProperty("subscriptions");
    expect(data).not.toHaveProperty("usage");
    expect(data).not.toHaveProperty("invoices");
    expect(data).not.toHaveProperty("payment");
  });
});
