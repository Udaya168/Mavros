import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const email = z.string().trim().email().max(320);
const password = z.string().min(1).max(128);
const strongPassword = z.string().min(12).max(128);
const name = z.string().trim().min(1).max(120);

export const getPublicUserSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicUserSessionServer } = await import("./public-auth.server");
  return getPublicUserSessionServer();
});

export const signInPublicUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ email, password }).parse(input))
  .handler(async ({ data }) => {
    const { signInPublicUserServer } = await import("./public-auth.server");
    return signInPublicUserServer(data);
  });

export const signUpPublicUser = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ fullName: name, email, password: strongPassword }).parse(input),
  )
  .handler(async ({ data }) => {
    const { signUpPublicUserServer } = await import("./public-auth.server");
    return signUpPublicUserServer(data);
  });

export const signOutPublicUser = createServerFn({ method: "POST" }).handler(async () => {
  const { signOutPublicUserServer } = await import("./public-auth.server");
  return signOutPublicUserServer();
});

export const requestPublicPasswordRecovery = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ email }).parse(input))
  .handler(async ({ data }) => {
    const { requestPublicPasswordRecoveryServer } = await import("./public-auth.server");
    return requestPublicPasswordRecoveryServer(data);
  });

export const exchangePublicAuthCode = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ code: z.string().min(1).max(4096) }).parse(input))
  .handler(async ({ data }) => {
    const { exchangePublicAuthCodeServer } = await import("./public-auth.server");
    return exchangePublicAuthCodeServer(data);
  });

export const hasPublicRecoverySession = createServerFn({ method: "GET" }).handler(async () => {
  const { hasPublicRecoverySessionServer } = await import("./public-auth.server");
  return hasPublicRecoverySessionServer();
});

export const updatePublicPassword = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ password: strongPassword }).parse(input))
  .handler(async ({ data }) => {
    const { updatePublicPasswordServer } = await import("./public-auth.server");
    return updatePublicPasswordServer(data);
  });

export const getOwnProfile = createServerFn({ method: "GET" }).handler(async () => {
  const { getOwnProfileServer } = await import("./public-auth.server");
  return getOwnProfileServer();
});

export const updateOwnProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ fullName: name }).parse(input))
  .handler(async ({ data }) => {
    const { updateOwnProfileServer } = await import("./public-auth.server");
    return updateOwnProfileServer(data);
  });
