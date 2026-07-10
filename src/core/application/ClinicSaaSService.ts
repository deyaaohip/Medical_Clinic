import { db } from "@/db";
import {
  tenants,
  clinicBranches,
  clinicDepartments,
  clinicRooms,
  staffProfiles,
  workingHours,
  vacationsHolidays,
  patients,
  patientMedicalRecords,
  patientVitalSigns,
  patientInsurance,
  patientAttachments,
  patientTimelineNotes,
  appointments,
  waitingListQueues,
  appointmentReminders,
  users,
} from "@/db/schema";
import { eq, ne, and, or, ilike, desc, asc, isNull, isNotNull, inArray, sql } from "drizzle-orm";

export class ClinicSaaSService {
  // =========================================================================
  // 1. CLINIC MANAGEMENT SYSTEM (Multi-Branch Ready)
  // =========================================================================
  async getTenantAndBranches(tenantId: string) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantId));
    const branches = await db
      .select()
      .from(clinicBranches)
      .where(and(eq(clinicBranches.tenantId, tenant ? tenant.id : tenantId), isNull(clinicBranches.deletedAt)))
      .orderBy(desc(clinicBranches.isPrimary), clinicBranches.name);

    return { tenant, branches };
  }

  async getStaffProfiles(tenantId: string, branchId?: string, staffType?: string) {
    const conditions: any[] = [isNull(staffProfiles.deletedAt)];
    if (branchId && branchId !== "all") conditions.push(eq(staffProfiles.branchId, branchId));
    if (staffType && staffType !== "all") conditions.push(eq(staffProfiles.staffType, staffType));

    const results = await db
      .select({
        profile: staffProfiles,
        user: users,
        branch: clinicBranches,
        department: clinicDepartments,
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .innerJoin(clinicBranches, eq(staffProfiles.branchId, clinicBranches.id))
      .leftJoin(clinicDepartments, eq(staffProfiles.departmentId, clinicDepartments.id))
      .where(and(...conditions))
      .orderBy(staffProfiles.staffType, users.fullName);

    return results.map(({ profile, user, branch, department }) => ({
      ...profile,
      user,
      branchName: branch.name,
      departmentName: department?.name || "General Triage",
    }));
  }

  async getDepartmentsAndRooms(tenantId: string, branchId?: string) {
    const depConditions: any[] = [isNull(clinicDepartments.deletedAt)];
    const roomConditions: any[] = [isNull(clinicRooms.deletedAt)];

    if (branchId && branchId !== "all") {
      depConditions.push(eq(clinicDepartments.branchId, branchId));
      roomConditions.push(eq(clinicRooms.branchId, branchId));
    }

    const depts = await db.select().from(clinicDepartments).where(and(...depConditions)).orderBy(clinicDepartments.name);
    const rooms = await db
      .select({
        room: clinicRooms,
        dept: clinicDepartments,
      })
      .from(clinicRooms)
      .innerJoin(clinicDepartments, eq(clinicRooms.departmentId, clinicDepartments.id))
      .where(and(...roomConditions))
      .orderBy(clinicRooms.roomNumber);

    return {
      departments: depts,
      rooms: rooms.map(({ room, dept }) => ({ ...room, departmentName: dept.name })),
    };
  }

  async getWorkingHours(tenantId: string, branchId?: string) {
    const conditions: any[] = [];
    if (branchId && branchId !== "all") conditions.push(eq(workingHours.branchId, branchId));

    const results = await db
      .select({
        hours: workingHours,
        staff: staffProfiles,
        user: users,
      })
      .from(workingHours)
      .leftJoin(staffProfiles, eq(workingHours.staffId, staffProfiles.id))
      .leftJoin(users, eq(staffProfiles.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(workingHours.dayOfWeek);

    return results.map(({ hours, user }) => ({
      ...hours,
      staffName: user ? user.fullName : "Branch Standard Operating Hours",
    }));
  }

  async getVacations(tenantId: string, branchId?: string) {
    const conditions: any[] = [isNull(vacationsHolidays.deletedAt)];
    if (branchId && branchId !== "all") conditions.push(eq(vacationsHolidays.branchId, branchId));

    const results = await db
      .select({
        vac: vacationsHolidays,
        user: users,
      })
      .from(vacationsHolidays)
      .leftJoin(staffProfiles, eq(vacationsHolidays.staffId, staffProfiles.id))
      .leftJoin(users, eq(staffProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(vacationsHolidays.startDate));

    return results.map(({ vac, user }) => ({
      ...vac,
      staffName: user ? user.fullName : "Clinic Public Holiday",
    }));
  }

  // =========================================================================
  // 2. PATIENT MANAGEMENT SYSTEM
  // =========================================================================
  async getPatients(tenantId: string, branchId?: string, searchQuery: string = "") {
    const conditions: any[] = [isNull(patients.deletedAt)];
    if (branchId && branchId !== "all") conditions.push(eq(patients.branchId, branchId));
    if (searchQuery) {
      conditions.push(
        or(
          ilike(patients.fullName, `%${searchQuery}%`),
          ilike(patients.medicalRecordNumber, `%${searchQuery}%`),
          ilike(patients.phone, `%${searchQuery}%`)
        )
      );
    }

    const results = await db
      .select()
      .from(patients)
      .where(and(...conditions))
      .orderBy(desc(patients.createdAt))
      .limit(100);

    return results;
  }

  async getPatientComprehensiveRecord(patientId: string) {
    const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));
    const [medical] = await db.select().from(patientMedicalRecords).where(eq(patientMedicalRecords.patientId, patientId));
    const [vitals] = await db.select().from(patientVitalSigns).where(eq(patientVitalSigns.patientId, patientId)).orderBy(desc(patientVitalSigns.recordedAt)).limit(1);
    const insurances = await db.select().from(patientInsurance).where(eq(patientInsurance.patientId, patientId));
    const attachments = await db.select().from(patientAttachments).where(and(eq(patientAttachments.patientId, patientId), isNull(patientAttachments.deletedAt))).orderBy(desc(patientAttachments.uploadedAt));
    const timeline = await db
      .select({
        note: patientTimelineNotes,
        author: users,
      })
      .from(patientTimelineNotes)
      .leftJoin(users, eq(patientTimelineNotes.authorUserId, users.id))
      .where(eq(patientTimelineNotes.patientId, patientId))
      .orderBy(desc(patientTimelineNotes.recordedAt));

    return {
      patient,
      medicalRecord: medical || { allergies: [], chronicDiseases: [], activeMedications: [], vaccinations: [] },
      latestVitals: vitals,
      insurances,
      attachments,
      timeline: timeline.map(({ note, author }) => ({ ...note, authorName: author?.fullName || "System Engine" })),
    };
  }

  async createPatient(data: any, tenantId: string, branchId: string) {
    const medicalRecordNumber = "MRN-2026-" + Math.floor(10000 + Math.random() * 90000);
    const [inserted] = await db
      .insert(patients)
      .values({
        tenantId,
        branchId,
        medicalRecordNumber,
        firstName: data.firstName || "Unknown",
        lastName: data.lastName || "Patient",
        fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown Patient",
        email: data.email || `patient_${Date.now()}@medsaas.com`,
        phone: data.phone || "+971500000000",
        dateOfBirth: new Date(data.dateOfBirth || "1990-01-01"),
        gender: data.gender || "Male",
        nationalId: data.nationalId || "784-0000-0000000-0",
        bloodType: data.bloodType || "O+",
        smokingStatus: data.smokingStatus || "Non-smoker",
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        preferredLanguage: data.preferredLanguage || "en",
        address: data.address,
        tags: data.tags || ["New Registration"],
        isActive: true,
      })
      .returning();

    // Setup initial empty medical record
    await db.insert(patientMedicalRecords).values({
      tenantId,
      patientId: inserted.id,
      allergies: data.allergies || [],
      chronicDiseases: data.chronicDiseases || [],
      activeMedications: data.activeMedications || [],
      vaccinations: data.vaccinations || [],
    });

    // Setup initial vitals
    if (data.bloodPressure || data.heartRate) {
      await db.insert(patientVitalSigns).values({
        tenantId,
        patientId: inserted.id,
        bloodPressure: data.bloodPressure || "120/80",
        heartRateBpm: Number(data.heartRate) || 72,
        temperatureCelsius: Number(data.temperature) || 37.0,
      });
    }

    // Log timeline
    await db.insert(patientTimelineNotes).values({
      tenantId,
      patientId: inserted.id,
      title: "Patient Account Provisioned",
      noteType: "Reception Note",
      contentText: "Successfully registered at clinic entrance.",
    });

    return inserted;
  }

  async mergePatients(sourcePatientId: string, targetPatientId: string, tenantId: string) {
    if (sourcePatientId === targetPatientId) throw new Error("Cannot merge identical UUIDs.");

    // Migrate medical notes, appointments, attachments, waiting list to target
    await db.update(appointments).set({ patientId: targetPatientId, updatedAt: new Date() }).where(eq(appointments.patientId, sourcePatientId));
    await db.update(patientAttachments).set({ patientId: targetPatientId }).where(eq(patientAttachments.patientId, sourcePatientId));
    await db.update(patientTimelineNotes).set({ patientId: targetPatientId }).where(eq(patientTimelineNotes.patientId, sourcePatientId));
    await db.update(patientVitalSigns).set({ patientId: targetPatientId }).where(eq(patientVitalSigns.patientId, sourcePatientId));
    await db.update(waitingListQueues).set({ patientId: targetPatientId }).where(eq(waitingListQueues.patientId, sourcePatientId));

    // Soft delete source patient
    await db
      .update(patients)
      .set({ deletedAt: new Date(), isActive: false, tags: ["Merged Duplicate"] })
      .where(eq(patients.id, sourcePatientId));

    return { success: true, mergedTargetId: targetPatientId };
  }

  // =========================================================================
  // 3. APPOINTMENT MANAGEMENT SYSTEM
  // =========================================================================
  async getAppointments(tenantId: string, branchId?: string, dateRange?: { start: Date; end: Date }, status?: string, doctorId?: string) {
    const conditions: any[] = [isNull(appointments.deletedAt)];
    if (branchId && branchId !== "all") conditions.push(eq(appointments.branchId, branchId));
    if (status && status !== "all") conditions.push(eq(appointments.status, status));
    if (doctorId && doctorId !== "all") conditions.push(eq(appointments.doctorId, doctorId));

    if (dateRange) {
      conditions.push(and(sql`appointment_date >= ${dateRange.start}`, sql`appointment_date <= ${dateRange.end}`));
    }

    const results = await db
      .select({
        app: appointments,
        patient: patients,
        doctorStaff: staffProfiles,
        doctorUser: users,
        room: clinicRooms,
        dept: clinicDepartments,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(staffProfiles, eq(appointments.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(clinicRooms, eq(appointments.roomId, clinicRooms.id))
      .leftJoin(clinicDepartments, eq(appointments.departmentId, clinicDepartments.id))
      .where(and(...conditions))
      .orderBy(appointments.appointmentDate, appointments.startTime);

    return results.map(({ app, patient, doctorUser, room, dept }) => ({
      ...app,
      patientFullName: patient.fullName,
      patientMrn: patient.medicalRecordNumber,
      patientPhone: patient.phone,
      doctorFullName: doctorUser.fullName,
      roomName: room ? `${room.roomNumber} (${room.name})` : "Standard Box",
      departmentName: dept?.name || "Cardiology",
    }));
  }

  async getLiveQueues(tenantId: string, branchId?: string) {
    const conditions: any[] = [];
    if (branchId && branchId !== "all") conditions.push(eq(waitingListQueues.branchId, branchId));

    const results = await db
      .select({
        queue: waitingListQueues,
        patient: patients,
        doctorStaff: staffProfiles,
        doctorUser: users,
        dept: clinicDepartments,
      })
      .from(waitingListQueues)
      .innerJoin(patients, eq(waitingListQueues.patientId, patients.id))
      .innerJoin(staffProfiles, eq(waitingListQueues.doctorId, staffProfiles.id))
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(clinicDepartments, eq(waitingListQueues.departmentId, clinicDepartments.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(waitingListQueues.checkedInAt));

    return results.map(({ queue, patient, doctorUser, dept }) => ({
      ...queue,
      patientFullName: patient.fullName,
      patientMrn: patient.medicalRecordNumber,
      doctorFullName: doctorUser.fullName,
      departmentName: dept?.name || "Specialty Hub",
    }));
  }

  async createAppointment(data: any, tenantId: string, branchId: string) {
    const appointmentNumber = "APP-2026-" + Math.floor(100000 + Math.random() * 900000);
    const appointmentDate = new Date(data.appointmentDate || Date.now());
    const startTime = new Date(data.startTime || appointmentDate);
    const endTime = new Date(startTime.getTime() + (data.durationMinutes || 30) * 60000);

    const [inserted] = await db
      .insert(appointments)
      .values({
        tenantId,
        branchId,
        departmentId: data.departmentId,
        roomId: data.roomId || null,
        doctorId: data.doctorId,
        patientId: data.patientId,
        appointmentNumber,
        title: data.title || "Specialty Consultation",
        appointmentDate,
        startTime,
        endTime,
        status: data.status || "Scheduled",
        type: data.type || "Online Booking",
        priority: data.priority || "Standard",
        isRecurring: !!data.isRecurring,
        recurrenceRule: data.recurrenceRule,
        notes: data.notes,
      })
      .returning();

    // If walk-in or checked in, automatically add to live waiting list queue
    if (data.status === "CheckedIn" || data.type === "Walk-in") {
      await db.insert(waitingListQueues).values({
        tenantId,
        branchId,
        departmentId: data.departmentId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        appointmentId: inserted.id,
        queueNumber: (data.priority === "VIP" ? "VIP-" : "A-") + Math.floor(10 + Math.random() * 89),
        priority: data.priority === "VIP" ? "Urgent" : "Standard",
        status: "Waiting",
        checkedInAt: new Date(),
        notes: "Automated Walk-in Relay Queue registration.",
      });
    }

    // Schedule sample reminders
    await db.insert(appointmentReminders).values([
      { tenantId, appointmentId: inserted.id, patientId: data.patientId, reminderType: "WhatsApp", scheduledTime: new Date(startTime.getTime() - 24 * 3600 * 1000), status: "Sent" },
    ]);

    return inserted;
  }

  async updateAppointmentStatus(appointmentId: string, status: string) {
    const [updated] = await db
      .update(appointments)
      .set({
        status,
        checkInTime: status === "CheckedIn" ? new Date() : undefined,
        checkOutTime: status === "CheckedOut" || status === "Completed" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // If checked in, add to waiting queue if not present
    if (status === "CheckedIn" && updated) {
      const existingQueue = await db.select().from(waitingListQueues).where(eq(waitingListQueues.appointmentId, appointmentId)).limit(1);
      if (existingQueue.length === 0) {
        await db.insert(waitingListQueues).values({
          tenantId: updated.tenantId,
          branchId: updated.branchId,
          departmentId: updated.departmentId,
          doctorId: updated.doctorId,
          patientId: updated.patientId,
          appointmentId,
          queueNumber: "T-" + Math.floor(10 + Math.random() * 89),
          priority: updated.priority === "VIP" ? "Urgent" : "Standard",
          status: "Waiting",
          checkedInAt: new Date(),
        });
      }
    }

    // If completed or left, update queue
    if ((status === "Completed" || status === "CheckedOut") && updated) {
      await db
        .update(waitingListQueues)
        .set({ status: "Completed", completedAt: new Date() })
        .where(eq(waitingListQueues.appointmentId, appointmentId));
    }

    return updated;
  }
}
