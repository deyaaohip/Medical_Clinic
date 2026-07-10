// DDD Domain Model: User, Roles, & Permissions
export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  preferredLocale: "en" | "ar";
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface Role {
  id: string;
  tenantId?: string | null;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  joinedAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: string[];
}
