"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  FileDown,
  History,
  Loader2,
  Pill,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type RxItem = {
  medicineId: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  quantity: number;
  refillsAllowed: number;
  instructions: string;
};

const newItem = (): RxItem => ({ medicineId: "", dosage: "1 tablet", frequency: "Once daily", duration: "7 days", route: "Oral", quantity: 7, refillsAllowed: 0, instructions: "Take after food." });

export default function PrescriptionManagementPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [context, setContext] = React.useState<any>(null);
  const [prescriptions, setPrescriptions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<any>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [warnings, setWarnings] = React.useState<any[]>([]);
  const [verificationOrigin, setVerificationOrigin] = React.useState("https://medsaas.health");
  const [form, setForm] = React.useState({ patientId: "", doctorId: "", branchId: "", templateId: "", diagnosis: "", instructions: "", doctorSignature: "", overrideCriticalWarning: false, items: [newItem()] });

  React.useEffect(() => void params.then((value) => setTenantId(value.tenantId)), [params]);
  React.useEffect(() => setVerificationOrigin(window.location.origin), []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [contextRes, rxRes] = await Promise.all([
        fetch(`/api/clinical/${tenantId}/context`),
        fetch(`/api/clinical/${tenantId}/prescriptions`),
      ]);
      const [contextJson, rxJson] = await Promise.all([contextRes.json(), rxRes.json()]);
      if (contextJson.success) {
        setContext(contextJson.data);
        setForm((current) => ({
          ...current,
          patientId: current.patientId || contextJson.data.patients?.[0]?.id || "",
          doctorId: current.doctorId || contextJson.data.doctors?.[0]?.id || "",
          branchId: current.branchId || contextJson.data.branches?.[0]?.id || "",
        }));
      }
      if (rxJson.success) setPrescriptions(rxJson.data || []);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);
  React.useEffect(() => void load(), [load]);

  const updateItem = (index: number, key: keyof RxItem, value: any) => {
    setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  };

  const runSafety = React.useCallback(async (patientId: string, items: RxItem[]) => {
    const medicineIds = items.map((item) => item.medicineId).filter(Boolean);
    if (!patientId || !medicineIds.length) return setWarnings([]);
    const response = await fetch(`/api/clinical/${tenantId}/prescription-safety`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, medicineIds }),
    });
    const payload = await response.json();
    if (payload.success) setWarnings(payload.data || []);
  }, [tenantId]);

  React.useEffect(() => {
    const timer = setTimeout(() => void runSafety(form.patientId, form.items), 250);
    return () => clearTimeout(timer);
  }, [form.patientId, form.items, runSafety]);

  const applyTemplate = (templateId: string) => {
    const template = context?.prescriptionTemplates?.find((item: any) => item.id === templateId);
    setForm((current) => ({ ...current, templateId, diagnosis: template?.diagnosisLabel || current.diagnosis, items: template?.items?.length ? template.items : current.items }));
  };

  const createPrescription = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clinical/${tenantId}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (response.status === 409) {
        setWarnings(payload.warnings || []);
        throw new Error("Prescription blocked by a critical allergy warning. Review the warning before override.");
      }
      if (!payload.success) throw new Error(payload.error);
      setCreateOpen(false);
      await load();
      const created = (await (await fetch(`/api/clinical/${tenantId}/prescriptions`)).json()).data?.find((item: any) => item.id === payload.prescription.id);
      setDetail(created || null);
    } catch (error: any) {
      alert(error.message || "Unable to issue prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const refill = async (id: string) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clinical/${tenantId}/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refill" }),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error);
      await load();
      alert("Refill issued with a new signed prescription and QR verification token.");
    } catch (error: any) {
      alert(error.message || "Refill failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = prescriptions.filter((rx) => `${rx.patientName} ${rx.prescriptionNumber} ${rx.diagnosis}`.toLowerCase().includes(search.toLowerCase()));
  const activeCount = prescriptions.filter((rx) => rx.status === "Active").length;
  const criticalWarnings = warnings.filter((warning) => warning.level === "critical");

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-950 to-teal-950 p-7 text-white shadow-xl print:hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><Badge className="mb-3 bg-cyan-400/15 text-cyan-200">Medication safety engine</Badge><h1 className="flex items-center gap-3 text-3xl font-black"><Pill className="h-8 w-8 text-cyan-300" /> Prescription Management</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Electronic prescribing with allergy checks, interactions, generic alternatives, refills, signatures and QR verification.</p></div><Button onClick={() => setCreateOpen(true)} className="h-11 bg-cyan-400 px-6 font-black text-slate-950 hover:bg-cyan-300"><Plus className="mr-2 h-4 w-4" />New prescription</Button></div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3 print:hidden">
        <Metric label="Prescription history" value={prescriptions.length} icon={History} color="text-indigo-600" />
        <Metric label="Active prescriptions" value={activeCount} icon={CheckCircle2} color="text-emerald-600" />
        <Metric label="Medicine database" value={context?.medicines?.length || 0} icon={Pill} color="text-cyan-600" />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 print:hidden"><div className="relative w-full max-w-xl"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, prescription or diagnosis..." /></div><Badge variant="outline">{filtered.length} results</Badge></div>

      {loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div> : <div className="grid gap-4 xl:grid-cols-2 print:hidden">{filtered.map((rx) => <Card key={rx.id} className="overflow-hidden hover:border-cyan-400 hover:shadow-lg"><CardHeader className="pb-3"><div className="flex justify-between gap-3"><div><CardTitle>{rx.patientName}</CardTitle><CardDescription className="mt-1 font-mono">{rx.prescriptionNumber} • {rx.patientMrn}</CardDescription></div><Badge variant={rx.status === "Active" ? "success" : "secondary"}>{rx.status}</Badge></div></CardHeader><CardContent className="space-y-4"><p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold dark:bg-slate-800/60">{rx.diagnosis || "No diagnosis supplied"}</p><div className="space-y-2">{rx.items.map((item: any) => <div key={item.id} className="flex items-center justify-between rounded-xl border p-3 text-xs dark:border-slate-800"><div><p className="font-black">{item.medicine.brandName} <span className="font-normal text-slate-500">({item.medicine.genericName})</span></p><p className="mt-1 text-slate-500">{item.dosage} • {item.frequency} • {item.duration}</p></div><Badge variant="outline">{item.refillsAllowed - item.refillsUsed} refills</Badge></div>)}</div><div className="flex flex-wrap gap-2"><Button variant="outline" className="flex-1 font-bold" onClick={() => setDetail(rx)}>View & QR</Button><Button className="font-bold" disabled={submitting} onClick={() => refill(rx.id)}><RefreshCw className="mr-2 h-4 w-4" />Refill</Button></div></CardContent></Card>)}</div>}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-10 border-b bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><DialogTitle className="text-xl font-black">Issue electronic prescription</DialogTitle><DialogDescription>The safety engine rechecks every selected medicine against the active patient record.</DialogDescription></DialogHeader>
          <form onSubmit={createPrescription} className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-4"><Select label="Patient" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} options={context?.patients?.map((item: any) => [item.id, `${item.fullName} • ${item.medicalRecordNumber}`]) || []} /><Select label="Doctor" value={form.doctorId} onChange={(value) => setForm({ ...form, doctorId: value })} options={context?.doctors?.map((item: any) => [item.id, item.fullName]) || []} /><Select label="Branch" value={form.branchId} onChange={(value) => setForm({ ...form, branchId: value })} options={context?.branches?.map((item: any) => [item.id, item.name]) || []} /><Select label="Template" value={form.templateId} onChange={applyTemplate} options={[["", "Blank prescription"], ...(context?.prescriptionTemplates?.map((item: any) => [item.id, item.name]) || [])]} /></div>
            <div className="grid gap-4 md:grid-cols-2"><div><Label className="text-xs font-bold">Diagnosis</Label><Input className="mt-1" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Clinical diagnosis / ICD‑10" /></div><div><Label className="text-xs font-bold">Doctor electronic signature</Label><Input className="mt-1" value={form.doctorSignature} onChange={(e) => setForm({ ...form, doctorSignature: e.target.value })} placeholder="Doctor name • license" /></div></div>

            <div className="space-y-3"><div className="flex items-center justify-between"><Label className="font-black">Medicines</Label><Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, items: [...form.items, newItem()] })}><Plus className="mr-1 h-3 w-3" />Add medicine</Button></div>{form.items.map((item, index) => <div key={index} className="rounded-2xl border p-4 dark:border-slate-800"><div className="grid gap-3 md:grid-cols-6"><div className="md:col-span-2"><Select label="Medicine" value={item.medicineId} onChange={(value) => updateItem(index, "medicineId", value)} options={[["", "Select medicine"], ...(context?.medicines?.map((medicine: any) => [medicine.id, `${medicine.brandName} • ${medicine.genericName} ${medicine.strength}`]) || [])]} /></div><SmallInput label="Dosage" value={item.dosage} onChange={(value) => updateItem(index, "dosage", value)} /><SmallInput label="Frequency" value={item.frequency} onChange={(value) => updateItem(index, "frequency", value)} /><SmallInput label="Duration" value={item.duration} onChange={(value) => updateItem(index, "duration", value)} /><div className="flex items-end"><Button type="button" variant="ghost" className="text-rose-600" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button></div></div><div className="mt-3 grid gap-3 md:grid-cols-4"><SmallInput label="Route" value={item.route} onChange={(value) => updateItem(index, "route", value)} /><SmallInput label="Quantity" type="number" value={String(item.quantity)} onChange={(value) => updateItem(index, "quantity", Number(value))} /><SmallInput label="Refills allowed" type="number" value={String(item.refillsAllowed)} onChange={(value) => updateItem(index, "refillsAllowed", Number(value))} /><SmallInput label="Instructions" value={item.instructions} onChange={(value) => updateItem(index, "instructions", value)} /></div></div>)}</div>

            {warnings.length > 0 && <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"><div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-200"><ShieldAlert className="h-5 w-5" />Safety analysis</div>{warnings.map((warning, index) => <div key={index} className={`rounded-xl p-3 text-xs font-bold ${warning.level === "critical" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" : warning.level === "warning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200"}`}>{warning.level === "critical" ? "BLOCKING ALLERGY" : warning.level.toUpperCase()}: {warning.message}</div>)}{criticalWarnings.length > 0 && <label className="flex items-center gap-2 text-xs font-black text-rose-700"><input type="checkbox" checked={form.overrideCriticalWarning} onChange={(e) => setForm({ ...form, overrideCriticalWarning: e.target.checked })} />Clinician override after documented risk assessment</label>}</div>}

            <div><Label className="text-xs font-bold">General prescription instructions</Label><textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="mt-1 w-full rounded-xl border bg-transparent p-3 text-xs dark:border-slate-700" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button disabled={submitting || !form.items.every((item) => item.medicineId) || (criticalWarnings.length > 0 && !form.overrideCriticalWarning)}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign & issue prescription"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detail !== null} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-h-[94vh] max-w-3xl overflow-y-auto p-0 print:max-h-none print:max-w-none print:border-0 print:shadow-none">
          {detail && <div><div className="bg-slate-950 p-7 text-white print:bg-white print:text-black"><div className="flex justify-between"><div><p className="text-xs font-black uppercase text-cyan-300">Verified electronic prescription</p><h2 className="mt-1 text-2xl font-black">{detail.patientName}</h2><p className="mt-1 font-mono text-xs text-slate-300 print:text-slate-500">{detail.patientMrn} • {detail.prescriptionNumber}</p></div><Badge variant="success">{detail.status}</Badge></div></div><div className="space-y-6 p-7"><div className="grid gap-5 sm:grid-cols-[1fr_auto]"><div><p className="text-xs font-black uppercase text-slate-500">Diagnosis</p><p className="mt-2 text-sm font-bold">{detail.diagnosis}</p><p className="mt-4 text-xs font-black uppercase text-slate-500">Prescriber</p><p className="mt-2 text-sm font-bold">{detail.doctorName}</p></div><div className="rounded-2xl border bg-white p-3 text-center"><QRCodeSVG value={`${verificationOrigin}/verify/prescription/${detail.qrVerificationToken}`} size={128} level="H" /><p className="mt-2 text-[9px] font-black uppercase text-slate-500">Scan to verify</p></div></div><div className="space-y-3">{detail.items.map((item: any, index: number) => <div key={item.id} className="rounded-2xl border p-4 dark:border-slate-800"><div className="flex items-start justify-between"><div><p className="text-base font-black">{index + 1}. {item.medicine.brandName} {item.medicine.strength}</p><p className="text-xs text-slate-500">Generic: {item.medicine.genericName} • {item.medicine.dosageForm}</p></div><Badge variant="outline">Qty {item.quantity}</Badge></div><div className="mt-3 grid gap-2 text-xs sm:grid-cols-3"><span><b>Dosage:</b> {item.dosage}</span><span><b>Frequency:</b> {item.frequency}</span><span><b>Duration:</b> {item.duration}</span></div><p className="mt-3 rounded-xl bg-slate-50 p-2 text-xs dark:bg-slate-800">{item.instructions}</p></div>)}</div><div className="rounded-2xl border-2 border-dashed border-cyan-300 p-4"><p className="text-xs font-black uppercase text-slate-500">Electronic signature</p><div className="mt-2 flex items-center gap-2 text-lg font-black text-cyan-700"><ShieldCheck className="h-5 w-5" />{detail.doctorSignature || "Unsigned"}</div></div></div><div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white p-4 dark:border-slate-800 dark:bg-slate-900 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button><Button onClick={() => window.print()}><FileDown className="mr-2 h-4 w-4" />Export PDF</Button><Button variant="secondary" onClick={() => setDetail(null)}><X className="mr-2 h-4 w-4" />Close</Button></div></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, icon: Icon, color }: any) { return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div><Icon className={`h-8 w-8 ${color}`} /></CardContent></Card>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div><Label className="text-xs font-bold">{label}</Label><select className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([id, text]) => <option value={id} key={`${label}-${id}`}>{text}</option>)}</select></div>; }
function SmallInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div><Label className="text-[10px] font-bold uppercase text-slate-500">{label}</Label><Input type={type} className="mt-1 h-8 text-xs" value={value} onChange={(e) => onChange(e.target.value)} /></div>; }
