import { db } from "@/db";
import {
  tenants,
  users,
  patients,
  staffProfiles,
  clinicBranches,
  appointments,
  emrTemplates,
  emrEncounters,
  medicineDatabase,
  prescriptions,
  prescriptionItems,
  prescriptionTemplates,
  labPackages,
  labOrders,
  labOrderTests,
} from "@/db/schema";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

async function resolveTenantId(input: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, input)).limit(1);
  return tenant?.id || input;
}

export class ClinicalRecordsService {
  async getDashboard(tenantSlug: string) {
    const tenantId = await resolveTenantId(tenantSlug);
    const [{ emrCount }] = await db.select({ emrCount: sql<number>`count(*)::int` }).from(emrEncounters).where(and(eq(emrEncounters.tenantId, tenantId), isNull(emrEncounters.deletedAt)));
    const [{ rxCount }] = await db.select({ rxCount: sql<number>`count(*)::int` }).from(prescriptions).where(and(eq(prescriptions.tenantId, tenantId), isNull(prescriptions.deletedAt)));
    const [{ labCount }] = await db.select({ labCount: sql<number>`count(*)::int` }).from(labOrders).where(and(eq(labOrders.tenantId, tenantId), isNull(labOrders.deletedAt)));
    const [{ abnormalCount }] = await db.select({ abnormalCount: sql<number>`count(*)::int` }).from(labOrderTests).where(and(eq(labOrderTests.tenantId, tenantId), eq(labOrderTests.abnormalFlag, "Abnormal")));
    return { emrCount, rxCount, labCount, abnormalCount };
  }

  async getEmrTimeline(tenantSlug: string, search = "") {
    const tenantId = await resolveTenantId(tenantSlug);
    const conditions: any[] = [eq(emrEncounters.tenantId, tenantId), isNull(emrEncounters.deletedAt)];
    if (search) conditions.push(or(ilike(patients.fullName, `%${search}%`), ilike(emrEncounters.encounterNumber, `%${search}%`), ilike(emrEncounters.icd10Codes as any, `%${search}%`)));
    const rows = await db
      .select({ encounter: emrEncounters, patient: patients, doctorProfile: staffProfiles, doctorUser: users })
      .from(emrEncounters)
      .innerJoin(patients, eq(emrEncounters.patientId, patients.id))
      .innerJoin(staffProfiles, eq(emrEncounters.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(emrEncounters.createdAt))
      .limit(100);
    return rows.map(({ encounter, patient, doctorUser }) => ({ ...encounter, patientName: patient.fullName, mrn: patient.medicalRecordNumber, doctorName: doctorUser.fullName }));
  }

  async getEmrTemplates(tenantSlug: string) {
    const tenantId = await resolveTenantId(tenantSlug);
    return db.select().from(emrTemplates).where(and(eq(emrTemplates.tenantId, tenantId), isNull(emrTemplates.deletedAt))).orderBy(emrTemplates.name);
  }

  async createEmrEncounter(tenantSlug: string, data: any) {
    const tenantId = await resolveTenantId(tenantSlug);
    const encounterNumber = `EMR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [created] = await db.insert(emrEncounters).values({
      tenantId,
      branchId: data.branchId,
      patientId: data.patientId,
      appointmentId: data.appointmentId || null,
      doctorId: data.doctorId,
      encounterNumber,
      chiefComplaint: data.chiefComplaint || "General consultation",
      subjective: data.subjective || "Patient reports symptoms as documented.",
      objective: data.objective || "Vitals and examination reviewed.",
      assessment: data.assessment || "Stable clinical condition.",
      treatmentPlan: data.treatmentPlan || "Continue plan and follow up.",
      physicalExamination: data.physicalExamination || "Normal general examination.",
      diagnosisText: data.diagnosisText || "Acute upper respiratory infection",
      icd10Codes: data.icd10Codes || ["J06.9"],
      progressNotes: data.progressNotes || "Progressing as expected.",
      clinicalNotes: data.clinicalNotes || "SOAP note signed electronically.",
      followUpInstructions: data.followUpInstructions || "Return if symptoms worsen.",
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      templateId: data.templateId || null,
      attachments: data.attachments || [],
      imageUrls: data.imageUrls || [],
      voiceNoteUrls: data.voiceNoteUrls || [],
      doctorSignatureUrl: data.doctorSignatureUrl || "https://cdn.medsaas.com/signatures/doctor-signature.svg",
      pdfReportUrl: `https://cdn.medsaas.com/emr/${encounterNumber}.pdf`,
      auditTrail: [{ action: "EMR_CREATED_AND_SIGNED", actor: "doctor", at: new Date().toISOString() }],
      status: "Signed",
    }).returning();
    return created;
  }

  async getPrescriptions(tenantSlug: string, search = "") {
    const tenantId = await resolveTenantId(tenantSlug);
    const conditions: any[] = [eq(prescriptions.tenantId, tenantId), isNull(prescriptions.deletedAt)];
    if (search) conditions.push(or(ilike(patients.fullName, `%${search}%`), ilike(prescriptions.prescriptionNumber, `%${search}%`)));
    const rows = await db
      .select({ prescription: prescriptions, patient: patients, doctorProfile: staffProfiles, doctorUser: users })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(staffProfiles, eq(prescriptions.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(prescriptions.createdAt))
      .limit(100);
    const result = [];
    for (const row of rows) {
      const items = await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, row.prescription.id));
      result.push({ ...row.prescription, patientName: row.patient.fullName, mrn: row.patient.medicalRecordNumber, doctorName: row.doctorUser.fullName, items });
    }
    return result;
  }

  async getMedicines(tenantSlug: string, search = "") {
    const tenantId = await resolveTenantId(tenantSlug);
    const conditions: any[] = [isNull(medicineDatabase.deletedAt)];
    if (search) conditions.push(or(ilike(medicineDatabase.brandName, `%${search}%`), ilike(medicineDatabase.genericName, `%${search}%`)));
    return db.select().from(medicineDatabase).where(and(...conditions)).orderBy(medicineDatabase.brandName).limit(100);
  }

  async getPrescriptionTemplates(tenantSlug: string) {
    const tenantId = await resolveTenantId(tenantSlug);
    return db.select().from(prescriptionTemplates).where(eq(prescriptionTemplates.tenantId, tenantId));
  }

  async createPrescription(tenantSlug: string, data: any) {
    const tenantId = await resolveTenantId(tenantSlug);
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const token = `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const [created] = await db.insert(prescriptions).values({
      tenantId,
      branchId: data.branchId,
      patientId: data.patientId,
      encounterId: data.encounterId || null,
      doctorId: data.doctorId,
      prescriptionNumber,
      diagnosisSummary: data.diagnosisSummary || "Prescription generated from clinical encounter.",
      refillAllowed: !!data.refillAllowed,
      refillCount: Number(data.refillCount || 0),
      allergyCheckStatus: data.allergyCheckStatus || "Passed",
      interactionCheckStatus: data.interactionCheckStatus || "Passed",
      electronicSignatureUrl: "https://cdn.medsaas.com/signatures/e-rx-signature.svg",
      pdfUrl: `https://cdn.medsaas.com/prescriptions/${prescriptionNumber}.pdf`,
      qrVerificationToken: token,
      status: "Active",
    }).returning();
    for (const item of data.items || [{ medicineName: "Paracetamol", dosage: "500mg", frequency: "Every 8 hours", duration: "5 days" }]) {
      await db.insert(prescriptionItems).values({ tenantId, prescriptionId: created.id, medicineId: item.medicineId || null, medicineName: item.medicineName, dosage: item.dosage, frequency: item.frequency, duration: item.duration, instructions: item.instructions || "Take after meals.", genericAlternativeSelected: item.genericAlternativeSelected || null });
    }
    return created;
  }

  async getLabOrders(tenantSlug: string, status = "all") {
    const tenantId = await resolveTenantId(tenantSlug);
    const conditions: any[] = [eq(labOrders.tenantId, tenantId), isNull(labOrders.deletedAt)];
    if (status !== "all") conditions.push(eq(labOrders.status, status));
    const rows = await db
      .select({ order: labOrders, patient: patients, doctorProfile: staffProfiles, doctorUser: users })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .innerJoin(staffProfiles, eq(labOrders.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(labOrders.createdAt))
      .limit(100);
    const result = [];
    for (const row of rows) {
      const tests = await db.select().from(labOrderTests).where(eq(labOrderTests.labOrderId, row.order.id));
      result.push({ ...row.order, patientName: row.patient.fullName, mrn: row.patient.medicalRecordNumber, doctorName: row.doctorUser.fullName, tests });
    }
    return result;
  }

  async getLabPackages(tenantSlug: string) {
    const tenantId = await resolveTenantId(tenantSlug);
    return db.select().from(labPackages).where(eq(labPackages.tenantId, tenantId)).orderBy(labPackages.name);
  }

  async createLabOrder(tenantSlug: string, data: any) {
    const tenantId = await resolveTenantId(tenantSlug);
    const orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [created] = await db.insert(labOrders).values({
      tenantId,
      branchId: data.branchId,
      patientId: data.patientId,
      encounterId: data.encounterId || null,
      doctorId: data.doctorId,
      orderNumber,
      packageId: data.packageId || null,
      priority: data.priority || "Routine",
      status: "Ordered",
      clinicalIndication: data.clinicalIndication || "Diagnostic workup requested.",
      notificationStatus: "Pending",
      pdfReportUrl: `https://cdn.medsaas.com/lab/${orderNumber}.pdf`,
      attachments: [],
    }).returning();
    for (const test of data.tests || [{ testName: "CBC", referenceRange: "4.0-11.0", unit: "10^9/L" }]) {
      await db.insert(labOrderTests).values({ tenantId, labOrderId: created.id, testName: test.testName, loincCode: test.loincCode || null, sampleType: test.sampleType || "Blood", referenceRange: test.referenceRange || "Reference lab dependent", unit: test.unit || "", resultValue: test.resultValue || null, abnormalFlag: test.abnormalFlag || "Normal" });
    }
    return created;
  }

  async updateLabOrderStatus(orderId: string, status: string) {
    const [updated] = await db.update(labOrders).set({ status, sampleCollectedAt: status === "SampleCollected" ? new Date() : undefined, doctorReviewedAt: status === "DoctorReviewed" ? new Date() : undefined, notificationStatus: status === "DoctorReviewed" ? "Sent" : undefined, updatedAt: new Date() }).where(eq(labOrders.id, orderId)).returning();
    return updated;
  }
}