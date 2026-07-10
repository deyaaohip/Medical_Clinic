import { db } from "@/db";
import {
  tenants,
  clinicBranches,
  patients,
  staffProfiles,
  users,
  auditLogs,
  radiologyProcedures,
  radiologyOrders,
  radiologyDicomStudies,
  radiologyReports,
  radiologyComparisons,
  radiologyAttachments,
  insuranceCompanies,
  insurancePlans,
  patientInsurancePolicies,
  insuranceBillingRules,
  insuranceAuthorizations,
  insuranceClaims,
  insuranceClaimItems,
  insuranceInvoices,
  insuranceAttachments,
} from "@/db/schema";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";

export class DiagnosticRevenueService {
  private async tenantId(slugOrId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
    const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(isUuid ? eq(tenants.id, slugOrId) : eq(tenants.slug, slugOrId)).limit(1);
    if (!tenant) throw new Error("Tenant was not found.");
    return tenant.id;
  }

  async getContext(slugOrId: string) {
    const tenantId = await this.tenantId(slugOrId);
    const [patientRows, doctorRows, branchRows, procedureRows, companyRows, planRows, policyRows] = await Promise.all([
      db.select().from(patients).where(and(eq(patients.tenantId, tenantId), isNull(patients.deletedAt))).orderBy(patients.fullName),
      db.select({ id: staffProfiles.id, fullName: users.fullName, specialization: staffProfiles.specialization, licenseNumber: staffProfiles.licenseNumber }).from(staffProfiles).innerJoin(users, eq(staffProfiles.userId, users.id)).where(and(eq(staffProfiles.tenantId, tenantId), eq(staffProfiles.staffType, "Doctor"), isNull(staffProfiles.deletedAt))).orderBy(users.fullName),
      db.select().from(clinicBranches).where(and(eq(clinicBranches.tenantId, tenantId), isNull(clinicBranches.deletedAt))).orderBy(clinicBranches.name),
      db.select().from(radiologyProcedures).where(eq(radiologyProcedures.isActive, true)).orderBy(radiologyProcedures.modality, radiologyProcedures.name),
      db.select().from(insuranceCompanies).where(and(eq(insuranceCompanies.tenantId, tenantId), isNull(insuranceCompanies.deletedAt))).orderBy(insuranceCompanies.name),
      db.select().from(insurancePlans).where(and(eq(insurancePlans.tenantId, tenantId), isNull(insurancePlans.deletedAt))).orderBy(insurancePlans.name),
      db.select({ policy: patientInsurancePolicies, patient: patients, company: insuranceCompanies, plan: insurancePlans }).from(patientInsurancePolicies).innerJoin(patients, eq(patientInsurancePolicies.patientId, patients.id)).innerJoin(insuranceCompanies, eq(patientInsurancePolicies.insuranceCompanyId, insuranceCompanies.id)).innerJoin(insurancePlans, eq(patientInsurancePolicies.insurancePlanId, insurancePlans.id)).where(and(eq(patientInsurancePolicies.tenantId, tenantId), isNull(patientInsurancePolicies.deletedAt))).orderBy(patients.fullName),
    ]);
    return {
      tenantId,
      patients: patientRows,
      doctors: doctorRows,
      branches: branchRows,
      procedures: procedureRows,
      companies: companyRows,
      plans: planRows,
      policies: policyRows.map(({ policy, patient, company, plan }) => ({ ...policy, patientName: patient.fullName, patientMrn: patient.medicalRecordNumber, companyName: company.name, planName: plan.name, coveragePercent: plan.defaultCoveragePercent })),
    };
  }

  // -------------------------------------------------------------------------
  // Radiology / PACS
  // -------------------------------------------------------------------------
  async getRadiologyOrders(slugOrId: string, modality?: string, patientId?: string) {
    const tenantId = await this.tenantId(slugOrId);
    const conditions: any[] = [eq(radiologyOrders.tenantId, tenantId), isNull(radiologyOrders.deletedAt)];
    if (patientId) conditions.push(eq(radiologyOrders.patientId, patientId));
    if (modality && modality !== "all") conditions.push(eq(radiologyProcedures.modality, modality));
    const rows = await db
      .select({ order: radiologyOrders, patient: patients, doctor: users, branch: clinicBranches, procedure: radiologyProcedures })
      .from(radiologyOrders)
      .innerJoin(patients, eq(radiologyOrders.patientId, patients.id))
      .innerJoin(staffProfiles, eq(radiologyOrders.orderingDoctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .innerJoin(clinicBranches, eq(radiologyOrders.branchId, clinicBranches.id))
      .innerJoin(radiologyProcedures, eq(radiologyOrders.procedureId, radiologyProcedures.id))
      .where(and(...conditions))
      .orderBy(desc(radiologyOrders.orderedAt));
    const ids = rows.map((row) => row.order.id);
    const [studies, reportRows, attachmentRows, comparisonRows] = await Promise.all([
      ids.length ? db.select().from(radiologyDicomStudies).where(and(inArray(radiologyDicomStudies.radiologyOrderId, ids), isNull(radiologyDicomStudies.deletedAt))) : Promise.resolve([]),
      ids.length ? db.select({ report: radiologyReports, radiologist: users }).from(radiologyReports).innerJoin(staffProfiles, eq(radiologyReports.radiologistId, staffProfiles.id)).innerJoin(users, eq(staffProfiles.userId, users.id)).where(inArray(radiologyReports.radiologyOrderId, ids)) : Promise.resolve([]),
      ids.length ? db.select().from(radiologyAttachments).where(and(inArray(radiologyAttachments.radiologyOrderId, ids), isNull(radiologyAttachments.deletedAt))) : Promise.resolve([]),
      ids.length ? db.select().from(radiologyComparisons).where(inArray(radiologyComparisons.currentOrderId, ids)) : Promise.resolve([]),
    ]);
    return rows.map(({ order, patient, doctor, branch, procedure }) => ({
      ...order,
      patientName: patient.fullName,
      patientMrn: patient.medicalRecordNumber,
      patientGender: patient.gender,
      patientDob: patient.dateOfBirth,
      doctorName: doctor.fullName,
      branchName: branch.name,
      procedure,
      studies: studies.filter((study) => study.radiologyOrderId === order.id),
      reports: reportRows.filter((row) => row.report.radiologyOrderId === order.id).map((row) => ({ ...row.report, radiologistName: row.radiologist.fullName })),
      attachments: attachmentRows.filter((file) => file.radiologyOrderId === order.id),
      comparisons: comparisonRows.filter((comparison) => comparison.currentOrderId === order.id),
    }));
  }

  async createRadiologyOrder(slugOrId: string, input: any, actorUserId?: string) {
    const tenantId = await this.tenantId(slugOrId);
    const orderNumber = `RAD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const accessionNumber = `ACC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const [created] = await db.insert(radiologyOrders).values({
      tenantId,
      branchId: input.branchId,
      patientId: input.patientId,
      orderingDoctorId: input.orderingDoctorId,
      encounterId: input.encounterId || null,
      procedureId: input.procedureId,
      orderNumber,
      accessionNumber,
      clinicalIndication: input.clinicalIndication,
      priority: input.priority || "Routine",
      status: input.scheduledAt ? "Scheduled" : "Ordered",
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      contrastRequested: !!input.contrastRequested,
      pregnancyScreening: input.pregnancyScreening,
    }).returning();
    await this.audit(tenantId, actorUserId, "RADIOLOGY_ORDER_CREATED", "RadiologyOrder", created.id, { orderNumber, accessionNumber });
    return created;
  }

  async updateRadiologyOrder(slugOrId: string, orderId: string, input: any, actorUserId?: string) {
    const tenantId = await this.tenantId(slugOrId);
    if (input.action === "upload-dicom") {
      const [study] = await db.insert(radiologyDicomStudies).values({
        tenantId,
        radiologyOrderId: orderId,
        studyInstanceUid: input.studyInstanceUid || `2.25.${Date.now()}${Math.floor(Math.random() * 10000)}`,
        seriesInstanceUid: input.seriesInstanceUid || `2.25.${Date.now()}${Math.floor(Math.random() * 100000)}`,
        sopClassUid: input.sopClassUid || "1.2.840.10008.5.1.4.1.1.2",
        modality: input.modality,
        seriesDescription: input.seriesDescription,
        bodyPart: input.bodyPart,
        instanceCount: Number(input.instanceCount) || 1,
        storageUrl: input.storageUrl,
        thumbnailUrl: input.thumbnailUrl,
      }).returning();
      await db.update(radiologyOrders).set({ status: "Images Available", completedAt: new Date(), updatedAt: new Date() }).where(and(eq(radiologyOrders.id, orderId), eq(radiologyOrders.tenantId, tenantId)));
      if (input.attachmentUrl) await db.insert(radiologyAttachments).values({ tenantId, radiologyOrderId: orderId, fileName: input.attachmentName || "radiology-document.pdf", fileUrl: input.attachmentUrl, mimeType: input.attachmentMimeType || "application/pdf", category: input.attachmentCategory || "Supporting Document" });
      await this.audit(tenantId, actorUserId, "DICOM_STUDY_UPLOADED", "RadiologyOrder", orderId, { studyInstanceUid: study.studyInstanceUid, instanceCount: study.instanceCount });
      return study;
    }
    if (input.action === "report") {
      const [report] = await db.insert(radiologyReports).values({
        tenantId,
        radiologyOrderId: orderId,
        radiologistId: input.radiologistId,
        findings: input.findings,
        impression: input.impression,
        recommendations: input.recommendations,
        status: input.radiologistSignature ? "Final" : "Preliminary",
        radiologistSignature: input.radiologistSignature,
        reportedAt: new Date(),
      }).returning();
      await db.update(radiologyOrders).set({ status: "Reported", updatedAt: new Date() }).where(and(eq(radiologyOrders.id, orderId), eq(radiologyOrders.tenantId, tenantId)));
      if (input.priorOrderId) await db.insert(radiologyComparisons).values({ tenantId, currentOrderId: orderId, priorOrderId: input.priorOrderId, comparisonNotes: input.comparisonNotes || "Compared with prior study.", createdByStaffId: input.radiologistId });
      await this.audit(tenantId, actorUserId, "RADIOLOGY_REPORT_SIGNED", "RadiologyOrder", orderId, { reportId: report.id });
      return report;
    }
    if (input.action === "doctor-review") {
      const [report] = await db.update(radiologyReports).set({ reviewedByDoctorId: input.doctorId, reviewedAt: new Date(), doctorReviewNotes: input.reviewNotes, updatedAt: new Date() }).where(and(eq(radiologyReports.id, input.reportId), eq(radiologyReports.tenantId, tenantId))).returning();
      await db.update(radiologyOrders).set({ status: "Doctor Reviewed", updatedAt: new Date() }).where(and(eq(radiologyOrders.id, orderId), eq(radiologyOrders.tenantId, tenantId)));
      await this.audit(tenantId, actorUserId, "RADIOLOGY_DOCTOR_REVIEWED", "RadiologyOrder", orderId, { reportId: input.reportId });
      return report;
    }
    throw new Error("Unsupported radiology transition.");
  }

  // -------------------------------------------------------------------------
  // Insurance / Revenue Cycle
  // -------------------------------------------------------------------------
  async getInsuranceDashboard(slugOrId: string) {
    const tenantId = await this.tenantId(slugOrId);
    const [context, authorizationRows, claimRows, invoiceRows, ruleRows] = await Promise.all([
      this.getContext(slugOrId),
      db.select({ authorization: insuranceAuthorizations, patient: patients, policy: patientInsurancePolicies, company: insuranceCompanies }).from(insuranceAuthorizations).innerJoin(patients, eq(insuranceAuthorizations.patientId, patients.id)).innerJoin(patientInsurancePolicies, eq(insuranceAuthorizations.patientPolicyId, patientInsurancePolicies.id)).innerJoin(insuranceCompanies, eq(patientInsurancePolicies.insuranceCompanyId, insuranceCompanies.id)).where(and(eq(insuranceAuthorizations.tenantId, tenantId), isNull(insuranceAuthorizations.deletedAt))).orderBy(desc(insuranceAuthorizations.submittedAt)),
      db.select({ claim: insuranceClaims, patient: patients, policy: patientInsurancePolicies, company: insuranceCompanies, plan: insurancePlans }).from(insuranceClaims).innerJoin(patients, eq(insuranceClaims.patientId, patients.id)).innerJoin(patientInsurancePolicies, eq(insuranceClaims.patientPolicyId, patientInsurancePolicies.id)).innerJoin(insuranceCompanies, eq(patientInsurancePolicies.insuranceCompanyId, insuranceCompanies.id)).innerJoin(insurancePlans, eq(patientInsurancePolicies.insurancePlanId, insurancePlans.id)).where(and(eq(insuranceClaims.tenantId, tenantId), isNull(insuranceClaims.deletedAt))).orderBy(desc(insuranceClaims.createdAt)),
      db.select().from(insuranceInvoices).where(and(eq(insuranceInvoices.tenantId, tenantId), isNull(insuranceInvoices.deletedAt))).orderBy(desc(insuranceInvoices.issuedAt)),
      db.select().from(insuranceBillingRules).where(and(eq(insuranceBillingRules.tenantId, tenantId), isNull(insuranceBillingRules.deletedAt))).orderBy(insuranceBillingRules.serviceCategory),
    ]);
    const claimIds = claimRows.map((row) => row.claim.id);
    const [items, attachments] = await Promise.all([
      claimIds.length ? db.select().from(insuranceClaimItems).where(inArray(insuranceClaimItems.claimId, claimIds)) : Promise.resolve([]),
      claimIds.length ? db.select().from(insuranceAttachments).where(and(inArray(insuranceAttachments.claimId, claimIds), isNull(insuranceAttachments.deletedAt))) : Promise.resolve([]),
    ]);
    return {
      ...context,
      authorizations: authorizationRows.map(({ authorization, patient, policy, company }) => ({ ...authorization, patientName: patient.fullName, patientMrn: patient.medicalRecordNumber, policyNumber: policy.policyNumber, companyName: company.name })),
      claims: claimRows.map(({ claim, patient, policy, company, plan }) => ({ ...claim, patientName: patient.fullName, patientMrn: patient.medicalRecordNumber, policyNumber: policy.policyNumber, companyName: company.name, planName: plan.name, items: items.filter((item) => item.claimId === claim.id), attachments: attachments.filter((item) => item.claimId === claim.id) })),
      invoices: invoiceRows,
      billingRules: ruleRows,
    };
  }

  async createInsuranceEntity(slugOrId: string, module: string, input: any, actorUserId?: string) {
    const tenantId = await this.tenantId(slugOrId);
    if (module === "company") {
      const [created] = await db.insert(insuranceCompanies).values({ tenantId, payerCode: input.payerCode, name: input.name, companyType: input.companyType || "Commercial", phone: input.phone, email: input.email, claimsEndpoint: input.claimsEndpoint, electronicPayerId: input.electronicPayerId }).returning();
      return created;
    }
    if (module === "plan") {
      const [created] = await db.insert(insurancePlans).values({ tenantId, insuranceCompanyId: input.insuranceCompanyId, planCode: input.planCode, name: input.name, networkTier: input.networkTier, defaultCoveragePercent: Number(input.defaultCoveragePercent), defaultCoPaymentCents: Number(input.defaultCoPaymentCents), annualDeductibleCents: Number(input.annualDeductibleCents), annualLimitCents: Number(input.annualLimitCents), coverageRules: input.coverageRules || {} }).returning();
      return created;
    }
    if (module === "policy") {
      const [created] = await db.insert(patientInsurancePolicies).values({ tenantId, patientId: input.patientId, insuranceCompanyId: input.insuranceCompanyId, insurancePlanId: input.insurancePlanId, policyNumber: input.policyNumber, memberId: input.memberId, groupNumber: input.groupNumber, holderName: input.holderName, relationshipToHolder: input.relationshipToHolder || "Self", coverageStart: new Date(input.coverageStart), coverageEnd: new Date(input.coverageEnd), coPaymentCents: Number(input.coPaymentCents), status: "Active", eligibilityVerifiedAt: new Date() }).returning();
      return created;
    }
    if (module === "authorization") {
      const authorizationNumber = `AUTH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const [created] = await db.insert(insuranceAuthorizations).values({ tenantId, patientPolicyId: input.patientPolicyId, patientId: input.patientId, encounterId: input.encounterId || null, authorizationNumber, serviceType: input.serviceType, diagnosisCodes: input.diagnosisCodes || [], requestedAmountCents: Number(input.requestedAmountCents), status: "Pending", expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }).returning();
      await this.audit(tenantId, actorUserId, "INSURANCE_AUTH_REQUESTED", "InsuranceAuthorization", created.id, { authorizationNumber });
      return created;
    }
    if (module === "claim") {
      const [policyRow] = await db.select({ policy: patientInsurancePolicies, plan: insurancePlans }).from(patientInsurancePolicies).innerJoin(insurancePlans, eq(patientInsurancePolicies.insurancePlanId, insurancePlans.id)).where(and(eq(patientInsurancePolicies.id, input.patientPolicyId), eq(patientInsurancePolicies.tenantId, tenantId))).limit(1);
      if (!policyRow) throw new Error("Active patient policy was not found.");
      const serviceItems: any[] = input.items || [];
      if (!serviceItems.length) throw new Error("At least one claim service is required.");
      const total = serviceItems.reduce((sum, item) => sum + Number(item.quantity || 1) * Number(item.unitPriceCents || 0), 0);
      const coverage = Number(policyRow.plan.defaultCoveragePercent);
      const calculatedCovered = Math.round(total * coverage / 100);
      const coPay = Math.max(Number(policyRow.policy.coPaymentCents), total - calculatedCovered);
      const covered = Math.max(0, total - coPay);
      const claimNumber = `CLM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const [claim] = await db.insert(insuranceClaims).values({ tenantId, patientPolicyId: input.patientPolicyId, patientId: policyRow.policy.patientId, encounterId: input.encounterId || null, authorizationId: input.authorizationId || null, claimNumber, status: "Draft", totalAmountCents: total, coveredAmountCents: covered, patientCoPaymentCents: coPay, submissionCount: 0 }).returning();
      await db.insert(insuranceClaimItems).values(serviceItems.map((item) => { const lineTotal = Number(item.quantity || 1) * Number(item.unitPriceCents); const lineCovered = Math.round(lineTotal * coverage / 100); return { tenantId, claimId: claim.id, serviceCode: item.serviceCode, description: item.description, quantity: Number(item.quantity || 1), unitPriceCents: Number(item.unitPriceCents), coveragePercent: coverage, coveredAmountCents: lineCovered, patientResponsibilityCents: lineTotal - lineCovered, status: "Draft" }; }));
      const dueAt = new Date(); dueAt.setDate(dueAt.getDate() + 30);
      await db.insert(insuranceInvoices).values({ tenantId, claimId: claim.id, patientId: policyRow.policy.patientId, invoiceNumber: `INV-INS-${Date.now()}`, totalAmountCents: total, insuranceDueCents: covered, patientCoPaymentCents: coPay, status: "Open", dueAt });
      if (input.attachmentUrl) await db.insert(insuranceAttachments).values({ tenantId, claimId: claim.id, fileName: input.attachmentName || "claim-support.pdf", fileUrl: input.attachmentUrl, mimeType: "application/pdf", category: "Claim Support" });
      await this.audit(tenantId, actorUserId, "INSURANCE_CLAIM_CREATED", "InsuranceClaim", claim.id, { claimNumber, total, covered, coPay });
      return claim;
    }
    throw new Error("Unsupported insurance entity.");
  }

  async transitionInsurance(slugOrId: string, module: string, id: string, input: any, actorUserId?: string) {
    const tenantId = await this.tenantId(slugOrId);
    if (module === "authorization") {
      const approved = input.action === "approve";
      const [updated] = await db.update(insuranceAuthorizations).set({ status: approved ? "Approved" : "Rejected", approvedAmountCents: approved ? Number(input.approvedAmountCents) : null, externalReference: input.externalReference, rejectionReason: approved ? null : input.rejectionReason, decisionAt: new Date(), updatedAt: new Date() }).where(and(eq(insuranceAuthorizations.id, id), eq(insuranceAuthorizations.tenantId, tenantId))).returning();
      await this.audit(tenantId, actorUserId, approved ? "INSURANCE_AUTH_APPROVED" : "INSURANCE_AUTH_REJECTED", "InsuranceAuthorization", id, input);
      return updated;
    }
    if (module === "claim") {
      const [current] = await db.select().from(insuranceClaims).where(and(eq(insuranceClaims.id, id), eq(insuranceClaims.tenantId, tenantId))).limit(1);
      if (!current) throw new Error("Claim was not found.");
      if (input.action === "submit" || input.action === "resubmit") {
        const isResubmit = input.action === "resubmit";
        const [updated] = await db.update(insuranceClaims).set({ status: isResubmit ? "Resubmitted" : "Submitted", rejectionCode: null, rejectionReason: null, submissionCount: current.submissionCount + 1, submittedAt: new Date(), updatedAt: new Date() }).where(eq(insuranceClaims.id, id)).returning();
        await db.update(insuranceClaimItems).set({ status: "Submitted" }).where(eq(insuranceClaimItems.claimId, id));
        await this.audit(tenantId, actorUserId, isResubmit ? "CLAIM_RESUBMITTED" : "CLAIM_SUBMITTED", "InsuranceClaim", id, { submissionCount: current.submissionCount + 1 });
        return updated;
      }
      if (input.action === "reject") {
        const [updated] = await db.update(insuranceClaims).set({ status: "Rejected", rejectionCode: input.rejectionCode, rejectionReason: input.rejectionReason, decidedAt: new Date(), updatedAt: new Date() }).where(eq(insuranceClaims.id, id)).returning();
        await this.audit(tenantId, actorUserId, "CLAIM_REJECTED", "InsuranceClaim", id, input);
        return updated;
      }
      if (input.action === "approve") {
        const [updated] = await db.update(insuranceClaims).set({ status: "Approved", approvedAmountCents: Number(input.approvedAmountCents ?? current.coveredAmountCents), decidedAt: new Date(), updatedAt: new Date() }).where(eq(insuranceClaims.id, id)).returning();
        await db.update(insuranceInvoices).set({ insuranceDueCents: Number(input.approvedAmountCents ?? current.coveredAmountCents), updatedAt: new Date() }).where(eq(insuranceInvoices.claimId, id));
        await this.audit(tenantId, actorUserId, "CLAIM_APPROVED", "InsuranceClaim", id, input);
        return updated;
      }
      if (input.action === "mark-paid") {
        const [invoice] = await db.update(insuranceInvoices).set({ status: "Paid", paidAt: new Date(), updatedAt: new Date() }).where(and(eq(insuranceInvoices.claimId, id), eq(insuranceInvoices.tenantId, tenantId))).returning();
        await db.update(insuranceClaims).set({ status: "Paid", updatedAt: new Date() }).where(eq(insuranceClaims.id, id));
        await this.audit(tenantId, actorUserId, "INSURANCE_INVOICE_PAID", "InsuranceClaim", id, {});
        return invoice;
      }
    }
    throw new Error("Unsupported insurance transition.");
  }

  private async audit(tenantId: string, userId: string | undefined, action: string, resourceType: string, resourceId: string, metadata: Record<string, unknown>) {
    await db.insert(auditLogs).values({ tenantId, userId: userId || null, action, resourceType, resourceId, metadata, ipAddress: "server-action", userAgent: "MedSaaS Diagnostic & Revenue API" });
  }
}
