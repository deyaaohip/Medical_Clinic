import { NotificationItem } from "../domain/notification";

export interface INotificationRepository {
  getForUser(tenantId: string, userId: string): Promise<NotificationItem[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(tenantId: string, userId: string): Promise<void>;
  create(data: Omit<NotificationItem, "id" | "isRead" | "createdAt">): Promise<NotificationItem>;
}
