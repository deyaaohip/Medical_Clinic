import * as React from "react";
import { Activity, Calendar, PhoneCall, Users } from "lucide-react";
import { StatCard } from "@/components/clinic/ui/stat-card";

/** Four headline clinical metrics on the clinic overview. */
export function DashboardKpis() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Scheduled today"
        value="14 active"
        hint="4 walk-ins added / live queues"
        icon={Calendar}
        tone="teal"
      />
      <StatCard
        label="Active patient flow"
        value="2 in room"
        hint="Avg wait triage: 8.4 minutes"
        icon={Activity}
        tone="emerald"
      />
      <StatCard
        label="Clinical staff hub"
        value="8 on shift"
        hint="2 physicians, 4 nurses, 2 triage"
        icon={Users}
        tone="cyan"
      />
      <StatCard
        label="Master telemetry"
        value="100% SLA"
        hint="All reminders sent successfully"
        icon={PhoneCall}
        tone="amber"
      />
    </div>
  );
}
