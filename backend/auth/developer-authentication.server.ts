import { createSupabaseServerClient } from "../lib/supabase.server";
import {
  INITIAL_MAVROS_DEVELOPER_ID,
  INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID,
  isDeveloperRole,
  isIntendedDeveloperOrganizationMembership,
} from "./developer-auth-core";

type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;

function diagnosticCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    if (typeof code === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(code)) return code;
  }
  return "unexpected_error";
}

export async function getDeveloperMemberships(supabase: SupabaseServerClient, userId: string) {
  let memberships;
  try {
    const result = await supabase
      .from("developer_organization_memberships")
      .select("organization_id, user_id, role, is_active")
      .eq("user_id", userId);
    if (result.error) {
      console.error("[developer-auth]", {
        stage: "membership-lookup",
        code: result.error.code ?? "unknown",
      });
      return { status: "unavailable" as const, errorCode: result.error.code ?? "unknown" };
    }
    memberships = result.data;
  } catch (error) {
    const code = diagnosticCode(error);
    console.error("[developer-auth]", { stage: "membership-lookup", code });
    return { status: "unavailable" as const, errorCode: code };
  }

  if (!memberships?.length) return { status: "missing" as const };
  if (
    userId === INITIAL_MAVROS_DEVELOPER_ID &&
    !memberships.some((membership) => isIntendedDeveloperOrganizationMembership(userId, membership))
  ) {
    console.warn("[developer-auth]", {
      stage: "membership-validation",
      code: "intended_organization_mismatch",
    });
    return { status: "invalid" as const };
  }
  const intendedMemberships =
    userId === INITIAL_MAVROS_DEVELOPER_ID
      ? memberships.filter(
          (membership) => membership.organization_id === INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID,
        )
      : memberships;
  if (
    intendedMemberships.some(
      (membership) =>
        !isIntendedDeveloperOrganizationMembership(userId, membership) ||
        !isDeveloperRole(membership.role),
    )
  ) {
    console.warn("[developer-auth]", {
      stage: "membership-validation",
      code: "invalid_membership",
    });
    return { status: "invalid" as const };
  }

  const activeMemberships = intendedMemberships.filter((membership) => membership.is_active);
  if (!activeMemberships.length) return { status: "inactive" as const };

  const organizationIds = [
    ...new Set(activeMemberships.map((membership) => membership.organization_id)),
  ];
  let organizations;
  try {
    const result = await supabase
      .from("developer_organizations")
      .select("id, name, slug")
      .in("id", organizationIds);
    if (result.error) {
      console.error("[developer-auth]", {
        stage: "organization-lookup",
        code: result.error.code ?? "unknown",
      });
      return { status: "unavailable" as const, errorCode: result.error.code ?? "unknown" };
    }
    organizations = result.data;
  } catch (error) {
    const code = diagnosticCode(error);
    console.error("[developer-auth]", { stage: "organization-lookup", code });
    return { status: "unavailable" as const, errorCode: code };
  }

  const organizationById = new Map(
    organizations?.map((organization) => [organization.id, organization]),
  );
  const resolved = activeMemberships.flatMap((membership) => {
    const organization = organizationById.get(membership.organization_id);
    if (!organization) return [];
    return [
      {
        organizationId: organization.id,
        organizationName: organization.name,
        organizationSlug: organization.slug,
        role: membership.role,
      },
    ];
  });
  if (resolved.length !== activeMemberships.length) {
    console.warn("[developer-auth]", {
      stage: "organization-validation",
      code: "organization_membership_unresolved",
    });
    return { status: "invalid" as const };
  }

  return { status: "authorized" as const, memberships: resolved };
}

export async function getDeveloperSessionServer() {
  let supabase: SupabaseServerClient;
  try {
    supabase = createSupabaseServerClient();
  } catch (error) {
    const code = diagnosticCode(error);
    console.error("[developer-auth]", { stage: "client-initialization", code });
    return { authenticated: false as const, status: "unavailable" as const, errorCode: code };
  }

  let session;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[developer-auth]", {
        stage: "session-restoration",
        code: error.code ?? "unknown",
      });
      return { authenticated: false as const, status: "unavailable" as const };
    }
    session = data.session;
  } catch (error) {
    const code = diagnosticCode(error);
    console.error("[developer-auth]", { stage: "session-restoration", code });
    return { authenticated: false as const, status: "unavailable" as const, errorCode: code };
  }
  if (!session) return { authenticated: false as const, status: "unauthenticated" as const };

  let user;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      console.error("[developer-auth]", {
        stage: "user-verification",
        code: error?.code ?? "missing_user",
      });
      return { authenticated: false as const, status: "unavailable" as const };
    }
    user = data.user;
  } catch (error) {
    const code = diagnosticCode(error);
    console.error("[developer-auth]", { stage: "user-verification", code });
    return { authenticated: false as const, status: "unavailable" as const, errorCode: code };
  }

  const metadataName =
    typeof user.user_metadata?.["full_name"] === "string"
      ? user.user_metadata["full_name"].trim()
      : "";
  let profileName: string | null = null;
  try {
    const result = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (result.error) {
      console.error("[developer-auth]", {
        stage: "profile-lookup",
        code: result.error.code ?? "unknown",
      });
    } else {
      profileName = result.data?.full_name?.trim() || null;
    }
  } catch (error) {
    const code = diagnosticCode(error);
    console.error("[developer-auth]", { stage: "profile-lookup", code });
  }
  const sessionUser = {
    id: user.id,
    email: user.email ?? null,
    displayName:
      profileName || metadataName || user.email?.split("@")[0]?.trim() || "Developer account",
  };

  const memberships = await getDeveloperMemberships(supabase, user.id);
  if (memberships.status !== "authorized") {
    const errorCode = "errorCode" in memberships ? memberships.errorCode : undefined;
    return {
      authenticated: true as const,
      user: sessionUser,
      status: memberships.status,
      ...(errorCode ? { errorCode } : {}),
    };
  }

  return {
    authenticated: true as const,
    user: sessionUser,
    status: "authorized" as const,
    memberships: memberships.memberships,
  };
}
