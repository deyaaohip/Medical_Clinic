import * as React from "react";
import { cn } from "@/lib/utils";

const toneStyles = {
  teal: "bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  rose: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
  slate:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
} as const;

export type StatTone = keyof typeof toneStyles;

/**
 * Compact metric tile used in the summary row at the top of clinic pages.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "teal",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ElementType;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-slate-900 dark:text-slate-50">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{hint}</p>
          ) : null}
        </div>

        {Icon ? (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
              toneStyles[tone]
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
