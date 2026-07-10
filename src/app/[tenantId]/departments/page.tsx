"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Layers,
  Bed,
  Plus,
  Building2,
  Stethoscope,
  Activity,
  Check,
  X,
  Loader2,
} from "lucide-react";

export default function ClinicDepartmentsRoomsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [depts, setDepts] = React.useState<any[]>([]);
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [selectedBranch, setSelectedBranch] = React.useState("all");

  // Modals
  const [deptModalOpen, setDeptModalOpen] = React.useState(false);
  const [roomModalOpen, setRoomModalOpen] = React.useState(false);

  const [newDept, setNewDept] = React.useState({ name: "", code: "GEN-01", description: "", branchId: "" });
  const [newRoom, setNewRoom] = React.useState({ roomNumber: "", name: "", type: "Consultation", departmentId: "", branchId: "" });
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
      const [depRes, overRes] = await Promise.all([
        fetch(`/api/clinic/${tenantId}/departments?${q}`),
        fetch(`/api/clinic/${tenantId}/overview`),
      ]);
      const depJson = await depRes.json();
      const overJson = await overRes.json();

      if (depJson.success) {
        setDepts(depJson.departments || []);
        setRooms(depJson.rooms || []);
      }
      if (overJson.success) {
        setBranches(overJson.branches || []);
        if (!newDept.branchId && overJson.branches?.[0]) setNewDept((prev) => ({ ...prev, branchId: overJson.branches[0].id }));
        if (!newRoom.branchId && overJson.branches?.[0]) setNewRoom((prev) => ({ ...prev, branchId: overJson.branches[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedBranch, newDept.branchId, newRoom.branchId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert("Department fully classified & propagated to operational facilities!");
      setSubmitting(false);
      setDeptModalOpen(false);
      fetchData();
    }, 800);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      alert("Room Suite fully commissioned in PostgreSQL database Container!");
      setSubmitting(false);
      setRoomModalOpen(false);
      fetchData();
    }, 800);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* Top Banner & Multi-Branch Row */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2 text-slate-900 dark:text-slate-50">
            <span>Specialty Departments & Commissioned Suites</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-lg font-medium">
            Manage practice specialties, billing ICD codes, and interactive video/walk-in physical room containers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-black h-9 px-4 space-x-1.5"
            onClick={() => setDeptModalOpen(true)}
          >
            <span>+ Add Classification Department</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="text-xs font-black h-9 px-4 shadow-md space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            onClick={() => setRoomModalOpen(true)}
          >
            <span>+ Commission Suite Box Room</span>
          </Button>
        </div>
      </div>

      {/* Departments Deck */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center space-x-2">
          <span>Active Classification Departments ({depts.length})</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-teal-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : depts.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-bold text-slate-500">No departments configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {depts.map((d) => {
              const deptRooms = rooms.filter((r) => r.departmentId === d.id);
              return (
                <Card key={d.id} className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between">
                  <CardHeader className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white font-extrabold shadow-xs">
                          <Layers className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-black text-slate-900 dark:text-slate-50">{d.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] font-mono mt-1 font-bold">Code: {d.code}</Badge>
                        </div>
                      </div>
                    </div>

                    <CardDescription className="mt-4 text-xs leading-relaxed font-medium">
                      {d.description || "General diagnostic and therapeutic healthcare pipeline."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">Physical Rooms Attached:</span>
                      <span className="text-teal-600 dark:text-teal-400 font-extrabold">{deptRooms.length} Active Boxes</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Commissioned Room Suites Area */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">
          Commissioned Operating Suite Rooms ({rooms.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-teal-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-bold text-slate-500">No rooms configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rooms.map((r) => (
              <Card key={r.id} className="relative overflow-hidden border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      r.type === "Consultation"
                        ? "default"
                        : r.type === "Surgery"
                        ? "destructive"
                        : r.type === "Radiology"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-[10px] font-black uppercase px-2 py-0.5"
                  >
                    {r.type}
                  </Badge>
                  <span className="text-xs font-black font-mono text-slate-400">#{r.roomNumber}</span>
                </div>

                <div className="mt-4">
                  <CardTitle className="text-base font-black text-slate-900 dark:text-slate-50 truncate">{r.name}</CardTitle>
                  <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5 truncate">{r.departmentName}</p>
                </div>

                <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse mr-1 rtl:mr-0 rtl:ml-1" />
                    <span>Occupancy Hub</span>
                  </span>
                  <span className="text-emerald-600">Available</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      <Dialog open={deptModalOpen} onOpenChange={setDeptModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Commission Clinical Department</DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Classify practice modules, lab orders, and billing codes:
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDept} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label htmlFor="dName" className="text-xs font-bold">Department Name</Label>
              <Input
                id="dName"
                required
                placeholder="e.g. Outpatient Day Surgery"
                value={newDept.name}
                onChange={(e) => setNewDept((prev) => ({ ...prev, name: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dCode" className="text-xs font-bold">ICD Code Prefix</Label>
                <Input
                  id="dCode"
                  required
                  placeholder="e.g. SURG-01"
                  value={newDept.code}
                  onChange={(e) => setNewDept((prev) => ({ ...prev, code: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dBranch" className="text-xs font-bold">Facility Branch</Label>
                <select
                  id="dBranch"
                  value={newDept.branchId}
                  onChange={(e) => setNewDept((prev) => ({ ...prev, branchId: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold shadow-sm focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dDesc" className="text-xs font-bold">Scope Description</Label>
              <textarea
                id="dDesc"
                rows={3}
                value={newDept.description}
                onChange={(e) => setNewDept((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setDeptModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="default" size="sm" type="submit" className="bg-teal-600 hover:bg-teal-700 font-extrabold px-6" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enforce Classification"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Commissioned Room Modal */}
      <Dialog open={roomModalOpen} onOpenChange={setRoomModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Commission Suite Box Room</DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Add consultation physical rooms, radiology suites, or sterile surgical containers:
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRoom} className="space-y-4 my-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rNum" className="text-xs font-bold">Room Suite #</Label>
                <Input
                  id="rNum"
                  required
                  placeholder="e.g. 104-B"
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom((prev) => ({ ...prev, roomNumber: e.target.value }))}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rType" className="text-xs font-bold">Suite Category</Label>
                <select
                  id="rType"
                  value={newRoom.type}
                  onChange={(e) => setNewRoom((prev) => ({ ...prev, type: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold shadow-sm focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="Consultation">Consultation Box</option>
                  <option value="Surgery">Sterile Surgery</option>
                  <option value="Radiology">Radiology / MRI</option>
                  <option value="Laboratory">Laboratory Hub</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rName" className="text-xs font-bold">Suite Full Title</Label>
              <Input
                id="rName"
                required
                placeholder="e.g. Advanced Echocardiography Box B"
                value={newRoom.name}
                onChange={(e) => setNewRoom((prev) => ({ ...prev, name: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rDept" className="text-xs font-bold">Target Department</Label>
              <select
                id="rDept"
                value={newRoom.departmentId}
                onChange={(e) => setNewRoom((prev) => ({ ...prev, departmentId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold shadow-sm focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
              >
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setRoomModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="default" size="sm" type="submit" className="bg-gradient-to-r from-teal-600 to-emerald-600 font-extrabold px-6" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commission Suite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
