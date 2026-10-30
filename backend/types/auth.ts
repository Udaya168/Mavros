export interface StaffMembership {
  user_id: string;
  role: string;
  is_active: boolean;
}

export interface AuthenticatedUserIdentity {
  id: string;
  email: string | null;
}
