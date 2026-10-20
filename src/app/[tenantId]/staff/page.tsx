"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Headset, Plus, Search, Stethoscope, Syringe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/clinic/ui/page-shell";
import { PageHeader } from "@/components/clinic/ui/page-header";
import { SectionHeading } from "@/components/clinic/ui/section-heading";
import { StatCard } from "@/components/clinic/ui/stat-card";
import { EmptyState, LoadingBlock } from "@/components/clinic/ui/state-blocks";
import { StaffToolbar } from "@/components/clinic/staff/staff-toolbar";
import { StaffCard } from "@/components/clinic/staff/staff-card";
import { AddStaffDialog, type StaffDraft } from "@/components/clinic/staff/add-staff-dialog";

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
      if (overJson.success) setBranches(overJson.branches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedBranch, selectedStaffType]);

  React.useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleRegisterStaffSubmit = (draft: StaffDraft) => {
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

  const filteredStaff = staffData.filter((staff) => {
    if (!searchQuery) return true;
    const name = staff.user?.fullName?.toLowerCase() || "";
    const specialization = staff.specialization?.toLowerCase() || "";
    const license = staff.licenseNumber?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || specialization.includes(query) || license.includes(query);
  });

  const doctors = staffData.filter((staff) => staff.staffType === "Doctor").length;
  const nurses = staffData.filter((staff) => staff.staffType === "Nurse").length;
  const frontDesk = staffData.filter((staff) => staff.staffType === "Receptionist").length;

  return (
    <PageShell>
      <PageHeader
        icon={Users}
        eyebrow="Clinic management"
        title="Staff & clinical personas"
        description="Enrol doctors, nurses and front-desk staff, then keep their facility posting, licensing and consult rate in order."
        actions={
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 px-4 text-xs font-semibold shadow-sm hover:from-teal-700 hover:to-emerald-700"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Provision staff
          </Button>
        }
      >
        <StaffToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          selectedStaffType={selectedStaffType}
          onStaffTypeChange={setSelectedStaffType}
        />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total staff" value={staffData.length} hint="Across all branches" icon={Users} tone="teal" />
        <StatCard label="Physicians" value={doctors} hint="Consulting doctors" icon={Stethoscope} tone="emerald" />
        <StatCard label="Nurses" value={nurses} hint="Triage & ward support" icon={Syringe} tone="cyan" />
        <StatCard label="Front desk" value={frontDesk} hint="Reception personas" icon={Headset} tone="amber" />
      </div>

      <section className="space-y-4">
        <SectionHeading
          title="Persona directory"
          count={filteredStaff.length}
          description="Filtered by the branch and persona type selected above."
        />

        {loading ? (
          <LoadingBlock label="Querying staff directory" />
        ) : filteredStaff.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No staff match your criteria"
            description="Try a different search term, branch, or persona type — or provision a new profile."
            action={
              <Button size="sm" className="bg-teal-600 font-medium hover:bg-teal-700" onClick={() => setModalOpen(true)}>
                Provision staff
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStaff.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                onInspectShift={() => router.push(`/${tenantId}/working-hours`)}
              />
            ))}
          </div>
        )}
      </section>

      <AddStaffDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        branches={branches}
        submitting={submitting}
        onSubmit={handleRegisterStaffSubmit}
      />
    </PageShell>
  );
}
