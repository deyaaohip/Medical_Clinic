import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type StaffRecord = {
  id: string;
  staffType: "Doctor" | "Nurse" | "Receptionist" | string;
  specialization?: string | null;
  licenseNumber?: string | null;
  hourlyRateCents?: number | null;
  branchName?: string | null;
  bio?: string | null;
  user?: { fullName?: string | null } | null;
};

const personaStyle: Record<string, { tile: string; emoji: string; badge: "default" | "secondary" | "outline" }> = {
  Doctor: { tile: "bg-gradient-to-br from-teal-600 to-teal-800", emoji: "🩺", badge: "default" },
  Nurse: { tile: "bg-gradient-to-br from-cyan-600 to-cyan-800", emoji: "💊", badge: "secondary" },
  Receptionist: { tile: "bg-gradient-to-br from-amber-600 to-amber-800", emoji: "🤝", badge: "outline" },
};

/** One clinical staff persona card in the directory grid. */
export function StaffCard({
  staff,
  onInspectShift,
}: {
  staff: StaffRecord;
  onInspectShift: () => void;
}) {
  const style = personaStyle[staff.staffType] ?? personaStyle.Receptionist;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-white shadow-sm ${style.tile}`}
            >
              {style.emoji}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {staff.user?.fullName || "Staff persona"}
              </h3>
              <p className="mt-0.5 truncate text-[11px] font-medium text-teal-700 dark:text-teal-400">
                {staff.specialization || staff.staffType}
              </p>
            </div>
          </div>
          <Badge variant={style.badge} className="shrink-0 px-2 text-[10px] font-medium">
            {staff.staffType}
          </Badge>
        </div>

        <dl className="mt-4 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-400">Facility</dt>
            <dd className="truncate font-semibold text-slate-900 dark:text-slate-100">{staff.branchName}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-400">License</dt>
            <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {staff.licenseNumber || "N/A"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-400">Consult rate</dt>
            <dd className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              ${Math.round((staff.hourlyRateCents ?? 0) / 100)} / hr
            </dd>
          </div>
        </dl>
      </div>

      <div className="px-5 pb-4">
        <p className="line-clamp-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-medium italic leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
          &ldquo;
          {staff.bio ||
            "Dedicated healthcare professional supporting multi-branch workflows and high patient fulfilment SLA."}
          &rdquo;
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 p-5 py-4 dark:border-slate-800">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Schedules verified
        </span>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium" onClick={onInspectShift}>
          Inspect shift rule
        </Button>
      </div>
    </article>
  );
}
