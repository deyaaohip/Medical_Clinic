// DDD Domain Model: Feature Flags & SaaS Toggles
export interface FeatureFlag {
  id: string;
  tenantId: string;
  flagKey: string;
  isEnabled: boolean;
  updatedAt: Date;
}

export type StandardFeatureKey =
  | "telemedicine"
  | "ai_clinical_scribe"
  | "automated_whatsapp_reminders"
  | "vip_concierge_portal"
  | "arabic_advanced_nlp"
  | "custom_hl7_fhir"
  | "multi_branch";
