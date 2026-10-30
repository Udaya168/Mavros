import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailInput = z.object({
  email: z.string().trim().email().max(320),
});

const recoveryCodeInput = z.object({
  code: z.string().min(1).max(4096),
});

const newPasswordInput = z.object({
  password: z.string().min(12).max(128),
});

export const getControlSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getControlSessionServer } = await import("./control-auth.server");
  return getControlSessionServer();
});

export const getControlDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const { getControlDashboardServer } = await import("./control-auth.server");
  return getControlDashboardServer();
});

export const listControlSecurityAudit = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ category: z.enum(["all", "activity", "membership"]).default("all") }).parse(input),
  )
  .handler(async ({ data }) => {
    const { listControlSecurityAuditServer } = await import("./control-auth.server");
    return listControlSecurityAuditServer(data.category);
  });

export const listControlSupportRequests = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        status: z.enum(["all", "open", "in_progress", "resolved", "closed"]).default("all"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { listControlSupportRequestsServer } = await import("./control-auth.server");
    return listControlSupportRequestsServer(data.status);
  });

export const getControlConfiguration = createServerFn({ method: "GET" }).handler(async () => {
  const { getControlConfigurationServer } = await import("./control-auth.server");
  return getControlConfigurationServer();
});

export const getControlBackgroundJobs = createServerFn({ method: "GET" }).handler(async () => {
  const { getControlBackgroundJobsServer } = await import("./control-auth.server");
  return getControlBackgroundJobsServer();
});

export const getControlUsageBilling = createServerFn({ method: "GET" }).handler(async () => {
  const { getControlUsageBillingServer } = await import("./control-auth.server");
  return getControlUsageBillingServer();
});

export const signOutControlStaff = createServerFn({ method: "POST" }).handler(async () => {
  const { signOutControlStaffServer } = await import("./control-auth.server");
  return signOutControlStaffServer();
});

export const requestControlPasswordRecovery = createServerFn({ method: "POST" })
  .validator((input: unknown) => emailInput.parse(input))
  .handler(async ({ data }) => {
    const { requestControlPasswordRecoveryServer } = await import("./control-auth.server");
    return requestControlPasswordRecoveryServer(data);
  });

export const exchangeControlRecoveryCode = createServerFn({ method: "POST" })
  .validator((input: unknown) => recoveryCodeInput.parse(input))
  .handler(async ({ data }) => {
    const { exchangeControlRecoveryCodeServer } = await import("./control-auth.server");
    return exchangeControlRecoveryCodeServer(data);
  });

export const hasControlRecoverySession = createServerFn({ method: "GET" }).handler(async () => {
  const { hasControlRecoverySessionServer } = await import("./control-auth.server");
  return hasControlRecoverySessionServer();
});

export const updateControlPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => newPasswordInput.parse(input))
  .handler(async ({ data }) => {
    const { updateControlPasswordServer } = await import("./control-auth.server");
    return updateControlPasswordServer(data);
  });
