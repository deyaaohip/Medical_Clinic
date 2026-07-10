import { db } from "./index";
import {
  subscriptionPlans,
  tenants,
  users,
  roles,
  rolePermissions,
  tenantUsers,
  tenantSubscriptions,
  featureFlags,
  activityLogs,
  auditLogs,
  notifications,
  superAdminInvoices,
  superAdminCoupons,
  superAdminAnnouncements,
  superAdminEmailTemplates,
  superAdminSmsTemplates,
  superAdminSystemLogs,
  superAdminGlobalSettings,
  superAdminStorageFiles,
  superAdminAiUsage,
  superAdminApiKeys,
  superAdminSecurityRules,
  superAdminBackups,
  superAdminSupportTickets,
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
} from "./schema";

export async function runSeed() {
  console.log("🌱 Starting Comprehensive Database Seeding for Medical SaaS Platform...");

  // 1. Seed Subscription Plans
  console.log("📦 Seeding Subscription Plans...");
  await db.insert(subscriptionPlans).values([
    {
      id: "starter",
      name: "Starter Clinic Plan",
      description: "Perfect for single practitioner clinics or small medical practices.",
      priceMonthly: 19900,
      priceYearly: 199000,
      currency: "USD",
      maxUsers: 3,
      maxPatients: 1000,
      features: [
        "Up to 3 Staff Members",
        "1,000 Active Patient Records",
        "Standard Appointment Scheduling",
        "Basic EMR & Clinical Notes",
        "English & Arabic Localization",
      ],
      isActive: true,
    },
    {
      id: "professional",
      name: "Professional Practice",
      description: "Advanced solution for multi-physician medical centers.",
      priceMonthly: 49900,
      priceYearly: 499000,
      currency: "USD",
      maxUsers: 15,
      maxPatients: 10000,
      features: [
        "Up to 15 Staff Members",
        "10,000 Active Patient Records",
        "Advanced EMR & Lab Orders",
        "Automated WhatsApp/SMS Reminders",
        "Telemedicine Suite",
        "Full Billing & Claim Preparation",
        "Priority 24/7 Tech Support",
      ],
      isActive: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Healthcare",
      description: "Full-scale Hospital & Regional Medical Chain SaaS Engine.",
      priceMonthly: 129900,
      priceYearly: 1299000,
      currency: "USD",
      maxUsers: 999999,
      maxPatients: 999999,
      features: [
        "Unlimited Staff Members",
        "Unlimited Patient Records",
        "Dedicated Account Director",
        "Custom HL7 & FHIR Integration",
        "Advanced AI Scribe & Clinical Decision Support",
        "Multi-Branch Unified Portal",
        "Custom SLA & On-Premise Backup option",
      ],
      isActive: true,
    },
  ]).onConflictDoNothing();

  // 2. Seed Users
  console.log("👤 Seeding Users...");
  const adminEmail = "admin@medsaas.com";
  const doc1Email = "dr.ahmed@alshifaclinic.ae";
  const recep1Email = "reception@alshifaclinic.ae";
  const doc2Email = "dr.sarah@apexhealth.com";

  const mockPasswordHash = "hashed_password_mock_123";

  const [adminUser] = await db
    .insert(users)
    .values({
      email: adminEmail,
      passwordHash: mockPasswordHash,
      fullName: "Super Administrator",
      phone: "+971501234567",
      preferredLocale: "en",
      isSuperAdmin: true,
    })
    .onConflictDoUpdate({
      target: [users.email],
      set: { fullName: "Super Administrator", isSuperAdmin: true },
    })
    .returning();

  const [doc1User] = await db
    .insert(users)
    .values({
      email: doc1Email,
      passwordHash: mockPasswordHash,
      fullName: "Dr. Ahmed Mansour (د. أحمد منصور)",
      phone: "+971509876543",
      preferredLocale: "ar",
      isSuperAdmin: false,
    })
    .onConflictDoUpdate({
      target: [users.email],
      set: { fullName: "Dr. Ahmed Mansour (د. أحمد منصور)" },
    })
    .returning();

  const [recep1User] = await db
    .insert(users)
    .values({
      email: recep1Email,
      passwordHash: mockPasswordHash,
      fullName: "Fatima Al-Hassan (فاطمة الحسن)",
      phone: "+971505554433",
      preferredLocale: "ar",
      isSuperAdmin: false,
    })
    .onConflictDoUpdate({
      target: [users.email],
      set: { fullName: "Fatima Al-Hassan (فاطمة الحسن)" },
    })
    .returning();

  const [doc2User] = await db
    .insert(users)
    .values({
      email: doc2Email,
      passwordHash: mockPasswordHash,
      fullName: "Dr. Sarah Jenkins",
      phone: "+14155550199",
      preferredLocale: "en",
      isSuperAdmin: false,
    })
    .onConflictDoUpdate({
      target: [users.email],
      set: { fullName: "Dr. Sarah Jenkins" },
    })
    .returning();

  // 3. Seed Tenants
  console.log("🏢 Seeding Tenants (Medical Clinics)...");
  const [tenant1] = await db
    .insert(tenants)
    .values({
      name: "Al Shifa Medical Center (مركز الشفاء الطبي)",
      slug: "al-shifa",
      country: "UAE",
      timeZone: "Asia/Dubai",
      defaultLocale: "ar",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [tenants.slug],
      set: { name: "Al Shifa Medical Center (مركز الشفاء الطبي)" },
    })
    .returning();

  const [tenant2] = await db
    .insert(tenants)
    .values({
      name: "Apex International Healthcare",
      slug: "apex-health",
      country: "USA",
      timeZone: "America/New_York",
      defaultLocale: "en",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [tenants.slug],
      set: { name: "Apex International Healthcare" },
    })
    .returning();

  // 4. Seed Tenant Subscriptions
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  await db.insert(tenantSubscriptions).values([
    {
      tenantId: tenant1.id,
      planId: "professional",
      status: "active",
      billingCycle: "yearly",
      currentPeriodStart: now,
      currentPeriodEnd: nextYear,
    },
    {
      tenantId: tenant2.id,
      planId: "enterprise",
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: now,
      currentPeriodEnd: nextYear,
    },
  ]).onConflictDoNothing();

  // 5. Seed Roles & Permissions
  console.log("🔐 Seeding Roles & Permissions...");
  const [adminRoleT1] = await db.insert(roles).values({
    tenantId: tenant1.id,
    name: "Clinic Admin",
    description: "Full managerial access.",
    isSystem: true,
  }).returning();

  const [docRoleT1] = await db.insert(roles).values({
    tenantId: tenant1.id,
    name: "Senior Physician",
    description: "Access to patient medical records.",
    isSystem: true,
  }).returning();

  const [recepRoleT1] = await db.insert(roles).values({
    tenantId: tenant1.id,
    name: "Front Desk / Reception",
    description: "Access to appointments.",
    isSystem: true,
  }).returning();

  const adminPermissions = [
    "appointments:view", "appointments:create", "appointments:edit", "appointments:delete",
    "patients:view", "patients:create", "patients:edit", "patients:delete",
    "emr:view", "emr:create", "emr:edit", "emr:delete",
    "billing:view", "billing:create", "billing:edit", "billing:delete",
    "tenant:settings", "tenant:rbac", "tenant:billing",
  ];

  for (const perm of adminPermissions) {
    await db.insert(rolePermissions).values({ roleId: adminRoleT1.id, permissionKey: perm }).onConflictDoNothing();
  }

  for (const perm of ["appointments:view", "appointments:create", "appointments:edit", "patients:view", "patients:create", "patients:edit", "emr:view", "emr:create", "emr:edit"]) {
    await db.insert(rolePermissions).values({ roleId: docRoleT1.id, permissionKey: perm }).onConflictDoNothing();
  }

  // Link users
  await db.insert(tenantUsers).values([
    { tenantId: tenant1.id, userId: adminUser.id, roleId: adminRoleT1.id, isActive: true },
    { tenantId: tenant1.id, userId: doc1User.id, roleId: docRoleT1.id, isActive: true },
    { tenantId: tenant1.id, userId: recep1User.id, roleId: recepRoleT1.id, isActive: true },
  ]).onConflictDoNothing();

  // Feature Flags
  await db.insert(featureFlags).values([
    { tenantId: tenant1.id, flagKey: "telemedicine", isEnabled: true },
    { tenantId: tenant1.id, flagKey: "automated_whatsapp_reminders", isEnabled: true },
    { tenantId: tenant1.id, flagKey: "patient_portal", isEnabled: true },
  ]).onConflictDoNothing();

  // =========================================================================
  // SEED CLINIC MANAGEMENT MODULE (Branches, Departments, Rooms, Staff)
  // =========================================================================
  console.log("🏥 Seeding Clinic Management Module Data...");

  const [branch1] = await db.insert(clinicBranches).values([
    {
      tenantId: tenant1.id,
      name: "Dubai Jumeirah Central Medical Center (الفرع الرئيسي - جميرا)",
      slug: "dubai-main",
      address: "Jumeirah Beach Road, Villa #45, Dubai UAE",
      phone: "+97143211122",
      email: "contact@alshifaclinic.ae",
      isPrimary: true,
      isActive: true,
    },
  ]).returning();

  const [branch2] = await db.insert(clinicBranches).values([
    {
      tenantId: tenant1.id,
      name: "Abu Dhabi Corniche Specialty Center (فرع الكورنيش التخصصي)",
      slug: "abudhabi-corniche",
      address: "Corniche Tower, Floor 14, Abu Dhabi UAE",
      phone: "+97126543322",
      email: "abudhabi@alshifaclinic.ae",
      isPrimary: false,
      isActive: true,
    },
  ]).returning();

  // Departments
  const [deptCardio] = await db.insert(clinicDepartments).values([
    { tenantId: tenant1.id, branchId: branch1.id, name: "Pediatric & General Cardiology (قسم أمراض القلب)", code: "CARD-01", description: "Advanced EKG and Echocardiography." },
  ]).returning();

  const [deptPeds] = await db.insert(clinicDepartments).values([
    { tenantId: tenant1.id, branchId: branch1.id, name: "General Pediatrics & Immunization (قسم طب الأطفال)", code: "PEDS-02", description: "Infant well-care and vaccinations." },
  ]).returning();

  const [deptSurgery] = await db.insert(clinicDepartments).values([
    { tenantId: tenant1.id, branchId: branch2.id, name: "Outpatient Day Surgery (قسم الجراحة اليومية)", code: "SURG-03", description: "Minor elective procedures." },
  ]).returning();

  // Rooms
  const [room1] = await db.insert(clinicRooms).values([
    { tenantId: tenant1.id, branchId: branch1.id, departmentId: deptCardio.id, roomNumber: "101-Cardio", name: "Echocardiography Suite A", type: "Consultation" },
  ]).returning();

  const [room2] = await db.insert(clinicRooms).values([
    { tenantId: tenant1.id, branchId: branch1.id, departmentId: deptPeds.id, roomNumber: "102-Peds", name: "Pediatric Consultation Villa B", type: "Consultation" },
  ]).returning();

  const [room3] = await db.insert(clinicRooms).values([
    { tenantId: tenant1.id, branchId: branch2.id, departmentId: deptSurgery.id, roomNumber: "201-Surg", name: "Day Surgery Suite #1", type: "Surgery" },
  ]).returning();

  // Staff Profiles
  const [staffDoc1] = await db.insert(staffProfiles).values([
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      userId: doc1User.id,
      departmentId: deptCardio.id,
      staffType: "Doctor",
      specialization: "Senior Pediatric Cardiologist",
      licenseNumber: "DHA-2023-8911",
      hourlyRateCents: 20000, // $200
      bio: "Completed fellowship at Boston Children's Hospital. Specialized in congenital heart anomalies.",
      isActive: true,
    },
  ]).returning();

  const [staffRecep1] = await db.insert(staffProfiles).values([
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      userId: recep1User.id,
      departmentId: deptPeds.id,
      staffType: "Receptionist",
      specialization: "Front Desk Patient Care Manager",
      licenseNumber: "Triage-9912",
      hourlyRateCents: 4500, // $45
      bio: "7+ years managing patient queues and fast check-in protocols.",
      isActive: true,
    },
  ]).returning();

  // Working Hours
  await db.insert(workingHours).values([
    { tenantId: tenant1.id, branchId: branch1.id, staffId: staffDoc1.id, dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
    { tenantId: tenant1.id, branchId: branch1.id, staffId: staffDoc1.id, dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
    { tenantId: tenant1.id, branchId: branch1.id, staffId: staffDoc1.id, dayOfWeek: 3, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
    { tenantId: tenant1.id, branchId: branch1.id, staffId: staffDoc1.id, dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
    { tenantId: tenant1.id, branchId: branch1.id, staffId: staffDoc1.id, dayOfWeek: 5, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 }, // Friday early Shift
  ]).onConflictDoNothing();

  // Vacations
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthEnd = new Date(nextMonth);
  nextMonthEnd.setDate(nextMonthEnd.getDate() + 14);

  await db.insert(vacationsHolidays).values([
    { tenantId: tenant1.id, branchId: branch1.id, staffId: staffDoc1.id, title: "Annual Academic Conference Leave", startDate: nextMonth, endDate: nextMonthEnd, type: "Vacation", status: "Approved", notes: "Attending ESC Congress in Paris." },
    { tenantId: tenant1.id, branchId: branch1.id, title: "UAE National Day Public Holiday", startDate: new Date("2026-12-02T00:00:00"), endDate: new Date("2026-12-03T00:00:00"), type: "Public Holiday", status: "Approved", notes: "Clinic closed. Emergency relay active." },
  ]).onConflictDoNothing();

  // =========================================================================
  // SEED PATIENT MANAGEMENT SYSTEM (Patients, Medical Records, Vitals, Insurance)
  // =========================================================================
  console.log("🛌 Seeding Patient Management System Data...");

  const thirtyYearsAgo = new Date();
  thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);

  const [pat1] = await db.insert(patients).values([
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      medicalRecordNumber: "MRN-2026-00911",
      firstName: "Omar",
      lastName: "Al-Futtaim",
      fullName: "Omar Al-Futtaim (عمر الفطيم)",
      email: "omar.futtaim@dubaimedia.ae",
      phone: "+971509988776",
      dateOfBirth: thirtyYearsAgo,
      gender: "Male",
      nationalId: "784-1996-1234567-1",
      bloodType: "A+",
      smokingStatus: "Non-smoker",
      emergencyContactName: "Sara Al-Futtaim (Wife)",
      emergencyContactPhone: "+971501122334",
      emergencyContactRelation: "Spouse",
      preferredLanguage: "ar",
      address: "Dubai Marina, Residence Tower B, Apt #1402",
      tags: ["VIP", "Diabetic", "Pediatric Parent"],
      isActive: true,
    },
  ]).returning();

  const [pat2] = await db.insert(patients).values([
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      medicalRecordNumber: "MRN-2026-00912",
      firstName: "Layla",
      lastName: "Al-Maktoum",
      fullName: "Layla Al-Maktoum (ليلى المكتوم)",
      email: "layla.m@emirates.com",
      phone: "+971504433221",
      dateOfBirth: new Date("2018-05-14"), // Pediatric Patient
      gender: "Female",
      nationalId: "784-2018-9876543-2",
      bloodType: "O+",
      smokingStatus: "Non-smoker",
      emergencyContactName: "Rashid Al-Maktoum (Father)",
      emergencyContactPhone: "+971508889900",
      emergencyContactRelation: "Parent",
      preferredLanguage: "en",
      address: "Emirates Hills, Villa #12, Dubai UAE",
      tags: ["Pediatric", "Asthmatic"],
      isActive: true,
    },
  ]).returning();

  // Medical Records
  await db.insert(patientMedicalRecords).values([
    {
      tenantId: tenant1.id,
      patientId: pat1.id,
      allergies: [{ allergen: "Penicillin", reaction: "Hives & Swelling", severity: "High" }],
      chronicDiseases: [{ disease: "Type 2 Diabetes Mellitus", diagnosedYear: 2022 }],
      activeMedications: [{ medication: "Metformin", dosage: "500mg Twice Daily with meals" }],
      vaccinations: [{ vaccine: "Influenza Quadrivalent", date: "2025-10-01" }],
      familyHistory: "Father had coronary artery disease. Mother has hypertension.",
      surgicalHistory: "Appendectomy in 2015 without complications.",
    },
    {
      tenantId: tenant1.id,
      patientId: pat2.id,
      allergies: [{ allergen: "Peanuts", reaction: "Anaphylaxis", severity: "Critical" }],
      chronicDiseases: [{ disease: "Mild Persistent Asthma", diagnosedYear: 2023 }],
      activeMedications: [{ medication: "Albuterol Inhaler", dosage: "2 Puffs PRN for wheezing" }],
      vaccinations: [{ vaccine: "MMR & DTaP Booster", date: "2024-08-15" }],
      familyHistory: "Older brother also has mild allergic asthma.",
    },
  ]).onConflictDoNothing();

  // Vitals
  await db.insert(patientVitalSigns).values([
    { tenantId: tenant1.id, patientId: pat1.id, bloodPressure: "124/82", heartRateBpm: 76, temperatureCelsius: 36.9, respiratoryRate: 16, oxygenSaturationPercent: 99, weightKg: 78.5, heightCm: 180.0, bmi: 24.2 },
    { tenantId: tenant1.id, patientId: pat2.id, bloodPressure: "100/65", heartRateBpm: 88, temperatureCelsius: 37.1, respiratoryRate: 20, oxygenSaturationPercent: 100, weightKg: 28.0, heightCm: 125.0, bmi: 17.9 },
  ]).onConflictDoNothing();

  // Insurance
  const insExp = new Date();
  insExp.setFullYear(insExp.getFullYear() + 2);
  await db.insert(patientInsurance).values([
    { tenantId: tenant1.id, patientId: pat1.id, providerName: "Daman Health UAE Platinum VIP network", policyNumber: "DAMAN-VIP-891102", groupNumber: "GRP-DUBAI-100", networkTier: "Platinum VIP Premium", expiryDate: insExp, isPrimary: true },
    { tenantId: tenant1.id, patientId: pat2.id, providerName: "NextCare UAE Comprehensive GN+", policyNumber: "NEXT-PEDS-554411", networkTier: "GN+ Premium", expiryDate: insExp, isPrimary: true },
  ]).onConflictDoNothing();

  // Attachments
  await db.insert(patientAttachments).values([
    { tenantId: tenant1.id, patientId: pat1.id, fileName: "omar_blood_glucose_hba1c_report.pdf", fileUrl: "https://cdn.medsaas.com/patients/omar_hba1c.pdf", mimeType: "application/pdf", fileSizeBytes: 340512, category: "Lab Result" },
    { tenantId: tenant1.id, patientId: pat2.id, fileName: "layla_pediatric_telemedicine_consent_signed.pdf", fileUrl: "https://cdn.medsaas.com/patients/layla_consent.pdf", mimeType: "application/pdf", fileSizeBytes: 189110, category: "Consent Form" },
  ]).onConflictDoNothing();

  // Timeline Notes
  await db.insert(patientTimelineNotes).values([
    { tenantId: tenant1.id, patientId: pat1.id, authorUserId: doc1User.id, title: "Completed Initial Diabetic Follow-up", noteType: "Clinical Note", contentText: "Patient reports excellent compliance with Metformin. Fasting glucose averages 105 mg/dL. Recommending continued diet exercise." },
    { tenantId: tenant1.id, patientId: pat1.id, authorUserId: recep1User.id, title: "Insurance Pre-Authorization Approved", noteType: "Reception Note", contentText: "Daman Platinum network confirmed 100% direct billing with zero deductible." },
    { tenantId: tenant1.id, patientId: pat2.id, authorUserId: doc1User.id, title: "Pediatric Triage & Asthma Check", noteType: "Clinical Note", contentText: "Layla presented with mild wheezing after playground activity. Administered 1 nebulizer treatment. Lungs clear upon departure." },
  ]).onConflictDoNothing();

  // =========================================================================
  // SEED APPOINTMENT & QUEUE MANAGEMENT SYSTEM
  // =========================================================================
  console.log("📅 Seeding Appointment & Queue Management System Data...");

  const morningToday = new Date();
  morningToday.setHours(9, 30, 0, 0);
  const morningEnd = new Date(morningToday);
  morningEnd.setMinutes(morningEnd.getMinutes() + 30);

  const afternoonToday = new Date();
  afternoonToday.setHours(14, 0, 0, 0);
  const afternoonEnd = new Date(afternoonToday);
  afternoonEnd.setMinutes(afternoonEnd.getMinutes() + 30);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);

  const [app1] = await db.insert(appointments).values([
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      departmentId: deptCardio.id,
      roomId: room1.id,
      doctorId: staffDoc1.id,
      patientId: pat1.id,
      appointmentNumber: "APP-2026-00101",
      title: "Diabetic Cardiovascular Screening & Echocardiogram",
      appointmentDate: morningToday,
      startTime: morningToday,
      endTime: morningEnd,
      status: "CheckedIn",
      type: "Online Booking",
      priority: "VIP",
      isRecurring: false,
      notes: "Patient requested thorough EKG inspection due to new workout regimen.",
      checkInTime: new Date(morningToday.getTime() - 15 * 60000), // checked in 15 mins early
    },
  ]).returning();

  const [app2] = await db.insert(appointments).values([
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      departmentId: deptPeds.id,
      roomId: room2.id,
      doctorId: staffDoc1.id,
      patientId: pat2.id,
      appointmentNumber: "APP-2026-00102",
      title: "Pediatric Asthma Follow-up & Immunization Check",
      appointmentDate: afternoonToday,
      startTime: afternoonToday,
      endTime: afternoonEnd,
      status: "Scheduled",
      type: "Walk-in",
      priority: "Standard",
      isRecurring: true,
      recurrenceRule: "FREQ=MONTHLY;COUNT=6",
      notes: "Monthly pediatric evaluation.",
    },
  ]).returning();

  await db.insert(appointments).values([
    {
      tenantId: tenant1.id,
      branchId: branch2.id,
      departmentId: deptSurgery.id,
      roomId: room3.id,
      doctorId: staffDoc1.id,
      patientId: pat1.id,
      appointmentNumber: "APP-2026-00103",
      title: "Minor Elective Consultation (Rescheduled)",
      appointmentDate: tomorrow,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: "Rescheduled",
      type: "Follow-up",
      priority: "Standard",
      notes: "Moved from last Tuesday by receptionist.",
    },
  ]).onConflictDoNothing();

  // Waiting List Queues
  await db.insert(waitingListQueues).values([
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      departmentId: deptCardio.id,
      doctorId: staffDoc1.id,
      patientId: pat1.id,
      appointmentId: app1.id,
      queueNumber: "VIP-01",
      priority: "Urgent",
      status: "InRoom",
      checkedInAt: new Date(morningToday.getTime() - 15 * 60000),
      calledAt: morningToday,
      notes: "Dr. Ahmed is conducting ultrasound scan.",
    },
    {
      tenantId: tenant1.id,
      branchId: branch1.id,
      departmentId: deptPeds.id,
      doctorId: staffDoc1.id,
      patientId: pat2.id,
      appointmentId: app2.id,
      queueNumber: "A-14",
      priority: "Standard",
      status: "Waiting",
      checkedInAt: new Date(),
      notes: "Waiting in Children's Play Room B.",
    },
  ]).onConflictDoNothing();

  // Reminders
  await db.insert(appointmentReminders).values([
    { tenantId: tenant1.id, appointmentId: app1.id, patientId: pat1.id, reminderType: "WhatsApp", scheduledTime: new Date(morningToday.getTime() - 24 * 3600 * 1000), status: "Sent" },
    { tenantId: tenant1.id, appointmentId: app2.id, patientId: pat2.id, reminderType: "SMS", scheduledTime: new Date(afternoonToday.getTime() - 2 * 3600 * 1000), status: "Sent" },
  ]).onConflictDoNothing();

  console.log("✨ All Comprehensive Healthcare Modules Database Seeding Completed Successfully!");
}
