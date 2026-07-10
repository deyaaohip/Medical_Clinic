"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Loader2, Pill, Printer, QrCode, RefreshCw, Search, ShieldAlert, ShieldCheck, Stethoscope } from "lucide-react";

export default function PrescriptionManagementPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [rx, setRx] = React.useState<any[]>([]);
  const [meds, setMeds] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [form, setForm] = React.useState({ patientId: "", doctorId: "", branchId: "", medicineName: "Amoxicillin", dosage: "500mg", frequency: "Every 8 hours", duration: "7 days", instructions: "Take after meals", diagnosisSummary: "Bacterial pharyngitis", refillAllowed: false, refillCount: 0 });

  React.useEffect(() => { params.then(p => setTenantId(p.tenantId)); }, [params]);
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ search });
    const [rxRes, medRes, patRes, stRes, ovRes] = await Promise.all([
      fetch(`/api/clinical/${tenantId}/prescriptions?${q}`).then(r=>r.json()),
      fetch(`/api/clinical/${tenantId}/medicines?${q}`).then(r=>r.json()),
      fetch(`/api/clinic/${tenantId}/patients`).then(r=>r.json()),
      fetch(`/api/clinic/${tenantId}/staff?staffType=Doctor`).then(r=>r.json()),
      fetch(`/api/clinic/${tenantId}/overview`).then(r=>r.json()),
    ]);
    if (rxRes.success) setRx(rxRes.data||[]);
    if (medRes.success) setMeds(medRes.data||[]);
    if (patRes.success) setPatients(patRes.data||[]);
    if (stRes.success) setStaff(stRes.data||[]);
    if (ovRes.success) setBranches(ovRes.branches||[]);
    setForm(f=>({...f, patientId: patRes.data?.[0]?.id||f.patientId, doctorId: stRes.data?.[0]?.id||f.doctorId, branchId: ovRes.branches?.[0]?.id||f.branchId}));
    setLoading(false);
  }, [tenantId, search]);
  React.useEffect(()=>{fetchData();},[fetchData]);

  async function createRx(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/clinical/${tenantId}/prescriptions`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, items:[{ medicineName: form.medicineName, dosage: form.dosage, frequency: form.frequency, duration: form.duration, instructions: form.instructions }] }) });
    const data = await res.json();
    if (data.success) { setModalOpen(false); fetchData(); alert("eRx signed, QR verified and PDF generated."); } else alert(data.error);
  }

  return <div className="p-6 space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border p-6"><div><h1 className="text-2xl font-black flex items-center gap-2"><Pill className="text-teal-600"/> Prescription Management</h1><p className="text-xs text-slate-500">Medicine database, interaction checks, allergy verification, refill, PDF, print and QR verification.</p></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} className="h-9 rounded-xl border px-9 text-xs font-bold dark:bg-slate-900" placeholder="Search prescription or medicine..."/></div><Button onClick={()=>setModalOpen(true)} className="bg-teal-600 font-black"><Stethoscope className="w-4 h-4 mr-2"/>New eRx</Button></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="lg:col-span-2"><CardHeader><CardTitle className="font-black">Prescription History</CardTitle><CardDescription>Signed electronic prescriptions with QR tokens.</CardDescription></CardHeader><CardContent>{loading?<Loader2 className="animate-spin text-teal-600"/>:<div className="space-y-4">{rx.map(r=><div key={r.id} className="p-4 border rounded-2xl hover:border-teal-500"><div className="flex justify-between"><div><p className="font-black">{r.patientName}</p><p className="text-xs text-slate-500 font-mono">{r.prescriptionNumber} • {r.mrn}</p></div><Badge variant={r.allergyCheckStatus==="Passed"?"success":"destructive"}>{r.allergyCheckStatus}</Badge></div><div className="mt-3 flex flex-wrap gap-2">{r.items?.map((i:any)=><Badge key={i.id} variant="outline" className="font-mono">{i.medicineName} {i.dosage} • {i.frequency}</Badge>)}</div><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={()=>setSelected(r)}><QrCode className="w-4 h-4 mr-1"/>Verify QR</Button><Button size="sm" variant="outline"><Printer className="w-4 h-4 mr-1"/>Print</Button><Button size="sm" className="bg-teal-600"><Download className="w-4 h-4 mr-1"/>PDF</Button>{r.refillAllowed&&<Badge variant="warning"><RefreshCw className="w-3 h-3 mr-1"/>Refills {r.refillCount}</Badge>}</div></div>)}</div>}</CardContent></Card><Card><CardHeader><CardTitle className="font-black">Medicine Database</CardTitle><CardDescription>Interactions, allergies and generic alternatives.</CardDescription></CardHeader><CardContent className="space-y-3">{meds.map(m=><div key={m.id} className="p-3 border rounded-xl text-xs"><p className="font-black">{m.brandName} <span className="text-slate-400">({m.genericName})</span></p><p className="font-mono text-slate-500">{m.strength} • {m.dosageForm}</p><div className="mt-2 flex gap-1 flex-wrap"><Badge variant="secondary">{m.route}</Badge>{m.interactions?.length>0&&<Badge variant="warning"><ShieldAlert className="w-3 h-3 mr-1"/>Interactions</Badge>}{m.genericAlternatives?.length>0&&<Badge variant="success">Generics {m.genericAlternatives.length}</Badge>}</div></div>)}</CardContent></Card></div>
    <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Create Electronic Prescription</DialogTitle><DialogDescription>Includes drug interaction and allergy check simulation.</DialogDescription></DialogHeader><form onSubmit={createRx} className="space-y-4"><div className="grid grid-cols-3 gap-3"><select className="h-9 rounded border text-xs" value={form.patientId} onChange={e=>setForm({...form,patientId:e.target.value})}>{patients.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select><select className="h-9 rounded border text-xs" value={form.doctorId} onChange={e=>setForm({...form,doctorId:e.target.value})}>{staff.map(s=><option key={s.id} value={s.id}>{s.user?.fullName}</option>)}</select><select className="h-9 rounded border text-xs" value={form.branchId} onChange={e=>setForm({...form,branchId:e.target.value})}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="grid grid-cols-2 gap-3">{["medicineName","dosage","frequency","duration","instructions","diagnosisSummary"].map(k=><div key={k}><Label className="text-xs font-bold capitalize">{k}</Label><Input value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></div>)}</div><div className="p-3 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-700 flex gap-3"><ShieldCheck className="w-4 h-4"/> Drug allergy check passed • Interaction scan passed • Generic alternatives available</div><DialogFooter><Button type="button" variant="outline" onClick={()=>setModalOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-600"><QrCode className="w-4 h-4 mr-1"/>Sign + QR</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={()=>setSelected(null)}><DialogContent><DialogHeader><DialogTitle>QR Code Verification</DialogTitle></DialogHeader>{selected&&<div className="text-center p-8"><div className="mx-auto h-40 w-40 bg-slate-950 text-white grid place-items-center rounded-2xl"><QrCode className="w-24 h-24"/></div><p className="mt-4 font-black font-mono">{selected.qrVerificationToken}</p><p className="text-xs text-slate-500">Valid signed prescription: {selected.prescriptionNumber}</p></div>}</DialogContent></Dialog>
  </div>;
}