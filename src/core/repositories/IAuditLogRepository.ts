import { AuditLog, ActivityLog } from "../domain/logs";

export interface IAuditLogRepository {
  getForTenant(tenantId: string, limit?: number): Promise<AuditLog[]>;
  log(entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
}

export interface IActivityLogRepository {
  getForTenant(tenantId: string, limit?: number): Promise<ActivityLog[]>;
  record(entry: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog>;
}
