import { getRequest } from "@tanstack/react-start/server";

import {
  getPostLoginDestination,
  INITIAL_MAVROS_OWNER_ID,
  isAuthorizedMavrosOwner,
} from "./control-auth-core";
import {
  INITIAL_MAVROS_DEVELOPER_ID,
  INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID,
} from "./developer-auth-core";
import { getDeveloperMemberships } from "./developer-authentication.server";
import { createSupabaseServerClient } from "../lib/supabase.server";

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

function logAuthFailure(stage: string, code?: string) {
  console.error("[control-auth]", { stage, code: code ?? "unknown" });
}

function logAuthDenial(stage: string, code: string) {
  console.warn("[control-auth]", { stage, code });
}

function diagnosticCode(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const value = "code" in error ? error.code : "name" in error ? error.name : undefined;
    if (typeof value === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(value)) return value;
  }
  return "unexpected_error";
}

async function getActiveStaffRole(supabase: SupabaseServerClient, userId: string) {
  let data;
  let error;
  try {
    ({ data, error } = await supabase
      .from("mavros_staff_memberships")
      .select("user_id, role, is_active")
      .eq("user_id", userId)
      .maybeSingle());
  } catch (cause) {
    const code = diagnosticCode(cause);
    logAuthFailure("membership-lookup", code);
    return { role: null, status: "unavailable", errorCode: code } as const;
  }

  if (error) {
    logAuthFailure("membership-lookup", error.code);
    return { role: null, status: "unavailable", errorCode: error.code ?? "unknown" } as const;
  }

  if (userId !== INITIAL_MAVROS_OWNER_ID) {
    return { role: null, status: "normal-user" } as const;
  }
  if (!data) {
    logAuthDenial("membership-lookup", "owner_membership_missing");
    return { role: null, status: "missing" as const };
  }
  if (!data.is_active) {
    logAuthDenial("membership-authorization", "owner_membership_inactive");
    return { role: null, status: "inactive" as const };
  }
  if (!isAuthorizedMavrosOwner(userId, data)) {
    logAuthDenial("membership-authorization", "owner_role_mismatch");
    return { role: null, status: "not-owner" as const };
  }

  return { role: data.role, status: "authorized" as const };
}

async function getAuthenticatedStaff(supabase: SupabaseServerClient, expectedUserId?: string) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    logAuthFailure("session-restoration", sessionError.code);
    return { staff: null, authenticated: false, authorizationStatus: "session-error" as const };
  }
  if (!sessionData.session) {
    return { staff: null, authenticated: false, authorizationStatus: "unauthenticated" as const };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    logAuthFailure("user-verification", error.code);
    return {
      staff: null,
      authenticated: false,
      authorizationStatus: "user-verification-error" as const,
    };
  }
  if (!data.user) {
    return { staff: null, authenticated: false, authorizationStatus: "unauthenticated" as const };
  }
  if (expectedUserId && data.user.id !== expectedUserId) {
    logAuthFailure("session-user-mismatch", "user_id_mismatch");
    return { staff: null, authenticated: false, authorizationStatus: "user-mismatch" as const };
  }

  const membership = await getActiveStaffRole(supabase, data.user.id);
  if (membership.status !== "authorized") {
    const authorizationErrorCode =
      "errorCode" in membership ? membership.errorCode : undefined;
    return {
      staff: null,
      authenticated: true,
      authorizationStatus: membership.status,
      ...(authorizationErrorCode ? { authorizationErrorCode } : {}),
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        metadataName:
          typeof data.user.user_metadata?.["full_name"] === "string"
            ? data.user.user_metadata["full_name"]
            : null,
      },
    };
  }

  return {
    staff: {
      role: membership.role,
      displayName: "Admin",
      email: data.user.email ?? null,
    },
    authenticated: true,
    authorizationStatus: "authorized" as const,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
      metadataName:
        typeof data.user.user_metadata?.["full_name"] === "string"
          ? data.user.user_metadata["full_name"]
          : null,
    },
  };
}

async function signOutLocally(supabase: SupabaseServerClient) {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    logAuthFailure("local-sign-out", error.code);
    return false;
  }
  return true;
}

export async function getControlSessionServer() {
  try {
    return await getAuthenticatedStaff(createSupabaseServerClient());
  } catch (cause) {
    const code = diagnosticCode(cause);
    logAuthFailure("control-session", code);
    return {
      staff: null,
      authenticated: false as const,
      authorizationStatus: "unavailable" as const,
      authorizationErrorCode: code,
    };
  }
}

export async function getMavrosUserAccessServer() {
  let session: Awaited<ReturnType<typeof getAuthenticatedStaff>>;
  let supabase: SupabaseServerClient;
  try {
    supabase = createSupabaseServerClient();
    session = await getAuthenticatedStaff(supabase);
  } catch (cause) {
    const code = diagnosticCode(cause);
    logAuthFailure("account-access-check", code);
    return {
      user: null,
      role: null,
      authorizationStatus: "unavailable" as const,
      authorizationErrorCode: code,
    };
  }
  if (!session.authenticated || !session.user) {
    if (session.authorizationStatus !== "unauthenticated") {
      return {
        user: null,
        role: null,
        authorizationStatus: "unavailable" as const,
        authorizationErrorCode: session.authorizationStatus,
      };
    }
    return { user: null, role: null, authorizationStatus: session.authorizationStatus };
  }

  let profileName: string | null = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) {
      logAuthFailure("navbar-profile-lookup", error.code);
    } else {
      profileName = data?.full_name?.trim() || null;
    }
  } catch (cause) {
    logAuthFailure("navbar-profile-lookup", diagnosticCode(cause));
  }
  const { metadataName, ...verifiedUser } = session.user;
  const user = {
    ...verifiedUser,
    displayName:
      profileName ||
      metadataName?.trim() ||
      session.user.email?.split("@")[0]?.trim() ||
      "My Account",
  };

  if (session.staff) {
    return {
      user,
      role: "owner" as const,
      authorizationStatus: "authorized" as const,
    };
  }
  if (session.authorizationStatus === "unavailable") {
    return {
      user,
      role: null,
      authorizationStatus: "unavailable" as const,
      authorizationErrorCode: session.authorizationErrorCode,
    };
  }
  if (session.authorizationStatus === "missing") {
    return {
      user,
      role: null,
      authorizationStatus: "missing-owner" as const,
    };
  }
  if (session.authorizationStatus === "inactive") {
    return {
      user,
      role: null,
      authorizationStatus: "inactive-owner" as const,
    };
  }
  if (session.authorizationStatus === "not-owner") {
    return {
      user,
      role: null,
      authorizationStatus: "invalid-owner-role" as const,
    };
  }
  if (session.authorizationStatus === "normal-user") {
    const developerAccess = await getDeveloperMemberships(supabase, session.user.id);
    if (developerAccess.status === "unavailable") {
      return {
        user,
        role: null,
        authorizationStatus: "unavailable" as const,
        authorizationErrorCode: developerAccess.errorCode,
      };
    }
    if (developerAccess.status === "invalid") {
      return {
        user,
        role: null,
        authorizationStatus: "invalid-developer-membership" as const,
      };
    }
    if (developerAccess.status === "inactive") {
      return {
        user,
        role: null,
        authorizationStatus: "inactive-developer-membership" as const,
      };
    }
    if (developerAccess.status === "authorized") {
      return {
        user,
        role: "developer" as const,
        authorizationStatus: "developer-authorized" as const,
        developerMemberships: developerAccess.memberships,
      };
    }
    if (session.user.id === INITIAL_MAVROS_DEVELOPER_ID) {
      return {
        user,
        role: null,
        authorizationStatus: "missing-developer-membership" as const,
      };
    }
  }
  return {
    user,
    role: "user" as const,
    authorizationStatus: "normal-user" as const,
  };
}

export async function getControlDashboardServer() {
  const supabase = createSupabaseServerClient();
  const { staff } = await getAuthenticatedStaff(supabase);
  if (!staff) {
    throw new Response("Control Center access denied.", { status: 403 });
  }

  const { data, error } = await supabase.rpc("get_mavros_command_center_metrics");
  if (error) {
    logAuthFailure("command-center-metrics", error.code);
    return {
      staff,
      metrics: {
        status: "unavailable" as const,
        errorCode: error.code ?? "unknown",
      },
    };
  }

  const metrics = Array.isArray(data) ? data[0] : data;
  if (!metrics) {
    logAuthFailure("command-center-metrics", "empty_result");
    return {
      staff,
      metrics: {
        status: "unavailable" as const,
        errorCode: "empty_result",
      },
    };
  }

  return {
    staff,
    metrics: {
      status: "available" as const,
      organizationCount: Number(metrics.organization_count),
      activeMembershipCount: Number(metrics.active_membership_count),
      projectCount: Number(metrics.project_count),
      publishedProjectCount: Number(metrics.published_project_count),
      inventoryUnitCount: Number(metrics.inventory_unit_count),
      availableInventoryUnitCount: Number(metrics.available_inventory_unit_count),
      leadCount: Number(metrics.lead_count),
    },
  };
}

export async function listControlSecurityAuditServer(
  category: "all" | "activity" | "membership" = "all",
) {
  const supabase = createSupabaseServerClient();
  const { staff } = await getAuthenticatedStaff(supabase);
  if (!staff) {
    throw new Response("Control Center access denied.", { status: 403 });
  }

  const { data, error } = await supabase.rpc("list_mavros_command_center_security_audit", {
    p_category: category === "all" ? null : category,
    p_limit: 100,
  });
  if (error) {
    logAuthFailure("command-center-security-audit", error.code);
    return {
      status: "unavailable" as const,
      errorCode: error.code ?? "unknown",
    };
  }

  return {
    status: "available" as const,
    events: Array.isArray(data)
      ? data.map((event) => ({
          eventId: event.event_id,
          category: event.category,
          organizationName: event.organization_name,
          actorName: event.actor_name,
          entityType: event.entity_type,
          action: event.action,
          details: event.details,
          occurredAt: event.occurred_at,
        }))
      : [],
  };
}

export async function listControlSupportRequestsServer(
  status: "all" | "open" | "in_progress" | "resolved" | "closed" = "all",
) {
  const supabase = createSupabaseServerClient();
  const { staff } = await getAuthenticatedStaff(supabase);
  if (!staff) {
    throw new Response("Control Center access denied.", { status: 403 });
  }

  const { data, error } = await supabase.rpc("list_mavros_command_center_support_requests", {
    p_status: status === "all" ? null : status,
    p_limit: 100,
  });
  if (error) {
    logAuthFailure("command-center-support-requests", error.code);
    return {
      status: "unavailable" as const,
      errorCode: error.code ?? "unknown",
    };
  }

  return {
    status: "available" as const,
    requests: Array.isArray(data)
      ? data.map((request) => ({
          requestId: request.request_id,
          organizationName: request.organization_name,
          subject: request.subject,
          summary: request.summary,
          status: request.status,
          requesterName: request.requester_name,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
        }))
      : [],
  };
}

export async function getControlConfigurationServer() {
  const supabase = createSupabaseServerClient();
  const { staff } = await getAuthenticatedStaff(supabase);
  if (!staff) {
    throw new Response("Control Center access denied.", { status: 403 });
  }

  return {
    status: "available" as const,
    settings: [
      {
        key: "supabase_url",
        name: "Supabase project URL",
        description: "Server-side authentication and database connection.",
        source: "VITE_SUPABASE_URL",
        state: import.meta.env["VITE_SUPABASE_URL"]
          ? ("configured" as const)
          : ("not_configured" as const),
        readOnly: true,
        secret: false,
      },
      {
        key: "supabase_publishable_key",
        name: "Supabase publishable credential",
        description: "Browser-safe publishable credential used by the cookie-backed server client.",
        source: "VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY",
        state:
          import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          import.meta.env["VITE_SUPABASE_ANON_KEY"]
            ? ("configured" as const)
            : ("not_configured" as const),
        readOnly: true,
        secret: true,
      },
      {
        key: "canonical_app_url",
        name: "Canonical application URL",
        description: "Optional origin used for password-recovery redirects.",
        source: "VITE_APP_URL",
        state: import.meta.env["VITE_APP_URL"]
          ? ("configured" as const)
          : ("not_configured" as const),
        readOnly: true,
        secret: false,
      },
      {
        key: "feature_flags",
        name: "Feature flags",
        description: "No database-backed or remote feature-flag service is configured.",
        source: "No backing service",
        state: "not_configured" as const,
        readOnly: true,
        secret: false,
      },
    ],
  };
}

export async function getControlBackgroundJobsServer() {
  const supabase = createSupabaseServerClient();
  const { staff } = await getAuthenticatedStaff(supabase);
  if (!staff) {
    throw new Response("Control Center access denied.", { status: 403 });
  }

  return {
    status: "unavailable" as const,
    reason: "No persistent job queue, scheduler, or worker-status source is configured.",
  };
}

export async function getControlUsageBillingServer() {
  const supabase = createSupabaseServerClient();
  const { staff } = await getAuthenticatedStaff(supabase);
  if (!staff) {
    throw new Response("Control Center access denied.", { status: 403 });
  }

  return {
    status: "unavailable" as const,
    reason:
      "No billing provider, subscription records, invoices, payments, usage metering, or quota source is configured.",
  };
}

export async function signInMavrosUserServer(data: { email: string; password: string }) {
  let supabase: SupabaseServerClient;
  try {
    supabase = createSupabaseServerClient();
  } catch (cause) {
    const code = diagnosticCode(cause);
    logAuthFailure("supabase-client-initialization", code);
    return {
      success: false,
      reason: "configuration" as const,
      message: "Supabase authentication is not configured correctly on the server.",
    };
  }

  let authData;
  let error;
  try {
    ({ data: authData, error } = await supabase.auth.signInWithPassword(data));
  } catch (cause) {
    logAuthFailure("password-sign-in-request", diagnosticCode(cause));
    return {
      success: false,
      reason: "auth-unavailable" as const,
      message: "Supabase sign-in could not be reached. Check the server connection and try again.",
    };
  }
  if (error) {
    logAuthFailure("password-sign-in", error.code);
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email address before signing in."
        : error.code === "invalid_credentials"
          ? "The email or password is incorrect."
          : "Supabase could not sign you in. Check the credentials and try again.";
    return { success: false, reason: "credentials" as const, message };
  }

  if (!authData.user || !authData.session || authData.user.id !== authData.session.user.id) {
    logAuthFailure("password-sign-in-session", "missing_or_mismatched_session");
    await signOutLocally(supabase);
    return {
      success: false,
      reason: "session-unavailable" as const,
      message: "Supabase did not return a verified session for this sign-in.",
    };
  }

  const userId = authData.session.user.id;
  let access: Awaited<ReturnType<typeof getAuthenticatedStaff>>;
  try {
    access = await getAuthenticatedStaff(supabase, userId);
  } catch (cause) {
    logAuthFailure("post-sign-in-authorization", diagnosticCode(cause));
    await signOutLocally(supabase);
    return {
      success: false,
      reason: "authorization-unavailable" as const,
      message:
        "Your credentials were accepted, but account authorization could not be checked. Please try again.",
    };
  }
  if (!access.authenticated || !access.user) {
    await signOutLocally(supabase);
    return {
      success: false,
      reason: "session-unavailable" as const,
      message: "Supabase could not restore and verify the sign-in session. Please try again.",
    };
  }
  if (access.authorizationStatus === "unavailable") {
    await signOutLocally(supabase);
    const detail =
      access.authorizationErrorCode === "42501"
        ? "Supabase RLS denied membership access."
        : access.authorizationErrorCode === "PGRST205" || access.authorizationErrorCode === "42P01"
          ? "The membership table is missing from the API schema cache."
          : "Check the membership table, API schema, and own-row RLS policy.";
    return {
      success: false,
      reason: "authorization-unavailable" as const,
      message: `Your credentials were accepted, but owner authorization could not be checked. ${detail}`,
    };
  }
  if (userId === INITIAL_MAVROS_OWNER_ID && !access.staff) {
    await signOutLocally(supabase);
    const message =
      access.authorizationStatus === "missing"
        ? "This account has no owner membership. Verify its UUID and apply the existing initial-owner provisioning step if the membership is absent."
        : access.authorizationStatus === "inactive"
          ? "This account's owner membership is inactive. Review its existing membership record in Supabase."
          : "This account is not authorized with an active owner role.";
    return { success: false, reason: "not-authorized" as const, message };
  }
  let developerRole: "developer" | null = null;
  if (!access.staff && access.authorizationStatus === "normal-user") {
    const developerAccess = await getDeveloperMemberships(supabase, userId);
    if (developerAccess.status === "unavailable") {
      await signOutLocally(supabase);
      const detail =
        developerAccess.errorCode === "42501"
          ? "Supabase RLS denied organization membership access."
          : developerAccess.errorCode === "PGRST205" || developerAccess.errorCode === "42P01"
            ? "The developer organization membership migration is not available in the database API."
            : "Check the organization membership tables, API schema, and own-row RLS policy.";
      return {
        success: false,
        reason: "authorization-unavailable" as const,
        message: `Your credentials were accepted, but developer and public account authorization could not be checked. ${detail}`,
      };
    }
    if (developerAccess.status === "invalid") {
      await signOutLocally(supabase);
      return {
        success: false,
        reason: "not-authorized" as const,
        message:
          "This account has an invalid developer organization membership. Contact the organization owner.",
      };
    }
    if (developerAccess.status === "inactive") {
      await signOutLocally(supabase);
      return {
        success: false,
        reason: "not-authorized" as const,
        message:
          "This account's developer organization membership is inactive. Contact the organization owner.",
      };
    }
    if (developerAccess.status === "authorized") {
      developerRole = "developer";
    } else if (userId === INITIAL_MAVROS_DEVELOPER_ID) {
      await signOutLocally(supabase);
      return {
        success: false,
        reason: "not-authorized" as const,
        message: `No active membership was found for Auth user ${INITIAL_MAVROS_DEVELOPER_ID} in organization ${INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID}. Apply the organization-membership migration, verify the organization row, then add an active membership for this user with a permitted role.`,
      };
    }
  }

  const role = access.staff ? "owner" : developerRole ? "developer" : "user";
  return { success: true, destination: getPostLoginDestination(role), userId };
}

export async function signOutControlStaffServer() {
  return { success: await signOutLocally(createSupabaseServerClient()) };
}

export async function requestControlPasswordRecoveryServer(data: { email: string }) {
  const supabase = createSupabaseServerClient();
  const configuredAppUrl = import.meta.env["VITE_APP_URL"];
  const appOrigin = configuredAppUrl
    ? new URL(configuredAppUrl).origin
    : new URL(getRequest().url).origin;
  const redirectTo = new URL("/control/reset-password", appOrigin).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo });

  if (error) {
    console.error("Supabase password recovery request failed:", error.message);
    return {
      success: false,
      message: "We could not process that request. Please try again later.",
    };
  }

  return {
    success: true,
    message: "If an account is eligible, a password reset link will be sent.",
  };
}

export async function exchangeControlRecoveryCodeServer(data: { code: string }) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(data.code);
  return { success: !error };
}

export async function hasControlRecoverySessionServer() {
  const { data, error } = await createSupabaseServerClient().auth.getUser();
  return { success: !error && Boolean(data.user) };
}

export async function updateControlPasswordServer(data: { password: string }) {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { success: false, message: "This reset link is invalid or expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: data.password });
  if (error) {
    console.error("Supabase password update failed:", error.message);
    return { success: false, message: "Your password could not be updated. Please try again." };
  }

  return { success: true };
}
