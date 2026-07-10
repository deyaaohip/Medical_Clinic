import { db } from "@/db";
import {
  tenants,
  subscriptionPlans,
  tenantSubscriptions,
  users,
  roles,
  rolePermissions,
  tenantUsers,
  featureFlags,
  auditLogs,
  activityLogs,
  notifications,
  superAdminInvoices,
  superAdminCoupons,
  superAdminAnnouncements,
  superAdminEmailTemplates,
  superAdminSmsTemplates,
  superAdminSystemLogs,
  superAdminGlobalSettings,
  superAdminStorageFiles,
  superAdminAiUsage,
  superAdminApiKeys,
  superAdminSecurityRules,
  superAdminBackups,
  superAdminSupportTickets,
} from "@/db/schema";
import { eq, ne, and, or, ilike, desc, asc, isNull, isNotNull, inArray, sql } from "drizzle-orm";

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  status?: string;
  showDeleted?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SuperAdminService {
  // =========================================================
  // 1. DASHBOARD & ANALYTICS CHARTS OVERVIEW
  // =========================================================
  async getDashboardMetrics() {
    // Total ARR (Annual Recurring Revenue)
    const activeSubs = await db
      .select({ planId: tenantSubscriptions.planId })
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.status, "active"));

    const plans = await db.select().from(subscriptionPlans);
    const planPriceMap: Record<string, number> = {};
    for (const p of plans) {
      planPriceMap[p.id] = p.priceYearly;
    }

    let totalArrCents = 0;
    for (const sub of activeSubs) {
      totalArrCents += planPriceMap[sub.planId] || 0;
    }

    // Active Tenants count
    const [{ totalTenants }] = await db
      .select({ totalTenants: sql<number>`count(*)::int` })
      .from(tenants)
      .where(isNull(tenants.deletedAt));

    // Active Users count
    const [{ totalUsers }] = await db
      .select({ totalUsers: sql<number>`count(*)::int` })
      .from(users)
      .where(isNull(users.deletedAt));

    // Total Support Tickets
    const [{ openTickets }] = await db
      .select({ openTickets: sql<number>`count(*)::int` })
      .from(superAdminSupportTickets)
      .where(and(isNull(superAdminSupportTickets.deletedAt), ne(superAdminSupportTickets.status, "Resolved")));

    // AI Usage summary
    const [{ totalAiCostCents }] = await db
      .select({ totalAiCostCents: sql<number>`coalesce(sum(cost_cents_double), 0)::int` })
      .from(superAdminAiUsage)
      .where(isNull(superAdminAiUsage.deletedAt));

    // Subscription Tier Distribution for Chart
    const tierStats: Record<string, number> = {};
    for (const sub of activeSubs) {
      tierStats[sub.planId] = (tierStats[sub.planId] || 0) + 1;
    }

    return {
      totalArrUsd: Math.round(totalArrCents / 100),
      totalTenants,
      totalUsers,
      openTickets,
      totalAiCostUsd: Number((totalAiCostCents / 100).toFixed(2)),
      tierDistribution: Object.entries(tierStats).map(([tier, count]) => ({ tier, count })),
    };
  }

  // Revenue chart data (Mock chronological revenue for gorgeous visual)
  async getRevenueChartData() {
    return [
      { month: "Sep", revenueUsd: 14200 },
      { month: "Oct", revenueUsd: 18500 },
      { month: "Nov", revenueUsd: 22100 },
      { month: "Dec", revenueUsd: 29800 },
      { month: "Jan", revenueUsd: 34500 },
      { month: "Feb", revenueUsd: 41200 },
    ];
  }

  // =========================================================
  // 2. TENANTS MANAGEMENT (Clinics)
  // =========================================================
  async getTenants(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", sortBy = "createdAt", sortDir = "desc", showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) {
      conditions.push(isNull(tenants.deletedAt));
    } else {
      conditions.push(isNotNull(tenants.deletedAt));
    }

    if (search) {
      conditions.push(or(ilike(tenants.name, `%${search}%`), ilike(tenants.slug, `%${search}%`)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let sortColumn: any = tenants.createdAt;
    if (sortBy === "name") sortColumn = tenants.name;
    if (sortBy === "slug") sortColumn = tenants.slug;

    const results = await db
      .select()
      .from(tenants)
      .where(whereClause)
      .orderBy(sortDir === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenants)
      .where(whereClause);

    return {
      data: results,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async createTenant(data: { name: string; slug: string; defaultLocale?: string; country?: string }) {
    const [inserted] = await db
      .insert(tenants)
      .values({
        name: data.name,
        slug: data.slug,
        defaultLocale: data.defaultLocale || "en",
        country: data.country || "UAE",
        isActive: true,
      })
      .returning();
    return inserted;
  }

  async updateTenant(id: string, data: Partial<typeof tenants.$inferInsert>) {
    const [updated] = await db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  }

  async softDeleteTenant(id: string) {
    const [deleted] = await db
      .update(tenants)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(tenants.id, id))
      .returning();
    return deleted;
  }

  async restoreTenant(id: string) {
    const [restored] = await db
      .update(tenants)
      .set({ deletedAt: null, isActive: true })
      .where(eq(tenants.id, id))
      .returning();
    return restored;
  }

  async bulkSoftDeleteTenants(ids: string[]) {
    await db
      .update(tenants)
      .set({ deletedAt: new Date(), isActive: false })
      .where(inArray(tenants.id, ids));
  }

  async bulkRestoreTenants(ids: string[]) {
    await db
      .update(tenants)
      .set({ deletedAt: null, isActive: true })
      .where(inArray(tenants.id, ids));
  }

  // =========================================================
  // 3. SUBSCRIPTION PLANS MANAGEMENT
  // =========================================================
  async getSubscriptionPlans(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", sortBy = "priceMonthly", sortDir = "desc", showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(subscriptionPlans.deletedAt));
    else conditions.push(isNotNull(subscriptionPlans.deletedAt));

    if (search) conditions.push(ilike(subscriptionPlans.name, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(subscriptionPlans)
      .where(whereClause)
      .orderBy(sortDir === "asc" ? asc(subscriptionPlans.priceMonthly) : desc(subscriptionPlans.priceMonthly))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptionPlans)
      .where(whereClause);

    return {
      data: results,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async createSubscriptionPlan(data: {
    id: string;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    maxUsers: number;
    maxPatients: number;
    features: string[];
  }) {
    const [inserted] = await db.insert(subscriptionPlans).values(data).returning();
    return inserted;
  }

  async updateSubscriptionPlan(id: string, data: Partial<typeof subscriptionPlans.$inferInsert>) {
    const [updated] = await db
      .update(subscriptionPlans)
      .set(data)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updated;
  }

  async softDeleteSubscriptionPlan(id: string) {
    const [deleted] = await db
      .update(subscriptionPlans)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return deleted;
  }

  async restoreSubscriptionPlan(id: string) {
    const [restored] = await db
      .update(subscriptionPlans)
      .set({ deletedAt: null, isActive: true })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return restored;
  }

  // =========================================================
  // 4. INVOICES MANAGEMENT
  // =========================================================
  async getInvoices(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", status, showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(superAdminInvoices.deletedAt));
    else conditions.push(isNotNull(superAdminInvoices.deletedAt));

    if (status && status !== "all") conditions.push(eq(superAdminInvoices.status, status));
    if (search) conditions.push(ilike(superAdminInvoices.invoiceNumber, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(superAdminInvoices)
      .where(whereClause)
      .orderBy(desc(superAdminInvoices.billingDate))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminInvoices)
      .where(whereClause);

    return {
      data: results,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async softDeleteInvoice(id: string) {
    await db.update(superAdminInvoices).set({ deletedAt: new Date() }).where(eq(superAdminInvoices.id, id));
  }

  async restoreInvoice(id: string) {
    await db.update(superAdminInvoices).set({ deletedAt: null }).where(eq(superAdminInvoices.id, id));
  }

  // =========================================================
  // 5. COUPONS MANAGEMENT
  // =========================================================
  async getCoupons(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(superAdminCoupons.deletedAt));
    else conditions.push(isNotNull(superAdminCoupons.deletedAt));

    if (search) conditions.push(or(ilike(superAdminCoupons.code, `%${search}%`), ilike(superAdminCoupons.name, `%${search}%`)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(superAdminCoupons)
      .where(whereClause)
      .orderBy(desc(superAdminCoupons.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminCoupons)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async createCoupon(data: { code: string; name: string; discountPercent?: number; discountAmountCents?: number; maxRedemptions?: number }) {
    const [inserted] = await db.insert(superAdminCoupons).values({ ...data, isActive: true }).returning();
    return inserted;
  }

  async softDeleteCoupon(id: string) {
    await db.update(superAdminCoupons).set({ deletedAt: new Date(), isActive: false }).where(eq(superAdminCoupons.id, id));
  }

  async restoreCoupon(id: string) {
    await db.update(superAdminCoupons).set({ deletedAt: null, isActive: true }).where(eq(superAdminCoupons.id, id));
  }

  // =========================================================
  // 6. ANNOUNCEMENTS MANAGEMENT
  // =========================================================
  async getAnnouncements(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", showDeleted = false } = params;
    const offset = (page - 1) * limit;
    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(superAdminAnnouncements.deletedAt));
    else conditions.push(isNotNull(superAdminAnnouncements.deletedAt));

    if (search) conditions.push(ilike(superAdminAnnouncements.title, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(superAdminAnnouncements)
      .where(whereClause)
      .orderBy(desc(superAdminAnnouncements.publishedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminAnnouncements)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async createAnnouncement(data: { title: string; message: string; type: string; targetTiers?: string[] }) {
    const [inserted] = await db
      .insert(superAdminAnnouncements)
      .values({
        title: data.title,
        message: data.message,
        type: data.type || "info",
        targetTiers: data.targetTiers || ["all"],
        isActive: true,
      })
      .returning();
    return inserted;
  }

  async softDeleteAnnouncement(id: string) {
    await db.update(superAdminAnnouncements).set({ deletedAt: new Date(), isActive: false }).where(eq(superAdminAnnouncements.id, id));
  }

  async restoreAnnouncement(id: string) {
    await db.update(superAdminAnnouncements).set({ deletedAt: null, isActive: true }).where(eq(superAdminAnnouncements.id, id));
  }

  // =========================================================
  // 7. EMAIL & SMS TEMPLATES MANAGEMENT
  // =========================================================
  async getEmailTemplates() {
    return db.select().from(superAdminEmailTemplates).where(isNull(superAdminEmailTemplates.deletedAt)).orderBy(superAdminEmailTemplates.name);
  }

  async createEmailTemplate(data: { templateKey: string; name: string; subject: string; bodyHtml: string; variablesDescription?: string }) {
    const [inserted] = await db.insert(superAdminEmailTemplates).values(data).returning();
    return inserted;
  }

  async updateEmailTemplate(id: string, data: Partial<typeof superAdminEmailTemplates.$inferInsert>) {
    const [updated] = await db.update(superAdminEmailTemplates).set({ ...data, updatedAt: new Date() }).where(eq(superAdminEmailTemplates.id, id)).returning();
    return updated;
  }

  async getSmsTemplates() {
    return db.select().from(superAdminSmsTemplates).where(isNull(superAdminSmsTemplates.deletedAt)).orderBy(superAdminSmsTemplates.name);
  }

  async createSmsTemplate(data: { templateKey: string; name: string; messageText: string; variablesDescription?: string }) {
    const [inserted] = await db.insert(superAdminSmsTemplates).values(data).returning();
    return inserted;
  }

  async updateSmsTemplate(id: string, data: Partial<typeof superAdminSmsTemplates.$inferInsert>) {
    const [updated] = await db.update(superAdminSmsTemplates).set({ ...data, updatedAt: new Date() }).where(eq(superAdminSmsTemplates.id, id)).returning();
    return updated;
  }

  // =========================================================
  // 8. USERS MANAGEMENT
  // =========================================================
  async getUsers(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(users.deletedAt));
    else conditions.push(isNotNull(users.deletedAt));

    if (search) conditions.push(or(ilike(users.fullName, `%${search}%`), ilike(users.email, `%${search}%`)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async softDeleteUser(id: string) {
    await db.update(users).set({ deletedAt: new Date(), isActive: false }).where(eq(users.id, id));
  }

  async restoreUser(id: string) {
    await db.update(users).set({ deletedAt: null, isActive: true }).where(eq(users.id, id));
  }

  // =========================================================
  // 9. SYSTEM LOGS & AUDIT LOGS
  // =========================================================
  async getSystemLogs(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 15, search = "", status } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [isNull(superAdminSystemLogs.deletedAt)];
    if (status && status !== "all") conditions.push(eq(superAdminSystemLogs.level, status));
    if (search) conditions.push(or(ilike(superAdminSystemLogs.message, `%${search}%`), ilike(superAdminSystemLogs.sourceService, `%${search}%`)));

    const whereClause = and(...conditions);
    const results = await db
      .select()
      .from(superAdminSystemLogs)
      .where(whereClause)
      .orderBy(desc(superAdminSystemLogs.timestamp))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminSystemLogs)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  // =========================================================
  // 10. GLOBAL SETTINGS
  // =========================================================
  async getGlobalSettings() {
    return db.select().from(superAdminGlobalSettings).orderBy(superAdminGlobalSettings.settingKey);
  }

  async updateGlobalSetting(key: string, value: any, description?: string) {
    const [inserted] = await db
      .insert(superAdminGlobalSettings)
      .values({ settingKey: key, settingValue: value, description })
      .onConflictDoUpdate({ target: [superAdminGlobalSettings.settingKey], set: { settingValue: value, updatedAt: new Date() } })
      .returning();
    return inserted;
  }

  // =========================================================
  // 11. STORAGE OVERVIEW
  // =========================================================
  async getStorageFiles(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "" } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [isNull(superAdminStorageFiles.deletedAt)];
    if (search) conditions.push(ilike(superAdminStorageFiles.fileName, `%${search}%`));

    const whereClause = and(...conditions);
    const results = await db
      .select()
      .from(superAdminStorageFiles)
      .where(whereClause)
      .orderBy(desc(superAdminStorageFiles.uploadedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminStorageFiles)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async softDeleteStorageFile(id: string) {
    await db.update(superAdminStorageFiles).set({ deletedAt: new Date() }).where(eq(superAdminStorageFiles.id, id));
  }

  // =========================================================
  // 12. AI USAGE ANALYTICS
  // =========================================================
  async getAiUsageLogs(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "" } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [isNull(superAdminAiUsage.deletedAt)];
    if (search) conditions.push(or(ilike(superAdminAiUsage.aiModel, `%${search}%`), ilike(superAdminAiUsage.featureCategory, `%${search}%`)));

    const whereClause = and(...conditions);
    const results = await db
      .select()
      .from(superAdminAiUsage)
      .where(whereClause)
      .orderBy(desc(superAdminAiUsage.executedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminAiUsage)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  // =========================================================
  // 13. API KEYS MANAGEMENT
  // =========================================================
  async getApiKeys(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(superAdminApiKeys.deletedAt));
    else conditions.push(isNotNull(superAdminApiKeys.deletedAt));

    if (search) conditions.push(ilike(superAdminApiKeys.name, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(superAdminApiKeys)
      .where(whereClause)
      .orderBy(desc(superAdminApiKeys.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminApiKeys)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async createApiKey(data: { name: string; permissions?: string[]; rateLimitPerMin?: number; tenantId?: string }) {
    const keyPrefix = "ms_live_" + Math.random().toString(36).substring(2, 6);
    const secretHash = "hashed_secret_" + Date.now();
    const [inserted] = await db
      .insert(superAdminApiKeys)
      .values({
        tenantId: data.tenantId || null,
        name: data.name,
        keyPrefix,
        secretHash,
        permissions: data.permissions || ["*"],
        rateLimitPerMin: data.rateLimitPerMin || 60,
        isActive: true,
      })
      .returning();
    return inserted;
  }

  async softDeleteApiKey(id: string) {
    await db.update(superAdminApiKeys).set({ deletedAt: new Date(), isActive: false }).where(eq(superAdminApiKeys.id, id));
  }

  async restoreApiKey(id: string) {
    await db.update(superAdminApiKeys).set({ deletedAt: null, isActive: true }).where(eq(superAdminApiKeys.id, id));
  }

  // =========================================================
  // 14. SECURITY CENTER
  // =========================================================
  async getSecurityRules(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(superAdminSecurityRules.deletedAt));
    else conditions.push(isNotNull(superAdminSecurityRules.deletedAt));

    if (search) conditions.push(or(ilike(superAdminSecurityRules.targetIpOrRange, `%${search}%`), ilike(superAdminSecurityRules.reason, `%${search}%`)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(superAdminSecurityRules)
      .where(whereClause)
      .orderBy(desc(superAdminSecurityRules.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminSecurityRules)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async createSecurityRule(data: { ruleType: string; targetIpOrRange: string; reason: string }) {
    const [inserted] = await db
      .insert(superAdminSecurityRules)
      .values({
        ruleType: data.ruleType || "blacklist",
        targetIpOrRange: data.targetIpOrRange,
        reason: data.reason,
        isActive: true,
      })
      .returning();
    return inserted;
  }

  async softDeleteSecurityRule(id: string) {
    await db.update(superAdminSecurityRules).set({ deletedAt: new Date(), isActive: false }).where(eq(superAdminSecurityRules.id, id));
  }

  async restoreSecurityRule(id: string) {
    await db.update(superAdminSecurityRules).set({ deletedAt: null, isActive: true }).where(eq(superAdminSecurityRules.id, id));
  }

  // =========================================================
  // 15. BACKUPS
  // =========================================================
  async getBackups(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(superAdminBackups.deletedAt));
    else conditions.push(isNotNull(superAdminBackups.deletedAt));

    if (search) conditions.push(ilike(superAdminBackups.backupName, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(superAdminBackups)
      .where(whereClause)
      .orderBy(desc(superAdminBackups.completedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminBackups)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async triggerNewBackup(backupName: string, triggerType: "automated" | "manual" = "manual") {
    const s3ArchiveUrl = `https://s3.amazonaws.com/medsaas-backups/${backupName}.sql`;
    const [inserted] = await db
      .insert(superAdminBackups)
      .values({
        backupName,
        status: "completed",
        sizeBytes: 1048576000 + Math.floor(Math.random() * 500000000),
        s3ArchiveUrl,
        triggerType,
        completedAt: new Date(),
      })
      .returning();
    return inserted;
  }

  async softDeleteBackup(id: string) {
    await db.update(superAdminBackups).set({ deletedAt: new Date() }).where(eq(superAdminBackups.id, id));
  }

  // =========================================================
  // 16. SUPPORT TICKETS
  // =========================================================
  async getSupportTickets(params: PaginationParams): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search = "", status, showDeleted = false } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (!showDeleted) conditions.push(isNull(superAdminSupportTickets.deletedAt));
    else conditions.push(isNotNull(superAdminSupportTickets.deletedAt));

    if (status && status !== "all") conditions.push(eq(superAdminSupportTickets.status, status));
    if (search) {
      conditions.push(or(ilike(superAdminSupportTickets.ticketNumber, `%${search}%`), ilike(superAdminSupportTickets.subject, `%${search}%`)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db
      .select()
      .from(superAdminSupportTickets)
      .where(whereClause)
      .orderBy(desc(superAdminSupportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(superAdminSupportTickets)
      .where(whereClause);

    return { data: results, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async updateTicketStatus(id: string, newStatus: string) {
    const [updated] = await db
      .update(superAdminSupportTickets)
      .set({
        status: newStatus,
        resolvedAt: newStatus === "Resolved" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(superAdminSupportTickets.id, id))
      .returning();
    return updated;
  }

  async softDeleteTicket(id: string) {
    await db.update(superAdminSupportTickets).set({ deletedAt: new Date() }).where(eq(superAdminSupportTickets.id, id));
  }

  async restoreTicket(id: string) {
    await db.update(superAdminSupportTickets).set({ deletedAt: null }).where(eq(superAdminSupportTickets.id, id));
  }
}
