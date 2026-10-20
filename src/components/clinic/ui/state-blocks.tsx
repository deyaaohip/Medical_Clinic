import * as React from "react";
import { Loader2 } from "lucide-react";

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-16 dark:border-slate-800 dark:bg-slate-900">
      <Loader2 className="h-5 w-5 animate-spin text-teal-600 dark:text-teal-400" />
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center dark:border-slate-700 dark:bg-slate-900">
      {Icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
