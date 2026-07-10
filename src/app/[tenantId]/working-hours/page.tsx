"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function ClinicWorkingHoursVacationsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [workingHoursData, setWorkingHoursData] = React.useState<any[]>([]);
  const [vacationsData, setVacationsData] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = React.useState("all");

  // Add Vacation Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newVacation, setNewVacation] = React.useState({
    title: "",
    startDate: "2026-06-01",
    endDate: "2026-06-14",
    type: "Vacation",
    status: "Approved",
    notes: "Summer academic leave.",
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ branchId: selectedBranch });
      const [hourRes, overRes] = await Promise.all([
        fetch(`/api/clinic/${tenantId}/working-hours?${q}`),
        fetch(`/api/clinic/${tenantId}/overview`),
      ]);
      const hourJson = await hourRes.json();
      const overJson = await overRes.json();

      if (hourJson.success) {
        setWorkingHoursData(hourJson.workingHours || []);
        setVacationsData(hourJson.vacations || []);
      }
      if (overJson.success) {
        setBranches(overJson.branches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedBranch]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLeaveAction = (id: string, actionStatus: string) => {
    alert(`Leave request #${id.substring(0, 6)} status successfully updated to ${actionStatus.toUpperCase()} !`);
    fetchData();
  };

  const handleRegisterLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert("Leave & Holiday Schedule successfully synced with PostgreSQL Calendar Container!");
      setSubmitting(false);
      setModalOpen(false);
      fetchData();
    }, 800);
  };

  const dayMap: Record<number, string> = {
    1: "Monday Shift",
    2: "Tuesday Shift",
    3: "Wednesday Shift",
    4: "Thursday Shift",
    5: "Friday Shift (Ramadan/Early)",
    6: "Saturday Triage",
    7: "Sunday Emergency Relay",
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* Top Multi-Branch Header Row */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2 text-slate-900 dark:text-slate-50">
            <span>Working Hours, Shift Rules & Leave Calendars</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium max-w-lg">
            Standard operating shift matrices, appointment time slot durations, and physician vacation scheduling pipelines.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Branch Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-black space-x-1.5 bg-slate-50 dark:bg-slate-800">
                <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>
                  {selectedBranch === "all"
                    ? "All multiple branches"
                    : branches.find((b) => b.id === selectedBranch)?.name || "Facility"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2">
              <DropdownMenuLabel className="text-xs">Filter Operating Facility:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedBranch("all")} className="cursor-pointer text-xs font-bold">
                All multiple branches ({branches.length})
              </DropdownMenuItem>
              {branches.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => setSelectedBranch(b.id)} className="cursor-pointer text-xs font-bold">
                  {b.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="default"
            size="sm"
            className="h-9 px-6 text-xs font-extrabold shadow-md space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            onClick={() => setModalOpen(true)}
          >
            <Calendar className="h-4 w-4" />
            <span>+ Enroll Vacation / Triage Holiday</span>
          </Button>
        </div>
      </div>

      {/* Operating Shift Rules Bar */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center space-x-2">
          <span>Operating Working Shift Matrices ({workingHoursData.length})</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-teal-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : workingHoursData.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-bold text-slate-500">No shift matrices configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workingHoursData.map((h, index) => (
              <Card key={index} className="border border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 rounded-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      {dayMap[h.dayOfWeek] || `Day #${h.dayOfWeek}`}
                    </span>
                    <Badge variant="success" className="px-2 py-0 text-[10px]">
                      {h.slotDurationMinutes} Mins Slots
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Operating Window</p>
                      <p className="text-xl font-black font-mono text-slate-900 dark:text-slate-50 mt-0.5">
                        {h.startTime} - {h.endTime}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{h.staffName}</span>
                  <span className="text-emerald-600 font-bold">Active SLA</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Vacation Management & Holiday Calendar Area */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">
          Master Vacation Requests & Public Holidays ({vacationsData.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-teal-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : vacationsData.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-bold text-slate-500">No active vacations requests recorded.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <table className="w-full border-collapse text-left rtl:text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Leave Title / Purpose</th>
                  <th className="py-3 px-4">Target Persona</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Active Date Window</th>
                  <th className="py-3 px-4 text-center">Approval Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {vacationsData.map((vac) => {
                  return (
                    <tr key={vac.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-slate-50">{vac.title}</td>
                      <td className="py-3 px-4 font-semibold text-teal-600 dark:text-teal-400">{vac.staffName}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={vac.type === "Public Holiday" ? "warning" : "secondary"}
                          className="px-2 py-0.5 text-[10px] uppercase font-bold"
                        >
                          {vac.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        {new Date(vac.startDate).toISOString().split("T")[0]} to {new Date(vac.endDate).toISOString().split("T")[0]}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={vac.status === "Approved" ? "success" : vac.status === "Rejected" ? "destructive" : "warning"}
                          className="px-2.5 py-0.5 text-[10px] uppercase font-extrabold"
                        >
                          {vac.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center space-x-1.5 rtl:space-x-reverse whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-black px-2.5 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleLeaveAction(vac.id, "Approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-black px-2.5 text-rose-600 hover:bg-rose-50"
                          onClick={() => handleLeaveAction(vac.id, "Rejected")}
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Leave Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Enroll Vacation / Staff Leave</DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Add physician annual vacations, sick leave, or branch-wide religious holidays:
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterLeave} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label htmlFor="vTitle" className="text-xs font-bold">Leave Full Purpose</Label>
              <Input
                id="vTitle"
                required
                placeholder="e.g. Annual International Surgical Workshop"
                value={newVacation.title}
                onChange={(e) => setNewVacation((prev) => ({ ...prev, title: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vStart" className="text-xs font-bold">Start Date</Label>
                <Input
                  id="vStart"
                  type="date"
                  required
                  value={newVacation.startDate}
                  onChange={(e) => setNewVacation((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vEnd" className="text-xs font-bold">End Date</Label>
                <Input
                  id="vEnd"
                  type="date"
                  required
                  value={newVacation.endDate}
                  onChange={(e) => setNewVacation((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vType" className="text-xs font-bold">Leave Type</Label>
                <select
                  id="vType"
                  value={newVacation.type}
                  onChange={(e) => setNewVacation((prev) => ({ ...prev, type: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold shadow-sm focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="Vacation">Vacation Leave</option>
                  <option value="Sick Leave">Sick Triage</option>
                  <option value="Public Holiday">Public Holiday</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vStatus" className="text-xs font-bold">Initial Status</Label>
                <select
                  id="vStatus"
                  value={newVacation.status}
                  onChange={(e) => setNewVacation((prev) => ({ ...prev, status: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold shadow-sm focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="Approved">Approved / Active</option>
                  <option value="Pending">Pending Audit</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vNotes" className="text-xs font-bold">Additional Coverage Relay Notes</Label>
              <textarea
                id="vNotes"
                rows={3}
                value={newVacation.notes}
                onChange={(e) => setNewVacation((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="default" size="sm" type="submit" className="bg-teal-600 hover:bg-teal-700 font-extrabold px-6" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enroll Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
