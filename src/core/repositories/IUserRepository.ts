import { User, Role, TenantMembership, RoleWithPermissions } from "../domain/user";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  getTenantMembers(tenantId: string): Promise<(TenantMembership & { user: User; role: Role })[]>;
  getRolesForTenant(tenantId: string): Promise<RoleWithPermissions[]>;
  getUserPermissionsInTenant(tenantId: string, userId: string): Promise<string[]>;
  createRoleWithPermissions(tenantId: string, name: string, description: string, permissions: string[]): Promise<RoleWithPermissions>;
  updateRolePermissions(roleId: string, permissions: string[]): Promise<void>;
  assignUserRole(tenantId: string, userId: string, roleId: string): Promise<TenantMembership>;
}
