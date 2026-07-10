import { db } from "@/db";
import { tenants, featureFlags } from "@/db/schema";
import { ITenantRepository } from "@/core/repositories/ITenantRepository";
import { Tenant } from "@/core/domain/tenant";
import { FeatureFlag } from "@/core/domain/featureFlags";
import { eq, and } from "drizzle-orm";

export class TenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (!tenant) return null;
    return {
      ...tenant,
      defaultLocale: (tenant.defaultLocale as "en" | "ar") || "en",
      metadata: tenant.metadata as Record<string, any>,
    };
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    if (!tenant) return null;
    return {
      ...tenant,
      defaultLocale: (tenant.defaultLocale as "en" | "ar") || "en",
      metadata: tenant.metadata as Record<string, any>,
    };
  }

  async findAll(): Promise<Tenant[]> {
    const results = await db.select().from(tenants);
    return results.map((t) => ({
      ...t,
      defaultLocale: (t.defaultLocale as "en" | "ar") || "en",
      metadata: t.metadata as Record<string, any>,
    }));
  }

  async create(data: Omit<Tenant, "id" | "createdAt" | "updatedAt">): Promise<Tenant> {
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        country: data.country,
        timeZone: data.timeZone,
        defaultLocale: data.defaultLocale,
        isActive: data.isActive,
        metadata: data.metadata,
      })
      .returning();

    return {
      ...newTenant,
      defaultLocale: (newTenant.defaultLocale as "en" | "ar") || "en",
      metadata: newTenant.metadata as Record<string, any>,
    };
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const [updated] = await db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return {
      ...updated,
      defaultLocale: (updated.defaultLocale as "en" | "ar") || "en",
      metadata: updated.metadata as Record<string, any>,
    };
  }

  async getFeatureFlags(tenantId: string): Promise<FeatureFlag[]> {
    const results = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.tenantId, tenantId));
    return results.map((f) => ({
      id: f.id,
      tenantId: f.tenantId,
      flagKey: f.flagKey,
      isEnabled: f.isEnabled,
      updatedAt: f.updatedAt,
    }));
  }

  async setFeatureFlag(tenantId: string, flagKey: string, isEnabled: boolean): Promise<FeatureFlag> {
    const [existing] = await db
      .select()
      .from(featureFlags)
      .where(and(eq(featureFlags.tenantId, tenantId), eq(featureFlags.flagKey, flagKey)));

    if (existing) {
      const [updated] = await db
        .update(featureFlags)
        .set({ isEnabled, updatedAt: new Date() })
        .where(eq(featureFlags.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(featureFlags)
        .values({
          tenantId,
          flagKey,
          isEnabled,
        })
        .returning();
      return inserted;
    }
  }
}
