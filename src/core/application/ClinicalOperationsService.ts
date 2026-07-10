import { db } from "@/db";
import {
  tenants,
  clinicBranches,
  patients,
  patientMedicalRecords,
  staffProfiles,
  users,
  auditLogs,
  notifications,
  icd10Codes,
  emrTemplates,
  emrEncounters,
  emrEncounterDiagnoses,
  emrAttachments,
  emrVoiceNotes,
  medicines,
  prescriptionTemplates,
  prescriptions,
  prescriptionItems,
  labTests,
  labPackages,
  labOrders,
  labOrderItems,
  labAttachments,
} from "@/db/schema";
import { and, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";

export class ClinicalOperationsService {
  private async resolveTenantId(tenantSlugOrId: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantSlugOrId);
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(isUuid ? eq(tenants.id, tenantSlugOrId) : eq(tenants.slug, tenantSlugOrId))
      .limit(1);
    if (!tenant) throw new Error("Tenant was not found or is unavailable.");
    return tenant.id;
  }

  async getClinicalContext(tenantSlugOrId: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const [patientRows, doctorRows, branchRows, codeRows, medicineRows, testRows, packageRows, emrTemplateRows, rxTemplateRows] = await Promise.all([
      db.select().from(patients).where(and(eq(patients.tenantId, tenantId), isNull(patients.deletedAt))).orderBy(patients.fullName),
      db
        .select({ id: staffProfiles.id, fullName: users.fullName, specialization: staffProfiles.specialization, branchId: staffProfiles.branchId })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .where(and(eq(staffProfiles.tenantId, tenantId), eq(staffProfiles.staffType, "Doctor"), isNull(staffProfiles.deletedAt)))
        .orderBy(users.fullName),
      db.select().from(clinicBranches).where(and(eq(clinicBranches.tenantId, tenantId), isNull(clinicBranches.deletedAt))).orderBy(clinicBranches.name),
      db.select().from(icd10Codes).where(eq(icd10Codes.isActive, true)).orderBy(icd10Codes.code),
      db.select().from(medicines).where(eq(medicines.isActive, true)).orderBy(medicines.genericName),
      db.select().from(labTests).where(eq(labTests.isActive, true)).orderBy(labTests.category, labTests.name),
      db.select().from(labPackages).where(and(eq(labPackages.tenantId, tenantId), isNull(labPackages.deletedAt))).orderBy(labPackages.name),
      db.select().from(emrTemplates).where(and(eq(emrTemplates.tenantId, tenantId), isNull(emrTemplates.deletedAt))).orderBy(emrTemplates.name),
      db.select().from(prescriptionTemplates).where(and(eq(prescriptionTemplates.tenantId, tenantId), isNull(prescriptionTemplates.deletedAt))).orderBy(prescriptionTemplates.name),
    ]);

    return {
      tenantId,
      patients: patientRows,
      doctors: doctorRows,
      branches: branchRows,
      icd10Codes: codeRows,
      medicines: medicineRows,
      labTests: testRows,
      labPackages: packageRows,
      emrTemplates: emrTemplateRows,
      prescriptionTemplates: rxTemplateRows,
    };
  }

  // -------------------------------------------------------------------------
  // EMR
  // -------------------------------------------------------------------------
  async getEncounters(tenantSlugOrId: string, search = "", patientId?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const conditions: any[] = [eq(emrEncounters.tenantId, tenantId), isNull(emrEncounters.deletedAt)];
    if (patientId) conditions.push(eq(emrEncounters.patientId, patientId));
    if (search) {
      conditions.push(
        or(
          ilike(emrEncounters.encounterNumber, `%${search}%`),
          ilike(emrEncounters.chiefComplaint, `%${search}%`),
          ilike(patients.fullName, `%${search}%`)
        )
      );
    }

    const rows = await db
      .select({ encounter: emrEncounters, patient: patients, doctor: users, branch: clinicBranches })
      .from(emrEncounters)
      .innerJoin(patients, eq(emrEncounters.patientId, patients.id))
      .innerJoin(staffProfiles, eq(emrEncounters.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .innerJoin(clinicBranches, eq(emrEncounters.branchId, clinicBranches.id))
      .where(and(...conditions))
      .orderBy(desc(emrEncounters.visitDate));

    const encounterIds = rows.map((row) => row.encounter.id);
    const diagnoses = encounterIds.length
      ? await db
          .select({ diagnosis: emrEncounterDiagnoses, code: icd10Codes })
          .from(emrEncounterDiagnoses)
          .innerJoin(icd10Codes, eq(emrEncounterDiagnoses.icd10CodeId, icd10Codes.id))
          .where(inArray(emrEncounterDiagnoses.encounterId, encounterIds))
      : [];

    return rows.map(({ encounter, patient, doctor, branch }) => ({
      ...encounter,
      patientName: patient.fullName,
      patientMrn: patient.medicalRecordNumber,
      patientBloodType: patient.bloodType,
      doctorName: doctor.fullName,
      branchName: branch.name,
      diagnoses: diagnoses
        .filter((item) => item.diagnosis.encounterId === encounter.id)
        .map((item) => ({ ...item.diagnosis, code: item.code.code, description: item.code.description })),
    }));
  }

  async getEncounterDetail(tenantSlugOrId: string, encounterId: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const encounters = await this.getEncounters(tenantSlugOrId);
    const encounter = encounters.find((item) => item.id === encounterId);
    if (!encounter || encounter.tenantId !== tenantId) throw new Error("Encounter was not found.");

    const [attachments, voiceNotes, audits] = await Promise.all([
      db.select().from(emrAttachments).where(and(eq(emrAttachments.encounterId, encounterId), isNull(emrAttachments.deletedAt))),
      db.select().from(emrVoiceNotes).where(and(eq(emrVoiceNotes.encounterId, encounterId), isNull(emrVoiceNotes.deletedAt))),
      db
        .select({ audit: auditLogs, actor: users })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(and(eq(auditLogs.tenantId, tenantId), eq(auditLogs.resourceId, encounterId)))
        .orderBy(desc(auditLogs.createdAt)),
    ]);

    return {
      ...encounter,
      attachments,
      voiceNotes,
      auditTrail: audits.map(({ audit, actor }) => ({ ...audit, actorName: actor?.fullName || "System" })),
    };
  }

  async createEncounter(tenantSlugOrId: string, input: any, actorUserId?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const encounterNumber = `ENC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [created] = await db
      .insert(emrEncounters)
      .values({
        tenantId,
        branchId: input.branchId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        appointmentId: input.appointmentId || null,
        encounterNumber,
        visitType: input.visitType || "Outpatient",
        status: input.status || "Draft",
        chiefComplaint: input.chiefComplaint || "Routine clinical follow-up",
        subjective: input.subjective || "Patient-reported history documented.",
        objective: input.objective || "Objective findings documented.",
        assessment: input.assessment || "Clinical assessment pending final review.",
        treatmentPlan: input.treatmentPlan || "Continue monitoring and follow-up.",
        physicalExamination: input.physicalExamination || {},
        followUpInstructions: input.followUpInstructions,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        clinicalNotes: input.clinicalNotes,
        visitDate: input.visitDate ? new Date(input.visitDate) : new Date(),
      })
      .returning();

    const diagnosisIds: string[] = input.icd10CodeIds || [];
    if (diagnosisIds.length) {
      const selectedCodes = await db.select().from(icd10Codes).where(inArray(icd10Codes.id, diagnosisIds));
      await db.insert(emrEncounterDiagnoses).values(
        selectedCodes.map((code, index) => ({
          tenantId,
          encounterId: created.id,
          icd10CodeId: code.id,
          diagnosisText: code.description,
          isPrimary: index === 0,
        }))
      );
    }

    if (input.attachmentUrl) {
      await db.insert(emrAttachments).values({
        tenantId,
        encounterId: created.id,
        fileName: input.attachmentName || "clinical-attachment.pdf",
        fileUrl: input.attachmentUrl,
        mimeType: input.attachmentMimeType || "application/pdf",
        category: input.attachmentCategory || "Clinical Document",
        fileSizeBytes: Number(input.attachmentSizeBytes) || 0,
      });
    }

    if (input.voiceNoteUrl) {
      await db.insert(emrVoiceNotes).values({
        tenantId,
        encounterId: created.id,
        audioUrl: input.voiceNoteUrl,
        durationSeconds: Number(input.voiceDurationSeconds) || 0,
        transcription: input.voiceTranscription,
      });
    }

    await this.writeAudit(tenantId, actorUserId, "EMR_ENCOUNTER_CREATED", "EmrEncounter", created.id, {
      encounterNumber,
      patientId: input.patientId,
    });
    return created;
  }

  async signEncounter(tenantSlugOrId: string, encounterId: string, signature: string, actorUserId?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const [updated] = await db
      .update(emrEncounters)
      .set({ doctorSignature: signature, signedAt: new Date(), status: "Signed", updatedAt: new Date() })
      .where(and(eq(emrEncounters.id, encounterId), eq(emrEncounters.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Encounter was not found.");
    await this.writeAudit(tenantId, actorUserId, "EMR_ENCOUNTER_SIGNED", "EmrEncounter", encounterId, { signature });
    return updated;
  }

  // -------------------------------------------------------------------------
  // PRESCRIPTIONS
  // -------------------------------------------------------------------------
  async getPrescriptions(tenantSlugOrId: string, patientId?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const conditions: any[] = [eq(prescriptions.tenantId, tenantId), isNull(prescriptions.deletedAt)];
    if (patientId) conditions.push(eq(prescriptions.patientId, patientId));

    const rows = await db
      .select({ prescription: prescriptions, patient: patients, doctor: users })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(staffProfiles, eq(prescriptions.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(prescriptions.issuedAt));

    const ids = rows.map((row) => row.prescription.id);
    const items = ids.length
      ? await db
          .select({ item: prescriptionItems, medicine: medicines })
          .from(prescriptionItems)
          .innerJoin(medicines, eq(prescriptionItems.medicineId, medicines.id))
          .where(inArray(prescriptionItems.prescriptionId, ids))
      : [];

    return rows.map(({ prescription, patient, doctor }) => ({
      ...prescription,
      patientName: patient.fullName,
      patientMrn: patient.medicalRecordNumber,
      patientAllergyTags: patient.tags,
      doctorName: doctor.fullName,
      items: items
        .filter((row) => row.item.prescriptionId === prescription.id)
        .map((row) => ({ ...row.item, medicine: row.medicine })),
    }));
  }

  async analyzePrescriptionSafety(patientId: string, medicineIds: string[]) {
    const [record] = await db.select().from(patientMedicalRecords).where(eq(patientMedicalRecords.patientId, patientId));
    const selected = medicineIds.length ? await db.select().from(medicines).where(inArray(medicines.id, medicineIds)) : [];
    const allergies = (record?.allergies as Array<{ allergen?: string; severity?: string }>) || [];
    const warnings: Array<{ level: "critical" | "warning" | "info"; message: string }> = [];

    for (const medicine of selected) {
      const keywords = (medicine.allergyKeywords as string[]) || [];
      for (const allergy of allergies) {
        if (keywords.some((keyword) => allergy.allergen?.toLowerCase().includes(keyword.toLowerCase()))) {
          warnings.push({
            level: "critical",
            message: `${medicine.genericName} conflicts with recorded allergy: ${allergy.allergen} (${allergy.severity || "unknown severity"}).`,
          });
        }
      }
      const interactionIds = (medicine.interactionMedicineIds as string[]) || [];
      const interacting = selected.filter((candidate) => candidate.id !== medicine.id && interactionIds.includes(candidate.id));
      for (const candidate of interacting) {
        warnings.push({ level: "warning", message: `Potential interaction between ${medicine.genericName} and ${candidate.genericName}.` });
      }
      const alternatives = (medicine.genericAlternatives as string[]) || [];
      if (alternatives.length) {
        warnings.push({ level: "info", message: `Generic alternatives for ${medicine.brandName}: ${alternatives.join(", ")}.` });
      }
    }
    return warnings.filter((warning, index, all) => all.findIndex((item) => item.message === warning.message) === index);
  }

  async createPrescription(tenantSlugOrId: string, input: any, actorUserId?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const itemInputs: any[] = input.items || [];
    if (!itemInputs.length) throw new Error("At least one medicine is required.");
    const warnings = await this.analyzePrescriptionSafety(input.patientId, itemInputs.map((item) => item.medicineId));
    if (warnings.some((warning) => warning.level === "critical") && !input.overrideCriticalWarning) {
      return { blocked: true, warnings };
    }

    const prescriptionNumber = `RX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const verificationToken = `rxv_${crypto.randomUUID()}`;
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 6);

    const [created] = await db
      .insert(prescriptions)
      .values({
        tenantId,
        branchId: input.branchId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        encounterId: input.encounterId || null,
        prescriptionNumber,
        diagnosis: input.diagnosis,
        instructions: input.instructions,
        status: "Active",
        doctorSignature: input.doctorSignature,
        signedAt: input.doctorSignature ? new Date() : null,
        qrVerificationToken: verificationToken,
        refillOfPrescriptionId: input.refillOfPrescriptionId || null,
        validUntil,
      })
      .returning();

    await db.insert(prescriptionItems).values(
      itemInputs.map((item) => ({
        tenantId,
        prescriptionId: created.id,
        medicineId: item.medicineId,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        route: item.route || "Oral",
        quantity: Number(item.quantity) || 1,
        refillsAllowed: Number(item.refillsAllowed) || 0,
        instructions: item.instructions,
      }))
    );

    await this.writeAudit(tenantId, actorUserId, "PRESCRIPTION_ISSUED", "Prescription", created.id, {
      prescriptionNumber,
      warnings,
    });
    return { blocked: false, prescription: created, warnings };
  }

  async refillPrescription(tenantSlugOrId: string, prescriptionId: string, actorUserId?: string) {
    const existing = (await this.getPrescriptions(tenantSlugOrId)).find((item) => item.id === prescriptionId);
    if (!existing) throw new Error("Prescription was not found.");
    const refillable = existing.items.some((item: any) => item.refillsUsed < item.refillsAllowed);
    if (!refillable) throw new Error("No authorized refills remain on this prescription.");
    return this.createPrescription(
      tenantSlugOrId,
      {
        branchId: existing.branchId,
        patientId: existing.patientId,
        doctorId: existing.doctorId,
        encounterId: existing.encounterId,
        diagnosis: existing.diagnosis,
        instructions: existing.instructions,
        doctorSignature: existing.doctorSignature,
        refillOfPrescriptionId: existing.id,
        overrideCriticalWarning: true,
        items: existing.items.map((item: any) => ({
          medicineId: item.medicineId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          route: item.route,
          quantity: item.quantity,
          refillsAllowed: Math.max(0, item.refillsAllowed - item.refillsUsed - 1),
          instructions: item.instructions,
        })),
      },
      actorUserId
    );
  }

  async verifyPrescription(token: string) {
    const [row] = await db
      .select({ prescription: prescriptions, patient: patients, doctor: users, tenant: tenants })
      .from(prescriptions)
      .innerJoin(patients, eq(prescriptions.patientId, patients.id))
      .innerJoin(staffProfiles, eq(prescriptions.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .innerJoin(tenants, eq(prescriptions.tenantId, tenants.id))
      .where(and(eq(prescriptions.qrVerificationToken, token), isNull(prescriptions.deletedAt)))
      .limit(1);
    if (!row) return null;
    const items = await db
      .select({ item: prescriptionItems, medicine: medicines })
      .from(prescriptionItems)
      .innerJoin(medicines, eq(prescriptionItems.medicineId, medicines.id))
      .where(eq(prescriptionItems.prescriptionId, row.prescription.id));
    return {
      prescriptionNumber: row.prescription.prescriptionNumber,
      status: row.prescription.status,
      issuedAt: row.prescription.issuedAt,
      validUntil: row.prescription.validUntil,
      signedAt: row.prescription.signedAt,
      doctorSignature: row.prescription.doctorSignature,
      diagnosis: row.prescription.diagnosis,
      patientName: row.patient.fullName,
      patientMrn: row.patient.medicalRecordNumber,
      doctorName: row.doctor.fullName,
      clinicName: row.tenant.name,
      items: items.map(({ item, medicine }) => ({
        genericName: medicine.genericName,
        brandName: medicine.brandName,
        strength: medicine.strength,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        route: item.route,
        quantity: item.quantity,
      })),
    };
  }

  // -------------------------------------------------------------------------
  // LABORATORY
  // -------------------------------------------------------------------------
  async getLabOrders(tenantSlugOrId: string, status?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const conditions: any[] = [eq(labOrders.tenantId, tenantId), isNull(labOrders.deletedAt)];
    if (status && status !== "all") conditions.push(eq(labOrders.status, status));

    const rows = await db
      .select({ order: labOrders, patient: patients, doctor: users, branch: clinicBranches })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .innerJoin(staffProfiles, eq(labOrders.orderingDoctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .innerJoin(clinicBranches, eq(labOrders.branchId, clinicBranches.id))
      .where(and(...conditions))
      .orderBy(desc(labOrders.orderedAt));

    const orderIds = rows.map((row) => row.order.id);
    const [items, attachments] = await Promise.all([
      orderIds.length
        ? db
            .select({ item: labOrderItems, test: labTests, technician: users })
            .from(labOrderItems)
            .innerJoin(labTests, eq(labOrderItems.labTestId, labTests.id))
            .leftJoin(users, eq(labOrderItems.technicianUserId, users.id))
            .where(inArray(labOrderItems.labOrderId, orderIds))
        : Promise.resolve([]),
      orderIds.length
        ? db.select().from(labAttachments).where(and(inArray(labAttachments.labOrderId, orderIds), isNull(labAttachments.deletedAt)))
        : Promise.resolve([]),
    ]);

    return rows.map(({ order, patient, doctor, branch }) => ({
      ...order,
      patientName: patient.fullName,
      patientMrn: patient.medicalRecordNumber,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      doctorName: doctor.fullName,
      branchName: branch.name,
      items: items
        .filter((row) => row.item.labOrderId === order.id)
        .map((row) => ({ ...row.item, test: row.test, technicianName: row.technician?.fullName || null })),
      attachments: attachments.filter((file) => file.labOrderId === order.id),
    }));
  }

  async createLabOrder(tenantSlugOrId: string, input: any, actorUserId?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const testIds: string[] = input.testIds || [];
    if (!testIds.length) throw new Error("At least one laboratory test is required.");
    const orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [created] = await db
      .insert(labOrders)
      .values({
        tenantId,
        branchId: input.branchId,
        patientId: input.patientId,
        orderingDoctorId: input.orderingDoctorId,
        encounterId: input.encounterId || null,
        orderNumber,
        priority: input.priority || "Routine",
        status: "Ordered",
        clinicalNotes: input.clinicalNotes,
      })
      .returning();

    const tests = await db.select().from(labTests).where(inArray(labTests.id, testIds));
    await db.insert(labOrderItems).values(
      tests.map((test) => ({
        tenantId,
        labOrderId: created.id,
        labTestId: test.id,
        status: "Pending",
        referenceRange: test.referenceRangeMale || test.referenceRangeFemale,
      }))
    );
    await this.writeAudit(tenantId, actorUserId, "LAB_ORDER_CREATED", "LabOrder", created.id, { orderNumber, testIds });
    return created;
  }

  async updateLabOrder(tenantSlugOrId: string, orderId: string, input: any, actorUserId?: string) {
    const tenantId = await this.resolveTenantId(tenantSlugOrId);
    const action = input.action;

    if (action === "collect-sample") {
      const [updated] = await db
        .update(labOrders)
        .set({ status: "Sample Collected", sampleCollectedAt: new Date(), collectedByUserId: actorUserId, updatedAt: new Date() })
        .where(and(eq(labOrders.id, orderId), eq(labOrders.tenantId, tenantId)))
        .returning();
      await db.update(labOrderItems).set({ status: "Processing", updatedAt: new Date() }).where(eq(labOrderItems.labOrderId, orderId));
      await this.writeAudit(tenantId, actorUserId, "LAB_SAMPLE_COLLECTED", "LabOrder", orderId, {});
      return updated;
    }

    if (action === "enter-result") {
      const [updatedItem] = await db
        .update(labOrderItems)
        .set({
          resultValue: input.resultValue,
          resultText: input.resultText,
          referenceRange: input.referenceRange,
          isAbnormal: !!input.isAbnormal,
          abnormalFlag: input.abnormalFlag || null,
          technicianUserId: actorUserId,
          status: "Resulted",
          resultedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(labOrderItems.id, input.itemId), eq(labOrderItems.tenantId, tenantId)))
        .returning();
      const allItems = await db.select().from(labOrderItems).where(eq(labOrderItems.labOrderId, orderId));
      if (allItems.every((item) => item.id === input.itemId || item.status === "Resulted")) {
        await db.update(labOrders).set({ status: "Results Ready", completedAt: new Date(), updatedAt: new Date() }).where(eq(labOrders.id, orderId));
      }
      await this.writeAudit(tenantId, actorUserId, "LAB_RESULT_ENTERED", "LabOrder", orderId, { itemId: input.itemId, isAbnormal: !!input.isAbnormal });
      return updatedItem;
    }

    if (action === "doctor-review") {
      const [updated] = await db
        .update(labOrders)
        .set({
          status: "Doctor Reviewed",
          reviewedByDoctorId: input.doctorId,
          reviewedAt: new Date(),
          doctorReviewNotes: input.reviewNotes,
          updatedAt: new Date(),
        })
        .where(and(eq(labOrders.id, orderId), eq(labOrders.tenantId, tenantId)))
        .returning();
      if (input.notifyPatient && updated) {
        await db.insert(notifications).values({
          tenantId,
          userId: actorUserId!,
          title: `Laboratory report reviewed: ${updated.orderNumber}`,
          message: "The laboratory report was clinically reviewed and is ready for secure patient communication.",
          type: "success",
          link: `/${tenantSlugOrId}/laboratory`,
        });
      }
      await this.writeAudit(tenantId, actorUserId, "LAB_RESULT_REVIEWED", "LabOrder", orderId, { reviewNotes: input.reviewNotes });
      return updated;
    }

    throw new Error("Unsupported laboratory transition.");
  }

  private async writeAudit(
    tenantId: string,
    userId: string | undefined,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>
  ) {
    await db.insert(auditLogs).values({
      tenantId,
      userId: userId || null,
      action,
      resourceType,
      resourceId,
      metadata,
      ipAddress: "server-action",
      userAgent: "MedSaaS Clinical API",
    });
  }
}
