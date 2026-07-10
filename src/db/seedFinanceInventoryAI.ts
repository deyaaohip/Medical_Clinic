import { db } from "./index";
import { eq } from "drizzle-orm";
import { tenants, clinicBranches, patients, financialPackages, financialInvoices, financialPayments, inventorySuppliers, inventoryWarehouses, inventoryItems, inventoryStockBatches, purchaseOrders, inventoryTransfers, aiFeatures, aiActions, staffProfiles } from "./schema";

async function run() {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "al-shifa")); if (!tenant) return;
  const [branch] = await db.select().from(clinicBranches).where(eq(clinicBranches.tenantId, tenant.id));
  const [patient] = await db.select().from(patients).where(eq(patients.tenantId, tenant.id));
  const [doctor] = await db.select().from(staffProfiles).where(eq(staffProfiles.tenantId, tenant.id));
  if (!branch || !patient) return;
  await db.insert(financialPackages).values({ tenantId: tenant.id, name: "Executive Checkup Package", code: "PKG-EXEC", services: ["Consultation", "CBC", "ECG"], priceCents: 45000, taxPercent: 5 }).onConflictDoNothing();
  const [inv] = await db.insert(financialInvoices).values({ tenantId: tenant.id, branchId: branch.id, patientId: patient.id, invoiceNumber: "FIN-INV-100001", subtotalCents: 45000, discountCents: 5000, taxCents: 2000, totalCents: 42000, insuranceCoveredCents: 20000, patientDueCents: 22000, outstandingBalanceCents: 12000, status: "Partial" }).onConflictDoNothing().returning();
  if (inv) await db.insert(financialPayments).values({ tenantId: tenant.id, invoiceId: inv.id, receiptNumber: "RCT-100001", method: "Card", amountCents: 10000, gatewayReference: "VISA-9911" }).onConflictDoNothing();
  const [supplier] = await db.insert(inventorySuppliers).values({ tenantId: tenant.id, name: "Gulf Medical Supplies", contactName: "Supply Manager", email: "supply@gulfmed.ae", phone: "+97140001122" }).onConflictDoNothing().returning();
  const [wh] = await db.insert(inventoryWarehouses).values({ tenantId: tenant.id, branchId: branch.id, name: "Main Pharmacy Warehouse", locationCode: "DXB-PHARM-01" }).onConflictDoNothing().returning();
  const [item] = await db.insert(inventoryItems).values({ tenantId: tenant.id, itemType: "Medicine", name: "Insulin Glargine Pen", sku: "MED-INS-001", barcode: "629100000001", qrCode: "INVQR-MED-INS-001", unit: "pen", lowStockThreshold: 15 }).onConflictDoNothing().returning();
  if (item && wh) await db.insert(inventoryStockBatches).values({ tenantId: tenant.id, itemId: item.id, warehouseId: wh.id, batchNumber: "BATCH-INS-2026-A", quantity: 12, expiryDate: new Date("2026-09-01"), purchaseCostCents: 1800 }).onConflictDoNothing();
  if (supplier && wh) await db.insert(purchaseOrders).values({ tenantId: tenant.id, supplierId: supplier.id, warehouseId: wh.id, poNumber: "PO-100001", status: "Ordered", totalCents: 250000, items: [{ sku: "MED-INS-001", qty: 100 }] }).onConflictDoNothing();
  if (item && wh) await db.insert(inventoryTransfers).values({ tenantId: tenant.id, itemId: item.id, fromWarehouseId: wh.id, toWarehouseId: wh.id, quantity: 5, status: "Completed" }).onConflictDoNothing();
  const features = ["visit_summary","medical_note_generator","soap_generator","treatment_suggestions","diagnosis_suggestions","drug_interaction_analysis","prescription_review","lab_result_interpretation","radiology_report_summary","patient_risk_prediction","follow_up_suggestions","reminder_suggestions","insurance_coding_assistance","voice_to_medical_notes","medical_document_ocr","medical_report_translation"];
  for (const f of features) await db.insert(aiFeatures).values({ tenantId: tenant.id, featureKey: f, name: f.replaceAll("_", " "), description: "Physician-supervised clinical AI assist. Never replaces doctor.", requiresDoctorApproval: true }).onConflictDoNothing();
  if (patient && doctor) await db.insert(aiActions).values({ tenantId: tenant.id, patientId: patient.id, doctorId: doctor.id, featureKey: "visit_summary", promptSummary: "Summarize visit", outputText: "AI draft summary requires physician review and approval before patient visibility.", confidenceScore: 0.84, sources: ["EMR", "Vitals"], medicalReferences: ["WHO", "FDA"], reviewRequired: true, doctorApprovalRequired: true, status: "PendingDoctorReview", patientVisible: false }).onConflictDoNothing();
}
run().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});