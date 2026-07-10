import { db } from "@/db";
import { subscriptionPlans, tenantSubscriptions } from "@/db/schema";
import { ISubscriptionRepository } from "@/core/repositories/ISubscriptionRepository";
import { SubscriptionPlan, TenantSubscription } from "@/core/domain/subscription";
import { eq } from "drizzle-orm";

export class SubscriptionRepository implements ISubscriptionRepository {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      currency: p.currency,
      maxUsers: p.maxUsers,
      maxPatients: p.maxPatients,
      features: (p.features as string[]) || [],
      isActive: p.isActive,
    }));
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const [p] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      currency: p.currency,
      maxUsers: p.maxUsers,
      maxPatients: p.maxPatients,
      features: (p.features as string[]) || [],
      isActive: p.isActive,
    };
  }

  async getTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
    const results = await db
      .select({
        sub: tenantSubscriptions,
        plan: subscriptionPlans,
      })
      .from(tenantSubscriptions)
      .innerJoin(subscriptionPlans, eq(tenantSubscriptions.planId, subscriptionPlans.id))
      .where(eq(tenantSubscriptions.tenantId, tenantId))
      .limit(1);

    if (results.length === 0) return null;

    const { sub, plan } = results[0];
    return {
      id: sub.id,
      tenantId: sub.tenantId,
      planId: sub.planId,
      status: sub.status as "trialing" | "active" | "past_due" | "canceled",
      billingCycle: sub.billingCycle as "monthly" | "yearly",
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        currency: plan.currency,
        maxUsers: plan.maxUsers,
        maxPatients: plan.maxPatients,
        features: (plan.features as string[]) || [],
        isActive: plan.isActive,
      },
    };
  }

  async updateSubscription(
    tenantId: string,
    planId: string,
    billingCycle: "monthly" | "yearly"
  ): Promise<TenantSubscription> {
    const [existing] = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId))
      .limit(1);

    const now = new Date();
    const periodEnd = new Date();
    if (billingCycle === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    if (existing) {
      const [updated] = await db
        .update(tenantSubscriptions)
        .set({
          planId,
          billingCycle,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.id, existing.id))
        .returning();

      return {
        ...updated,
        status: updated.status as any,
        billingCycle: updated.billingCycle as any,
      };
    } else {
      const [inserted] = await db
        .insert(tenantSubscriptions)
        .values({
          tenantId,
          planId,
          billingCycle,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        })
        .returning();

      return {
        ...inserted,
        status: inserted.status as any,
        billingCycle: inserted.billingCycle as any,
      };
    }
  }
}
