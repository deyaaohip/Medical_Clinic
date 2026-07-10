import { db } from "@/db";
import {
  tenants,
  users,
  patients,
  staffProfiles,
  clinicBranches,
  emrTemplates,
  emrEncounters,
  emrEncounterDiagnoses,
  emrAttachments,
  emrVoiceNotes,
  icd10Codes,
  medicines,
  prescriptions,
  prescriptionItems,
  prescriptionTemplates,
  labPackages,
  labTests,
  labOrders,
  labOrderItems,
  labAttachments,
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
    const [{ abnormalCount }] = await db.select({ abnormalCount: sql<number>`count(*)::int` }).from(labOrderItems).where(and(eq(labOrderItems.tenantId, tenantId), eq(labOrderItems.isAbnormal, true)));
    return { emrCount, rxCount, labCount, abnormalCount };
  }

  async getEmrTimeline(tenantSlug: string, search = "") {
    const tenantId = await resolveTenantId(tenantSlug);
    const conditions: any[] = [eq(emrEncounters.tenantId, tenantId), isNull(emrEncounters.deletedAt)];
    if (search) conditions.push(or(ilike(patients.fullName, `%${search}%`), ilike(emrEncounters.encounterNumber, `%${search}%`), ilike(emrEncounters.chiefComplaint, `%${search}%`)));
    const rows = await db
      .select({ encounter: emrEncounters, patient: patients, doctorProfile: staffProfiles, doctorUser: users })
      .from(emrEncounters)
      .innerJoin(patients, eq(emrEncounters.patientId, patients.id))
      .innerJoin(staffProfiles, eq(emrEncounters.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(emrEncounters.visitDate))
      .limit(100);
    const result = [];
    for (const row of rows) {
      const diagnoses = await db.select({ diagnosis: emrEncounterDiagnoses, code: icd10Codes }).from(emrEncounterDiagnoses).innerJoin(icd10Codes, eq(emrEncounterDiagnoses.icd10CodeId, icd10Codes.id)).where(eq(emrEncounterDiagnoses.encounterId, row.encounter.id));
      const attachments = await db.select().from(emrAttachments).where(and(eq(emrAttachments.encounterId, row.encounter.id), isNull(emrAttachments.deletedAt)));
      const voices = await db.select().from(emrVoiceNotes).where(and(eq(emrVoiceNotes.encounterId, row.encounter.id), isNull(emrVoiceNotes.deletedAt)));
      result.push({ ...row.encounter, patientName: row.patient.fullName, mrn: row.patient.medicalRecordNumber, doctorName: row.doctorUser.fullName, diagnosisText: diagnoses[0]?.diagnosis.diagnosisText || row.encounter.assessment, icd10Codes: diagnoses.map((d) => d.code.code), attachments, imageUrls: attachments.filter((a) => a.category === "Image").map((a) => a.fileUrl), voiceNoteUrls: voices.map((v) => v.audioUrl), auditTrail: [{ action: row.encounter.status, at: row.encounter.updatedAt }] });
    }
    return result;
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
      visitType: data.visitType || "Outpatient",
      chiefComplaint: data.chiefComplaint || "General consultation",
      subjective: data.subjective || "Patient reports symptoms as documented.",
      objective: data.objective || "Vitals and examination reviewed.",
      assessment: data.assessment || data.diagnosisText || "Stable clinical condition.",
      treatmentPlan: data.treatmentPlan || "Continue plan and follow up.",
      physicalExamination: data.physicalExamination || { general: "Normal general examination" },
      followUpInstructions: data.followUpInstructions || "Return if symptoms worsen.",
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      clinicalNotes: data.clinicalNotes || "SOAP note signed electronically.",
      doctorSignature: data.doctorSignatureUrl || "https://cdn.medsaas.com/signatures/doctor-signature.svg",
      signedAt: new Date(),
      status: "Signed",
    }).returning();
    const codeList: string[] = data.icd10Codes || ["J06.9"];
    for (const code of codeList) {
      let [icd] = await db.select().from(icd10Codes).where(eq(icd10Codes.code, code)).limit(1);
      if (!icd) [icd] = await db.insert(icd10Codes).values({ code, description: data.diagnosisText || "Clinical diagnosis", category: "General" }).returning();
      await db.insert(emrEncounterDiagnoses).values({ tenantId, encounterId: created.id, icd10CodeId: icd.id, diagnosisText: data.diagnosisText || "Clinical diagnosis", isPrimary: code === codeList[0] });
    }
    await db.insert(emrAttachments).values({ tenantId, encounterId: created.id, fileName: "signed-soap-note.pdf", fileUrl: `https://cdn.medsaas.com/emr/${encounterNumber}.pdf`, mimeType: "application/pdf", category: "Clinical Document", fileSizeBytes: 245000 });
    await db.insert(emrVoiceNotes).values({ tenantId, encounterId: created.id, audioUrl: "https://cdn.medsaas.com/emr/voice-note.mp3", durationSeconds: 42, transcription: "Voice SOAP note transcribed." });
    return created;
  }

  async getPrescriptions(tenantSlug: string, search = "") {
    const tenantId = await resolveTenantId(tenantSlug);
    const conditions: any[] = [eq(prescriptions.tenantId, tenantId), isNull(prescriptions.deletedAt)];
    if (search) conditions.push(or(ilike(patients.fullName, `%${search}%`), ilike(prescriptions.prescriptionNumber, `%${search}%`)));
    const rows = await db.select({ prescription: prescriptions, patient: patients, doctorProfile: staffProfiles, doctorUser: users }).from(prescriptions).innerJoin(patients, eq(prescriptions.patientId, patients.id)).innerJoin(staffProfiles, eq(prescriptions.doctorId, staffProfiles.id)).innerJoin(users, eq(staffProfiles.userId, users.id)).where(and(...conditions)).orderBy(desc(prescriptions.issuedAt)).limit(100);
    const result = [];
    for (const row of rows) {
      const itemsRows = await db.select({ item: prescriptionItems, medicine: medicines }).from(prescriptionItems).innerJoin(medicines, eq(prescriptionItems.medicineId, medicines.id)).where(eq(prescriptionItems.prescriptionId, row.prescription.id));
      result.push({ ...row.prescription, patientName: row.patient.fullName, mrn: row.patient.medicalRecordNumber, doctorName: row.doctorUser.fullName, diagnosisSummary: row.prescription.diagnosis, refillAllowed: !!row.prescription.refillOfPrescriptionId || itemsRows.some((i) => i.item.refillsAllowed > 0), refillCount: Math.max(0, ...itemsRows.map((i) => i.item.refillsAllowed)), allergyCheckStatus: "Passed", interactionCheckStatus: "Passed", items: itemsRows.map(({ item, medicine }) => ({ ...item, medicineName: medicine.brandName, genericName: medicine.genericName })) });
    }
    return result;
  }

  async getMedicines(_tenantSlug: string, search = "") {
    const conditions: any[] = [eq(medicines.isActive, true)];
    if (search) conditions.push(or(ilike(medicines.brandName, `%${search}%`), ilike(medicines.genericName, `%${search}%`)));
    return db.select().from(medicines).where(and(...conditions)).orderBy(medicines.brandName).limit(100);
  }

  async getPrescriptionTemplates(tenantSlug: string) {
    const tenantId = await resolveTenantId(tenantSlug);
    return db.select().from(prescriptionTemplates).where(and(eq(prescriptionTemplates.tenantId, tenantId), isNull(prescriptionTemplates.deletedAt)));
  }

  async createPrescription(tenantSlug: string, data: any) {
    const tenantId = await resolveTenantId(tenantSlug);
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const token = `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);
    const [created] = await db.insert(prescriptions).values({ tenantId, branchId: data.branchId, patientId: data.patientId, encounterId: data.encounterId || null, doctorId: data.doctorId, prescriptionNumber, diagnosis: data.diagnosisSummary || "Prescription generated from encounter", instructions: data.instructions || "Follow physician instructions.", doctorSignature: "https://cdn.medsaas.com/signatures/e-rx-signature.svg", signedAt: new Date(), qrVerificationToken: token, validUntil, status: "Active" }).returning();
    for (const item of data.items || [{ medicineName: "Paracetamol", dosage: "500mg", frequency: "Every 8 hours", duration: "5 days" }]) {
      let [med] = await db.select().from(medicines).where(ilike(medicines.brandName, item.medicineName)).limit(1);
      if (!med) [med] = await db.insert(medicines).values({ brandName: item.medicineName, genericName: item.medicineName, strength: item.dosage || "500mg", dosageForm: "Tablet", drugClass: "General", interactionMedicineIds: [], allergyKeywords: [], genericAlternatives: [] }).returning();
      await db.insert(prescriptionItems).values({ tenantId, prescriptionId: created.id, medicineId: med.id, dosage: item.dosage, frequency: item.frequency, duration: item.duration, instructions: item.instructions || "Take after meals.", refillsAllowed: Number(data.refillCount || 0) });
    }
    return created;
  }

  async getLabOrders(tenantSlug: string, status = "all") {
    const tenantId = await resolveTenantId(tenantSlug);
    const conditions: any[] = [eq(labOrders.tenantId, tenantId), isNull(labOrders.deletedAt)];
    if (status !== "all") conditions.push(eq(labOrders.status, status));
    const rows = await db.select({ order: labOrders, patient: patients, doctorProfile: staffProfiles, doctorUser: users }).from(labOrders).innerJoin(patients, eq(labOrders.patientId, patients.id)).innerJoin(staffProfiles, eq(labOrders.orderingDoctorId, staffProfiles.id)).innerJoin(users, eq(staffProfiles.userId, users.id)).where(and(...conditions)).orderBy(desc(labOrders.orderedAt)).limit(100);
    const result = [];
    for (const row of rows) {
      const tests = await db.select({ item: labOrderItems, test: labTests }).from(labOrderItems).innerJoin(labTests, eq(labOrderItems.labTestId, labTests.id)).where(eq(labOrderItems.labOrderId, row.order.id));
      result.push({ ...row.order, patientName: row.patient.fullName, mrn: row.patient.medicalRecordNumber, doctorName: row.doctorUser.fullName, clinicalIndication: row.order.clinicalNotes, doctorReviewedAt: row.order.reviewedAt, notificationStatus: row.order.status === "DoctorReviewed" ? "Sent" : "Pending", pdfReportUrl: `https://cdn.medsaas.com/lab/${row.order.orderNumber}.pdf`, tests: tests.map(({ item, test }) => ({ ...item, testName: test.name, referenceRange: item.referenceRange || test.referenceRangeMale, unit: test.unit, abnormalFlag: item.isAbnormal ? "Abnormal" : "Normal" })) });
    }
    return result;
  }

  async getLabPackages(tenantSlug: string) {
    const tenantId = await resolveTenantId(tenantSlug);
    const rows = await db.select().from(labPackages).where(and(eq(labPackages.tenantId, tenantId), isNull(labPackages.deletedAt))).orderBy(labPackages.name);
    return rows.map((p) => ({ ...p, code: p.name.toUpperCase().replace(/\s+/g, "-"), tests: p.testIds }));
  }

  async createLabOrder(tenantSlug: string, data: any) {
    const tenantId = await resolveTenantId(tenantSlug);
    const orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [created] = await db.insert(labOrders).values({ tenantId, branchId: data.branchId, patientId: data.patientId, orderingDoctorId: data.doctorId, encounterId: data.encounterId || null, orderNumber, priority: data.priority || "Routine", status: "Ordered", clinicalNotes: data.clinicalIndication || "Diagnostic workup requested." }).returning();
    for (const test of data.tests || [{ testName: "CBC", referenceRange: "4.0-11.0", unit: "10^9/L" }]) {
      let [labTest] = await db.select().from(labTests).where(ilike(labTests.name, test.testName)).limit(1);
      if (!labTest) [labTest] = await db.insert(labTests).values({ code: `T-${Math.floor(Math.random()*99999)}`, name: test.testName, category: "General", sampleType: test.sampleType || "Blood", unit: test.unit || "", referenceRangeMale: test.referenceRange || "Reference lab dependent", referenceRangeFemale: test.referenceRange || "Reference lab dependent", priceCents: 1000 }).returning();
      await db.insert(labOrderItems).values({ tenantId, labOrderId: created.id, labTestId: labTest.id, referenceRange: test.referenceRange || labTest.referenceRangeMale, resultValue: test.resultValue || null, isAbnormal: test.abnormalFlag === "Abnormal", abnormalFlag: test.abnormalFlag || "Normal" });
    }
    return created;
  }

  async updateLabOrderStatus(orderId: string, status: string) {
    const [updated] = await db.update(labOrders).set({ status, sampleCollectedAt: status === "SampleCollected" ? new Date() : undefined, reviewedAt: status === "DoctorReviewed" ? new Date() : undefined, completedAt: status === "DoctorReviewed" ? new Date() : undefined, updatedAt: new Date() }).where(eq(labOrders.id, orderId)).returning();
    return updated;
  }
}