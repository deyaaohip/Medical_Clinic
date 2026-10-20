import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Page title block shared by every clinic portal screen.
 * Optional `children` render as a footer row (filters, tabs, branch switchers).
 */
export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  icon?: React.ElementType;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          {Icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div className="space-y-1.5">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
        ) : null}
      </div>

      {children ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          {children}
        </div>
      ) : null}
    </header>
  );
}
