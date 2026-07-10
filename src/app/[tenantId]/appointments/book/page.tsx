"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Clock,
  Building2,
  Users,
  PlusCircle,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Bed,
  Syringe,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function BookAppointmentOnlineBookingPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [branches, setBranches] = React.useState<any[]>([]);
  const [depts, setDepts] = React.useState<any[]>([]);
  const [staffData, setStaffData] = React.useState<any[]>([]);
  const [patientsData, setPatientsData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Wizard Master States
  const [formData, setFormData] = React.useState({
    branchId: "",
    departmentId: "",
    doctorId: "",
    patientId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "09:30",
    type: "Online Booking",
    priority: "Standard",
    isRecurring: false,
    recurrenceRule: "FREQ=WEEKLY;COUNT=4",
    notes: "Baseline online triage booking.",
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [successBooking, setSuccessBooking] = React.useState<any | null>(null);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  React.useEffect(() => {
    const fetchPrereqs = async () => {
      setLoading(true);
      try {
        const [overRes, depRes, staffRes, patRes] = await Promise.all([
          fetch(`/api/clinic/${tenantId}/overview`),
          fetch(`/api/clinic/${tenantId}/departments`),
          fetch(`/api/clinic/${tenantId}/staff?staffType=Doctor`),
          fetch(`/api/clinic/${tenantId}/patients`),
        ]);

        const overJson = await overRes.json();
        const depJson = await depRes.json();
        const staffJson = await staffRes.json();
        const patJson = await patRes.json();

        if (overJson.success) {
          setBranches(overJson.branches || []);
          if (overJson.branches?.[0]) setFormData((prev) => ({ ...prev, branchId: overJson.branches[0].id }));
        }
        if (depJson.success) {
          setDepts(depJson.departments || []);
          if (depJson.departments?.[0]) setFormData((prev) => ({ ...prev, departmentId: depJson.departments[0].id }));
        }
        if (staffJson.success) {
          setStaffData(staffJson.data || []);
          if (staffJson.data?.[0]) setFormData((prev) => ({ ...prev, doctorId: staffJson.data[0].id }));
        }
        if (patJson.success) {
          setPatientsData(patJson.data || []);
          if (patJson.data?.[0]) setFormData((prev) => ({ ...prev, patientId: patJson.data[0].id }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrereqs();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.doctorId || !formData.patientId) {
      alert("Please ensure Department, Physician, and Patient are fully specified.");
      return;
    }

    setSubmitting(true);
    try {
      // Compose timestamp for start
      const dtObj = new Date(`${formData.appointmentDate}T${formData.timeSlot}:00`);

      const payload = {
        ...formData,
        startTime: dtObj.toISOString(),
        durationMinutes: 30,
        status: formData.type === "Walk-in" ? "CheckedIn" : "Scheduled",
      };

      const res = await fetch(`/api/clinic/${tenantId}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessBooking({ ...data.data, patientName: patientsData.find((p) => p.id === formData.patientId)?.fullName });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(data.error || "Failed to confirm online booking.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to communicate with Triage API Relay.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const availableSlots = ["09:00", "09:30", "10:00", "11:00", "11:30", "14:00", "15:30", "16:30"];

  if (successBooking) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 mt-10">
        <Card className="border-2 border-teal-500 bg-gradient-to-b from-white to-teal-50/40 dark:from-slate-900 dark:to-teal-950/30 p-8 rounded-3xl shadow-xl text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 dark:text-slate-50">Appointment Successfully Verified</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto">
            A secure timestamped calendar reference and Triage Waiting List Queue ticket have been committed to Postgres:
          </p>

          <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-2 shadow-inner">
            <p className="font-black font-mono text-2xl text-teal-600">{successBooking.appointmentNumber}</p>
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              Patient: {successBooking.patientName} • Triage Window: {new Date(successBooking.startTime).toLocaleString()}
            </p>
          </div>

          <p className="mt-3 text-xs font-black text-emerald-600">
            🔊 Sound ping trigger active & automated WhatsApp text verification dispatched successfully!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="py-6 px-8 font-black text-sm"
              onClick={() => {
                setSuccessBooking(null);
                setFormData((prev) => ({ ...prev, timeSlot: "11:00" })); // pick next slot
              }}
            >
              + Book Another Session
            </Button>
            <Button
              variant="default"
              className="py-6 px-8 font-black text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              onClick={() => router.push(`/${tenantId}/appointments/calendar`)}
            >
              Inspect Master Interactive Calendar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in-0">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="font-extrabold text-xs space-x-1"
          onClick={() => router.push(`/${tenantId}/appointments/calendar`)}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 rtl:rotate-180" />
          <span>Interactive Calendar</span>
        </Button>
        <Badge variant="success" className="px-3 py-1 text-xs font-black uppercase tracking-widest">
          Online Booking Gateway Wizard
        </Badge>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="p-8 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 shadow-md border border-teal-400/30">
              <PlusCircle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Book Triage / Online Booking</CardTitle>
              <CardDescription className="text-xs text-teal-200/80 mt-1">
                Select target facility, pick available clinical practitioner, verify accessible time slots, and verify instant bidi synchronization.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center p-16 text-teal-600 space-x-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">Bootstrapping booking wizard matrices...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Demographics & Specialization Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="bBranch" className="text-xs font-extrabold">1. Operating Branch</Label>
                  <select
                    id="bBranch"
                    required
                    value={formData.branchId}
                    onChange={(e) => handleChange("branchId", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bDept" className="text-xs font-extrabold">2. Target Department</Label>
                  <select
                    id="bDept"
                    required
                    value={formData.departmentId}
                    onChange={(e) => handleChange("departmentId", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bDoc" className="text-xs font-extrabold">3. Assigned Physician</Label>
                  <select
                    id="bDoc"
                    required
                    value={formData.doctorId}
                    onChange={(e) => handleChange("doctorId", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {staffData.map((st) => (
                      <option key={st.id} value={st.id}>{st.user?.fullName} ({st.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2: Patient Selector OR Triage Add */}
              <div className="p-5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border-2 border-teal-600/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-black text-sm text-teal-900 dark:text-teal-200 rtl:space-x-reverse">
                    <Bed className="w-4 h-4 text-teal-600" />
                    <span>4. Target Triage Patient Selection</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    type="button"
                    className="text-xs font-black text-teal-700 dark:text-teal-300"
                    onClick={() => router.push(`/${tenantId}/patients/register`)}
                  >
                    + Register Brand New Person
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <select
                    id="bPat"
                    required
                    value={formData.patientId}
                    onChange={(e) => handleChange("patientId", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-teal-300 bg-white px-3 py-2 text-xs font-extrabold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-teal-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">-- Search and Select Target Triage Patient --</option>
                    {patientsData.map((pat) => (
                      <option key={pat.id} value={pat.id}>{pat.fullName} ({pat.medicalRecordNumber}) • {pat.phone}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3: Date & Interactive Time Slot Management */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center space-x-2">
                  <span>5. Date & Time Slot Management Pipelines</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="bDate" className="text-xs font-bold">Appointment Date</Label>
                    <Input
                      id="bDate"
                      type="date"
                      required
                      value={formData.appointmentDate}
                      onChange={(e) => handleChange("appointmentDate", e.target.value)}
                      className="text-xs font-mono font-bold h-11 rounded-xl"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold">Pick Verified Time Slot (30 Mins Block)</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={formData.timeSlot === slot ? "default" : "outline"}
                          className={`h-9 px-3.5 text-xs font-extrabold font-mono rounded-xl ${formData.timeSlot === slot ? "bg-teal-600 text-white hover:bg-teal-700 shadow-md" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                          onClick={() => handleChange("timeSlot", slot)}
                        >
                          <Clock className="w-3 h-3 mr-1.5 rtl:mr-0 rtl:ml-1.5" />
                          <span>{slot}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Type, Priority & Recurrence Rules */}
              <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider flex items-center space-x-2">
                  <span>6. Intake Modality, Priority & Recurrence Rules</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="bModality" className="text-xs font-extrabold">Modality Category</Label>
                    <select
                      id="bModality"
                      value={formData.type}
                      onChange={(e) => handleChange("type", e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="Online Booking">🌐 Online Booking Gateway</option>
                      <option value="Walk-in">🚶 Walk-in Physical Lobby</option>
                      <option value="Follow-up">🔄 Diagnostic Follow-up</option>
                      <option value="Urgent">⚠️ Urgent Encounter</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bPriority" className="text-xs font-extrabold">Triage Priority SLA</Label>
                    <select
                      id="bPriority"
                      value={formData.priority}
                      onChange={(e) => handleChange("priority", e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="Standard">Standard Priority</option>
                      <option value="Urgent">Urgent / Priority 1</option>
                      <option value="VIP">VIP Platinum Protocol</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-extrabold flex items-center justify-between">
                      <span>Recurring Session Rule</span>
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    </Label>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1">
                      <Switch
                        checked={formData.isRecurring}
                        onCheckedChange={(val) => handleChange("isRecurring", val)}
                      />
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {formData.isRecurring ? "Active (4 Weeks Rule)" : "Single One-time session"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="bNotes" className="text-xs font-bold">Preparation & Clinical Triage Relay Notes</Label>
                  <Input
                    id="bNotes"
                    placeholder="e.g. Please bring recent Daman insurance card and previous EKG printout."
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="text-xs h-10 rounded-xl"
                  />
                </div>
              </div>

              <CardFooter className="pt-8 px-0 flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  type="button"
                  className="py-6 px-6 font-extrabold text-xs"
                  onClick={() => router.push(`/${tenantId}/appointments/calendar`)}
                  disabled={submitting}
                >
                  Cancel Booking
                </Button>
                <Button
                  variant="default"
                  type="submit"
                  className="py-6 px-12 font-black text-sm shadow-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                  disabled={submitting || !formData.patientId}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "✓ Enforce Online Booking Instant Session"}
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
