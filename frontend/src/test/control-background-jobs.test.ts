import { describe, expect, it } from "vitest";

import type { BackgroundJobsData } from "@/command-center/dashboard";

describe("Command Center background jobs contract", () => {
  it("does not fabricate job records when infrastructure is absent", () => {
    const data: BackgroundJobsData = {
      status: "unavailable",
      reason: "No persistent job queue, scheduler, or worker-status source is configured.",
    };

    expect(data.status).toBe("unavailable");
    expect(data).not.toHaveProperty("jobs");
    expect(data).not.toHaveProperty("count");
    expect(data).not.toHaveProperty("workerStatus");
  });
});
