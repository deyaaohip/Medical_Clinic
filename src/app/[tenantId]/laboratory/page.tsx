"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  FileDown,
  FlaskConical,
  Loader2,
  Microscope,
  Paperclip,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  TestTube2,
  X,
} from "lucide-react";

export default function LaboratoryManagementPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [context, setContext] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<any>(null);
  const [resultItem, setResultItem] = React.useState<any>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [reviewNotes, setReviewNotes] = React.useState("");
  const [notifyPatient, setNotifyPatient] = React.useState(true);
  const [form, setForm] = React.useState({ patientId: "", orderingDoctorId: "", branchId: "", priority: "Routine", clinicalNotes: "", testIds: [] as string[], packageId: "" });
  const [resultForm, setResultForm] = React.useState({ resultValue: "", resultText: "", referenceRange: "", isAbnormal: false, abnormalFlag: "H" });

  React.useEffect(() => void params.then((value) => setTenantId(value.tenantId)), [params]);
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [contextRes, orderRes] = await Promise.all([
        fetch(`/api/clinical/${tenantId}/context`),
        fetch(`/api/clinical/${tenantId}/laboratory?status=${status}`),
      ]);
      const [contextJson, orderJson] = await Promise.all([contextRes.json(), orderRes.json()]);
      if (contextJson.success) {
        setContext(contextJson.data);
        setForm((current) => ({
          ...current,
          patientId: current.patientId || contextJson.data.patients?.[0]?.id || "",
          orderingDoctorId: current.orderingDoctorId || contextJson.data.doctors?.[0]?.id || "",
          branchId: current.branchId || contextJson.data.branches?.[0]?.id || "",
        }));
      }
      if (orderJson.success) setOrders(orderJson.data || []);
    } finally {
      setLoading(false);
    }
  }, [tenantId, status]);
  React.useEffect(() => void load(), [load]);

  const toggleTest = (id: string) => setForm((current) => ({ ...current, testIds: current.testIds.includes(id) ? current.testIds.filter((testId) => testId !== id) : [...current.testIds, id] }));
  const applyPackage = (packageId: string) => {
    const selected = context?.labPackages?.find((item: any) => item.id === packageId);
    setForm((current) => ({ ...current, packageId, testIds: selected?.testIds || current.testIds }));
  };

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clinical/${tenantId}/laboratory`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error);
      setCreateOpen(false);
      setForm((current) => ({ ...current, priority: "Routine", clinicalNotes: "", testIds: [], packageId: "" }));
      await load();
    } catch (error: any) { alert(error.message || "Unable to create laboratory order."); } finally { setSubmitting(false); }
  };

  const transition = async (orderId: string, body: any) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clinical/${tenantId}/laboratory/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error);
      await load();
      const refreshed = (await (await fetch(`/api/clinical/${tenantId}/laboratory`)).json()).data?.find((item: any) => item.id === orderId);
      if (refreshed) setDetail(refreshed);
      return true;
    } catch (error: any) { alert(error.message || "Laboratory transition failed."); return false; } finally { setSubmitting(false); }
  };

  const openResult = (item: any) => {
    setResultItem(item);
    setResultForm({ resultValue: item.resultValue || "", resultText: item.resultText || "", referenceRange: item.referenceRange || item.test.referenceRangeMale || "", isAbnormal: item.isAbnormal || false, abnormalFlag: item.abnormalFlag || "H" });
  };
  const saveResult = async () => {
    if (!detail || !resultItem) return;
    const ok = await transition(detail.id, { action: "enter-result", itemId: resultItem.id, ...resultForm });
    if (ok) setResultItem(null);
  };
  const review = async () => {
    if (!detail) return;
    const ok = await transition(detail.id, { action: "doctor-review", doctorId: detail.orderingDoctorId, reviewNotes, notifyPatient });
    if (ok) setReviewNotes("");
  };

  const filtered = orders.filter((order) => `${order.patientName} ${order.patientMrn} ${order.orderNumber}`.toLowerCase().includes(search.toLowerCase()));
  const abnormalCount = orders.reduce((sum, order) => sum + order.items.filter((item: any) => item.isAbnormal).length, 0);
  const readyCount = orders.filter((order) => order.status === "Results Ready").length;
  const processingCount = orders.filter((order) => ["Ordered", "Sample Collected", "Processing"].includes(order.status)).length;

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-950 to-cyan-950 p-7 text-white shadow-xl print:hidden"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><Badge className="mb-3 bg-emerald-400/15 text-emerald-200">Technician & physician workflow</Badge><h1 className="flex items-center gap-3 text-3xl font-black"><FlaskConical className="h-8 w-8 text-emerald-300" /> Laboratory Management</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Orders, sample collection, reference ranges, abnormal flags, attachments, reports, review and notifications.</p></div><Button onClick={() => setCreateOpen(true)} className="h-11 bg-emerald-400 px-6 font-black text-slate-950 hover:bg-emerald-300"><Plus className="mr-2 h-4 w-4" />New lab order</Button></div></section>

      <div className="grid gap-4 sm:grid-cols-3 print:hidden"><Metric label="In technician pipeline" value={processingCount} icon={Microscope} color="text-cyan-600" /><Metric label="Ready for review" value={readyCount} icon={CheckCircle2} color="text-emerald-600" /><Metric label="Abnormal results" value={abnormalCount} icon={AlertTriangle} color="text-rose-600" /></div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between print:hidden"><div className="relative w-full max-w-xl"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, patient or MRN..." /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-white px-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><option value="all">All statuses</option><option>Ordered</option><option>Sample Collected</option><option>Results Ready</option><option>Doctor Reviewed</option></select></div>

      {loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div> : <div className="grid gap-4 xl:grid-cols-2 print:hidden">{filtered.map((order) => <Card key={order.id} className={`overflow-hidden hover:shadow-lg ${order.items.some((item: any) => item.isAbnormal) ? "border-rose-300 dark:border-rose-900" : "hover:border-emerald-400"}`}><CardHeader className="pb-3"><div className="flex justify-between gap-3"><div><CardTitle>{order.patientName}</CardTitle><CardDescription className="mt-1 font-mono">{order.orderNumber} • {order.patientMrn}</CardDescription></div><Badge variant={order.status === "Doctor Reviewed" ? "success" : order.status === "Results Ready" ? "warning" : "default"}>{order.status}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between text-xs"><span>{order.doctorName}</span><Badge variant={order.priority === "Urgent" ? "destructive" : "outline"}>{order.priority}</Badge></div><div className="space-y-2">{order.items.map((item: any) => <div key={item.id} className={`flex items-center justify-between rounded-xl border p-3 text-xs ${item.isAbnormal ? "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30" : "dark:border-slate-800"}`}><div><p className="font-black">{item.test.name}</p><p className="mt-1 text-slate-500">{item.test.sampleType} • Ref {item.referenceRange || "—"}</p></div><div className="text-right"><p className={`font-mono text-sm font-black ${item.isAbnormal ? "text-rose-600" : "text-emerald-600"}`}>{item.resultValue || item.status}</p>{item.isAbnormal && <Badge variant="destructive" className="mt-1 text-[9px]">{item.abnormalFlag || "ABN"}</Badge>}</div></div>)}</div><div className="flex gap-2"><Button variant="outline" className="flex-1 font-bold" onClick={() => setDetail(order)}>Open order</Button>{order.status === "Ordered" && <Button onClick={() => transition(order.id, { action: "collect-sample" })} disabled={submitting}><TestTube2 className="mr-2 h-4 w-4" />Collect</Button>}</div></CardContent></Card>)}</div>}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto p-0"><DialogHeader className="sticky top-0 z-10 border-b bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><DialogTitle className="text-xl font-black">Create laboratory order</DialogTitle><DialogDescription>Select a package or individual tests and route the order to the technician dashboard.</DialogDescription></DialogHeader><form onSubmit={createOrder} className="space-y-6 p-6"><div className="grid gap-4 md:grid-cols-4"><Select label="Patient" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} options={context?.patients?.map((item: any) => [item.id, `${item.fullName} • ${item.medicalRecordNumber}`]) || []} /><Select label="Ordering doctor" value={form.orderingDoctorId} onChange={(value) => setForm({ ...form, orderingDoctorId: value })} options={context?.doctors?.map((item: any) => [item.id, item.fullName]) || []} /><Select label="Branch" value={form.branchId} onChange={(value) => setForm({ ...form, branchId: value })} options={context?.branches?.map((item: any) => [item.id, item.name]) || []} /><Select label="Priority" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={[["Routine", "Routine"], ["Urgent", "Urgent"], ["STAT", "STAT / Critical"]]} /></div><div><Label className="text-xs font-bold">Lab package</Label><select value={form.packageId} onChange={(e) => applyPackage(e.target.value)} className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option value="">Choose individual tests</option>{context?.labPackages?.map((item: any) => <option value={item.id} key={item.id}>{item.name} • ${(item.priceCents / 100).toFixed(2)}</option>)}</select></div><div><Label className="mb-2 block text-xs font-black uppercase">Available laboratory tests</Label><div className="grid max-h-72 gap-2 overflow-y-auto rounded-2xl border p-3 dark:border-slate-800 md:grid-cols-2">{context?.labTests?.map((test: any) => <button type="button" key={test.id} onClick={() => toggleTest(test.id)} className={`rounded-xl border p-3 text-left transition ${form.testIds.includes(test.id) ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "dark:border-slate-800"}`}><div className="flex justify-between gap-2"><span className="text-xs font-black">{test.name}</span><Badge variant="outline" className="font-mono">{test.code}</Badge></div><p className="mt-1 text-[11px] text-slate-500">{test.category} • {test.sampleType} • {test.turnaroundMinutes} min</p><p className="mt-2 text-[10px] font-bold text-emerald-700">Ref: {test.referenceRangeMale || test.referenceRangeFemale || "Test-specific"}</p></button>)}</div></div><div><Label className="text-xs font-bold">Clinical notes</Label><textarea rows={3} value={form.clinicalNotes} onChange={(e) => setForm({ ...form, clinicalNotes: e.target.value })} className="mt-1 w-full rounded-xl border bg-transparent p-3 text-xs dark:border-slate-700" /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button disabled={submitting || !form.testIds.length}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit lab order"}</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={detail !== null} onOpenChange={() => setDetail(null)}><DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto p-0 print:max-h-none print:max-w-none print:border-0 print:shadow-none">{detail && <div><div className="bg-slate-950 p-7 text-white print:bg-white print:text-black"><div className="flex justify-between"><div><p className="text-xs font-black uppercase text-emerald-300">Laboratory report</p><h2 className="mt-1 text-2xl font-black">{detail.patientName}</h2><p className="mt-1 font-mono text-xs text-slate-300 print:text-slate-500">{detail.patientMrn} • {detail.orderNumber}</p></div><Badge variant={detail.status === "Doctor Reviewed" ? "success" : "warning"}>{detail.status}</Badge></div></div><div className="space-y-6 p-7"><div className="grid gap-3 sm:grid-cols-3"><Info label="Ordering doctor" value={detail.doctorName} /><Info label="Sample collected" value={detail.sampleCollectedAt ? new Date(detail.sampleCollectedAt).toLocaleString() : "Not collected"} /><Info label="Priority" value={detail.priority} /></div><div className="overflow-hidden rounded-2xl border dark:border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="p-3">Test</th><th className="p-3">Result</th><th className="p-3">Reference</th><th className="p-3">Flag</th><th className="p-3 print:hidden">Action</th></tr></thead><tbody>{detail.items.map((item: any) => <tr key={item.id} className="border-t dark:border-slate-800"><td className="p-3"><p className="font-black">{item.test.name}</p><p className="text-slate-500">{item.test.code} • {item.test.unit}</p></td><td className={`p-3 font-mono font-black ${item.isAbnormal ? "text-rose-600" : "text-emerald-600"}`}>{item.resultValue || "Pending"}</td><td className="p-3 font-mono">{item.referenceRange || "—"}</td><td className="p-3">{item.isAbnormal ? <Badge variant="destructive">{item.abnormalFlag || "ABN"}</Badge> : item.resultValue ? <Badge variant="success">Normal</Badge> : <Badge variant="secondary">Pending</Badge>}</td><td className="p-3 print:hidden"><Button size="sm" variant="outline" onClick={() => openResult(item)}>Enter result</Button></td></tr>)}</tbody></table></div>{detail.status === "Ordered" && <Button onClick={() => transition(detail.id, { action: "collect-sample" })}><TestTube2 className="mr-2 h-4 w-4" />Record sample collection</Button>}<div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border p-4 dark:border-slate-800"><p className="mb-3 font-black">Attachments & PDF reports</p>{detail.attachments?.map((file: any) => <a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-bold dark:bg-slate-800"><span className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-emerald-600" />{file.fileName}</span><FileDown className="h-4 w-4" /></a>)}</div><div className="rounded-2xl border p-4 dark:border-slate-800"><p className="font-black">Doctor review</p><textarea rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder={detail.doctorReviewNotes || "Clinical interpretation and follow-up..."} className="mt-3 w-full rounded-xl border bg-transparent p-3 text-xs dark:border-slate-700" /><label className="mt-3 flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-2"><BellRing className="h-4 w-4 text-cyan-600" />Notify patient when reviewed</span><Switch checked={notifyPatient} onCheckedChange={setNotifyPatient} /></label><Button className="mt-3 w-full" onClick={review} disabled={submitting}><ShieldCheck className="mr-2 h-4 w-4" />Sign doctor review</Button></div></div></div><div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white p-4 dark:border-slate-800 dark:bg-slate-900 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button><Button onClick={() => window.print()}><FileDown className="mr-2 h-4 w-4" />PDF report</Button><Button variant="secondary" onClick={() => setDetail(null)}><X className="mr-2 h-4 w-4" />Close</Button></div></div>}</DialogContent></Dialog>

      <Dialog open={resultItem !== null} onOpenChange={() => setResultItem(null)}><DialogContent><DialogHeader><DialogTitle>Technician result entry</DialogTitle><DialogDescription>{resultItem?.test?.name} • Reference {resultItem?.referenceRange}</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><Label className="text-xs font-bold">Result value</Label><Input className="mt-1" value={resultForm.resultValue} onChange={(e) => setResultForm({ ...resultForm, resultValue: e.target.value })} /></div><div><Label className="text-xs font-bold">Reference range</Label><Input className="mt-1" value={resultForm.referenceRange} onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value })} /></div></div><div><Label className="text-xs font-bold">Result narrative</Label><textarea rows={3} value={resultForm.resultText} onChange={(e) => setResultForm({ ...resultForm, resultText: e.target.value })} className="mt-1 w-full rounded-xl border bg-transparent p-3 text-xs dark:border-slate-700" /></div><label className="flex items-center justify-between rounded-xl border p-3 text-xs font-black dark:border-slate-800"><span className="flex items-center gap-2 text-rose-600"><AlertTriangle className="h-4 w-4" />Flag as abnormal</span><Switch checked={resultForm.isAbnormal} onCheckedChange={(checked) => setResultForm({ ...resultForm, isAbnormal: checked })} /></label>{resultForm.isAbnormal && <Select label="Abnormal flag" value={resultForm.abnormalFlag} onChange={(value) => setResultForm({ ...resultForm, abnormalFlag: value })} options={[["H", "High (H)"], ["L", "Low (L)"], ["C", "Critical (C)"]]} />}</div><DialogFooter><Button variant="outline" onClick={() => setResultItem(null)}>Cancel</Button><Button onClick={saveResult} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate result"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Metric({ label, value, icon: Icon, color }: any) { return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div><Icon className={`h-8 w-8 ${color}`} /></CardContent></Card>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div><Label className="text-xs font-bold">{label}</Label><select className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([id, text]) => <option value={id} key={`${label}-${id}`}>{text}</option>)}</select></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-xs font-bold">{value}</p></div>; }
