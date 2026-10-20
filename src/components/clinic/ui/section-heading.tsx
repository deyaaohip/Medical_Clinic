import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Section title row used inside every clinic page above a grid, table or list.
 */
export function SectionHeading({
  title,
  description,
  count,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          {typeof count === "number" ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {count}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
