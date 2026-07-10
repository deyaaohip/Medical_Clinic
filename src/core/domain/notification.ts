// DDD Domain Model: Notifications
export interface NotificationItem {
  id: string;
  tenantId?: string | null;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
}
