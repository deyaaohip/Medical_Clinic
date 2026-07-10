import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { IAuditLogRepository } from "@/core/repositories/IAuditLogRepository";
import { AuditLog } from "@/core/domain/logs";
import { eq, desc } from "drizzle-orm";

export class AuditLogRepository implements IAuditLogRepository {
  async getForTenant(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
    const results = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return results.map((r) => ({
      ...r,
      tenantId: r.tenantId || null,
      metadata: r.metadata as Record<string, any>,
    }));
  }

  async log(entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    const [inserted] = await db
      .insert(auditLogs)
      .values({
        tenantId: entry.tenantId || null,
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        metadata: entry.metadata,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      })
      .returning();

    return {
      ...inserted,
      tenantId: inserted.tenantId || null,
      metadata: inserted.metadata as Record<string, any>,
    };
  }
}
