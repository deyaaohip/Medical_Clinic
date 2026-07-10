import { db } from "@/db";
import { notifications } from "@/db/schema";
import { INotificationRepository } from "@/core/repositories/INotificationRepository";
import { NotificationItem } from "@/core/domain/notification";
import { eq, and, desc } from "drizzle-orm";

export class NotificationRepository implements INotificationRepository {
  async getForUser(tenantId: string, userId: string): Promise<NotificationItem[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.tenantId, tenantId), eq(notifications.userId, userId)))
      .orderBy(desc(notifications.createdAt));

    return results.map((r) => ({
      id: r.id,
      tenantId: r.tenantId || null,
      userId: r.userId,
      title: r.title,
      message: r.message,
      type: r.type as "info" | "success" | "warning" | "error",
      link: r.link,
      isRead: r.isRead,
      createdAt: r.createdAt,
    }));
  }

  async markAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.tenantId, tenantId), eq(notifications.userId, userId)));
  }

  async create(data: Omit<NotificationItem, "id" | "isRead" | "createdAt">): Promise<NotificationItem> {
    const [inserted] = await db
      .insert(notifications)
      .values({
        tenantId: data.tenantId || null,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        isRead: false,
      })
      .returning();

    return {
      id: inserted.id,
      tenantId: inserted.tenantId || null,
      userId: inserted.userId,
      title: inserted.title,
      message: inserted.message,
      type: inserted.type as any,
      link: inserted.link,
      isRead: inserted.isRead,
      createdAt: inserted.createdAt,
    };
  }
}
