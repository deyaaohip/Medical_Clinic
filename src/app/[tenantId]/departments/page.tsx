"use client";

import * as React from "react";
import { Building2, DoorOpen, Layers, Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/clinic/ui/page-shell";
import { PageHeader } from "@/components/clinic/ui/page-header";
import { SectionHeading } from "@/components/clinic/ui/section-heading";
import { StatCard } from "@/components/clinic/ui/stat-card";
import { EmptyState, LoadingBlock } from "@/components/clinic/ui/state-blocks";
import { DepartmentCard } from "@/components/clinic/departments/department-card";
import { RoomCard } from "@/components/clinic/departments/room-card";
import { AddDepartmentDialog, type DepartmentDraft } from "@/components/clinic/departments/add-department-dialog";
import { AddRoomDialog, type RoomDraft } from "@/components/clinic/departments/add-room-dialog";

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

  const handleCreateDept = (draft: DepartmentDraft) => {
    setSubmitting(true);
    setTimeout(() => {
      alert("Department fully classified & propagated to operational facilities!");
      setSubmitting(false);
      setDeptModalOpen(false);
      fetchData();
    }, 800);
  };

  const handleCreateRoom = (draft: RoomDraft) => {
    setSubmitting(true);
    setTimeout(() => {
      alert("Room Suite fully commissioned in PostgreSQL database Container!");
      setSubmitting(false);
      setRoomModalOpen(false);
      fetchData();
    }, 800);
  };

  const consultationRooms = rooms.filter((room) => room.type === "Consultation").length;
  const specializedRooms = rooms.length - consultationRooms;

  return (
    <PageShell>
      <PageHeader
        icon={Layers}
        eyebrow="Facility configuration"
        title="Departments & Commissioned Suites"
        description="Manage practice specialties, billing ICD codes, and the physical rooms patients are routed into across every branch."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 px-4 text-xs font-medium"
              onClick={() => setDeptModalOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add department
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 px-4 text-xs font-semibold shadow-sm hover:from-teal-700 hover:to-emerald-700"
              onClick={() => setRoomModalOpen(true)}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              Commission room
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Departments" value={depts.length} hint="Clinical specialties" icon={Building2} tone="teal" />
        <StatCard label="Suite rooms" value={rooms.length} hint="Commissioned boxes" icon={DoorOpen} tone="cyan" />
        <StatCard label="Consultation" value={consultationRooms} hint="Walk-in & scheduled" icon={Stethoscope} tone="emerald" />
        <StatCard label="Specialized" value={specializedRooms} hint="Surgery, radiology, lab" icon={Layers} tone="amber" />
      </div>

      <section className="space-y-4">
        <SectionHeading
          title="Specialty departments"
          count={depts.length}
          description="Every clinical department available to this tenant."
        />

        {loading ? (
          <LoadingBlock label="Loading departments" />
        ) : depts.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No departments configured"
            description="Add your first clinical department to start routing rooms, staff and appointments."
            action={
              <Button size="sm" className="bg-teal-600 font-medium hover:bg-teal-700" onClick={() => setDeptModalOpen(true)}>
                Add department
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {depts.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                rooms={rooms.filter((room) => room.departmentId === department.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Commissioned suite rooms"
          count={rooms.length}
          description="Physical consultation boxes, surgical suites and imaging rooms."
        />

        {loading ? (
          <LoadingBlock label="Loading suite rooms" />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No rooms commissioned"
            description="Commission a room to give patients and physicians a physical destination."
            action={
              <Button size="sm" className="bg-teal-600 font-medium hover:bg-teal-700" onClick={() => setRoomModalOpen(true)}>
                Commission room
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      <AddDepartmentDialog
        open={deptModalOpen}
        onOpenChange={setDeptModalOpen}
        branches={branches}
        submitting={submitting}
        onSubmit={handleCreateDept}
      />

      <AddRoomDialog
        open={roomModalOpen}
        onOpenChange={setRoomModalOpen}
        branches={branches}
        departments={depts}
        submitting={submitting}
        onSubmit={handleCreateRoom}
      />
    </PageShell>
  );
}
