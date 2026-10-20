import * as React from "react";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type DepartmentRecord = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
};

export type DepartmentRoom = {
  id: string;
  type: string;
};

/** Single specialty department tile with its suite-room footprint. */
export function DepartmentCard({
  department,
  rooms,
}: {
  department: DepartmentRecord;
  rooms: DepartmentRoom[];
}) {
  const roomTypes = Array.from(new Set(rooms.map((room) => room.type)));

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-sm">
          <Layers className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {department.name}
          </h3>
          <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {department.code || "No code"}
          </span>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
        {department.description || "General diagnostic and therapeutic healthcare pipeline."}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {rooms.length}
          </span>{" "}
          suite {rooms.length === 1 ? "room" : "rooms"}
        </span>

        <div className="flex flex-wrap justify-end gap-1">
          {roomTypes.length > 0 ? (
            roomTypes.slice(0, 3).map((type) => (
              <Badge key={type} variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
                {type}
              </Badge>
            ))
          ) : (
            <span className="text-[11px] font-medium text-slate-400">No rooms yet</span>
          )}
        </div>
      </div>
    </article>
  );
}
