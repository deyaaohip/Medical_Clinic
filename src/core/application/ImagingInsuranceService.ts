import { db } from "@/db";
import { tenants, users, patients, staffProfiles, clinicBranches, radiologyOrders, radiologyImages, radiologyAttachments, insuranceCompanies, insurancePolicies, insuranceApprovalRequests, insuranceClaims } from "@/db/schema";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

async function tenantIdFromSlug(slug: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return tenant?.id || slug;
}

export class ImagingInsuranceService {
  async getRadiologyOrders(tenantSlug: string, status = "all", modality = "all", search = "") {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const conditions: any[] = [eq(radiologyOrders.tenantId, tenantId), isNull(radiologyOrders.deletedAt)];
    if (status !== "all") conditions.push(eq(radiologyOrders.status, status));
    if (modality !== "all") conditions.push(eq(radiologyOrders.modality, modality));
    if (search) conditions.push(or(ilike(patients.fullName, `%${search}%`), ilike(radiologyOrders.orderNumber, `%${search}%`), ilike(radiologyOrders.bodyPart, `%${search}%`)));
    const rows = await db.select({ order: radiologyOrders, patient: patients, doctorProfile: staffProfiles, doctorUser: users })
      .from(radiologyOrders)
      .innerJoin(patients, eq(radiologyOrders.patientId, patients.id))
      .innerJoin(staffProfiles, eq(radiologyOrders.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .where(and(...conditions)).orderBy(desc(radiologyOrders.createdAt)).limit(100);
    const result = [];
    for (const row of rows) {
      const images = await db.select().from(radiologyImages).where(and(eq(radiologyImages.radiologyOrderId, row.order.id), isNull(radiologyImages.deletedAt)));
      const attachments = await db.select().from(radiologyAttachments).where(eq(radiologyAttachments.radiologyOrderId, row.order.id));
      result.push({ ...row.order, patientName: row.patient.fullName, mrn: row.patient.medicalRecordNumber, doctorName: row.doctorUser.fullName, images, attachments });
    }
    return result;
  }

  async createRadiologyOrder(tenantSlug: string, data: any) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const orderNumber = `RAD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [created] = await db.insert(radiologyOrders).values({
      tenantId,
      branchId: data.branchId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      encounterId: data.encounterId || null,
      orderNumber,
      modality: data.modality || "X-Ray",
      bodyPart: data.bodyPart || "Chest",
      clinicalIndication: data.clinicalIndication || "Clinical imaging requested.",
      priority: data.priority || "Routine",
      status: "Ordered",
      dicomStudyUid: `1.2.840.${Date.now()}`,
      viewerUrl: `https://viewer.medsaas.com/studies/${orderNumber}`,
      reportPdfUrl: `https://cdn.medsaas.com/radiology/${orderNumber}.pdf`,
      historySnapshot: [{ action: "ORDER_CREATED", at: new Date().toISOString() }],
    }).returning();
    return created;
  }

  async updateRadiologyStatus(orderId: string, data: any) {
    const [order] = await db.select().from(radiologyOrders).where(eq(radiologyOrders.id, orderId)).limit(1);
    if (!order) throw new Error("Radiology order not found");
    if (data.status === "ImageUploaded") {
      await db.insert(radiologyImages).values({ tenantId: order.tenantId, radiologyOrderId: order.id, fileName: `${order.modality}_${order.bodyPart}_series.dcm`, fileUrl: `https://cdn.medsaas.com/dicom/${order.orderNumber}.dcm`, mimeType: "application/dicom", fileSizeBytes: 52428800, imageType: "DICOM", seriesUid: `2.25.${Date.now()}` });
    }
    const [updated] = await db.update(radiologyOrders).set({ status: data.status, radiologistReport: data.radiologistReport || order.radiologistReport, impression: data.impression || order.impression, doctorReviewNotes: data.doctorReviewNotes || order.doctorReviewNotes, doctorReviewedAt: data.status === "DoctorReviewed" ? new Date() : order.doctorReviewedAt, updatedAt: new Date(), historySnapshot: [...(order.historySnapshot as any[] || []), { action: data.status, at: new Date().toISOString() }] }).where(eq(radiologyOrders.id, orderId)).returning();
    return updated;
  }

  async getInsuranceDashboard(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const [{ companies }] = await db.select({ companies: sql<number>`count(*)::int` }).from(insuranceCompanies).where(eq(insuranceCompanies.tenantId, tenantId));
    const [{ approvals }] = await db.select({ approvals: sql<number>`count(*)::int` }).from(insuranceApprovalRequests).where(eq(insuranceApprovalRequests.tenantId, tenantId));
    const [{ claims }] = await db.select({ claims: sql<number>`count(*)::int` }).from(insuranceClaims).where(and(eq(insuranceClaims.tenantId, tenantId), isNull(insuranceClaims.deletedAt)));
    const [{ rejected }] = await db.select({ rejected: sql<number>`count(*)::int` }).from(insuranceClaims).where(and(eq(insuranceClaims.tenantId, tenantId), eq(insuranceClaims.status, "Rejected")));
    return { companies, approvals, claims, rejected };
  }

  async getInsuranceCompanies(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    return db.select().from(insuranceCompanies).where(and(eq(insuranceCompanies.tenantId, tenantId), isNull(insuranceCompanies.deletedAt))).orderBy(insuranceCompanies.name);
  }

  async getPolicies(tenantSlug: string) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const rows = await db.select({ policy: insurancePolicies, patient: patients, company: insuranceCompanies }).from(insurancePolicies).innerJoin(patients, eq(insurancePolicies.patientId, patients.id)).innerJoin(insuranceCompanies, eq(insurancePolicies.companyId, insuranceCompanies.id)).where(and(eq(insurancePolicies.tenantId, tenantId), isNull(insurancePolicies.deletedAt))).orderBy(desc(insurancePolicies.createdAt));
    return rows.map(({ policy, patient, company }) => ({ ...policy, patientName: patient.fullName, mrn: patient.medicalRecordNumber, companyName: company.name }));
  }

  async getApprovalRequests(tenantSlug: string, status = "all") {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const conditions: any[] = [eq(insuranceApprovalRequests.tenantId, tenantId)];
    if (status !== "all") conditions.push(eq(insuranceApprovalRequests.status, status));
    const rows = await db.select({ approval: insuranceApprovalRequests, patient: patients }).from(insuranceApprovalRequests).innerJoin(patients, eq(insuranceApprovalRequests.patientId, patients.id)).where(and(...conditions)).orderBy(desc(insuranceApprovalRequests.requestedAt));
    return rows.map(({ approval, patient }) => ({ ...approval, patientName: patient.fullName, mrn: patient.medicalRecordNumber }));
  }

  async getClaims(tenantSlug: string, status = "all") {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const conditions: any[] = [eq(insuranceClaims.tenantId, tenantId), isNull(insuranceClaims.deletedAt)];
    if (status !== "all") conditions.push(eq(insuranceClaims.status, status));
    const rows = await db.select({ claim: insuranceClaims, patient: patients, policy: insurancePolicies, company: insuranceCompanies }).from(insuranceClaims).innerJoin(patients, eq(insuranceClaims.patientId, patients.id)).innerJoin(insurancePolicies, eq(insuranceClaims.policyId, insurancePolicies.id)).innerJoin(insuranceCompanies, eq(insurancePolicies.companyId, insuranceCompanies.id)).where(and(...conditions)).orderBy(desc(insuranceClaims.submittedAt));
    return rows.map(({ claim, patient, company }) => ({ ...claim, patientName: patient.fullName, companyName: company.name, mrn: patient.medicalRecordNumber }));
  }

  async createApproval(tenantSlug: string, data: any) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const [created] = await db.insert(insuranceApprovalRequests).values({ tenantId, policyId: data.policyId, patientId: data.patientId, requestedService: data.requestedService || "Radiology MRI", authorizationNumber: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`, requestedAmountCents: Number(data.requestedAmountCents || 50000), approvedAmountCents: Number(data.approvedAmountCents || 45000), status: data.status || "Authorized", notes: data.notes || "Auto authorization gateway approved." }).returning();
    return created;
  }

  async createClaim(tenantSlug: string, data: any) {
    const tenantId = await tenantIdFromSlug(tenantSlug);
    const billed = Number(data.billedAmountCents || 50000);
    const copay = Math.round(billed * 0.2);
    const [created] = await db.insert(insuranceClaims).values({ tenantId, branchId: data.branchId, patientId: data.patientId, policyId: data.policyId, approvalRequestId: data.approvalRequestId || null, invoiceNumber: `INV-INS-${Math.floor(100000 + Math.random() * 900000)}`, claimNumber: `CLM-${Math.floor(100000 + Math.random() * 900000)}`, serviceCode: data.serviceCode || "RAD-MRI-001", diagnosisCodes: data.diagnosisCodes || ["M54.5"], billedAmountCents: billed, insurancePayableCents: billed - copay, patientCopaymentCents: copay, status: data.status || "Submitted" }).returning();
    return created;
  }

  async resubmitClaim(claimId: string) {
    const [claim] = await db.select().from(insuranceClaims).where(eq(insuranceClaims.id, claimId)).limit(1);
    if (!claim) throw new Error("Claim not found");
    const [updated] = await db.update(insuranceClaims).set({ status: "Resubmitted", rejectionReason: null, resubmissionCount: claim.resubmissionCount + 1, submittedAt: new Date() }).where(eq(insuranceClaims.id, claimId)).returning();
    return updated;
  }
}