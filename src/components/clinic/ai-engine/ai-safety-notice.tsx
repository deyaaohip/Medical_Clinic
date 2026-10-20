import * as React from "react";
import { ShieldAlert } from "lucide-react";

/** Non-negotiable clinical safety framing shown above the AI module. */
export function AiSafetyNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Clinical safety rule: AI never replaces the doctor.</p>
        <p className="text-xs font-medium leading-relaxed">
          Every recommendation carries a confidence score, sources, medical references and a review
          requirement. Patients cannot receive AI output without physician approval.
        </p>
      </div>
    </div>
  );
}
