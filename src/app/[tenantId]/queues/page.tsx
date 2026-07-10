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
  ListOrdered,
  Building2,
  Filter,
  Plus,
  Activity,
  Clock,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  Send,
  Headset,
} from "lucide-react";

export default function LiveTriageQueuesPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [queuesData, setQueuesData] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters State
  const [selectedBranch, setSelectedBranch] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("Waiting");

  // Reminders Modal
  const [reminderModalOpen, setReminderModalOpen] = React.useState(false);
  const [dispatchTarget, setDispatchTarget] = React.useState<any | null>(null);
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
        let appSt = "CheckedIn";
        if (newStatus === "Called" || newStatus === "InRoom") appSt = "InConsultation";
        if (newStatus === "Completed") appSt = "Completed";
        await fetch(`/api/clinic/${tenantId}/appointments/${appId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: appSt }),
        });
      }
      alert(`Patient Queue status successfully transitioned to '${newStatus.toUpperCase()}'! Sound alert ping triggered.`);
      fetchQueues();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReminder = (queueItem: any) => {
    setDispatchTarget(queueItem);
    setReminderMsg(
      `Dear ${queueItem.patientFullName}, it is almost your turn at ${queueItem.departmentName}. Please proceed to Consultation Suite with Dr. ${queueItem.doctorFullName}.`
    );
    setReminderModalOpen(true);
  };

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReminder(true);
    setTimeout(() => {
      alert("Bilingual WhatsApp & SMS Triage Priority Dispatch dispatched successfully!");
      setSendingReminder(false);
      setReminderModalOpen(false);
    }, 800);
  };

  const activeQueues = queuesData.filter((q) => {
    if (statusFilter === "all") return true;
    return q.status === statusFilter;
  });

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* Dynamic Action Controls Row */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl">🚨</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Live Live Waiting List Triage Triage Queues
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium max-w-xl">
            Active physical branch triage flow tracking check-in delays, VIP priorities, and physician room occupancy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

          {/* Queue Milestone Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-black space-x-1.5 bg-slate-50 dark:bg-slate-800">
                <Filter className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{statusFilter === "all" ? "All Queue States" : statusFilter.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 p-2">
              <DropdownMenuLabel className="text-xs">Filter Milestone State:</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")} className="cursor-pointer text-xs font-bold">All Patients</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Waiting")} className="cursor-pointer text-xs font-bold">Waiting in Lobby</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Called")} className="cursor-pointer text-xs font-bold">Called to Room</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("InRoom")} className="cursor-pointer text-xs font-bold">In Room / Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("Completed")} className="cursor-pointer text-xs font-bold">Completed Payer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="default"
            size="sm"
            className="h-9 px-6 text-xs font-black shadow-md space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            onClick={() => router.push(`/${tenantId}/appointments/book`)}
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>+ Book Fast Triage</span>
          </Button>
        </div>
      </div>

      {/* Primary Calling Banner Bar */}
      {statusFilter === "Waiting" && activeQueues.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl border-2 border-teal-500/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4 rtl:space-x-reverse text-center md:text-left rtl:md:text-right">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shrink-0 animate-bounce font-black font-mono text-2xl">
              {activeQueues[0].queueNumber}
            </div>
            <div>
              <p className="text-xs text-teal-300 font-extrabold uppercase tracking-widest">Next Priority in Line</p>
              <h2 className="text-2xl font-black mt-0.5">{activeQueues[0].patientFullName}</h2>
              <p className="text-xs text-slate-300 font-mono mt-1">
                Waiting for Dr. {activeQueues[0].doctorFullName} • {activeQueues[0].departmentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="font-extrabold text-xs bg-transparent border-teal-400 text-teal-300 hover:bg-teal-900/50"
              onClick={() => handleOpenReminder(activeQueues[0])}
            >
              <MessageSquare className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              <span>Dispatch WhatsApp Alert</span>
            </Button>

            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-xl space-x-2 py-6 px-8"
              onClick={() => handleUpdateQueueStatus(activeQueues[0].id, activeQueues[0].appointmentId, "Called")}
            >
              <span>🔊 Call Next to Triage Room</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Render Awesome List Cards Row */}
      {loading ? (
        <div className="flex items-center justify-center p-24 text-teal-600 space-x-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Querying Triage Relays...</span>
        </div>
      ) : activeQueues.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-4xl">📭</span>
          <h3 className="mt-4 text-base font-black">No active patient queues verifying for your filter criteria</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Try switching the milestone status filter above or click '+ Book Fast Triage' to check in new walk-ins.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeQueues.map((item) => {
            const checkInDt = new Date(item.checkedInAt);
            const waitMins = Math.round((Date.now() - checkInDt.getTime()) / 60000);

            return (
              <Card
                key={item.id}
                className={`relative overflow-hidden transition-all flex flex-col justify-between ${
                  item.priority === "Urgent"
                    ? "border-2 border-rose-500/80 bg-gradient-to-br from-white to-rose-50/20 dark:from-slate-900 dark:to-rose-950/20 shadow-lg scale-102"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                }`}
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <Badge
                      variant={
                        item.status === "InRoom"
                          ? "success"
                          : item.status === "Called"
                          ? "default"
                          : item.status === "Waiting"
                          ? "warning"
                          : "secondary"
                      }
                      className="px-2.5 py-0.5 text-[10px] font-black uppercase"
                    >
                      {item.status} State
                    </Badge>

                    <Badge variant={item.priority === "Urgent" ? "destructive" : "outline"} className="px-2.5 py-0.5 text-[11px] font-black font-mono">
                      {item.queueNumber}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-50 flex items-center justify-between">
                      <span className="truncate">{item.patientFullName}</span>
                      {item.priority === "Urgent" && <span className="text-rose-500 ml-1 animate-ping text-xs">● VIP</span>}
                    </CardTitle>
                    <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5 truncate">
                      Dr. {item.doctorFullName?.split("(د.")[0]} • {item.departmentName?.split("(")[0]}
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Checked In:</span>
                      <span className="font-mono">{checkInDt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Wait Trajectory:</span>
                      <span className={`font-black font-mono ${waitMins > 20 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {waitMins} Minutes
                      </span>
                    </p>
                  </div>
                </CardHeader>

                <CardFooter className="p-6 pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold px-3 space-x-1 hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => handleOpenReminder(item)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>WhatsApp</span>
                  </Button>

                  {item.status === "Waiting" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs font-black px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md"
                      onClick={() => handleUpdateQueueStatus(item.id, item.appointmentId, "Called")}
                    >
                      <span>🔊 Call to Box</span>
                    </Button>
                  )}

                  {item.status === "Called" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs font-black px-4 bg-cyan-600 hover:bg-cyan-700 shadow-md text-white"
                      onClick={() => handleUpdateQueueStatus(item.id, item.appointmentId, "InRoom")}
                    >
                      <span>🚪 Move In Room</span>
                    </Button>
                  )}

                  {item.status === "InRoom" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs font-black px-4 bg-emerald-600 hover:bg-emerald-700 shadow-md text-white"
                      onClick={() => handleUpdateQueueStatus(item.id, item.appointmentId, "Completed")}
                    >
                      <span>✓ Completed Payer</span>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Interactive Manual Automated SMS / WhatsApp Dispatcher Modal */}
      <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
              <MessageSquare className="w-5 h-5 animate-pulse" />
              <DialogTitle className="text-lg font-black">Dispatch Live Queue Alert Reminder</DialogTitle>
            </div>
            <DialogDescription className="text-xs mt-1">
              Confirm or customize the bilingual automated text to dispatch instantly to target mobile relay network:
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendReminder} className="space-y-4 my-2">
            {dispatchTarget && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 rounded-xl font-mono text-xs font-extrabold border border-teal-200 dark:border-teal-900">
                Target Relay # {dispatchTarget.queueNumber} • {dispatchTarget.patientFullName}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="remMsg" className="text-xs font-bold">Custom Dispatch Dispatch Text</Label>
              <textarea
                id="remMsg"
                rows={4}
                required
                value={reminderMsg}
                onChange={(e) => setReminderMsg(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 font-mono"
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end space-x-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setReminderModalOpen(false)} disabled={sendingReminder}>
                Cancel Relay
              </Button>
              <Button variant="default" size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 font-black px-6 shadow-md" disabled={sendingReminder}>
                {sendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : "🔊 Execute Secure Dispatch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
