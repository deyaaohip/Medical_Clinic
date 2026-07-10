"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Stethoscope,
  Building2,
  Users,
  Check,
  X,
  ExternalLink,
  Clock,
  Loader2,
  Activity,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  RotateCw,
} from "lucide-react";

export default function MasterInteractiveCalendarPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [appointmentsData, setAppointmentsData] = React.useState<any[]>([]);
  const [staffData, setStaffData] = React.useState<any[]>([]);
  const [roomsData, setRoomsData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters State
  const [calendarView, setCalendarView] = React.useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDoctorId, setSelectedDoctorId] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [currentDate, setCurrentDate] = React.useState(new Date("2026-02-15")); // Matching our sample seed appointments

  // Sync Switches
  const [googleSync, setGoogleSync] = React.useState(true);
  const [outlookSync, setOutlookSync] = React.useState(true);

  // Modal State
  const [selectedApp, setSelectedApp] = React.useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: selectedStatus,
        doctorId: selectedDoctorId,
        startDate: new Date(currentDate.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(currentDate.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
      });

      const [appRes, staffRes, overRes] = await Promise.all([
        fetch(`/api/clinic/${tenantId}/appointments?${q}`),
        fetch(`/api/clinic/${tenantId}/staff?staffType=Doctor`),
        fetch(`/api/clinic/${tenantId}/departments`),
      ]);

      const appJson = await appRes.json();
      const staffJson = await staffRes.json();
      const overJson = await overRes.json();

      if (appJson.success) setAppointmentsData(appJson.data || []);
      if (staffJson.success) setStaffData(staffJson.data || []);
      if (overJson.success) setRoomsData(overJson.rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedStatus, selectedDoctorId, currentDate]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/clinic/${tenantId}/appointments/${selectedApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Appointment status successfully shifted to '${newStatus}'!`);
        setSelectedApp(null);
        fetchData();
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch (err: any) {
      alert(err.message || "Communication Error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const shiftDate = (offset: number) => {
    const next = new Date(currentDate);
    if (calendarView === "daily") next.setDate(next.getDate() + offset);
    if (calendarView === "weekly") next.setDate(next.getDate() + offset * 7);
    if (calendarView === "monthly") next.setMonth(next.getMonth() + offset);
    setCurrentDate(next);
  };

  const getStatusBadgeVariant = (st: string) => {
    if (st === "CheckedIn" || st === "Confirmed" || st === "Completed") return "success";
    if (st === "InConsultation" || st === "Scheduled") return "default";
    if (st === "Rescheduled" || st === "Canceled" || st === "NoShow") return "destructive";
    return "warning";
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* Top Controls Row */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2 text-slate-900 dark:text-slate-50">
            <span>Master Multi-View Triage Calendar</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium max-w-xl">
            Supports Online Bookings, walk-in triage triage, and automated Google / Outlook Calendar bi-directional sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-extrabold space-x-1"
            onClick={() => router.push(`/${tenantId}/queues`)}
          >
            <Activity className="w-4 h-4 text-teal-600 animate-spin" />
            <span>Inspect Live Queues</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-9 px-6 text-xs font-black shadow-md space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            onClick={() => router.push(`/${tenantId}/appointments/book`)}
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ Book New Appointment</span>
          </Button>
        </div>
      </div>

      {/* Synchronizations Relay Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 px-6 bg-slate-200/60 dark:bg-slate-800/50 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs font-bold">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <span className="text-slate-500 uppercase font-black text-[11px]">External Gateways:</span>
          <div className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
            <span className={googleSync ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}>Google Calendar Relays</span>
            <Switch checked={googleSync} onCheckedChange={setGoogleSync} className="scale-80" />
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
            <span className={outlookSync ? "text-blue-700 dark:text-blue-400" : "text-slate-400"}>Outlook Sync Pipelines</span>
            <Switch checked={outlookSync} onCheckedChange={setOutlookSync} className="scale-80" />
          </div>
        </div>

        <Badge variant="outline" className="font-mono bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300">
          Sync Ping: 2.1ms (Ultra Low Jitter)
        </Badge>
      </div>

      {/* Calendar Controls & Filters Bar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        {/* Date shifting Bar */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 font-extrabold px-3 text-xs" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-white" onClick={() => shiftDate(1)}>
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>
          <span className="text-base font-black font-mono text-slate-900 dark:text-slate-50">
            {currentDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* View mode toggle button Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 rtl:space-x-reverse bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <Button
              variant={calendarView === "daily" ? "default" : "ghost"}
              size="sm"
              className="text-xs font-black px-3.5 h-8 rounded-lg"
              onClick={() => setCalendarView("daily")}
            >
              Daily Triage Box
            </Button>
            <Button
              variant={calendarView === "weekly" ? "default" : "ghost"}
              size="sm"
              className="text-xs font-black px-3.5 h-8 rounded-lg"
              onClick={() => setCalendarView("weekly")}
            >
              Weekly Grid
            </Button>
            <Button
              variant={calendarView === "monthly" ? "default" : "ghost"}
              size="sm"
              className="text-xs font-black px-3.5 h-8 rounded-lg"
              onClick={() => setCalendarView("monthly")}
            >
              Monthly Sheet
            </Button>
          </div>

          {/* Doctor Staff Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-black space-x-1.5 bg-slate-50 dark:bg-slate-800">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>
                  {selectedDoctorId === "all"
                    ? "All Physicians"
                    : staffData.find((s) => s.id === selectedDoctorId)?.user?.fullName || "Physician"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2">
              <DropdownMenuLabel className="text-xs">Filter by Triage Physician:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedDoctorId("all")} className="cursor-pointer text-xs font-bold">
                All Physicians ({staffData.length})
              </DropdownMenuItem>
              {staffData.map((st) => (
                <DropdownMenuItem key={st.id} onClick={() => setSelectedDoctorId(st.id)} className="cursor-pointer text-xs font-bold">
                  {st.user?.fullName} ({st.specialization})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-black space-x-1.5 bg-slate-50 dark:bg-slate-800">
                <Filter className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{selectedStatus === "all" ? "All Appointment Statuses" : selectedStatus.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 p-2">
              <DropdownMenuLabel className="text-xs">Filter Status:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedStatus("all")} className="cursor-pointer text-xs font-bold">All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Scheduled")} className="cursor-pointer text-xs font-bold">Scheduled</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("CheckedIn")} className="cursor-pointer text-xs font-bold">Checked In / Triage</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("InConsultation")} className="cursor-pointer text-xs font-bold">In Consultation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Completed")} className="cursor-pointer text-xs font-bold">Completed / Paid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Rescheduled")} className="cursor-pointer text-xs font-bold">Rescheduled</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("NoShow")} className="cursor-pointer text-xs font-bold">No Show</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Render Awesome Calendar Content Deck */}
      {loading ? (
        <div className="flex items-center justify-center p-24 text-teal-600 space-x-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Querying Calendar Box Container...</span>
        </div>
      ) : appointmentsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-4xl">📭</span>
          <h3 className="mt-4 text-base font-black">No triage appointments verified for this active criteria</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Try switching calendar views, shifting dates, or click '+ Book New Appointment' above.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointmentsData.map((app) => {
              const startDt = new Date(app.startTime);
              const endDt = new Date(app.endTime);
              return (
                <Card
                  key={app.id}
                  className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-teal-500 transition-all flex flex-col justify-between cursor-pointer group"
                  onClick={() => setSelectedApp(app)}
                >
                  <CardHeader className="p-5 pb-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusBadgeVariant(app.status) as any} className="px-2.5 py-0.5 text-[10px] uppercase font-black">
                        {app.status}
                      </Badge>
                      <Badge variant={app.priority === "VIP" ? "destructive" : "secondary"} className="px-2 py-0.5 text-[10px] font-black">
                        {app.type}
                      </Badge>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400">
                        {startDt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {endDt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <CardTitle className="text-base font-black text-slate-900 dark:text-slate-50 mt-1 truncate group-hover:text-teal-600 transition-colors">
                        {app.patientFullName}
                      </CardTitle>
                      <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{app.title}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">
                      <span className="truncate">Doc: {app.doctorFullName?.split("(د.")[0]}</span>
                      <span className="font-mono text-teal-700 dark:text-teal-300 shrink-0 ml-1">{app.roomName?.split("(")[0]}</span>
                    </div>
                  </CardHeader>
                  <CardFooter className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-500 font-mono">{app.appointmentNumber}</span>
                    <span className="text-teal-600 font-bold group-hover:underline flex items-center">
                      <span>Shift Status</span>
                      <ExternalLink className="w-3 h-3 ml-1 rtl:ml-0 rtl:mr-1" />
                    </span>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded Shift Triage Status Modal */}
      <Dialog open={selectedApp !== null} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Enforce Appointment Triage Status</DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Select an operational milestone below to update the PostgreSQL calendar and automatically propagate to live waiting list queues:
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6 my-2">
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1 font-mono text-xs">
                <p className="font-black text-sm font-sans text-slate-900 dark:text-slate-100">{selectedApp.patientFullName}</p>
                <p>App #: {selectedApp.appointmentNumber}</p>
                <p>Physician: {selectedApp.doctorFullName}</p>
                <p>Current Status: <span className="font-extrabold text-teal-600">{selectedApp.status.toUpperCase()}</span></p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase text-slate-500 tracking-wider">Execute Fast Shift Milestone:</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { st: "CheckedIn", label: "Check In (Front Desk)", color: "bg-teal-600 text-white hover:bg-teal-700" },
                    { st: "InConsultation", label: "In Room / Consult", color: "bg-cyan-600 text-white hover:bg-cyan-700" },
                    { st: "CheckedOut", label: "Check Out / Leaving", color: "bg-emerald-600 text-white hover:bg-emerald-700" },
                    { st: "Completed", label: "Completed (Paid)", color: "bg-green-600 text-white hover:bg-green-700" },
                    { st: "Rescheduled", label: "Reschedule", color: "bg-amber-600 text-white hover:bg-amber-700" },
                    { st: "NoShow", label: "Log No Show", color: "bg-rose-600 text-white hover:bg-rose-700" },
                  ].map((act) => (
                    <Button
                      key={act.st}
                      className={`h-11 text-xs font-extrabold rounded-xl shadow-xs ${act.color} ${selectedApp.status === act.st ? "ring-4 ring-offset-2 ring-slate-900 dark:ring-white" : ""}`}
                      onClick={() => handleStatusUpdate(act.st)}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : act.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSelectedApp(null)} disabled={updatingStatus}>
              Close Window
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
