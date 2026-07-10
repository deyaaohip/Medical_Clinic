"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GitMerge,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Bed,
} from "lucide-react";

export default function DuplicatePatientsMergeUtilityPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [patientsData, setPatientsData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Pickers State
  const [sourceId, setSourceId] = React.useState("");
  const [targetId, setTargetId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [successMerge, setSuccessMerge] = React.useState<any | null>(null);

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  React.useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clinic/${tenantId}/patients`);
        const data = await res.json();
        if (data.success) {
          setPatientsData(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [tenantId]);

  const sourcePat = patientsData.find((p) => p.id === sourceId);
  const targetPat = patientsData.find((p) => p.id === targetId);

  const handleExecuteMerge = async () => {
    if (!sourceId || !targetId) return;
    if (sourceId === targetId) {
      alert("Source and Target cannot be identical UUIDs.");
      return;
    }

    if (
      !confirm(
        `Are you absolutely sure you wish to consolidate all EMR encounters from '${sourcePat?.fullName}' into master target '${targetPat?.fullName}'? This operational consolidation is immutable.`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/clinic/${tenantId}/merge-patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePatientId: sourceId, targetPatientId: targetId }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMerge({ targetPat, sourcePat });
      } else {
        alert(data.error || "Failed to consolidate patient identities.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to communicate with DB Merge Relay.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successMerge) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 mt-10">
        <Card className="border-2 border-teal-500 bg-gradient-to-b from-white to-teal-50/40 dark:from-slate-900 dark:to-teal-950/30 p-8 rounded-3xl shadow-xl text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg">
              <GitMerge className="h-10 w-10 stroke-[2.5]" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 dark:text-slate-50">Identities Consolidated Successfully</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto">
            All timeline notes, vital signs, consent attachments, insurance providers, and waiting queues have been successfully migrated to master record:
          </p>
          <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-800 font-black font-mono text-xl text-teal-600 shadow-inner">
            {successMerge.targetPat?.fullName} ({successMerge.targetPat?.medicalRecordNumber})
          </div>
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-extrabold font-mono">
            ⚠️ Duplicate record '{successMerge.sourcePat?.fullName}' has been soft deleted & tagged ['Merged Duplicate'].
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="py-6 px-8 font-black text-sm"
              onClick={() => {
                setSuccessMerge(null);
                setSourceId("");
                setTargetId("");
                window.location.reload();
              }}
            >
              Merge Another Identity
            </Button>
            <Button
              variant="default"
              className="py-6 px-8 font-black text-sm bg-teal-600 hover:bg-teal-700"
              onClick={() => router.push(`/${tenantId}/patients`)}
            >
              Return to Master Directory
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
          onClick={() => router.push(`/${tenantId}/patients`)}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1 rtl:rotate-180" />
          <span>Master Directory</span>
        </Button>
        <Badge variant="warning" className="px-3 py-1 text-xs font-black uppercase tracking-widest">
          Consolidation DB Engine Utility
        </Badge>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="p-8 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 shadow-md border border-teal-400/30">
              <GitMerge className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Merge Duplicate Patient Records</CardTitle>
              <CardDescription className="text-xs text-teal-200/80 mt-1">
                Securely migrate Encounters, clinical progress notes, and DICOM attachments to retain a pristine Single Source of Truth directory.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center p-16 text-teal-600 space-x-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest">Retrieving multi-tenant patient indices...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pickers Side-by-Side Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Selection Card */}
                <div className="p-5 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 space-y-3">
                  <div className="flex items-center space-x-2 font-black text-xs text-rose-700 dark:text-rose-300 uppercase tracking-wider rtl:space-x-reverse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Source Record (To Soft Delete)</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sPick" className="text-xs font-bold text-slate-700 dark:text-slate-200">Select Duplicate Identity</Label>
                    <select
                      id="sPick"
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-rose-600 dark:border-rose-700 dark:bg-slate-900"
                    >
                      <option value="">-- Choose Source Patient --</option>
                      {patientsData.map((p) => (
                        <option key={p.id} value={p.id}>{p.fullName} ({p.medicalRecordNumber})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Master Retained Card */}
                <div className="p-5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border-2 border-teal-500/50 space-y-3">
                  <div className="flex items-center space-x-2 font-black text-xs text-teal-800 dark:text-teal-200 uppercase tracking-wider rtl:space-x-reverse">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Target Master Record (To Retain EMR)</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tPick" className="text-xs font-bold text-slate-700 dark:text-slate-200">Select Master Active Entity</Label>
                    <select
                      id="tPick"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-teal-300 bg-white px-3 py-2 text-xs font-bold shadow-xs focus:ring-2 focus:ring-teal-600 dark:border-teal-700 dark:bg-slate-900"
                    >
                      <option value="">-- Choose Master Retained Patient --</option>
                      {patientsData.map((p) => (
                        <option key={p.id} value={p.id}>{p.fullName} ({p.medicalRecordNumber})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Output */}
              {sourceId && targetId && (
                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-black tracking-tight text-center text-slate-900 dark:text-slate-50">
                    Demographic Comparison Verification
                  </h3>

                  {sourceId === targetId ? (
                    <div className="p-4 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-extrabold text-xs rounded-xl text-center">
                      ⚠️ Identical record selected in both selectors. Please select different UUIDs to consolidate.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                      {/* Source comparison output */}
                      <Card className="border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-extrabold font-mono text-rose-600">{sourcePat?.medicalRecordNumber}</span>
                          <Badge variant="destructive" className="text-[9px] uppercase">Will Archive</Badge>
                        </div>
                        <p className="font-black text-sm">{sourcePat?.fullName}</p>
                        <div className="space-y-1 font-mono text-slate-600 dark:text-slate-400">
                          <p>DOB: {new Date(sourcePat?.dateOfBirth).toLocaleDateString()}</p>
                          <p>Phone: {sourcePat?.phone}</p>
                          <p>Blood: {sourcePat?.bloodType || "O+"}</p>
                        </div>
                        <div className="pt-2 flex flex-wrap gap-1">
                          {sourcePat?.tags?.map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[9px]">{t}</Badge>
                          ))}
                        </div>
                      </Card>

                      {/* Target Retained comparison output */}
                      <Card className="border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-900 p-5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="font-extrabold font-mono text-teal-600">{targetPat?.medicalRecordNumber}</span>
                          <Badge variant="success" className="text-[9px] uppercase">Master Target</Badge>
                        </div>
                        <p className="font-black text-sm">{targetPat?.fullName}</p>
                        <div className="space-y-1 font-mono text-slate-600 dark:text-slate-400">
                          <p>DOB: {new Date(targetPat?.dateOfBirth).toLocaleDateString()}</p>
                          <p>Phone: {targetPat?.phone}</p>
                          <p>Blood: {targetPat?.bloodType || "O+"}</p>
                        </div>
                        <div className="pt-2 flex flex-wrap gap-1">
                          {targetPat?.tags?.map((t: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[9px] bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">{t}</Badge>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <CardFooter className="pt-6 px-0 flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              className="py-6 px-6 font-extrabold text-xs"
              onClick={() => router.push(`/${tenantId}/patients`)}
              disabled={submitting}
            >
              Cancel Operation
            </Button>
            <Button
              variant="default"
              type="button"
              className="py-6 px-10 font-black text-sm shadow-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              onClick={handleExecuteMerge}
              disabled={submitting || !sourceId || !targetId || sourceId === targetId}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Secure Duplicate Merge"}
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}
