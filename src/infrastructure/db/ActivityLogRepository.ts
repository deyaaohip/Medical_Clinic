import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { IActivityLogRepository } from "@/core/repositories/IAuditLogRepository";
import { ActivityLog } from "@/core/domain/logs";
import { eq, desc } from "drizzle-orm";

export class ActivityLogRepository implements IActivityLogRepository {
  async getForTenant(tenantId: string, limit: number = 100): Promise<ActivityLog[]> {
    const results = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.tenantId, tenantId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return results.map((r) => ({
      ...r,
      tenantId: r.tenantId || null,
    }));
  }

  async record(entry: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog> {
    const [inserted] = await db
      .insert(activityLogs)
      .values({
        tenantId: entry.tenantId || null,
        userId: entry.userId,
        title: entry.title,
        description: entry.description,
        category: entry.category,
      })
      .returning();

    return {
      ...inserted,
      tenantId: inserted.tenantId || null,
    };
  }
}
