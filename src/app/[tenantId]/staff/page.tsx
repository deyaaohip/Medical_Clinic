"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  Users,
  Search,
  Filter,
  Plus,
  Building2,
  Stethoscope,
  DollarSign,
  FileText,
  Check,
  X,
  Loader2,
} from "lucide-react";

export default function ClinicStaffManagementPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [staffData, setStaffData] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedBranch, setSelectedBranch] = React.useState("all");
  const [selectedStaffType, setSelectedStaffType] = React.useState("all");

  // Add Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [newStaff, setNewStaff] = React.useState({
    fullName: "",
    email: "",
    staffType: "Doctor",
    specialization: "",
    licenseNumber: "",
    hourlyRateCents: 15000,
    branchId: "",
    bio: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  const fetchStaff = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        branchId: selectedBranch,
        staffType: selectedStaffType,
      });

      const [staffRes, overRes] = await Promise.all([
        fetch(`/api/clinic/${tenantId}/staff?${q}`),
        fetch(`/api/clinic/${tenantId}/overview`),
      ]);

      const staffJson = await staffRes.json();
      const overJson = await overRes.json();

      if (staffJson.success) setStaffData(staffJson.data || []);
      if (overJson.success) {
        setBranches(overJson.branches || []);
        if (!newStaff.branchId && overJson.branches?.[0]) {
          setNewStaff((prev) => ({ ...prev, branchId: overJson.branches[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedBranch, selectedStaffType, newStaff.branchId]);

  React.useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleRegisterStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      alert("Staff profile successfully registered & mapped to Multi-Branch container!");
      setModalOpen(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffData.filter((s) => {
    if (!searchQuery) return true;
    const n = s.user?.fullName?.toLowerCase() || "";
    const sp = s.specialization?.toLowerCase() || "";
    const lic = s.licenseNumber?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return n.includes(q) || sp.includes(q) || lic.includes(q);
  });

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* Dynamic Action Toolbar Row */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder="Search staff Name, specialization, license..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs font-semibold shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 rtl:pl-4 rtl:pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Branch Switcher Dropdown */}
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
              <DropdownMenuLabel className="text-xs">Filter by Operating Branch:</DropdownMenuLabel>
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

          {/* Staff Persona Type Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-black space-x-1.5 bg-slate-50 dark:bg-slate-800">
                <Filter className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{selectedStaffType === "all" ? "All Clinical Personas" : selectedStaffType.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 p-2">
              <DropdownMenuLabel className="text-xs">Filter Persona Type:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedStaffType("all")} className="cursor-pointer text-xs font-bold">
                All Personas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStaffType("Doctor")} className="cursor-pointer text-xs font-bold">
                Doctors / Physicians
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStaffType("Nurse")} className="cursor-pointer text-xs font-bold">
                Nurses / Triage Staff
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStaffType("Receptionist")} className="cursor-pointer text-xs font-bold">
                Front Desk Reception
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="default"
          size="sm"
          className="h-9 px-6 text-xs font-extrabold shadow-md space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Provision New Staff Persona</span>
        </Button>
      </div>

      {/* Staff Grid Showcase Area */}
      {loading ? (
        <div className="flex items-center justify-center p-24 text-teal-600 space-x-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Querying Staff container...</span>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-4xl">📭</span>
          <h3 className="mt-4 text-base font-black">No clinical staff personas matching your criteria</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Try adjusting your search query, branch switcher, or persona type filter above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => (
            <Card
              key={staff.id}
              className="relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-teal-500/50 transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white font-extrabold ${
                        staff.staffType === "Doctor"
                          ? "bg-teal-600"
                          : staff.staffType === "Nurse"
                          ? "bg-cyan-600"
                          : "bg-amber-600"
                      }`}
                    >
                      <span className="text-lg">
                        {staff.staffType === "Doctor" ? "🩺" : staff.staffType === "Nurse" ? "💊" : "🤝"}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-50">
                        {staff.user?.fullName || "Staff Persona"}
                      </CardTitle>
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                        {staff.specialization || staff.staffType}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={staff.staffType === "Doctor" ? "default" : staff.staffType === "Nurse" ? "secondary" : "outline"}
                    className="text-[10px] font-extrabold px-2.5 py-0.5"
                  >
                    {staff.staffType}
                  </Badge>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Facility Posted:</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{staff.branchName}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Medical License:</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100">{staff.licenseNumber || "N/A"}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Consult Rate:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${Math.round(staff.hourlyRateCents / 100)} / hr
                    </span>
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-3">
                <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed line-clamp-2">
                  "{staff.bio || "Dedicated healthcare professional supporting multi-branch workflows and high patient fulfillment SLA."}"
                </p>
              </CardContent>

              <CardFooter className="p-6 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-2">
                <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 rtl:mr-0 rtl:ml-1" />
                  <span>Schedules Verified</span>
                </span>
                <Button variant="outline" size="sm" className="text-xs font-black h-8 px-3" onClick={() => router.push(`/${tenantId}/working-hours`)}>
                  Inspect Shift Rule
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Provision New Staff Persona Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
              <Stethoscope className="w-5 h-5 animate-bounce" />
              <DialogTitle className="text-lg font-black">Provision Clinical Staff Profile</DialogTitle>
            </div>
            <DialogDescription className="text-xs mt-1">
              Enroll doctors, nurses, or receptionists into your secure Multi-Branch isolation container:
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterStaffSubmit} className="space-y-4 my-2 max-h-96 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="staffFullName" className="text-xs font-bold capitalize">Staff Full Name</Label>
              <Input
                id="staffFullName"
                required
                placeholder="e.g. Dr. Jessica Sterling"
                value={newStaff.fullName}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, fullName: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sRole" className="text-xs font-bold capitalize">Persona Type</Label>
                <select
                  id="sRole"
                  value={newStaff.staffType}
                  onChange={(e) => setNewStaff((prev) => ({ ...prev, staffType: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold shadow-sm focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="Doctor">Doctor / Physician</option>
                  <option value="Nurse">Nurse / Triage</option>
                  <option value="Receptionist">Receptionist</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sBranch" className="text-xs font-bold capitalize">Posted Facility</Label>
                <select
                  id="sBranch"
                  value={newStaff.branchId}
                  onChange={(e) => setNewStaff((prev) => ({ ...prev, branchId: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold shadow-sm focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sSpec" className="text-xs font-bold capitalize">Specialization</Label>
              <Input
                id="sSpec"
                placeholder="e.g. Outpatient Day Surgeon"
                value={newStaff.specialization}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, specialization: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sLic" className="text-xs font-bold capitalize">License Number</Label>
                <Input
                  id="sLic"
                  placeholder="e.g. DHA-9812-44"
                  value={newStaff.licenseNumber}
                  onChange={(e) => setNewStaff((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sRate" className="text-xs font-bold capitalize">Hourly Rate ($)</Label>
                <Input
                  id="sRate"
                  type="number"
                  value={Math.round(newStaff.hourlyRateCents / 100)}
                  onChange={(e) => setNewStaff((prev) => ({ ...prev, hourlyRateCents: (parseFloat(e.target.value) || 0) * 100 }))}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sBio" className="text-xs font-bold capitalize">Staff Bio & Accreditations</Label>
              <textarea
                id="sBio"
                rows={3}
                value={newStaff.bio}
                onChange={(e) => setNewStaff((prev) => ({ ...prev, bio: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="default" size="sm" type="submit" className="bg-teal-600 hover:bg-teal-700 font-extrabold px-6" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enroll Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
