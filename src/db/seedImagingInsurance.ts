import { db } from "./index";
import { eq } from "drizzle-orm";
import { tenants, clinicBranches, patients, staffProfiles, radiologyOrders, radiologyImages, radiologyAttachments, insuranceCompanies, insurancePolicies, insuranceApprovalRequests, insuranceClaims } from "./schema";

async function run() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "al-shifa"));
  if (!tenant) return;
  const [branch] = await db.select().from(clinicBranches).where(eq(clinicBranches.tenantId, tenant.id));
  const [patient] = await db.select().from(patients).where(eq(patients.tenantId, tenant.id));
  const [doctor] = await db.select().from(staffProfiles).where(eq(staffProfiles.tenantId, tenant.id));
  if (!branch || !patient || !doctor) return;

  const [rad] = await db.insert(radiologyOrders).values({
    tenantId: tenant.id, branchId: branch.id, patientId: patient.id, doctorId: doctor.id,
    orderNumber: "RAD-2026-100001", modality: "MRI", bodyPart: "Lumbar Spine",
    clinicalIndication: "Low back pain with left-sided radiculopathy. Compare with prior study if available.",
    priority: "Urgent", status: "Reported", radiologistReport: "MRI lumbar spine shows mild L4-L5 disc bulge without severe canal stenosis.",
    impression: "Mild L4-L5 degenerative disc disease. No acute compression.", dicomStudyUid: "1.2.840.113619.2.55.3.604688654.100001",
    viewerUrl: "https://viewer.medsaas.com/studies/RAD-2026-100001", reportPdfUrl: "https://cdn.medsaas.com/radiology/RAD-2026-100001.pdf",
    historySnapshot: [{ action: "ORDERED" }, { action: "DICOM_UPLOADED" }, { action: "REPORTED" }],
  }).onConflictDoNothing().returning();
  if (rad) {
    await db.insert(radiologyImages).values({ tenantId: tenant.id, radiologyOrderId: rad.id, fileName: "lumbar_spine_mri_series_01.dcm", fileUrl: "https://cdn.medsaas.com/dicom/lumbar_spine_01.dcm", mimeType: "application/dicom", fileSizeBytes: 73400320, imageType: "DICOM", seriesUid: "2.25.100001" }).onConflictDoNothing();
    await db.insert(radiologyAttachments).values({ tenantId: tenant.id, radiologyOrderId: rad.id, fileName: "radiology-report.pdf", fileUrl: "https://cdn.medsaas.com/radiology/report.pdf", category: "PDF Report" }).onConflictDoNothing();
  }

  const [company] = await db.insert(insuranceCompanies).values({
    tenantId: tenant.id, name: "Daman Health UAE Platinum", payerCode: "DAMAN-PLAT", contactEmail: "claims@daman.ae", contactPhone: "+97124189999",
    billingRules: { preAuthorizationRequired: ["MRI", "CT", "Surgery"], copayDefaultPercent: 20, resubmissionWindowDays: 30 },
  }).onConflictDoNothing().returning();
  if (!company) return;
  const [policy] = await db.insert(insurancePolicies).values({
    tenantId: tenant.id, patientId: patient.id, companyId: company.id, policyNumber: "POL-DAMAN-100001", memberId: "MEM-991122", planName: "Platinum VIP GN+",
    coverage: { outpatient: "90%", radiology: "80%", laboratory: "100%", pharmacy: "75%" }, coPaymentPercent: 20, deductibleCents: 0,
    validFrom: new Date("2026-01-01"), validTo: new Date("2027-01-01"), isPrimary: true,
  }).onConflictDoNothing().returning();
  if (!policy) return;
  const [approval] = await db.insert(insuranceApprovalRequests).values({
    tenantId: tenant.id, policyId: policy.id, patientId: patient.id, requestedService: "MRI Lumbar Spine", authorizationNumber: "AUTH-DAMAN-100001",
    requestedAmountCents: 65000, approvedAmountCents: 52000, status: "Authorized", notes: "Approved for single MRI session.", decidedAt: new Date(),
  }).onConflictDoNothing().returning();
  await db.insert(insuranceClaims).values([
    { tenantId: tenant.id, branchId: branch.id, patientId: patient.id, policyId: policy.id, approvalRequestId: approval?.id || null, invoiceNumber: "INV-INS-100001", claimNumber: "CLM-100001", serviceCode: "RAD-MRI-001", diagnosisCodes: ["M54.5"], billedAmountCents: 65000, insurancePayableCents: 52000, patientCopaymentCents: 13000, status: "Submitted" },
    { tenantId: tenant.id, branchId: branch.id, patientId: patient.id, policyId: policy.id, invoiceNumber: "INV-INS-100002", claimNumber: "CLM-100002", serviceCode: "LAB-CBC-001", diagnosisCodes: ["R50.9"], billedAmountCents: 8500, insurancePayableCents: 0, patientCopaymentCents: 8500, status: "Rejected", rejectionReason: "Missing pre-authorization document.", resubmissionCount: 0 },
  ]).onConflictDoNothing();
}
run().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1);});