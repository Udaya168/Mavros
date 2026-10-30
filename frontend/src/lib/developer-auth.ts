import { createServerFn } from "@tanstack/react-start";

export const getDeveloperSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getDeveloperSessionServer } = await import("./developer-auth.server");
  return getDeveloperSessionServer();
});
