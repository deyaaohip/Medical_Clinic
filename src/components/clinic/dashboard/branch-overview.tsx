import * as React from "react";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/clinic/ui/section-heading";

type Branch = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};

/** Branch synchronisation cards at the bottom of the clinic overview. */
export function BranchOverview({ branches }: { branches: Branch[] }) {
  if (branches.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Branch synchronisation"
        count={branches.length}
        description="Operating facilities sharing this tenant's clinical data."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {branches.map((branch, index) => (
          <article
            key={branch.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                    index === 0
                      ? "bg-gradient-to-br from-teal-600 to-teal-800"
                      : "bg-gradient-to-br from-emerald-600 to-emerald-800"
                  }`}
                >
                  <MapPin className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {branch.name}
                  </h3>
                  <p className="mt-0.5 truncate font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {branch.address}
                  </p>
                </div>
              </div>

              <Badge variant={branch.isPrimary ? "default" : "secondary"} className="shrink-0 text-[10px] font-medium">
                {branch.isPrimary ? "Primary facility" : "Specialty branch"}
              </Badge>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <span className="font-medium text-slate-500 dark:text-slate-400">Direct contact desk</span>
              <span className="font-mono font-semibold text-teal-700 dark:text-teal-400">{branch.phone}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3 text-center dark:divide-slate-800 dark:border-slate-800">
              <div className="px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Suites</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                  {index === 0 ? 6 : 4}
                </p>
              </div>
              <div className="px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Staff</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                  {index === 0 ? 14 : 9}
                </p>
              </div>
              <div className="px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Status</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Operational
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
