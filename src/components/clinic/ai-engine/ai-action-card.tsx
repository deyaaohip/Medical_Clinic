"use client";

import * as React from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type AiAction = {
  id: string;
  featureKey: string;
  patientName?: string | null;
  doctorName?: string | null;
  status?: string | null;
  outputText?: string | null;
  confidenceScore?: number;
  sources?: unknown[];
  medicalReferences?: unknown[];
  doctorApprovalRequired?: boolean;
  reviewRequired?: boolean;
  patientVisible?: boolean;
  createdAt?: string | null;
};

/** One logged AI action awaiting or holding physician approval. */
export function AiActionCard({
  action,
  onApprove,
}: {
  action: AiAction;
  onApprove: () => void;
}) {
  const approved = action.status === "DoctorApproved";

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold capitalize tracking-tight text-slate-900 dark:text-slate-50">
            {action.featureKey.replaceAll("_", " ")}
          </h3>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {action.patientName} • Dr. {action.doctorName}
          </p>
        </div>
        <Badge variant={approved ? "success" : "warning"} className="shrink-0 text-[10px] font-medium">
          {action.status}
        </Badge>
      </div>

      <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
        {action.outputText}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge className="text-[10px] font-medium tabular-nums">
          Confidence {Math.round((action.confidenceScore ?? 0) * 100)}%
        </Badge>
        <Badge variant="outline" className="text-[10px] font-medium">
          Sources {action.sources?.length ?? 0}
        </Badge>
        <Badge variant="outline" className="text-[10px] font-medium">
          References {action.medicalReferences?.length ?? 0}
        </Badge>
        <Badge
          variant={action.doctorApprovalRequired ? "destructive" : "success"}
          className="text-[10px] font-medium"
        >
          {action.doctorApprovalRequired ? "Doctor approval required" : "Approved"}
        </Badge>
      </div>

      <div className="mt-3 space-y-1 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[11px] font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
        <p className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Review required: {String(action.reviewRequired)} • Patient visible:{" "}
          {String(action.patientVisible)}
        </p>
        <p className="text-[10px] text-rose-500 dark:text-rose-400">
          Logged {action.createdAt ? new Date(action.createdAt).toLocaleString() : "—"}
        </p>
      </div>

      {!approved ? (
        <Button
          size="sm"
          className="mt-3 h-8 gap-1.5 bg-emerald-600 text-xs font-semibold hover:bg-emerald-700"
          onClick={onApprove}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Doctor approve
        </Button>
      ) : null}
    </article>
  );
}
