import { db } from "@/db";
import { users, roles, rolePermissions, tenantUsers } from "@/db/schema";
import { IUserRepository } from "@/core/repositories/IUserRepository";
import { User, Role, TenantMembership, RoleWithPermissions } from "@/core/domain/user";
import { eq, and, inArray } from "drizzle-orm";

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return null;
    return {
      ...user,
      preferredLocale: (user.preferredLocale as "en" | "ar") || "en",
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return null;
    return {
      ...user,
      preferredLocale: (user.preferredLocale as "en" | "ar") || "en",
    };
  }

  async getTenantMembers(tenantId: string): Promise<(TenantMembership & { user: User; role: Role })[]> {
    const members = await db
      .select({
        membership: tenantUsers,
        user: users,
        role: roles,
      })
      .from(tenantUsers)
      .innerJoin(users, eq(tenantUsers.userId, users.id))
      .innerJoin(roles, eq(tenantUsers.roleId, roles.id))
      .where(eq(tenantUsers.tenantId, tenantId));

    return members.map(({ membership, user, role }) => ({
      id: membership.id,
      tenantId: membership.tenantId,
      userId: membership.userId,
      roleId: membership.roleId,
      isActive: membership.isActive,
      joinedAt: membership.joinedAt,
      user: {
        ...user,
        preferredLocale: (user.preferredLocale as "en" | "ar") || "en",
      },
      role: {
        id: role.id,
        tenantId: role.tenantId || null,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
      },
    }));
  }

  async getRolesForTenant(tenantId: string): Promise<RoleWithPermissions[]> {
    const tenantRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.tenantId, tenantId));

    if (tenantRoles.length === 0) return [];

    const roleIds = tenantRoles.map((r) => r.id);
    const perms = await db
      .select()
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));

    const permsByRole: Record<string, string[]> = {};
    for (const p of perms) {
      if (!permsByRole[p.roleId]) permsByRole[p.roleId] = [];
      permsByRole[p.roleId].push(p.permissionKey);
    }

    return tenantRoles.map((r) => ({
      id: r.id,
      tenantId: r.tenantId || null,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      permissions: permsByRole[r.id] || [],
    }));
  }

  async getUserPermissionsInTenant(tenantId: string, userId: string): Promise<string[]> {
    const membership = await db
      .select()
      .from(tenantUsers)
      .where(and(eq(tenantUsers.tenantId, tenantId), eq(tenantUsers.userId, userId)))
      .limit(1);

    if (membership.length === 0 || !membership[0].isActive) {
      // Check if user is super admin
      const [u] = await db.select().from(users).where(eq(users.id, userId));
      if (u && u.isSuperAdmin) {
        return ["*"]; // Wildcard super admin
      }
      return [];
    }

    const roleId = membership[0].roleId;
    const perms = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    return perms.map((p) => p.permissionKey);
  }

  async createRoleWithPermissions(
    tenantId: string,
    name: string,
    description: string,
    permissions: string[]
  ): Promise<RoleWithPermissions> {
    const [newRole] = await db
      .insert(roles)
      .values({
        tenantId,
        name,
        description,
        isSystem: false,
      })
      .returning();

    if (permissions.length > 0) {
      const values = permissions.map((perm) => ({
        roleId: newRole.id,
        permissionKey: perm,
      }));
      await db.insert(rolePermissions).values(values);
    }

    return {
      ...newRole,
      tenantId: newRole.tenantId || null,
      permissions,
    };
  }

  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (permissions.length > 0) {
      const values = permissions.map((perm) => ({
        roleId,
        permissionKey: perm,
      }));
      await db.insert(rolePermissions).values(values);
    }
  }

  async assignUserRole(tenantId: string, userId: string, roleId: string): Promise<TenantMembership> {
    const [existing] = await db
      .select()
      .from(tenantUsers)
      .where(and(eq(tenantUsers.tenantId, tenantId), eq(tenantUsers.userId, userId)));

    if (existing) {
      const [updated] = await db
        .update(tenantUsers)
        .set({ roleId, isActive: true })
        .where(eq(tenantUsers.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(tenantUsers)
        .values({
          tenantId,
          userId,
          roleId,
          isActive: true,
        })
        .returning();
      return inserted;
    }
  }
}
