import { SubscriptionPlan, TenantSubscription } from "../domain/subscription";

export interface ISubscriptionRepository {
  getPlans(): Promise<SubscriptionPlan[]>;
  getPlanById(planId: string): Promise<SubscriptionPlan | null>;
  getTenantSubscription(tenantId: string): Promise<TenantSubscription | null>;
  updateSubscription(tenantId: string, planId: string, billingCycle: "monthly" | "yearly"): Promise<TenantSubscription>;
}
