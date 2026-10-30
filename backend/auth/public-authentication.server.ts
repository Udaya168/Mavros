import { getRequest } from "@tanstack/react-start/server";

import { getMavrosUserAccessServer, signInMavrosUserServer } from "./control-authentication.server";
import { createSupabaseServerClient } from "../lib/supabase.server";

function getAppOrigin() {
  const configuredUrl = import.meta.env["VITE_APP_URL"];
  return configuredUrl ? new URL(configuredUrl).origin : new URL(getRequest().url).origin;
}

export async function getPublicUserSessionServer() {
  return getMavrosUserAccessServer();
}

export async function signInPublicUserServer(data: { email: string; password: string }) {
  return signInMavrosUserServer(data);
}

export async function signUpPublicUserServer(data: {
  fullName: string;
  email: string;
  password: string;
}) {
  const supabase = createSupabaseServerClient();
  const emailRedirectTo = new URL("/auth/callback", getAppOrigin()).toString();
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { full_name: data.fullName },
      emailRedirectTo,
    },
  });

  if (error || !authData.user) {
    return {
      success: false,
      message: "We could not create your account. Check your details and try again.",
    };
  }

  return {
    success: true,
    confirmationRequired: !authData.session,
    message: authData.session
      ? "Your account is ready. You can now sign in."
      : "If this address can be registered, check your inbox for a verification link.",
  };
}

export async function signOutPublicUserServer() {
  const { error } = await createSupabaseServerClient().auth.signOut({ scope: "local" });
  if (error) {
    console.error("Supabase user sign-out failed:", error.message);
    return { success: false };
  }
  return { success: true };
}

export async function requestPublicPasswordRecoveryServer(data: { email: string }) {
  const redirectTo = new URL("/auth/callback?next=%2Freset-password", getAppOrigin()).toString();
  const { error } = await createSupabaseServerClient().auth.resetPasswordForEmail(data.email, {
    redirectTo,
  });

  if (error) {
    console.error("Supabase public password recovery failed:", error.message);
    return {
      success: false,
      message: "We could not process your request. Please try again later.",
    };
  }

  return {
    success: true,
    message: "If this email is eligible, a password reset link will be sent.",
  };
}

export async function exchangePublicAuthCodeServer(data: { code: string }) {
  const { error } = await createSupabaseServerClient().auth.exchangeCodeForSession(data.code);
  if (error) {
    console.error("Supabase auth callback code exchange failed:", error.message);
    return { success: false };
  }
  return { success: true };
}

export async function hasPublicRecoverySessionServer() {
  const { data, error } = await createSupabaseServerClient().auth.getUser();
  return { success: !error && Boolean(data.user) };
}

export async function updatePublicPasswordServer(data: { password: string }) {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { success: false, message: "This reset link is invalid or expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) {
    console.error("Supabase user password update failed:", error.message);
    return { success: false, message: "Your password could not be updated. Please try again." };
  }
  return { success: true };
}

export async function getOwnProfileServer() {
  const supabase = createSupabaseServerClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("[public-auth]", {
      stage: "profile-session-restoration",
      code: sessionError.code ?? "unknown",
    });
    throw new Response("Your account session could not be verified.", { status: 503 });
  }
  if (!sessionData.session) return { profile: null, user: null };

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[public-auth]", { stage: "profile-user-verification", code: authError.code });
    throw new Response("Your account could not be verified.", { status: 503 });
  }
  if (!authData.user) return { profile: null, user: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, created_at, updated_at")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (error) {
    console.error("Supabase own-profile lookup failed:", error.message);
    throw new Response("Your profile could not be loaded.", { status: 500 });
  }
  const metadataName =
    typeof authData.user.user_metadata?.["full_name"] === "string"
      ? authData.user.user_metadata["full_name"].trim()
      : "";
  return {
    profile: data,
    user: {
      id: authData.user.id,
      email: authData.user.email ?? null,
      displayName:
        data?.full_name?.trim() ||
        metadataName ||
        authData.user.email?.split("@")[0]?.trim() ||
        "My Account",
    },
  };
}

export async function updateOwnProfileServer(data: { fullName: string }) {
  const supabase = createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { success: false, message: "Sign in to update your profile." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ full_name: data.fullName })
    .eq("id", authData.user.id)
    .select("id, full_name, created_at, updated_at")
    .maybeSingle();

  if (error || !profile) {
    if (error) console.error("Supabase profile update failed:", error.message);
    return { success: false, message: "Your profile could not be updated. Please try again." };
  }
  return { success: true, profile };
}
