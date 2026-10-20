import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/clinic/ui/section-heading";

export const AI_FEATURE_KEYS = [
  "visit_summary",
  "medical_note_generator",
  "soap_generator",
  "treatment_suggestions",
  "diagnosis_suggestions",
  "drug_interaction_analysis",
  "prescription_review",
  "lab_result_interpretation",
  "radiology_report_summary",
  "patient_risk_prediction",
  "follow_up_suggestions",
  "reminder_suggestions",
  "insurance_coding_assistance",
  "voice_to_medical_notes",
  "medical_document_ocr",
  "medical_report_translation",
];

const readable = (key: string) => key.replaceAll("_", " ");

/** Grid of the sixteen supported clinical assist features. */
export function AiFeatureGrid() {
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Assistive capabilities"
        count={AI_FEATURE_KEYS.length}
        description="Each capability drafts only — a physician signs off before anything reaches the patient."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {AI_FEATURE_KEYS.map((key) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-teal-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800"
          >
            <p className="text-xs font-semibold capitalize text-slate-800 dark:text-slate-200">
              {readable(key)}
            </p>
            <Badge variant="success" className="mt-2 text-[10px] font-medium">
              Doctor approval
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
