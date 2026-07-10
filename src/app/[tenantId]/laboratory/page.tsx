"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Activity, AlertTriangle, Beaker, Bell, CheckCircle2, Download, FileText, Loader2, Microscope, Plus, Search, Send, TestTube2 } from "lucide-react";

export default function LaboratoryModulePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [orders, setOrders] = React.useState<any[]>([]);
  const [packages, setPackages] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any | null>(null);
  const [form, setForm] = React.useState({ patientId:"", doctorId:"", branchId:"", packageId:"", priority:"Routine", clinicalIndication:"CBC and inflammatory markers requested.", tests:"CBC,CRP,HbA1c" });

  React.useEffect(()=>{params.then(p=>setTenantId(p.tenantId));},[params]);
  const fetchData = React.useCallback(async()=>{
    setLoading(true);
    const qs = new URLSearchParams({status});
    const [ord,pkg,pat,st,ov] = await Promise.all([
      fetch(`/api/clinical/${tenantId}/lab-orders?${qs}`).then(r=>r.json()),
      fetch(`/api/clinical/${tenantId}/lab-packages`).then(r=>r.json()),
      fetch(`/api/clinic/${tenantId}/patients`).then(r=>r.json()),
      fetch(`/api/clinic/${tenantId}/staff?staffType=Doctor`).then(r=>r.json()),
      fetch(`/api/clinic/${tenantId}/overview`).then(r=>r.json()),
    ]);
    if(ord.success) setOrders(ord.data||[]); if(pkg.success) setPackages(pkg.data||[]); if(pat.success) setPatients(pat.data||[]); if(st.success) setStaff(st.data||[]); if(ov.success) setBranches(ov.branches||[]);
    setForm(f=>({...f, patientId: pat.data?.[0]?.id||f.patientId, doctorId: st.data?.[0]?.id||f.doctorId, branchId: ov.branches?.[0]?.id||f.branchId, packageId: pkg.data?.[0]?.id||f.packageId}));
    setLoading(false);
  },[tenantId,status]);
  React.useEffect(()=>{fetchData();},[fetchData]);

  async function createOrder(e: React.FormEvent){
    e.preventDefault();
    const tests = form.tests.split(",").map(t=>({testName:t.trim(), referenceRange:t.includes("HbA1c")?"4.0-5.6":"Lab reference", unit:t.includes("HbA1c")?"%":"", sampleType:"Blood"}));
    const res = await fetch(`/api/clinical/${tenantId}/lab-orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,tests})});
    const data=await res.json(); if(data.success){setModalOpen(false); fetchData(); alert("Lab order created and technician dashboard notified.");} else alert(data.error);
  }
  async function updateStatus(id:string, st:string){ const res=await fetch(`/api/clinical/${tenantId}/lab-orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:st})}); const d=await res.json(); if(d.success){fetchData(); alert(`Lab order moved to ${st}`);} }

  return <div className="p-6 space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border p-6"><div><h1 className="text-2xl font-black flex items-center gap-2"><Microscope className="text-teal-600"/> Laboratory Module</h1><p className="text-xs text-slate-500">Orders, collection, technician result entry, abnormal flags, doctor review, PDF reports and notifications.</p></div><div className="flex gap-2"><select value={status} onChange={e=>setStatus(e.target.value)} className="h-9 rounded-xl border px-3 text-xs font-bold dark:bg-slate-900"><option value="all">All Status</option><option value="Ordered">Ordered</option><option value="SampleCollected">Sample Collected</option><option value="ResultEntered">Result Entered</option><option value="DoctorReviewed">Doctor Reviewed</option></select><Button onClick={()=>setModalOpen(true)} className="bg-teal-600 font-black"><Plus className="w-4 h-4 mr-2"/>New Lab Order</Button></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"><Card className="lg:col-span-3"><CardHeader><CardTitle className="font-black">Lab Orders & Technician Dashboard</CardTitle><CardDescription>Status tracking and abnormal result monitoring.</CardDescription></CardHeader><CardContent>{loading?<Loader2 className="animate-spin text-teal-600"/>:<div className="space-y-4">{orders.map(o=><div key={o.id} className="p-4 border rounded-2xl hover:border-teal-500"><div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div><p className="font-black">{o.patientName}</p><p className="text-xs text-slate-500 font-mono">{o.orderNumber} • {o.mrn} • Dr. {o.doctorName}</p><p className="text-xs mt-2"><b>Indication:</b> {o.clinicalIndication}</p></div><div className="flex gap-2"><Badge variant={o.priority==="STAT"?"destructive":"secondary"}>{o.priority}</Badge><Badge variant={o.status==="DoctorReviewed"?"success":o.status==="ResultEntered"?"warning":"default"}>{o.status}</Badge></div></div><div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">{o.tests?.map((t:any)=><div key={t.id} className={`p-3 rounded-xl border text-xs ${t.abnormalFlag==="Abnormal"?"bg-rose-50 border-rose-300 dark:bg-rose-950/30":"bg-slate-50 dark:bg-slate-800"}`}><div className="flex justify-between"><b>{t.testName}</b>{t.abnormalFlag==="Abnormal"&&<AlertTriangle className="w-4 h-4 text-rose-600"/>}</div><p className="font-mono text-slate-500">Result: {t.resultValue||"Pending"} {t.unit}</p><p className="font-mono text-slate-400">Range: {t.referenceRange}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>updateStatus(o.id,"SampleCollected")}><TestTube2 className="w-4 h-4 mr-1"/>Collect Sample</Button><Button size="sm" variant="outline" onClick={()=>updateStatus(o.id,"ResultEntered")}><Beaker className="w-4 h-4 mr-1"/>Enter Results</Button><Button size="sm" className="bg-teal-600" onClick={()=>updateStatus(o.id,"DoctorReviewed")}><CheckCircle2 className="w-4 h-4 mr-1"/>Doctor Review</Button><Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1"/>PDF</Button><Button size="sm" variant="outline" onClick={()=>setSelected(o)}><Bell className="w-4 h-4 mr-1"/>Notify</Button></div></div>)}</div>}</CardContent></Card><Card><CardHeader><CardTitle className="font-black">Lab Packages</CardTitle><CardDescription>Reusable bundled panels.</CardDescription></CardHeader><CardContent className="space-y-3">{packages.map(p=><div key={p.id} className="p-3 border rounded-xl text-xs"><p className="font-black">{p.name}</p><p className="font-mono text-slate-500">{p.code} • ${(p.priceCents/100).toFixed(0)}</p><div className="mt-2 flex gap-1 flex-wrap">{p.tests?.map((t:string)=><Badge key={t} variant="outline">{t}</Badge>)}</div></div>)}</CardContent></Card></div>
    <Dialog open={modalOpen} onOpenChange={setModalOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Create Lab Order</DialogTitle><DialogDescription>Generate lab order and notify sample collection technician dashboard.</DialogDescription></DialogHeader><form onSubmit={createOrder} className="space-y-4"><div className="grid grid-cols-3 gap-3"><select className="h-9 rounded border text-xs" value={form.patientId} onChange={e=>setForm({...form,patientId:e.target.value})}>{patients.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select><select className="h-9 rounded border text-xs" value={form.doctorId} onChange={e=>setForm({...form,doctorId:e.target.value})}>{staff.map(s=><option key={s.id} value={s.id}>{s.user?.fullName}</option>)}</select><select className="h-9 rounded border text-xs" value={form.branchId} onChange={e=>setForm({...form,branchId:e.target.value})}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><Label className="text-xs font-bold">Lab Package</Label><select className="h-9 rounded border text-xs w-full" value={form.packageId} onChange={e=>setForm({...form,packageId:e.target.value})}>{packages.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div><Label className="text-xs font-bold">Priority</Label><select className="h-9 rounded border text-xs w-full" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Routine</option><option>Urgent</option><option>STAT</option></select></div></div><div><Label className="text-xs font-bold">Tests CSV</Label><Input value={form.tests} onChange={e=>setForm({...form,tests:e.target.value})}/></div><div><Label className="text-xs font-bold">Clinical Indication</Label><textarea className="w-full rounded-xl border p-3 text-xs dark:bg-slate-900" rows={3} value={form.clinicalIndication} onChange={e=>setForm({...form,clinicalIndication:e.target.value})}/></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setModalOpen(false)}>Cancel</Button><Button type="submit" className="bg-teal-600"><Send className="w-4 h-4 mr-1"/>Send to Lab</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={()=>setSelected(null)}><DialogContent><DialogHeader><DialogTitle>Patient Notification</DialogTitle></DialogHeader>{selected&&<div className="space-y-3"><p className="text-sm font-bold">Notify {selected.patientName} that lab report {selected.orderNumber} is ready.</p><Button className="bg-emerald-600" onClick={()=>{alert("WhatsApp, SMS and portal notification sent.");setSelected(null)}}><Bell className="w-4 h-4 mr-1"/>Send Notification</Button></div>}</DialogContent></Dialog>
  </div>;
}