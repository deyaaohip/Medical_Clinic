// DDD Domain Model: Security Audit Logs & User Activity Feed
export interface AuditLog {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface ActivityLog {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  title: string;
  description: string;
  category: "Appointment" | "Billing" | "System" | "Clinical" | string;
  createdAt: Date;
  deletedAt?: Date | null;
}
