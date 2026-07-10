import { TenantRepository } from "@/infrastructure/db/TenantRepository";
import { SubscriptionRepository } from "@/infrastructure/db/SubscriptionRepository";
import { AuditLogRepository } from "@/infrastructure/db/AuditLogRepository";
import { Tenant } from "@/core/domain/tenant";
import { FeatureFlag } from "@/core/domain/featureFlags";
import { TenantSubscription } from "@/core/domain/subscription";

export class TenantService {
  private tenantRepo: TenantRepository;
  private subRepo: SubscriptionRepository;
  private auditRepo: AuditLogRepository;

  constructor() {
    this.tenantRepo = new TenantRepository();
    this.subRepo = new SubscriptionRepository();
    this.auditRepo = new AuditLogRepository();
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepo.findBySlug(slug);
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return this.tenantRepo.findById(id);
  }

  async listTenants(): Promise<Tenant[]> {
    return this.tenantRepo.findAll();
  }

  async createTenant(data: { name: string; slug: string; defaultLocale: "en" | "ar" }, adminUserId: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.create({
      name: data.name,
      slug: data.slug,
      defaultLocale: data.defaultLocale,
      isActive: true,
      metadata: { createdBy: adminUserId },
    });

    // Setup standard subscription (Starter plan trial)
    await this.subRepo.updateSubscription(tenant.id, "starter", "monthly");

    // Log audit
    await this.auditRepo.log({
      tenantId: tenant.id,
      userId: adminUserId,
      action: "TENANT_PROVISIONED",
      resourceType: "Tenant",
      resourceId: tenant.id,
      metadata: { slug: data.slug },
    });

    return tenant;
  }

  async getTenantFeatureFlags(tenantId: string): Promise<Record<string, boolean>> {
    const flags = await this.tenantRepo.getFeatureFlags(tenantId);
    const map: Record<string, boolean> = {};
    for (const f of flags) {
      map[f.flagKey] = f.isEnabled;
    }
    return map;
  }

  async toggleFeatureFlag(tenantId: string, flagKey: string, isEnabled: boolean, userId: string): Promise<FeatureFlag> {
    const res = await this.tenantRepo.setFeatureFlag(tenantId, flagKey, isEnabled);
    await this.auditRepo.log({
      tenantId,
      userId,
      action: "FEATURE_FLAG_TOGGLED",
      resourceType: "FeatureFlag",
      resourceId: flagKey,
      metadata: { flagKey, isEnabled },
    });
    return res;
  }

  async getTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
    return this.subRepo.getTenantSubscription(tenantId);
  }
}
