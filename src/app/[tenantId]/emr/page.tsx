"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Activity, ClipboardPlus, FileText, Mic, Paperclip, PenLine, Search, ShieldCheck, Stethoscope, Loader2, Download, Eye } from "lucide-react";

export default function EmrSystemPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [records, setRecords] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [form, setForm] = React.useState({ patientId: "", doctorId: "", branchId: "", templateId: "", chiefComplaint: "Fever and cough", subjective: "Patient reports 3 days of symptoms.", objective: "Temp 38.1C, throat erythema.", assessment: "Likely viral URI.", diagnosisText: "Acute upper respiratory infection", icd10Codes: "J06.9,R50.9", treatmentPlan: "Hydration, paracetamol, follow up if worse.", physicalExamination: "Chest clear. Heart sounds normal.", progressNotes: "Stable and ambulatory.", clinicalNotes: "No red flags noted.", followUpInstructions: "Follow up in 7 days.", followUpDate: "2026-03-01" });

  React.useEffect(() => { params.then((p) => setTenantId(p.tenantId)); }, [params]);
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search });
    const [emr, pat, st, ov, tpl] = await Promise.all([
      fetch(`/api/clinical/${tenantId}/emr?${q}`).then(r => r.json()),
      fetch(`/api/clinic/${tenantId}/patients`).then(r => r.json()),
      fetch(`/api/clinic/${tenantId}/staff?staffType=Doctor`).then(r => r.json()),
      fetch(`/api/clinic/${tenantId}/overview`).then(r => r.json()),
      fetch(`/api/clinical/${tenantId}/emr-templates`).then(r => r.json()),
    ]);
    if (emr.success) setRecords(emr.data || []);
    if (pat.success) setPatients(pat.data || []);
    if (st.success) setStaff(st.data || []);
    if (ov.success) setBranches(ov.branches || []);
    if (tpl.success) setTemplates(tpl.data || []);
    setForm((f) => ({ ...f, patientId: pat.data?.[0]?.id || f.patientId, doctorId: st.data?.[0]?.id || f.doctorId, branchId: ov.branches?.[0]?.id || f.branchId, templateId: tpl.data?.[0]?.id || "" }));
    setLoading(false);
  }, [tenantId, search]);
  React.useEffect(() => { fetchData(); }, [fetchData]);

  async function createEncounter(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/clinical/${tenantId}/emr`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, icd10Codes: form.icd10Codes.split(",").map(s => s.trim()), attachments: [{ fileName: "visit-summary.pdf", url: "https://cdn.medsaas.com/emr/visit-summary.pdf" }], imageUrls: ["https://cdn.medsaas.com/emr/lesion-image.png"], voiceNoteUrls: ["https://cdn.medsaas.com/emr/voice-note.mp3"] }) });
    const data = await res.json();
    if (data.success) { setModalOpen(false); fetchData(); alert("SOAP encounter signed and PDF exported successfully."); } else alert(data.error);
  }

  return <div className="p-6 space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border p-6">
      <div><h1 className="text-2xl font-black flex items-center gap-2"><FileText className="text-teal-600"/> Electronic Medical Records</h1><p className="text-xs text-slate-500 mt-1">SOAP notes, ICD-10 diagnosis, clinical timeline, signatures, audit trail and PDF export.</p></div>
      <div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient, EMR, ICD-10..." className="h-9 rounded-xl border px-9 text-xs font-bold dark:bg-slate-900"/></div><Button onClick={()=>setModalOpen(true)} className="font-black bg-teal-600 hover:bg-teal-700"><ClipboardPlus className="w-4 h-4 mr-2"/>New SOAP</Button></div>
    </div>
    {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-teal-600"/></div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{records.map(r => <Card key={r.id} className="border hover:border-teal-500 transition-all"><CardHeader><div className="flex justify-between"><Badge variant="success" className="font-black">{r.status}</Badge><Badge variant="outline" className="font-mono">{r.encounterNumber}</Badge></div><CardTitle className="text-lg font-black mt-3">{r.patientName}</CardTitle><CardDescription className="font-mono text-xs">{r.mrn} • Dr. {r.doctorName}</CardDescription></CardHeader><CardContent className="space-y-3 text-xs"><div className="grid grid-cols-2 gap-2"><div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><b>Chief Complaint</b><p>{r.chiefComplaint}</p></div><div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><b>Diagnosis</b><p>{r.diagnosisText}</p></div></div><div className="flex gap-1 flex-wrap">{r.icd10Codes?.map((c:string)=><Badge key={c} variant="warning" className="font-mono">ICD-10 {c}</Badge>)}</div><p className="line-clamp-2"><b>Assessment:</b> {r.assessment}</p><p className="line-clamp-2"><b>Treatment:</b> {r.treatmentPlan}</p><div className="flex gap-2"><Badge><Paperclip className="w-3 h-3 mr-1"/>{r.attachments?.length||0} Attachments</Badge><Badge variant="secondary"><Mic className="w-3 h-3 mr-1"/>{r.voiceNoteUrls?.length||0} Voice</Badge><Badge variant="success"><PenLine className="w-3 h-3 mr-1"/>Signed</Badge></div></CardContent><CardFooter className="flex justify-between"><Button variant="outline" size="sm" onClick={()=>setSelected(r)}><Eye className="w-4 h-4 mr-1"/>Timeline</Button><Button size="sm" className="bg-teal-600"><Download className="w-4 h-4 mr-1"/>PDF Export</Button></CardFooter></Card>)}</div>}
    <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create SOAP Note</DialogTitle><DialogDescription>Structured SOAP, diagnosis, ICD-10, plan and signature workflow.</DialogDescription></DialogHeader><form onSubmit={createEncounter} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><select className="h-9 rounded border text-xs" value={form.patientId} onChange={e=>setForm({...form, patientId:e.target.value})}>{patients.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select><select className="h-9 rounded border text-xs" value={form.doctorId} onChange={e=>setForm({...form, doctorId:e.target.value})}>{staff.map(s=><option key={s.id} value={s.id}>{s.user?.fullName}</option>)}</select><select className="h-9 rounded border text-xs" value={form.branchId} onChange={e=>setForm({...form, branchId:e.target.value})}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>{["chiefComplaint","subjective","objective","assessment","physicalExamination","diagnosisText","icd10Codes","treatmentPlan","progressNotes","clinicalNotes","followUpInstructions"].map(k=><div key={k}><Label className="text-xs font-bold capitalize">{k.replace(/([A-Z])/g," $1")}</Label><textarea className="w-full rounded-xl border p-3 text-xs dark:bg-slate-900" rows={k==="treatmentPlan"?4:2} value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>)}<div><Label className="text-xs font-bold">Follow Up Date</Label><Input type="date" value={form.followUpDate} onChange={e=>setForm({...form,followUpDate:e.target.value})}/></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setModalOpen(false)}>Cancel</Button><Button className="bg-teal-600" type="submit"><ShieldCheck className="w-4 h-4 mr-1"/>Sign & Export PDF</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={()=>setSelected(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Medical Timeline & Audit Trail</DialogTitle></DialogHeader>{selected && <pre className="bg-slate-950 text-emerald-400 rounded-xl p-4 text-xs overflow-auto max-h-96">{JSON.stringify({ encounter:selected.encounterNumber, auditTrail:selected.auditTrail, attachments:selected.attachments, imageUrls:selected.imageUrls, voiceNoteUrls:selected.voiceNoteUrls }, null, 2)}</pre>}</DialogContent></Dialog>
  </div>;
}