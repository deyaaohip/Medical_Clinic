import { UserRepository } from "@/infrastructure/db/UserRepository";
import { AuditLogRepository } from "@/infrastructure/db/AuditLogRepository";
import { RoleWithPermissions } from "@/core/domain/user";

export class RbacService {
  private userRepo: UserRepository;
  private auditRepo: AuditLogRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.auditRepo = new AuditLogRepository();
  }

  async getRolesInTenant(tenantId: string): Promise<RoleWithPermissions[]> {
    return this.userRepo.getRolesForTenant(tenantId);
  }

  async verifyPermission(tenantId: string, userId: string, requiredPermission: string): Promise<boolean> {
    const perms = await this.userRepo.getUserPermissionsInTenant(tenantId, userId);
    if (perms.includes("*")) return true; // Super admin
    if (perms.includes(requiredPermission)) return true;

    // Check wildcard domain prefix, e.g., if user has "appointments:*" and required is "appointments:create"
    const prefix = requiredPermission.split(":")[0] + ":*";
    if (perms.includes(prefix)) return true;

    return false;
  }

  async createCustomRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: string[],
    actorUserId: string
  ): Promise<RoleWithPermissions> {
    const role = await this.userRepo.createRoleWithPermissions(tenantId, name, description, permissions);

    await this.auditRepo.log({
      tenantId,
      userId: actorUserId,
      action: "RBAC_ROLE_CREATED",
      resourceType: "Role",
      resourceId: role.id,
      metadata: { roleName: name, permissions },
    });

    return role;
  }

  async updateRolePermissions(
    tenantId: string,
    roleId: string,
    permissions: string[],
    actorUserId: string
  ): Promise<void> {
    await this.userRepo.updateRolePermissions(roleId, permissions);

    await this.auditRepo.log({
      tenantId,
      userId: actorUserId,
      action: "RBAC_ROLE_PERMISSIONS_UPDATED",
      resourceType: "Role",
      resourceId: roleId,
      metadata: { permissions },
    });
  }
}
