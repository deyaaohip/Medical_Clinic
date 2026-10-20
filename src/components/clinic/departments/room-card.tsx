import * as React from "react";
import { Badge } from "@/components/ui/badge";

export type RoomRecord = {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  departmentName?: string | null;
};

const roomTone: Record<string, "default" | "destructive" | "warning" | "secondary"> = {
  Consultation: "default",
  Surgery: "destructive",
  Radiology: "warning",
  Laboratory: "secondary",
};

/** Commissioned physical suite card (consultation box, surgery, radiology...). */
export function RoomCard({ room }: { room: RoomRecord }) {
  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-teal-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-800">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={roomTone[room.type] ?? "secondary"} className="px-2 py-0 text-[10px] font-semibold uppercase tracking-wide">
          {room.type}
        </Badge>
        <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-400">
          #{room.roomNumber}
        </span>
      </div>

      <div className="mt-4">
        <h3 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {room.name}
        </h3>
        <p className="mt-0.5 truncate text-[11px] font-medium text-teal-700 dark:text-teal-400">
          {room.departmentName || "Unassigned department"}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-medium dark:border-slate-800">
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Occupancy hub
        </span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Available</span>
      </div>
    </article>
  );
}
