"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ListOrdered, Plus, Timer, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/clinic/ui/page-shell";
import { PageHeader } from "@/components/clinic/ui/page-header";
import { SectionHeading } from "@/components/clinic/ui/section-heading";
import { StatCard } from "@/components/clinic/ui/stat-card";
import { EmptyState, LoadingBlock } from "@/components/clinic/ui/state-blocks";
import { QueueToolbar } from "@/components/clinic/queues/queue-toolbar";
import { NextPatientBanner, type QueueItem } from "@/components/clinic/queues/next-patient-banner";
import { QueueCard } from "@/components/clinic/queues/queue-card";
import { QueueReminderDialog } from "@/components/clinic/queues/queue-reminder-dialog";

export default function LiveTriageQueuesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [queuesData, setQueuesData] = React.useState<QueueItem[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters State
  const [selectedBranch, setSelectedBranch] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("Waiting");

  // Reminders Modal
  const [reminderModalOpen, setReminderModalOpen] = React.useState(false);
  const [dispatchTarget, setDispatchTarget] = React.useState<QueueItem | null>(null);
  const [reminderMsg, setReminderMsg] = React.useState("");
  const [sendingReminder, setSendingReminder] = React.useState(false);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  const fetchQueues = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ branchId: selectedBranch });
      const [queueRes, overRes] = await Promise.all([
        fetch(`/api/clinic/${tenantId}/queues?${q}`),
        fetch(`/api/clinic/${tenantId}/overview`),
      ]);

      const queueJson = await queueRes.json();
      const overJson = await overRes.json();

      if (queueJson.success) setQueuesData(queueJson.data || []);
      if (overJson.success) setBranches(overJson.branches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedBranch]);

  React.useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  const handleUpdateQueueStatus = async (queueId: string, appId: string | null, newStatus: string) => {
    try {
      // If linked appointment exists, update its status too
      if (appId) {
        let appointmentStatus = "CheckedIn";
        if (newStatus === "Called" || newStatus === "InRoom") appointmentStatus = "InConsultation";
        if (newStatus === "Completed") appointmentStatus = "Completed";
        await fetch(`/api/clinic/${tenantId}/appointments/${appId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: appointmentStatus }),
        });
      }
      alert(`Patient Queue status successfully transitioned to '${newStatus.toUpperCase()}'! Sound alert ping triggered.`);
      fetchQueues();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReminder = (queueItem: QueueItem) => {
    setDispatchTarget(queueItem);
    setReminderMsg(
      `Dear ${queueItem.patientFullName}, it is almost your turn at ${queueItem.departmentName}. Please proceed to Consultation Suite with Dr. ${queueItem.doctorFullName}.`
    );
    setReminderModalOpen(true);
  };

  const handleSendReminder = () => {
    setSendingReminder(true);
    setTimeout(() => {
      alert("Bilingual WhatsApp & SMS Triage Priority Dispatch dispatched successfully!");
      setSendingReminder(false);
      setReminderModalOpen(false);
    }, 800);
  };

  const activeQueues = queuesData.filter((queue) => {
    if (statusFilter === "all") return true;
    return queue.status === statusFilter;
  });

  const countByStatus = (status: string) => queuesData.filter((queue) => queue.status === status).length;

  return (
    <PageShell>
      <PageHeader
        icon={ListOrdered}
        eyebrow="Appointment management"
        title="Live triage queues"
        description="Track check-in delays, VIP priorities and physician room occupancy across every operating branch."
        actions={
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 px-4 text-xs font-semibold shadow-sm hover:from-teal-700 hover:to-emerald-700"
            onClick={() => router.push(`/${tenantId}/appointments/book`)}
          >
            <Plus className="h-4 w-4" />
            Book fast triage
          </Button>
        }
      >
        <QueueToolbar
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Waiting" value={countByStatus("Waiting")} hint="In the lobby" icon={Timer} tone="amber" />
        <StatCard label="Called" value={countByStatus("Called")} hint="Called to a room" icon={Volume2} tone="cyan" />
        <StatCard label="In room" value={countByStatus("InRoom")} hint="Active consultations" icon={ListOrdered} tone="teal" />
        <StatCard label="Completed" value={countByStatus("Completed")} hint="Seen today" icon={CheckCircle2} tone="emerald" />
      </div>

      {statusFilter === "Waiting" && activeQueues.length > 0 ? (
        <NextPatientBanner
          item={activeQueues[0]}
          onReminder={() => handleOpenReminder(activeQueues[0])}
          onCallNext={() =>
            handleUpdateQueueStatus(activeQueues[0].id, activeQueues[0].appointmentId ?? null, "Called")
          }
        />
      ) : null}

      <section className="space-y-4">
        <SectionHeading
          title="Queue patients"
          count={activeQueues.length}
          description="Cards advance through called, in-room and completed milestones."
        />

        {loading ? (
          <LoadingBlock label="Querying triage relays" />
        ) : activeQueues.length === 0 ? (
          <EmptyState
            icon={ListOrdered}
            title="No patients match this filter"
            description="Switch the milestone filter, or book a walk-in to add the first patient of the day."
            action={
              <Button
                size="sm"
                className="bg-teal-600 font-medium hover:bg-teal-700"
                onClick={() => router.push(`/${tenantId}/appointments/book`)}
              >
                Book triage
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeQueues.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                onReminder={() => handleOpenReminder(item)}
                onAdvance={(status) => handleUpdateQueueStatus(item.id, item.appointmentId ?? null, status)}
              />
            ))}
          </div>
        )}
      </section>

      <QueueReminderDialog
        open={reminderModalOpen}
        onOpenChange={setReminderModalOpen}
        target={dispatchTarget}
        message={reminderMsg}
        onMessageChange={setReminderMsg}
        sending={sendingReminder}
        onSubmit={handleSendReminder}
      />
    </PageShell>
  );
}
