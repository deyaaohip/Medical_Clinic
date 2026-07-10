import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  jsonb,
  text,
  integer,
  bigint,
  doublePrecision,
} from "drizzle-orm/pg-core";

// 1. Tenants Table (Multi-Tenant Isolation)
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: varchar("logo_url", { length: 1024 }),
  country: varchar("country", { length: 100 }).default("UAE"),
  timeZone: varchar("time_zone", { length: 100 }).default("Asia/Dubai"),
  defaultLocale: varchar("default_locale", { length: 10 }).default("en"), // 'en' or 'ar'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft Delete
  metadata: jsonb("metadata").default({}),
});

// 2. Subscription Plans Table (SaaS Tiers & Billing)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull(),
  priceYearly: integer("price_yearly").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxPatients: integer("max_patients").notNull(),
  features: jsonb("features").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 3. Tenant Subscriptions
export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 100 })
    .notNull()
    .references(() => subscriptionPlans.id),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 4. Users Table (Global User Identities)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  preferredLocale: varchar("preferred_locale", { length: 10 }).default("en").notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 5. Roles Table (RBAC)
export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 6. Role Permissions
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionKey: varchar("permission_key", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Tenant Users Table
export const tenantUsers = pgTable("tenant_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id),
  isActive: boolean("is_active").default(true).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 8. Feature Flags Table
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  flagKey: varchar("flag_key", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 9. Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 10. Activity Logs Table
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 11. Notifications Table
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("info").notNull(),
  link: varchar("link", { length: 1024 }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// ==========================================
// SUPER ADMIN MODULES TABLES
// ==========================================

export const superAdminInvoices = pgTable("super_admin_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  status: varchar("status", { length: 50 }).default("paid").notNull(),
  billingDate: timestamp("billing_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  invoicePdfUrl: varchar("invoice_pdf_url", { length: 1024 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminCoupons = pgTable("super_admin_coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  discountPercent: doublePrecision("discount_percent"),
  discountAmountCents: integer("discount_amount_cents"),
  maxRedemptions: integer("max_redemptions").default(100),
  redemptionsCount: integer("redemptions_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminAnnouncements = pgTable("super_admin_announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("info").notNull(),
  targetTiers: jsonb("target_tiers").default(["all"]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminEmailTemplates = pgTable("super_admin_email_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateKey: varchar("template_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  variablesDescription: text("variables_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminSmsTemplates = pgTable("super_admin_sms_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateKey: varchar("template_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  messageText: text("message_text").notNull(),
  variablesDescription: text("variables_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminSystemLogs = pgTable("super_admin_system_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  level: varchar("level", { length: 50 }).default("info").notNull(),
  sourceService: varchar("source_service", { length: 100 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminGlobalSettings = pgTable("super_admin_global_settings", {
  settingKey: varchar("setting_key", { length: 100 }).primaryKey(),
  settingValue: jsonb("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminStorageFiles = pgTable("super_admin_storage_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  bucketOrFolder: varchar("bucket_or_folder", { length: 100 }).notNull(),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminAiUsage = pgTable("super_admin_ai_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  aiModel: varchar("ai_model", { length: 100 }).notNull(),
  featureCategory: varchar("feature_category", { length: 100 }).notNull(),
  promptTokens: integer("prompt_tokens").default(0).notNull(),
  completionTokens: integer("completion_tokens").default(0).notNull(),
  costCentsDouble: doublePrecision("cost_cents_double").default(0.0).notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminApiKeys = pgTable("super_admin_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 30 }).notNull(),
  secretHash: varchar("secret_hash", { length: 255 }).notNull(),
  permissions: jsonb("permissions").default(["*"]).notNull(),
  rateLimitPerMin: integer("rate_limit_per_min").default(60).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminSecurityRules = pgTable("super_admin_security_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  ruleType: varchar("rule_type", { length: 50 }).default("blacklist").notNull(),
  targetIpOrRange: varchar("target_ip_or_range", { length: 100 }).notNull(),
  reason: text("reason").notNull(),
  blockedUntil: timestamp("blocked_until"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminBackups = pgTable("super_admin_backups", {
  id: uuid("id").defaultRandom().primaryKey(),
  backupName: varchar("backup_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("completed").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  s3ArchiveUrl: varchar("s3_archive_url", { length: 1024 }).notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).default("automated").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const superAdminSupportTickets = pgTable("super_admin_support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  category: varchar("category", { length: 100 }).default("General").notNull(),
  priority: varchar("priority", { length: 50 }).default("Medium").notNull(),
  status: varchar("status", { length: 50 }).default("Open").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// =========================================================================
// NEW CLINIC MANAGEMENT MODULE TABLES (Fully supporting Multi-Branch)
// =========================================================================

// 1. Clinic Branches
export const clinicBranches = pgTable("clinic_branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  address: text("address").notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 2. Clinic Departments
export const clinicDepartments = pgTable("clinic_departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // e.g., 'Cardiology', 'Pediatrics', 'General Surgery'
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 3. Clinic Rooms
export const clinicRooms = pgTable("clinic_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => clinicDepartments.id, { onDelete: "cascade" }),
  roomNumber: varchar("room_number", { length: 50 }).notNull(), // e.g. '101-A'
  name: varchar("name", { length: 255 }).notNull(), // e.g. 'Advanced Ultrasound Suite'
  type: varchar("type", { length: 100 }).default("Consultation").notNull(), // 'Consultation', 'Radiology', 'Surgery', 'Laboratory'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 4. Staff Profiles (Doctors, Nurses, Receptionists)
export const staffProfiles = pgTable("staff_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .references(() => clinicDepartments.id),
  staffType: varchar("staff_type", { length: 100 }).notNull(), // 'Doctor', 'Nurse', 'Receptionist', 'Admin'
  specialization: varchar("specialization", { length: 255 }), // e.g. 'Pediatric Cardiologist'
  licenseNumber: varchar("license_number", { length: 100 }), // e.g. 'DHA-89120'
  hourlyRateCents: integer("hourly_rate_cents").default(15000), // $150
  bio: text("bio"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 5. Working Hours Configuration
export const workingHours = pgTable("working_hours", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staffProfiles.id, { onDelete: "cascade" }), // null if clinic/branch default
  dayOfWeek: integer("day_of_week").notNull(), // 1 = Monday, 7 = Sunday
  startTime: varchar("start_time", { length: 10 }).default("09:00").notNull(),
  endTime: varchar("end_time", { length: 10 }).default("17:00").notNull(),
  slotDurationMinutes: integer("slot_duration_minutes").default(30).notNull(), // e.g. 15, 30, 60
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Vacation & Holiday Management
export const vacationsHolidays = pgTable("vacations_holidays", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staffProfiles.id, { onDelete: "cascade" }), // null if public branch holiday
  title: varchar("title", { length: 255 }).notNull(), // e.g. 'Summer Annual Leave' or 'Eid Al-Fitr Holiday'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: varchar("type", { length: 50 }).default("Vacation").notNull(), // 'Vacation', 'Sick Leave', 'Public Holiday'
  status: varchar("status", { length: 50 }).default("Approved").notNull(), // 'Approved', 'Pending', 'Rejected'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// =========================================================================
// NEW PATIENT MANAGEMENT SYSTEM TABLES (Unlimited Records Ready)
// =========================================================================

// 1. Master Patients Table
export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id),
  medicalRecordNumber: varchar("medical_record_number", { length: 100 }).notNull(), // e.g. 'MRN-2026-98110'
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  gender: varchar("gender", { length: 50 }).notNull(), // 'Male', 'Female', 'Other'
  nationalId: varchar("national_id", { length: 100 }), // Emirates ID, SSN, Iqama
  bloodType: varchar("blood_type", { length: 10 }).default("O+"), // 'A+', 'O-', etc.
  smokingStatus: varchar("smoking_status", { length: 50 }).default("Non-smoker"), // 'Non-smoker', 'Former smoker', 'Current smoker'
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 100 }),
  preferredLanguage: varchar("preferred_language", { length: 20 }).default("en"),
  address: text("address"),
  tags: jsonb("tags").default(["New Patient"]).notNull(), // Array e.g. ['VIP', 'Diabetic', 'Pediatric']
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 2. Patient Comprehensive Medical Records
export const patientMedicalRecords = pgTable("patient_medical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  allergies: jsonb("allergies").default([]).notNull(), // Array [{ allergen: 'Penicillin', reaction: 'Severe Rash', severity: 'High' }]
  chronicDiseases: jsonb("chronic_diseases").default([]).notNull(), // Array [{ disease: 'Type 2 Diabetes', diagnosedYear: 2021 }]
  activeMedications: jsonb("active_medications").default([]).notNull(), // Array [{ medication: 'Metformin', dosage: '500mg daily' }]
  vaccinations: jsonb("vaccinations").default([]).notNull(), // Array [{ vaccine: 'COVID-19 Booster', date: '2025-01-10' }]
  familyHistory: text("family_history"),
  surgicalHistory: text("surgical_history"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Patient Vital Signs
export const patientVitalSigns = pgTable("patient_vital_signs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  bloodPressure: varchar("blood_pressure", { length: 20 }).default("120/80"), // '120/80'
  heartRateBpm: integer("heart_rate_bpm").default(72),
  temperatureCelsius: doublePrecision("temperature_celsius").default(37.0),
  respiratoryRate: integer("respiratory_rate").default(16),
  oxygenSaturationPercent: integer("oxygen_saturation_percent").default(99),
  weightKg: doublePrecision("weight_kg").default(70.0),
  heightCm: doublePrecision("height_cm").default(175.0),
  bmi: doublePrecision("bmi").default(22.9),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// 4. Patient Insurance Information
export const patientInsurance = pgTable("patient_insurance", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  providerName: varchar("provider_name", { length: 255 }).notNull(), // e.g. 'Daman Health UAE', 'Bupa', 'Aetna'
  policyNumber: varchar("policy_number", { length: 100 }).notNull(),
  groupNumber: varchar("group_number", { length: 100 }),
  networkTier: varchar("network_tier", { length: 100 }).default("GN+"),
  expiryDate: timestamp("expiry_date").notNull(),
  isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Patient Attachments (Documents, Radiology Images, Consent Forms)
export const patientAttachments = pgTable("patient_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
  category: varchar("category", { length: 100 }).default("General").notNull(), // 'Image', 'Document', 'Consent Form', 'Lab Result'
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 6. Patient Clinical Timeline & Notes
export const patientTimelineNotes = pgTable("patient_timeline_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  noteType: varchar("note_type", { length: 100 }).default("Clinical").notNull(), // 'Clinical Note', 'Reception Note', 'Consent Signed', 'Portal Message'
  contentText: text("content_text").notNull(),
  metadata: jsonb("metadata").default({}),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// =========================================================================
// NEW APPOINTMENT & QUEUE MANAGEMENT SYSTEM TABLES
// =========================================================================

// 1. Appointments Table
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => clinicDepartments.id),
  roomId: uuid("room_id")
    .references(() => clinicRooms.id),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => staffProfiles.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  appointmentNumber: varchar("appointment_number", { length: 100 }).notNull().unique(), // e.g. 'APP-89112'
  title: varchar("title", { length: 255 }).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { length: 50 }).default("Scheduled").notNull(), // 'Scheduled', 'Confirmed', 'CheckedIn', 'InConsultation', 'CheckedOut', 'Completed', 'Rescheduled', 'Canceled', 'NoShow'
  type: varchar("type", { length: 50 }).default("Online Booking").notNull(), // 'Online Booking', 'Walk-in', 'Follow-up', 'Urgent'
  priority: varchar("priority", { length: 50 }).default("Standard").notNull(), // 'Standard', 'Urgent', 'VIP'
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurrenceRule: varchar("recurrence_rule", { length: 255 }), // e.g. 'FREQ=WEEKLY;INTERVAL=1;COUNT=4'
  parentAppointmentId: uuid("parent_appointment_id"), // if generated from recurring
  googleCalendarEventId: varchar("google_calendar_event_id", { length: 255 }),
  outlookCalendarEventId: varchar("outlook_calendar_event_id", { length: 255 }),
  notes: text("notes"),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// 2. Waiting List & Live Patient Queue Management
export const waitingListQueues = pgTable("waiting_list_queues", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id")
    .notNull()
    .references(() => clinicBranches.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => clinicDepartments.id),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => staffProfiles.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  queueNumber: varchar("queue_number", { length: 50 }).notNull(), // e.g. 'A-14'
  priority: varchar("priority", { length: 50 }).default("Standard").notNull(), // 'Standard', 'Urgent'
  status: varchar("status", { length: 50 }).default("Waiting").notNull(), // 'Waiting', 'Called', 'InRoom', 'Completed', 'Left'
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

// 3. Automated SMS, WhatsApp & Email Reminders Auditing
export const appointmentReminders = pgTable("appointment_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id")
    .notNull()
    .references(() => appointments.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  reminderType: varchar("reminder_type", { length: 50 }).notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  status: varchar("status", { length: 50 }).default("Sent").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// =========================================================================
// ELECTRONIC MEDICAL RECORD (EMR)
// =========================================================================

export const icd10Codes = pgTable("icd10_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: varchar("description", { length: 512 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  isBillable: boolean("is_billable").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emrTemplates = pgTable("emr_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 255 }).notNull(),
  chiefComplaint: text("chief_complaint"),
  subjective: text("subjective"),
  objective: text("objective"),
  assessment: text("assessment"),
  treatmentPlan: text("treatment_plan"),
  physicalExamination: jsonb("physical_examination").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const emrEncounters = pgTable("emr_encounters", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => clinicBranches.id),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").notNull().references(() => staffProfiles.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  encounterNumber: varchar("encounter_number", { length: 100 }).notNull().unique(),
  visitType: varchar("visit_type", { length: 100 }).default("Outpatient").notNull(),
  status: varchar("status", { length: 50 }).default("Draft").notNull(),
  chiefComplaint: text("chief_complaint").notNull(),
  subjective: text("subjective").notNull(),
  objective: text("objective").notNull(),
  assessment: text("assessment").notNull(),
  treatmentPlan: text("treatment_plan").notNull(),
  physicalExamination: jsonb("physical_examination").default({}).notNull(),
  followUpInstructions: text("follow_up_instructions"),
  followUpDate: timestamp("follow_up_date"),
  clinicalNotes: text("clinical_notes"),
  doctorSignature: text("doctor_signature"),
  signedAt: timestamp("signed_at"),
  visitDate: timestamp("visit_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const emrEncounterDiagnoses = pgTable("emr_encounter_diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  encounterId: uuid("encounter_id").notNull().references(() => emrEncounters.id, { onDelete: "cascade" }),
  icd10CodeId: uuid("icd10_code_id").notNull().references(() => icd10Codes.id),
  diagnosisText: text("diagnosis_text").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emrAttachments = pgTable("emr_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  encounterId: uuid("encounter_id").notNull().references(() => emrEncounters.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).default("Clinical Document").notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const emrVoiceNotes = pgTable("emr_voice_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  encounterId: uuid("encounter_id").notNull().references(() => emrEncounters.id, { onDelete: "cascade" }),
  audioUrl: varchar("audio_url", { length: 1024 }).notNull(),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  transcription: text("transcription"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// =========================================================================
// PRESCRIPTION MANAGEMENT
// =========================================================================

export const medicines = pgTable("medicines", {
  id: uuid("id").defaultRandom().primaryKey(),
  genericName: varchar("generic_name", { length: 255 }).notNull(),
  brandName: varchar("brand_name", { length: 255 }).notNull(),
  strength: varchar("strength", { length: 100 }).notNull(),
  dosageForm: varchar("dosage_form", { length: 100 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  drugClass: varchar("drug_class", { length: 255 }).notNull(),
  interactionMedicineIds: jsonb("interaction_medicine_ids").default([]).notNull(),
  allergyKeywords: jsonb("allergy_keywords").default([]).notNull(),
  genericAlternatives: jsonb("generic_alternatives").default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptionTemplates = pgTable("prescription_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  diagnosisLabel: varchar("diagnosis_label", { length: 255 }),
  items: jsonb("items").default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => clinicBranches.id),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").notNull().references(() => staffProfiles.id),
  encounterId: uuid("encounter_id").references(() => emrEncounters.id, { onDelete: "set null" }),
  prescriptionNumber: varchar("prescription_number", { length: 100 }).notNull().unique(),
  diagnosis: text("diagnosis"),
  instructions: text("instructions"),
  status: varchar("status", { length: 50 }).default("Active").notNull(),
  doctorSignature: text("doctor_signature"),
  signedAt: timestamp("signed_at"),
  qrVerificationToken: varchar("qr_verification_token", { length: 255 }).notNull().unique(),
  refillOfPrescriptionId: uuid("refill_of_prescription_id"),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const prescriptionItems = pgTable("prescription_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id").notNull().references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: uuid("medicine_id").notNull().references(() => medicines.id),
  dosage: varchar("dosage", { length: 255 }).notNull(),
  frequency: varchar("frequency", { length: 255 }).notNull(),
  duration: varchar("duration", { length: 255 }).notNull(),
  route: varchar("route", { length: 100 }).default("Oral").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  refillsAllowed: integer("refills_allowed").default(0).notNull(),
  refillsUsed: integer("refills_used").default(0).notNull(),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =========================================================================
// LABORATORY MODULE
// =========================================================================

export const labTests = pgTable("lab_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  sampleType: varchar("sample_type", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  referenceRangeMale: varchar("reference_range_male", { length: 255 }),
  referenceRangeFemale: varchar("reference_range_female", { length: 255 }),
  priceCents: integer("price_cents").default(0).notNull(),
  turnaroundMinutes: integer("turnaround_minutes").default(1440).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const labPackages = pgTable("lab_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  testIds: jsonb("test_ids").default([]).notNull(),
  priceCents: integer("price_cents").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const labOrders = pgTable("lab_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => clinicBranches.id),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  orderingDoctorId: uuid("ordering_doctor_id").notNull().references(() => staffProfiles.id),
  encounterId: uuid("encounter_id").references(() => emrEncounters.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  priority: varchar("priority", { length: 50 }).default("Routine").notNull(),
  status: varchar("status", { length: 50 }).default("Ordered").notNull(),
  clinicalNotes: text("clinical_notes"),
  sampleCollectedAt: timestamp("sample_collected_at"),
  collectedByUserId: uuid("collected_by_user_id").references(() => users.id, { onDelete: "set null" }),
  reviewedByDoctorId: uuid("reviewed_by_doctor_id").references(() => staffProfiles.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  doctorReviewNotes: text("doctor_review_notes"),
  orderedAt: timestamp("ordered_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const labOrderItems = pgTable("lab_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  labOrderId: uuid("lab_order_id").notNull().references(() => labOrders.id, { onDelete: "cascade" }),
  labTestId: uuid("lab_test_id").notNull().references(() => labTests.id),
  status: varchar("status", { length: 50 }).default("Pending").notNull(),
  resultValue: varchar("result_value", { length: 255 }),
  resultText: text("result_text"),
  referenceRange: varchar("reference_range", { length: 255 }),
  isAbnormal: boolean("is_abnormal").default(false).notNull(),
  abnormalFlag: varchar("abnormal_flag", { length: 20 }),
  technicianUserId: uuid("technician_user_id").references(() => users.id, { onDelete: "set null" }),
  resultedAt: timestamp("resulted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const labAttachments = pgTable("lab_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  labOrderId: uuid("lab_order_id").notNull().references(() => labOrders.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// =========================================================================
// RADIOLOGY MODULE TABLES
// =========================================================================

export const radiologyOrders = pgTable("radiology_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => clinicBranches.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id").notNull().references(() => staffProfiles.id, { onDelete: "cascade" }),
  encounterId: uuid("encounter_id").references(() => emrEncounters.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  modality: varchar("modality", { length: 50 }).notNull(), // X-Ray, MRI, CT, Ultrasound
  bodyPart: varchar("body_part", { length: 150 }).notNull(),
  clinicalIndication: text("clinical_indication").notNull(),
  priority: varchar("priority", { length: 50 }).default("Routine").notNull(),
  status: varchar("status", { length: 50 }).default("Ordered").notNull(), // Ordered, ImageUploaded, Reported, DoctorReviewed
  radiologistUserId: uuid("radiologist_user_id").references(() => users.id, { onDelete: "set null" }),
  radiologistReport: text("radiologist_report"),
  impression: text("impression"),
  doctorReviewNotes: text("doctor_review_notes"),
  doctorReviewedAt: timestamp("doctor_reviewed_at"),
  comparisonStudyOrderId: uuid("comparison_study_order_id"),
  dicomStudyUid: varchar("dicom_study_uid", { length: 255 }),
  viewerUrl: varchar("viewer_url", { length: 1024 }),
  reportPdfUrl: varchar("report_pdf_url", { length: 1024 }),
  historySnapshot: jsonb("history_snapshot").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const radiologyImages = pgTable("radiology_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  radiologyOrderId: uuid("radiology_order_id").notNull().references(() => radiologyOrders.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).default("application/dicom").notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
  imageType: varchar("image_type", { length: 50 }).default("DICOM").notNull(),
  seriesUid: varchar("series_uid", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const radiologyAttachments = pgTable("radiology_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  radiologyOrderId: uuid("radiology_order_id").notNull().references(() => radiologyOrders.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  category: varchar("category", { length: 100 }).default("Report Attachment").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// =========================================================================
// INSURANCE MODULE TABLES
// =========================================================================

export const insuranceCompanies = pgTable("insurance_companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  payerCode: varchar("payer_code", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  billingRules: jsonb("billing_rules").default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const insurancePolicies = pgTable("insurance_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => insuranceCompanies.id, { onDelete: "cascade" }),
  policyNumber: varchar("policy_number", { length: 100 }).notNull(),
  memberId: varchar("member_id", { length: 100 }).notNull(),
  planName: varchar("plan_name", { length: 255 }).notNull(),
  coverage: jsonb("coverage").default({}).notNull(),
  coPaymentPercent: doublePrecision("co_payment_percent").default(20).notNull(),
  deductibleCents: integer("deductible_cents").default(0).notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  isPrimary: boolean("is_primary").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const insuranceApprovalRequests = pgTable("insurance_approval_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  policyId: uuid("policy_id").notNull().references(() => insurancePolicies.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  requestedService: varchar("requested_service", { length: 255 }).notNull(),
  authorizationNumber: varchar("authorization_number", { length: 100 }),
  requestedAmountCents: integer("requested_amount_cents").notNull(),
  approvedAmountCents: integer("approved_amount_cents").default(0).notNull(),
  status: varchar("status", { length: 50 }).default("Pending").notNull(), // Pending, Authorized, Rejected, Expired
  notes: text("notes"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  decidedAt: timestamp("decided_at"),
});

export const insuranceClaims = pgTable("insurance_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => clinicBranches.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  policyId: uuid("policy_id").notNull().references(() => insurancePolicies.id, { onDelete: "cascade" }),
  approvalRequestId: uuid("approval_request_id").references(() => insuranceApprovalRequests.id, { onDelete: "set null" }),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  claimNumber: varchar("claim_number", { length: 100 }).notNull().unique(),
  serviceCode: varchar("service_code", { length: 100 }).notNull(),
  diagnosisCodes: jsonb("diagnosis_codes").default([]).notNull(),
  billedAmountCents: integer("billed_amount_cents").notNull(),
  insurancePayableCents: integer("insurance_payable_cents").notNull(),
  patientCopaymentCents: integer("patient_copayment_cents").notNull(),
  status: varchar("status", { length: 50 }).default("Submitted").notNull(), // Submitted, Paid, Rejected, Resubmitted
  rejectionReason: text("rejection_reason"),
  resubmissionCount: integer("resubmission_count").default(0).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  deletedAt: timestamp("deleted_at"),
});
