"use client";

import * as React from "react";
import { MessageSquare, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QueueItem = {
  id: string;
  queueNumber: string;
  patientFullName: string;
  doctorFullName?: string | null;
  departmentName?: string | null;
  appointmentId?: string | null;
  priority?: string | null;
  status?: string | null;
  checkedInAt?: string | null;
};

/** Highlighted "next patient" banner for the waiting queue. */
export function NextPatientBanner({
  item,
  onReminder,
  onCallNext,
}: {
  item: QueueItem;
  onReminder: () => void;
  onCallNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-teal-500/40 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 text-white shadow-lg md:flex-row">
      <div className="flex items-center gap-4 text-center md:text-start">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-500 font-mono text-xl font-semibold tabular-nums shadow-md">
          {item.queueNumber}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300">
            Next priority in line
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{item.patientFullName}</h2>
          <p className="mt-0.5 font-mono text-[11px] text-slate-300">
            Dr. {item.doctorFullName} • {item.departmentName}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="lg"
          className="h-10 gap-2 border-teal-400/60 bg-transparent text-xs font-medium text-teal-200 hover:bg-teal-900/50 hover:text-teal-100"
          onClick={onReminder}
        >
          <MessageSquare className="h-4 w-4" />
          Dispatch alert
        </Button>

        <Button
          size="lg"
          className="h-10 gap-2 bg-emerald-500 px-6 text-xs font-semibold text-slate-950 shadow-md hover:bg-emerald-400"
          onClick={onCallNext}
        >
          <Volume2 className="h-4 w-4" />
          Call next to triage room
        </Button>
      </div>
    </div>
  );
}
