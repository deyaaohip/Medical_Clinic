import { Tenant } from "../domain/tenant";
import { FeatureFlag } from "../domain/featureFlags";

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
  create(data: Omit<Tenant, "id" | "createdAt" | "updatedAt">): Promise<Tenant>;
  update(id: string, data: Partial<Tenant>): Promise<Tenant>;
  getFeatureFlags(tenantId: string): Promise<FeatureFlag[]>;
  setFeatureFlag(tenantId: string, flagKey: string, isEnabled: boolean): Promise<FeatureFlag>;
}
