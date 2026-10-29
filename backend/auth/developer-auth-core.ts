export const INITIAL_MAVROS_DEVELOPER_ID = "ba27d990-a1cc-4f52-896d-62decbc04828";
export const INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID = "35f8836f-3133-4e9c-875b-84dadad1ca6b";

export const DEVELOPER_ROLES = ["owner", "admin", "marketing", "sales", "analyst"] as const;
export type DeveloperRole = (typeof DEVELOPER_ROLES)[number];

export interface DeveloperMembershipRecord {
  user_id: string;
  role: string;
  is_active: boolean;
}

interface DeveloperOrganizationMembershipRecord extends DeveloperMembershipRecord {
  organization_id: string;
}

export function isDeveloperRole(role: string): role is DeveloperRole {
  return DEVELOPER_ROLES.some((developerRole) => developerRole === role);
}

export function isIntendedDeveloperOrganizationMembership(
  authenticatedUserId: string,
  membership: DeveloperOrganizationMembershipRecord,
): boolean {
  return (
    membership.user_id === authenticatedUserId &&
    (authenticatedUserId !== INITIAL_MAVROS_DEVELOPER_ID ||
      membership.organization_id === INITIAL_MAVROS_DEVELOPER_ORGANIZATION_ID)
  );
}

export function isActiveDeveloperMembership(
  authenticatedUserId: string,
  membership: DeveloperMembershipRecord,
): membership is DeveloperMembershipRecord & { role: DeveloperRole } {
  return (
    membership.user_id === authenticatedUserId &&
    membership.is_active &&
    isDeveloperRole(membership.role)
  );
}

export function canAccessDeveloperPath(roles: readonly DeveloperRole[], pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/app";
  const allowedPrefixes: Partial<Record<DeveloperRole, readonly string[]>> = {
    marketing: [
      "/app",
      "/app/projects",
      "/app/inventory",
      "/app/knowledge-base",
      "/app/ai-advisor",
      "/app/creative-studio",
      "/app/campaigns",
      "/app/analytics",
      "/app/reports",
      "/app/contacts",
      "/app/notifications",
      "/app/help",
    ],
    sales: [
      "/app",
      "/app/projects",
      "/app/inventory",
      "/app/knowledge-base",
      "/app/leads",
      "/app/conversations",
      "/app/visits",
      "/app/tasks",
      "/app/contacts",
      "/app/notifications",
      "/app/help",
    ],
    analyst: [
      "/app",
      "/app/projects",
      "/app/inventory",
      "/app/campaigns",
      "/app/analytics",
      "/app/reports",
      "/app/contacts",
      "/app/notifications",
      "/app/help",
    ],
  };

  return (
    roles.length > 0 &&
    roles.every(
      (role) =>
        role === "owner" ||
        role === "admin" ||
        (allowedPrefixes[role] ?? []).some(
          (prefix) =>
            normalizedPath === prefix ||
            (prefix !== "/app" && normalizedPath.startsWith(`${prefix}/`)),
        ),
    )
  );
}
