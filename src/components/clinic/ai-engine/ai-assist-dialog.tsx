"use client";

import * as React from "react";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type AiDraft = {
  featureKey: string;
  patientId: string;
  doctorId: string;
  promptSummary: string;
  confidenceScore: number;
};

type Patient = { id: string; fullName: string };
type Staff = { id: string; user?: { fullName?: string | null } | null };

const selectClass =
  "h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Dialog that drafts a new AI assist action for physician review. */
export function AiAssistDialog({
  open,
  onOpenChange,
  features,
  patients,
  staff,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  features: string[];
  patients: Patient[];
  staff: Staff[];
  submitting: boolean;
  onSubmit: (draft: AiDraft) => void;
}) {
  const buildDraft = React.useCallback(
    (): AiDraft => ({
      featureKey: "visit_summary",
      patientId: patients[0]?.id ?? "",
      doctorId: staff[0]?.id ?? "",
      promptSummary: "Summarize current visit and suggest follow-up considerations.",
      confidenceScore: 0.82,
    }),
    [patients, staff]
  );

  const [draft, setDraft] = React.useState<AiDraft>(buildDraft);

  React.useEffect(() => {
    if (open) setDraft(buildDraft());
  }, [open, buildDraft]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">Run clinical AI assist</DialogTitle>
          <DialogDescription className="mt-1 text-xs font-medium text-slate-500">
            The draft is logged and hidden from the patient until a physician approves it.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
          className="my-2 space-y-3"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="aiFeature">
              Capability
            </label>
            <select
              id="aiFeature"
              value={draft.featureKey}
              onChange={(event) => setDraft({ ...draft, featureKey: event.target.value })}
              className={selectClass}
            >
              {features.map((feature) => (
                <option key={feature} value={feature}>
                  {feature.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="aiPatient">
                Patient
              </label>
              <select
                id="aiPatient"
                value={draft.patientId}
                onChange={(event) => setDraft({ ...draft, patientId: event.target.value })}
                className={selectClass}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="aiDoctor">
                Reviewing doctor
              </label>
              <select
                id="aiDoctor"
                value={draft.doctorId}
                onChange={(event) => setDraft({ ...draft, doctorId: event.target.value })}
                className={selectClass}
              >
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user?.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="aiPrompt">
              Prompt summary
            </label>
            <textarea
              id="aiPrompt"
              rows={4}
              value={draft.promptSummary}
              onChange={(event) => setDraft({ ...draft, promptSummary: event.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <p className="rounded-xl bg-amber-50 p-3 text-[11px] font-medium leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Output will be logged and blocked from patient view until physician approval.
          </p>

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 bg-teal-600 px-6 font-semibold hover:bg-teal-700" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Generate draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
