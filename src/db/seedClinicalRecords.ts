import { db } from "./index";
import { eq } from "drizzle-orm";
import {
  tenants,
  clinicBranches,
  staffProfiles,
  users,
  patients,
  emrTemplates,
  emrEncounters,
  medicineDatabase,
  prescriptionTemplates,
  prescriptions,
  prescriptionItems,
  labPackages,
  labOrders,
  labOrderTests,
} from "./schema";

export async function runClinicalRecordsSeed() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "al-shifa"));
  if (!tenant) return;
  const [branch] = await db.select().from(clinicBranches).where(eq(clinicBranches.tenantId, tenant.id));
  const [doctor] = await db.select().from(staffProfiles).where(eq(staffProfiles.tenantId, tenant.id));
  const [patient] = await db.select().from(patients).where(eq(patients.tenantId, tenant.id));
  if (!branch || !doctor || !patient) return;

  const [template] = await db.insert(emrTemplates).values({
    tenantId: tenant.id,
    name: "General SOAP Template",
    specialty: "Family Medicine",
    templateType: "SOAP",
    contentSchema: { subjective: "History", objective: "Examination", assessment: "Diagnosis", plan: "Treatment" },
  }).onConflictDoNothing().returning();

  const [encounter] = await db.insert(emrEncounters).values({
    tenantId: tenant.id,
    branchId: branch.id,
    patientId: patient.id,
    doctorId: doctor.id,
    encounterNumber: "EMR-2026-100001",
    chiefComplaint: "Fever, cough and sore throat",
    subjective: "Patient reports three days of fever and nonproductive cough.",
    objective: "Temperature 38.1C. Chest clear. Mild pharyngeal erythema.",
    assessment: "Likely viral upper respiratory tract infection.",
    treatmentPlan: "Supportive care, hydration, antipyretics, return precautions.",
    physicalExamination: "General appearance stable, chest clear, heart sounds normal.",
    diagnosisText: "Acute upper respiratory infection",
    icd10Codes: ["J06.9", "R50.9"],
    progressNotes: "Patient stable and discharged home.",
    clinicalNotes: "Reviewed warning signs and follow-up plan.",
    followUpInstructions: "Follow up in 7 days if no improvement.",
    followUpDate: new Date("2026-03-01"),
    templateId: template?.id || null,
    attachments: [{ fileName: "soap-summary.pdf", url: "https://cdn.medsaas.com/emr/soap-summary.pdf" }],
    imageUrls: ["https://cdn.medsaas.com/emr/throat-image.png"],
    voiceNoteUrls: ["https://cdn.medsaas.com/emr/voice-note.mp3"],
    doctorSignatureUrl: "https://cdn.medsaas.com/signatures/dr-ahmed.svg",
    pdfReportUrl: "https://cdn.medsaas.com/emr/EMR-2026-100001.pdf",
    auditTrail: [{ action: "SIGNED", at: new Date().toISOString(), actor: "Dr. Ahmed" }],
    status: "Signed",
  }).onConflictDoNothing().returning();

  const [med1] = await db.insert(medicineDatabase).values({
    tenantId: tenant.id,
    brandName: "Augmentin",
    genericName: "Amoxicillin / Clavulanate",
    strength: "625mg",
    dosageForm: "Tablet",
    route: "Oral",
    interactions: ["Warfarin", "Methotrexate"],
    allergyWarnings: ["Penicillin allergy"],
    genericAlternatives: ["Co-amoxiclav", "Amoclav"],
  }).onConflictDoNothing().returning();

  await db.insert(medicineDatabase).values({
    tenantId: tenant.id,
    brandName: "Panadol",
    genericName: "Paracetamol",
    strength: "500mg",
    dosageForm: "Tablet",
    route: "Oral",
    interactions: ["Alcohol", "Warfarin high-dose"],
    allergyWarnings: [],
    genericAlternatives: ["Acetaminophen", "Tylenol"],
  }).onConflictDoNothing();

  await db.insert(prescriptionTemplates).values({
    tenantId: tenant.id,
    name: "URI Supportive Care",
    diagnosisContext: "J06.9",
    itemsSchema: [{ medicineName: "Paracetamol", dosage: "500mg", frequency: "Every 8 hours", duration: "5 days" }],
  }).onConflictDoNothing();

  const [rx] = await db.insert(prescriptions).values({
    tenantId: tenant.id,
    branchId: branch.id,
    patientId: patient.id,
    encounterId: encounter?.id || null,
    doctorId: doctor.id,
    prescriptionNumber: "RX-2026-100001",
    diagnosisSummary: "Acute URI symptomatic management",
    refillAllowed: true,
    refillCount: 1,
    allergyCheckStatus: "Warning",
    interactionCheckStatus: "Passed",
    electronicSignatureUrl: "https://cdn.medsaas.com/signatures/erx.svg",
    pdfUrl: "https://cdn.medsaas.com/rx/RX-2026-100001.pdf",
    qrVerificationToken: "QR-ALSHIFA-100001",
  }).onConflictDoNothing().returning();
  if (rx) await db.insert(prescriptionItems).values({ tenantId: tenant.id, prescriptionId: rx.id, medicineId: med1?.id || null, medicineName: "Augmentin", dosage: "625mg", frequency: "Every 12 hours", duration: "7 days", instructions: "Take with food.", genericAlternativeSelected: "Co-amoxiclav" }).onConflictDoNothing();

  const [pkg] = await db.insert(labPackages).values({ tenantId: tenant.id, name: "Fever Workup Package", code: "LAB-FEVER-01", tests: ["CBC", "CRP", "HbA1c"], priceCents: 8500 }).onConflictDoNothing().returning();
  const [lab] = await db.insert(labOrders).values({
    tenantId: tenant.id,
    branchId: branch.id,
    patientId: patient.id,
    encounterId: encounter?.id || null,
    doctorId: doctor.id,
    orderNumber: "LAB-2026-100001",
    packageId: pkg?.id || null,
    priority: "Urgent",
    status: "ResultEntered",
    clinicalIndication: "Fever and diabetes follow-up screening.",
    sampleCollectedAt: new Date(),
    notificationStatus: "Pending",
    pdfReportUrl: "https://cdn.medsaas.com/lab/LAB-2026-100001.pdf",
  }).onConflictDoNothing().returning();
  if (lab) {
    await db.insert(labOrderTests).values([
      { tenantId: tenant.id, labOrderId: lab.id, testName: "CBC - WBC", loincCode: "6690-2", sampleType: "Blood", referenceRange: "4.0-11.0", unit: "10^9/L", resultValue: "13.4", abnormalFlag: "Abnormal", resultEnteredAt: new Date() },
      { tenantId: tenant.id, labOrderId: lab.id, testName: "CRP", loincCode: "1988-5", sampleType: "Blood", referenceRange: "0-5", unit: "mg/L", resultValue: "18", abnormalFlag: "Abnormal", resultEnteredAt: new Date() },
      { tenantId: tenant.id, labOrderId: lab.id, testName: "HbA1c", loincCode: "4548-4", sampleType: "Blood", referenceRange: "4.0-5.6", unit: "%", resultValue: "6.9", abnormalFlag: "Abnormal", resultEnteredAt: new Date() },
    ]).onConflictDoNothing();
  }
}

runClinicalRecordsSeed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });