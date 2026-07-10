import { db } from "./index";
import { eq, ilike } from "drizzle-orm";
import {
  tenants,
  clinicBranches,
  staffProfiles,
  patients,
  emrTemplates,
  emrEncounters,
  emrEncounterDiagnoses,
  emrAttachments,
  emrVoiceNotes,
  icd10Codes,
  medicines,
  prescriptionTemplates,
  prescriptions,
  prescriptionItems,
  labTests,
  labPackages,
  labOrders,
  labOrderItems,
} from "./schema";

export async function runClinicalRecordsSeed() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "al-shifa"));
  if (!tenant) return;
  const [branch] = await db.select().from(clinicBranches).where(eq(clinicBranches.tenantId, tenant.id));
  const [doctor] = await db.select().from(staffProfiles).where(eq(staffProfiles.tenantId, tenant.id));
  const [patient] = await db.select().from(patients).where(eq(patients.tenantId, tenant.id));
  if (!branch || !doctor || !patient) return;

  await db.insert(emrTemplates).values({
    tenantId: tenant.id,
    name: "General SOAP Template",
    specialty: "Family Medicine",
    chiefComplaint: "Fever and cough",
    subjective: "Patient reports symptoms.",
    objective: "Vitals and examination reviewed.",
    assessment: "Stable clinical condition.",
    treatmentPlan: "Supportive care and follow up.",
    physicalExamination: { general: "Normal" },
  }).onConflictDoNothing();

  const [encounter] = await db.insert(emrEncounters).values({
    tenantId: tenant.id,
    branchId: branch.id,
    patientId: patient.id,
    doctorId: doctor.id,
    encounterNumber: "EMR-2026-100001",
    visitType: "Outpatient",
    status: "Signed",
    chiefComplaint: "Fever, cough and sore throat",
    subjective: "Patient reports three days of fever and nonproductive cough.",
    objective: "Temperature 38.1C. Chest clear. Mild pharyngeal erythema.",
    assessment: "Likely viral upper respiratory tract infection.",
    treatmentPlan: "Supportive care, hydration, antipyretics, return precautions.",
    physicalExamination: { chest: "Clear", heart: "Normal S1/S2" },
    followUpInstructions: "Follow up in 7 days if no improvement.",
    followUpDate: new Date("2026-03-01"),
    clinicalNotes: "Reviewed warning signs and follow-up plan.",
    doctorSignature: "https://cdn.medsaas.com/signatures/dr-ahmed.svg",
    signedAt: new Date(),
  }).onConflictDoNothing().returning();

  let [icd] = await db.select().from(icd10Codes).where(eq(icd10Codes.code, "J06.9"));
  if (!icd) [icd] = await db.insert(icd10Codes).values({ code: "J06.9", description: "Acute upper respiratory infection, unspecified", category: "Respiratory" }).returning();
  if (encounter && icd) {
    await db.insert(emrEncounterDiagnoses).values({ tenantId: tenant.id, encounterId: encounter.id, icd10CodeId: icd.id, diagnosisText: "Acute upper respiratory infection", isPrimary: true }).onConflictDoNothing();
    await db.insert(emrAttachments).values({ tenantId: tenant.id, encounterId: encounter.id, fileName: "soap-summary.pdf", fileUrl: "https://cdn.medsaas.com/emr/soap-summary.pdf", mimeType: "application/pdf", category: "Clinical Document", fileSizeBytes: 245000 }).onConflictDoNothing();
    await db.insert(emrVoiceNotes).values({ tenantId: tenant.id, encounterId: encounter.id, audioUrl: "https://cdn.medsaas.com/emr/voice-note.mp3", durationSeconds: 42, transcription: "SOAP note dictated by physician." }).onConflictDoNothing();
  }

  let [med] = await db.select().from(medicines).where(ilike(medicines.brandName, "Panadol"));
  if (!med) [med] = await db.insert(medicines).values({ genericName: "Paracetamol", brandName: "Panadol", strength: "500mg", dosageForm: "Tablet", manufacturer: "GSK", drugClass: "Analgesic", interactionMedicineIds: [], allergyKeywords: [], genericAlternatives: ["Acetaminophen", "Tylenol"] }).returning();

  await db.insert(prescriptionTemplates).values({ tenantId: tenant.id, name: "URI Supportive Care", diagnosisLabel: "J06.9", items: [{ medicineName: "Panadol", dosage: "500mg", frequency: "Every 8 hours", duration: "5 days" }] }).onConflictDoNothing();
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 1);
  const [rx] = await db.insert(prescriptions).values({ tenantId: tenant.id, branchId: branch.id, patientId: patient.id, doctorId: doctor.id, encounterId: encounter?.id || null, prescriptionNumber: "RX-2026-100001", diagnosis: "Acute URI", instructions: "Use as directed.", status: "Active", doctorSignature: "https://cdn.medsaas.com/signatures/erx.svg", signedAt: new Date(), qrVerificationToken: "QR-ALSHIFA-100001", validUntil }).onConflictDoNothing().returning();
  if (rx && med) await db.insert(prescriptionItems).values({ tenantId: tenant.id, prescriptionId: rx.id, medicineId: med.id, dosage: "500mg", frequency: "Every 8 hours", duration: "5 days", route: "Oral", quantity: 15, refillsAllowed: 1, instructions: "Take after meals." }).onConflictDoNothing();

  let [cbc] = await db.select().from(labTests).where(eq(labTests.code, "CBC"));
  if (!cbc) [cbc] = await db.insert(labTests).values({ code: "CBC", name: "Complete Blood Count", category: "Hematology", sampleType: "Blood", unit: "10^9/L", referenceRangeMale: "4.0-11.0", referenceRangeFemale: "4.0-11.0", priceCents: 2500 }).returning();
  await db.insert(labPackages).values({ tenantId: tenant.id, name: "Fever Workup Package", description: "CBC and inflammatory markers", testIds: [cbc.id], priceCents: 8500 }).onConflictDoNothing();
  const [lab] = await db.insert(labOrders).values({ tenantId: tenant.id, branchId: branch.id, patientId: patient.id, orderingDoctorId: doctor.id, encounterId: encounter?.id || null, orderNumber: "LAB-2026-100001", priority: "Urgent", status: "ResultEntered", clinicalNotes: "Fever and screening workup.", sampleCollectedAt: new Date() }).onConflictDoNothing().returning();
  if (lab && cbc) await db.insert(labOrderItems).values({ tenantId: tenant.id, labOrderId: lab.id, labTestId: cbc.id, status: "Resulted", resultValue: "13.4", referenceRange: "4.0-11.0", isAbnormal: true, abnormalFlag: "High", resultedAt: new Date() }).onConflictDoNothing();
}

runClinicalRecordsSeed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });