interface StaffMembership {
  user_id: string;
  role: string;
  is_active: boolean;
}

export const INITIAL_MAVROS_OWNER_ID = "f2c67a31-2b22-4ba9-86bd-91e9977b4955";

export type MavrosAccountRole = "owner" | "developer" | "user";

export function getPostLoginDestination(role: MavrosAccountRole): "/control" | "/app" | "/" {
  if (role === "owner") return "/control";
  if (role === "developer") return "/app";
  return "/";
}

export function isAuthorizedMavrosOwner(
  userId: string,
  membership: StaffMembership | null,
): membership is StaffMembership & { role: "owner" } {
  return (
    userId === INITIAL_MAVROS_OWNER_ID &&
    membership !== null &&
    membership.user_id === userId &&
    membership.is_active &&
    membership.role === "owner"
  );
}
