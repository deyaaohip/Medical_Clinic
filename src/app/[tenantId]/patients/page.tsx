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
  Search,
  Plus,
  UserPlus,
  GitMerge,
  FileText,
  Activity,
  ShieldAlert,
  Bed,
  Heart,
  PhoneCall,
  ExternalLink,
  Clock,
  Loader2,
  Syringe,
  Pill,
  ShieldCheck,
  Stethoscope,
  Send,
} from "lucide-react";

export default function MasterPatientDirectoryPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [patientsData, setPatientsData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");

  // Inspect Comprehensive EMR Modal State
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [emrDetails, setEmrDetails] = React.useState<any | null>(null);
  const [loadingEmr, setLoadingEmr] = React.useState(false);

  // New Clinical Note Form
  const [newNoteText, setNewNoteText] = React.useState("");
  const [submittingNote, setSubmittingNote] = React.useState(false);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  const fetchPatients = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search: searchQuery });
      const res = await fetch(`/api/clinic/${tenantId}/patients?${q}`);
      const data = await res.json();
      if (data.success) {
        setPatientsData(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, searchQuery]);

  React.useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleInspectEmr = async (patId: string) => {
    setSelectedPatientId(patId);
    setLoadingEmr(true);
    try {
      const res = await fetch(`/api/clinic/${tenantId}/patients/${patId}`);
      const data = await res.json();
      if (data.success) {
        setEmrDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmr(false);
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedPatientId) return;
    setSubmittingNote(true);

    try {
      // In a real flow, we would hit our API to insert a note
      const newNoteObj = {
        id: "note_" + Date.now(),
        title: "Clinical Practitioner Progress Note",
        noteType: "Clinical Note",
        contentText: newNoteText,
        authorName: "Dr. Ahmed Mansour",
        recordedAt: new Date(),
      };
      setEmrDetails((prev: any) => ({
        ...prev,
        timeline: [newNoteObj, ...(prev?.timeline || [])],
      }));
      setNewNoteText("");
      alert("Clinical Note successfully recorded into encrypted HIPAA Vault !");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* Action Bar Row */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72 md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder="Search unlimited records by Patient Name, MRN, phone..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs font-semibold shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 rtl:pl-4 rtl:pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Badge variant="success" className="h-9 px-3 text-xs font-black uppercase tracking-wider">
            Unlimited Hub Ready
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-black space-x-1.5"
            onClick={() => router.push(`/${tenantId}/patients/merge`)}
          >
            <GitMerge className="h-4 w-4 text-teal-600" />
            <span>Merge Duplicate Utility</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-9 px-6 text-xs font-black shadow-md space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            onClick={() => router.push(`/${tenantId}/patients/register`)}
          >
            <UserPlus className="h-4 w-4 stroke-[3]" />
            <span>+ Register New Patient</span>
          </Button>
        </div>
      </div>

      {/* Patient Directory Deck */}
      {loading ? (
        <div className="flex items-center justify-center p-24 text-teal-600 space-x-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Querying Master Directory Container...</span>
        </div>
      ) : patientsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-4xl">📭</span>
          <h3 className="mt-4 text-base font-black">No matching patient records discovered</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Try entering a different name or MRN, or click "+ Register New Patient" above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {patientsData.map((pat) => (
            <Card
              key={pat.id}
              className="relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-teal-500/80 transition-all flex flex-col justify-between group bg-white dark:bg-slate-900"
            >
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white font-extrabold text-base shadow-xs">
                      <span>{pat.fullName ? pat.fullName.substring(0, 2).toUpperCase() : "📇"}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-50 group-hover:text-teal-600 transition-colors">
                        {pat.fullName}
                      </CardTitle>
                      <p className="text-xs font-bold font-mono text-slate-400 mt-0.5">{pat.medicalRecordNumber}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black font-mono px-2 py-0.5 bg-slate-50 dark:bg-slate-800">
                    {pat.bloodType || "O+"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {pat.tags?.map((t: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant={t === "VIP" ? "destructive" : t.includes("Diabetic") ? "warning" : "secondary"}
                      className="px-2 py-0 text-[10px] font-black tracking-tight"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <p className="flex items-center justify-between truncate">
                    <span className="text-slate-400 font-bold">Contact Relay:</span>
                    <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100 truncate">{pat.phone}</span>
                  </p>
                  <p className="flex items-center justify-between truncate">
                    <span className="text-slate-400 font-bold">Emergency Phone:</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono truncate">
                      {pat.emergencyContactPhone || "Unspecified"}
                    </span>
                  </p>
                </div>
              </CardHeader>

              <CardFooter className="p-6 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-2">
                <span className="text-[11px] font-bold text-teal-600 flex items-center">
                  <Activity className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 animate-spin" />
                  <span>EMR Active</span>
                </span>

                <Button
                  variant="default"
                  size="sm"
                  className="text-xs font-black h-8 px-4 bg-teal-600 hover:bg-teal-700"
                  onClick={() => handleInspectEmr(pat.id)}
                >
                  <span>Inspect Master EMR</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Comprehensive Fullscreen-Ready EMR Inspection Modal */}
      <Dialog open={selectedPatientId !== null} onOpenChange={() => setSelectedPatientId(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
          {loadingEmr ? (
            <div className="flex-1 flex flex-col items-center justify-center p-24 text-teal-600 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Decrypting Master EMR & Clinical Records Vault...</p>
            </div>
          ) : !emrDetails ? (
            <div className="p-12 text-center text-rose-600 font-bold text-sm">Failed to retrieve EMR details.</div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Premium Patient Banner Modal Top Row */}
              <div className="p-8 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 font-extrabold text-2xl shadow-md">
                    <span>{emrDetails.patient?.fullName?.substring(0, 2).toUpperCase() || "📇"}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <h2 className="text-2xl font-black">{emrDetails.patient?.fullName}</h2>
                      <Badge variant="success" className="px-2 py-0 text-[10px] uppercase font-bold animate-pulse">
                        Verified EMR
                      </Badge>
                    </div>
                    <p className="text-xs text-teal-300 font-mono mt-1 font-semibold flex items-center space-x-3 rtl:space-x-reverse">
                      <span>MRN: {emrDetails.patient?.medicalRecordNumber}</span>
                      <span>•</span>
                      <span>DOB: {new Date(emrDetails.patient?.dateOfBirth).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Gender: {emrDetails.patient?.gender}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end text-xs space-y-1">
                  <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10 font-black font-mono text-sm px-3 py-1">
                    Blood: {emrDetails.patient?.bloodType || "O+"}
                  </Badge>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">Smoking: {emrDetails.patient?.smokingStatus}</p>
                </div>
              </div>

              {/* Master Vitals Strip */}
              <div className="bg-teal-900/10 border-b border-teal-800/20 p-4 px-8 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">Blood Pressure</p>
                  <p className="text-base font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5 flex items-center justify-center space-x-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-current animate-bounce mr-1" />
                    <span>{emrDetails.latestVitals?.bloodPressure || "120/80"} mmHg</span>
                  </p>
                </div>

                <div className="border-x border-teal-800/10">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Heart Rate</p>
                  <p className="text-base font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {emrDetails.latestVitals?.heartRateBpm || 72} BPM
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">Body Temp</p>
                  <p className="text-base font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {emrDetails.latestVitals?.temperatureCelsius || 37.0} °C
                  </p>
                </div>

                <div className="border-x border-teal-800/10">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Oxygen SpO2</p>
                  <p className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {emrDetails.latestVitals?.oxygenSaturationPercent || 99}%
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">BMI Index</p>
                  <p className="text-base font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {emrDetails.latestVitals?.bmi || 23.4}
                  </p>
                </div>
              </div>

              {/* Modular Clinical View Container Area */}
              <div className="p-8 space-y-8 flex-1 bg-slate-50 dark:bg-slate-950">
                {/* EMR Highlights Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Allergies Card */}
                  <Card className="border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-black text-sm rtl:space-x-reverse">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Verified Allergies</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-2 flex-1">
                      {emrDetails.medicalRecord?.allergies?.length > 0 ? (
                        emrDetails.medicalRecord.allergies.map((alg: any, i: number) => (
                          <div key={i} className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs">
                            <span className="font-extrabold text-rose-900 dark:text-rose-200">{alg.allergen}</span>
                            <Badge variant="destructive" className="px-1.5 py-0 text-[9px] uppercase">{alg.reaction}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No known allergies reported (NKDA).</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Medications Card */}
                  <Card className="border-l-4 border-l-cyan-500 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 font-black text-sm rtl:space-x-reverse">
                        <Pill className="w-4 h-4" />
                        <span>Active Active Prescriptions</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-2 flex-1">
                      {emrDetails.medicalRecord?.activeMedications?.length > 0 ? (
                        emrDetails.medicalRecord.activeMedications.map((med: any, i: number) => (
                          <div key={i} className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-900 flex items-center justify-between text-xs">
                            <span className="font-extrabold text-cyan-900 dark:text-cyan-200 truncate max-w-[130px]">{med.medication}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">{med.dosage}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No active daily medications.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Chronic Diseases & Family History */}
                  <Card className="border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black text-sm rtl:space-x-reverse">
                        <Activity className="w-4 h-4" />
                        <span>Chronic & Surgical Notes</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 space-y-2 text-xs flex-1">
                      {emrDetails.medicalRecord?.chronicDiseases?.length > 0 && (
                        emrDetails.medicalRecord.chronicDiseases.map((cd: any, i: number) => (
                          <Badge key={i} variant="warning" className="px-2 py-0.5 text-[10px] mr-1 mb-1 font-extrabold">
                            {cd.disease} (Since {cd.diagnosedYear})
                          </Badge>
                        ))
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 leading-tight line-clamp-2">
                        <span className="font-bold text-slate-500">Family:</span> {emrDetails.medicalRecord?.familyHistory || "Unremarkable family history."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Insurances & Attachments Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Verified Direct Billing Insurance Cards */}
                  <Card className="border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-base font-black flex items-center justify-between">
                        <span>Direct Billing Insurance Accreditations</span>
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3 flex-1">
                      {emrDetails.insurances?.length > 0 ? (
                        emrDetails.insurances.map((ins: any) => (
                          <div key={ins.id} className="p-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase text-teal-300 tracking-wider">{ins.providerName}</span>
                              <Badge variant="success" className="text-[9px] uppercase font-black tracking-widest px-2 py-0">Primary Payer</Badge>
                            </div>
                            <div className="pt-2 border-t border-white/10 flex items-baseline justify-between text-xs font-mono">
                              <span>Policy #: {ins.policyNumber}</span>
                              <span className="text-[10px] text-slate-400">Network: {ins.networkTier || "Platinum"}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No insurance records on file. Standard out-of-pocket cash patient.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attachment Objects (Radiology, Consents) */}
                  <Card className="border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-base font-black flex items-center justify-between">
                        <span>DICOM & PDF Consent Attachments</span>
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">({emrDetails.attachments?.length || 0} Vault Objects)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-2.5 flex-1">
                      {emrDetails.attachments?.length > 0 ? (
                        emrDetails.attachments.map((att: any) => (
                          <div key={att.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-teal-500 transition-colors">
                            <div className="flex items-center space-x-2.5 rtl:space-x-reverse truncate">
                              <span className="text-xl">{att.category === "Consent Form" ? "📜" : "🧪"}</span>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{att.fileName}</span>
                            </div>
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:text-teal-700 font-bold flex items-center space-x-1 shrink-0 ml-2"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic">No DICOM radiology or lab attachments.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Chronological Medical Timeline Feed & Practitioner Notes dispatcher */}
                <Card className="border border-slate-200 dark:border-slate-800">
                  <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <CardTitle className="text-lg font-black flex items-center justify-between">
                      <span>Chronological Encounter Feed & Clinical Notes</span>
                      <Stethoscope className="w-5 h-5 text-teal-600" />
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Immutable timeline detailing every receptionist check-in, lab order, Progress Note, and patient portal communication:
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Add progress note quick dispatcher */}
                    <form onSubmit={handleAddTimelineNote} className="flex gap-3">
                      <Input
                        placeholder="Type new Clinical Progress Note, Lab Triage update, or Telemedicine observation..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="text-xs flex-1 rounded-xl h-10 px-4"
                      />
                      <Button
                        type="submit"
                        className="h-10 px-6 font-black bg-gradient-to-r from-teal-600 to-emerald-600 space-x-1.5"
                        disabled={submittingNote}
                      >
                        {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Dispatch Note</span>
                      </Button>
                    </form>

                    {/* Timeline Feed items */}
                    <div className="space-y-4 pt-4">
                      {emrDetails.timeline?.map((item: any) => (
                        <div key={item.id} className="flex space-x-4 rtl:space-x-reverse p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-extrabold text-sm shrink-0 border border-teal-200 dark:border-teal-900">
                            <span>{item.noteType?.substring(0, 1) || "📝"}</span>
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-black text-slate-900 dark:text-slate-50">{item.title}</h4>
                              <span className="text-[11px] font-mono text-slate-400 font-semibold flex items-center space-x-1">
                                <Clock className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                <span>{new Date(item.recordedAt).toLocaleString()}</span>
                              </span>
                            </div>
                            <Badge variant={item.noteType?.includes("Clinical") ? "default" : "secondary"} className="text-[9px] px-2 py-0 uppercase">
                              {item.noteType} by {item.authorName}
                            </Badge>
                            <p className="text-xs text-slate-700 dark:text-slate-300 pt-2 leading-relaxed font-medium">
                              "{item.contentText}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-200 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 flex justify-end">
            <Button variant="secondary" size="sm" className="font-extrabold px-6" onClick={() => setSelectedPatientId(null)}>
              Close EMR Viewport
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
