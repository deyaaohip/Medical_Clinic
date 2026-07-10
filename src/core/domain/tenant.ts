// DDD Domain Model: Tenant & Tenant Isolation
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  country?: string | null;
  timeZone?: string | null;
  defaultLocale: "en" | "ar";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ClinicBranch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  isPrimary: boolean;
}
