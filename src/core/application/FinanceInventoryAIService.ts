import { db } from "@/db";
import { tenants, patients, clinicBranches, staffProfiles, users, financialPackages, financialInvoices, financialPayments, financialRefunds, inventorySuppliers, inventoryWarehouses, inventoryItems, inventoryStockBatches, purchaseOrders, inventoryTransfers, aiFeatures, aiActions } from "@/db/schema";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

async function tenantIdFromSlug(slug: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return tenant?.id || slug;
}

export class FinanceInventoryAIService {
  async financeDashboard(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const [{ revenue }] = await db.select({ revenue: sql<number>`coalesce(sum(total_cents),0)::int` }).from(financialInvoices).where(and(eq(financialInvoices.tenantId, tenantId), isNull(financialInvoices.deletedAt)));
    const [{ outstanding }] = await db.select({ outstanding: sql<number>`coalesce(sum(outstanding_balance_cents),0)::int` }).from(financialInvoices).where(and(eq(financialInvoices.tenantId, tenantId), isNull(financialInvoices.deletedAt)));
    const [{ payments }] = await db.select({ payments: sql<number>`coalesce(sum(amount_cents),0)::int` }).from(financialPayments).where(eq(financialPayments.tenantId, tenantId));
    const [{ invoiceCount }] = await db.select({ invoiceCount: sql<number>`count(*)::int` }).from(financialInvoices).where(eq(financialInvoices.tenantId, tenantId));
    return { revenueUsd: revenue / 100, outstandingUsd: outstanding / 100, paymentsUsd: payments / 100, invoiceCount };
  }

  async getInvoices(tenantSlug: string, status = "all") {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const conditions: any[] = [eq(financialInvoices.tenantId, tenantId), isNull(financialInvoices.deletedAt)];
    if (status !== "all") conditions.push(eq(financialInvoices.status, status));
    const rows = await db.select({ invoice: financialInvoices, patient: patients, branch: clinicBranches }).from(financialInvoices).innerJoin(patients, eq(financialInvoices.patientId, patients.id)).innerJoin(clinicBranches, eq(financialInvoices.branchId, clinicBranches.id)).where(and(...conditions)).orderBy(desc(financialInvoices.createdAt));
    return rows.map(({ invoice, patient, branch }) => ({ ...invoice, patientName: patient.fullName, mrn: patient.medicalRecordNumber, branchName: branch.name }));
  }

  async getPayments(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    return db.select().from(financialPayments).where(eq(financialPayments.tenantId, tenantId)).orderBy(desc(financialPayments.paidAt));
  }

  async getFinancialPackages(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    return db.select().from(financialPackages).where(eq(financialPackages.tenantId, tenantId)).orderBy(financialPackages.name);
  }

  async createInvoice(tenantSlug: string, data: any) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const subtotal = Number(data.subtotalCents || 25000);
    const discount = Number(data.discountCents || 0);
    const tax = Math.round((subtotal - discount) * Number(data.taxPercent || 5) / 100);
    const total = subtotal - discount + tax;
    const insuranceCovered = Number(data.insuranceCoveredCents || 0);
    const due = total - insuranceCovered;
    const [created] = await db.insert(financialInvoices).values({ tenantId, branchId: data.branchId, patientId: data.patientId, appointmentId: data.appointmentId || null, invoiceNumber: `FIN-INV-${Math.floor(100000 + Math.random() * 900000)}`, subtotalCents: subtotal, discountCents: discount, taxCents: tax, totalCents: total, insuranceCoveredCents: insuranceCovered, patientDueCents: due, outstandingBalanceCents: due, status: due === 0 ? "Paid" : "Open" }).returning();
    return created;
  }

  async createPayment(tenantSlug: string, data: any) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const [created] = await db.insert(financialPayments).values({ tenantId, invoiceId: data.invoiceId, receiptNumber: `RCT-${Math.floor(100000 + Math.random() * 900000)}`, method: data.method || "Cash", amountCents: Number(data.amountCents || 0), gatewayReference: data.gatewayReference || null }).returning();
    const [invoice] = await db.select().from(financialInvoices).where(eq(financialInvoices.id, data.invoiceId));
    if (invoice) {
      const balance = Math.max(0, invoice.outstandingBalanceCents - created.amountCents);
      await db.update(financialInvoices).set({ outstandingBalanceCents: balance, status: balance === 0 ? "Paid" : "Partial", updatedAt: new Date() }).where(eq(financialInvoices.id, invoice.id));
    }
    return created;
  }

  async inventoryDashboard(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const [{ items }] = await db.select({ items: sql<number>`count(*)::int` }).from(inventoryItems).where(and(eq(inventoryItems.tenantId, tenantId), isNull(inventoryItems.deletedAt)));
    const [{ stock }] = await db.select({ stock: sql<number>`coalesce(sum(quantity),0)::int` }).from(inventoryStockBatches).where(eq(inventoryStockBatches.tenantId, tenantId));
    const rows = await this.getStock(tenantSlug);
    return { items, stock, lowStock: rows.filter((r: any) => r.totalQuantity <= r.lowStockThreshold).length, expiringSoon: rows.filter((r: any) => r.expiryDate && new Date(r.expiryDate).getTime() < Date.now() + 90 * 86400000).length };
  }

  async getStock(tenantSlug: string, search = "") {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const conditions: any[] = [eq(inventoryItems.tenantId, tenantId), isNull(inventoryItems.deletedAt)];
    if (search) conditions.push(or(ilike(inventoryItems.name, `%${search}%`), ilike(inventoryItems.sku, `%${search}%`), ilike(inventoryItems.barcode, `%${search}%`)));
    const rows = await db.select({ item: inventoryItems, batch: inventoryStockBatches, warehouse: inventoryWarehouses }).from(inventoryItems).leftJoin(inventoryStockBatches, eq(inventoryItems.id, inventoryStockBatches.itemId)).leftJoin(inventoryWarehouses, eq(inventoryStockBatches.warehouseId, inventoryWarehouses.id)).where(and(...conditions)).orderBy(inventoryItems.name);
    const map: Record<string, any> = {};
    for (const r of rows) {
      if (!map[r.item.id]) map[r.item.id] = { ...r.item, totalQuantity: 0, batches: [], warehouseNames: new Set<string>(), expiryDate: null };
      if (r.batch) { map[r.item.id].totalQuantity += r.batch.quantity; map[r.item.id].batches.push(r.batch); map[r.item.id].expiryDate = r.batch.expiryDate; }
      if (r.warehouse) map[r.item.id].warehouseNames.add(r.warehouse.name);
    }
    return Object.values(map).map((x: any) => ({ ...x, warehouseNames: Array.from(x.warehouseNames) }));
  }

  async getSuppliers(tenantSlug: string) { const tenantId = await tenantIdFromSlug(tenantSlug); return db.select().from(inventorySuppliers).where(eq(inventorySuppliers.tenantId, tenantId)).orderBy(inventorySuppliers.name); }
  async getWarehouses(tenantSlug: string) { const tenantId = await tenantIdFromSlug(tenantSlug); return db.select().from(inventoryWarehouses).where(eq(inventoryWarehouses.tenantId, tenantId)).orderBy(inventoryWarehouses.name); }
  async getPurchaseOrders(tenantSlug: string) { const tenantId = await tenantIdFromSlug(tenantSlug); return db.select().from(purchaseOrders).where(eq(purchaseOrders.tenantId, tenantId)).orderBy(desc(purchaseOrders.createdAt)); }
  async getTransfers(tenantSlug: string) { const tenantId = await tenantIdFromSlug(tenantSlug); return db.select().from(inventoryTransfers).where(eq(inventoryTransfers.tenantId, tenantId)).orderBy(desc(inventoryTransfers.createdAt)); }

  async createInventoryItem(tenantSlug: string, data: any) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const [created] = await db.insert(inventoryItems).values({ tenantId, itemType: data.itemType || "Medical Supply", name: data.name, sku: data.sku || `SKU-${Date.now()}`, barcode: data.barcode || `BAR-${Date.now()}`, qrCode: data.qrCode || `INV-QR-${Date.now()}`, unit: data.unit || "box", lowStockThreshold: Number(data.lowStockThreshold || 10) }).returning();
    return created;
  }

  async getAIFeatures(tenantSlug: string) { const tenantId = await tenantIdFromSlug(tenantSlug); return db.select().from(aiFeatures).where(eq(aiFeatures.tenantId, tenantId)).orderBy(aiFeatures.name); }
  async getAIActions(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const rows = await db.select({ action: aiActions, patient: patients, doctorProfile: staffProfiles, doctorUser: users }).from(aiActions).leftJoin(patients, eq(aiActions.patientId, patients.id)).leftJoin(staffProfiles, eq(aiActions.doctorId, staffProfiles.id)).leftJoin(users, eq(staffProfiles.userId, users.id)).where(eq(aiActions.tenantId, tenantId)).orderBy(desc(aiActions.createdAt)).limit(100);
    return rows.map(({ action, patient, doctorUser }) => ({ ...action, patientName: patient?.fullName || "No patient", doctorName: doctorUser?.fullName || "Pending doctor" }));
  }

  async runAIAction(tenantSlug: string, data: any) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const output = `AI draft for ${data.featureKey}: This is a clinical decision-support suggestion only. It must be reviewed, edited, and approved by the physician before use or patient visibility.`;
    const [created] = await db.insert(aiActions).values({ tenantId, patientId: data.patientId || null, doctorId: data.doctorId || null, featureKey: data.featureKey, promptSummary: data.promptSummary || "Clinical context provided by user", outputText: output, confidenceScore: Number(data.confidenceScore || 0.82), sources: ["Patient chart context", "Clinic encounter notes"], medicalReferences: ["WHO clinical safety guidance", "UpToDate-style physician-reviewed references", "FDA medication safety communications"], reviewRequired: true, doctorApprovalRequired: true, status: "PendingDoctorReview", patientVisible: false }).returning();
    return created;
  }

  async approveAIAction(actionId: string) { const [updated] = await db.update(aiActions).set({ doctorApprovedAt: new Date(), status: "DoctorApproved", patientVisible: true }).where(eq(aiActions.id, actionId)).returning(); return updated; }
}