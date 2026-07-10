// DDD Domain Model: Subscriptions, SaaS Tiers, & Billing
export interface SubscriptionPlan {
  id: string; // 'starter' | 'professional' | 'enterprise'
  name: string;
  description?: string | null;
  priceMonthly: number; // in cents
  priceYearly: number;  // in cents
  currency: string;
  maxUsers: number;
  maxPatients: number;
  features: string[];
  isActive: boolean;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: SubscriptionPlan;
}
