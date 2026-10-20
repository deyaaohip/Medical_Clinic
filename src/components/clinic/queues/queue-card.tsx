"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QueueItem } from "./next-patient-banner";

const statusTone: Record<string, "success" | "default" | "warning" | "secondary"> = {
  InRoom: "success",
  Called: "default",
  Waiting: "warning",
};

/** Single patient card in the live triage queue grid. */
export function QueueCard({
  item,
  onReminder,
  onAdvance,
}: {
  item: QueueItem;
  onReminder: () => void;
  onAdvance: (status: string) => void;
}) {
  const checkIn = item.checkedInAt ? new Date(item.checkedInAt) : new Date();
  const waitMinutes = Math.max(0, Math.round((Date.now() - checkIn.getTime()) / 60000));
  const isUrgent = item.priority === "Urgent";

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
        isUrgent
          ? "border-2 border-rose-400/70 dark:border-rose-800"
          : "border border-slate-200/80 dark:border-slate-800"
      }`}
    >
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant={statusTone[item.status ?? ""] ?? "secondary"}
            className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide"
          >
            {item.status} state
          </Badge>

          <Badge
            variant={isUrgent ? "destructive" : "outline"}
            className="px-2 py-0 font-mono text-[11px] font-semibold tabular-nums"
          >
            {item.queueNumber}
          </Badge>
        </div>

        <div className="mt-4">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            <span className="truncate">{item.patientFullName}</span>
            {isUrgent ? (
              <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                VIP
              </span>
            ) : null}
          </h3>
          <p className="mt-0.5 truncate text-[11px] font-medium text-teal-700 dark:text-teal-400">
            Dr. {item.doctorFullName?.split("(د.")[0]} • {item.departmentName?.split("(")[0]}
          </p>
        </div>

        <dl className="mt-4 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <dt className="font-medium text-slate-400">Checked in</dt>
            <dd className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {checkIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-medium text-slate-400">Waiting</dt>
            <dd
              className={`font-mono text-xs font-semibold tabular-nums ${
                waitMinutes > 20
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {waitMinutes} min
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-5 py-3.5 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs font-medium hover:bg-teal-50 hover:text-teal-700"
          onClick={onReminder}
        >
          <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
          WhatsApp
        </Button>

        {item.status === "Waiting" ? (
          <Button
            size="sm"
            className="h-8 bg-teal-600 px-4 text-xs font-semibold hover:bg-teal-700"
            onClick={() => onAdvance("Called")}
          >
            Call to box
          </Button>
        ) : null}

        {item.status === "Called" ? (
          <Button
            size="sm"
            className="h-8 bg-cyan-600 px-4 text-xs font-semibold text-white hover:bg-cyan-700"
            onClick={() => onAdvance("InRoom")}
          >
            Move in room
          </Button>
        ) : null}

        {item.status === "InRoom" ? (
          <Button
            size="sm"
            className="h-8 bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
            onClick={() => onAdvance("Completed")}
          >
            Mark completed
          </Button>
        ) : null}
      </div>
    </article>
  );
}
