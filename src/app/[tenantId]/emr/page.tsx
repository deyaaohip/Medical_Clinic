"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AudioLines,
  CheckCircle2,
  Clock3,
  FileDown,
  FileHeart,
  FileText,
  Loader2,
  LockKeyhole,
  Paperclip,
  PenLine,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";

const EMPTY_FORM = {
  patientId: "",
  doctorId: "",
  branchId: "",
  templateId: "",
  icd10CodeIds: [] as string[],
  visitType: "Outpatient",
  chiefComplaint: "",
  subjective: "",
  objective: "",
  assessment: "",
  treatmentPlan: "",
  physicalGeneral: "Alert, oriented and in no acute distress",
  physicalCardio: "Regular rate and rhythm",
  physicalRespiratory: "Clear to auscultation bilaterally",
  followUpInstructions: "",
  followUpDate: "",
  clinicalNotes: "",
  attachmentUrl: "",
  attachmentName: "",
  voiceNoteUrl: "",
  voiceTranscription: "",
};

export default function ElectronicMedicalRecordPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [context, setContext] = React.useState<any>(null);
  const [encounters, setEncounters] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<any>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [signature, setSignature] = React.useState("");

  React.useEffect(() => void params.then((value) => setTenantId(value.tenantId)), [params]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [contextRes, encounterRes] = await Promise.all([
        fetch(`/api/clinical/${tenantId}/context`),
        fetch(`/api/clinical/${tenantId}/emr?search=${encodeURIComponent(search)}`),
      ]);
      const [contextJson, encounterJson] = await Promise.all([contextRes.json(), encounterRes.json()]);
      if (contextJson.success) {
        setContext(contextJson.data);
        setForm((current) => ({
          ...current,
          patientId: current.patientId || contextJson.data.patients?.[0]?.id || "",
          doctorId: current.doctorId || contextJson.data.doctors?.[0]?.id || "",
          branchId: current.branchId || contextJson.data.branches?.[0]?.id || "",
        }));
      }
      if (encounterJson.success) setEncounters(encounterJson.data || []);
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  React.useEffect(() => void load(), [load]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const response = await fetch(`/api/clinical/${tenantId}/emr/${id}`);
      const payload = await response.json();
      if (payload.success) {
        setDetail(payload.data);
        setSignature(payload.data.doctorSignature || "");
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = context?.emrTemplates?.find((item: any) => item.id === templateId);
    setForm((current) => ({
      ...current,
      templateId,
      chiefComplaint: template?.chiefComplaint || current.chiefComplaint,
      subjective: template?.subjective || current.subjective,
      objective: template?.objective || current.objective,
      assessment: template?.assessment || current.assessment,
      treatmentPlan: template?.treatmentPlan || current.treatmentPlan,
      physicalGeneral: template?.physicalExamination?.general || current.physicalGeneral,
      physicalCardio: template?.physicalExamination?.cardiovascular || current.physicalCardio,
      physicalRespiratory: template?.physicalExamination?.respiratory || current.physicalRespiratory,
    }));
  };

  const toggleDiagnosis = (id: string) => {
    setForm((current) => ({
      ...current,
      icd10CodeIds: current.icd10CodeIds.includes(id)
        ? current.icd10CodeIds.filter((item) => item !== id)
        : [...current.icd10CodeIds, id],
    }));
  };

  const createEncounter = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clinical/${tenantId}/emr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          physicalExamination: {
            general: form.physicalGeneral,
            cardiovascular: form.physicalCardio,
            respiratory: form.physicalRespiratory,
          },
        }),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error);
      setCreateOpen(false);
      setForm((current) => ({ ...EMPTY_FORM, patientId: current.patientId, doctorId: current.doctorId, branchId: current.branchId }));
      await load();
      await openDetail(payload.data.id);
    } catch (error: any) {
      alert(error.message || "Unable to create encounter.");
    } finally {
      setSubmitting(false);
    }
  };

  const signEncounter = async () => {
    if (!detailId || !signature.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clinical/${tenantId}/emr/${detailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign", signature }),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error);
      await openDetail(detailId);
      await load();
    } catch (error: any) {
      alert(error.message || "Signature failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const signedCount = encounters.filter((item) => item.status === "Signed").length;
  const diagnosisCount = encounters.reduce((sum, item) => sum + (item.diagnoses?.length || 0), 0);

  return (
    <div className="space-y-6 p-6 print:p-0">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-7 text-white shadow-xl print:hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="mb-3 bg-teal-400/15 text-teal-200">Encrypted clinical workspace</Badge>
            <h1 className="flex items-center gap-3 text-3xl font-black"><FileHeart className="h-8 w-8 text-teal-300" /> Electronic Medical Record</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">SOAP documentation, ICD‑10 diagnoses, physical examination, signatures, voice notes, attachments and immutable audit history.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="h-11 bg-teal-500 px-6 font-black text-slate-950 hover:bg-teal-400"><Plus className="mr-2 h-4 w-4" />New SOAP encounter</Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3 print:hidden">
        {[
          ["Visit history", encounters.length, FileText, "text-teal-600"],
          ["Doctor signed", signedCount, ShieldCheck, "text-emerald-600"],
          ["ICD‑10 diagnoses", diagnosisCount, Stethoscope, "text-cyan-600"],
        ].map(([label, value, Icon, color]: any) => (
          <Card key={label}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div><Icon className={`h-8 w-8 ${color}`} /></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative w-full max-w-xl"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, encounter number or chief complaint..." className="pl-9" /></div>
        <Badge variant="outline">{encounters.length} records</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 print:hidden">
          {encounters.map((encounter) => (
            <Card key={encounter.id} className="overflow-hidden transition hover:border-teal-400 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div><CardTitle className="text-lg">{encounter.patientName}</CardTitle><CardDescription className="mt-1 font-mono">{encounter.encounterNumber} • {encounter.patientMrn}</CardDescription></div>
                  <Badge variant={encounter.status === "Signed" ? "success" : "warning"}>{encounter.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-[10px] font-black uppercase text-slate-400">Chief complaint</p><p className="mt-1 text-sm font-semibold">{encounter.chiefComplaint}</p></div>
                <div className="flex flex-wrap gap-2">{encounter.diagnoses?.map((diagnosis: any) => <Badge key={diagnosis.id} variant="outline" className="font-mono">{diagnosis.code} • {diagnosis.description}</Badge>)}</div>
                <div className="flex items-center justify-between text-xs text-slate-500"><span>{encounter.doctorName}</span><span>{new Date(encounter.visitDate).toLocaleString()}</span></div>
                <Button variant="outline" className="w-full font-bold" onClick={() => openDetail(encounter.id)}>Open clinical record</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-10 border-b bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <DialogTitle className="text-xl font-black">New SOAP clinical encounter</DialogTitle>
            <DialogDescription>Document the visit and attach structured diagnoses before signing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createEncounter} className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <FieldSelect label="Patient" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} options={context?.patients?.map((item: any) => [item.id, `${item.fullName} • ${item.medicalRecordNumber}`]) || []} />
              <FieldSelect label="Doctor" value={form.doctorId} onChange={(value) => setForm({ ...form, doctorId: value })} options={context?.doctors?.map((item: any) => [item.id, item.fullName]) || []} />
              <FieldSelect label="Branch" value={form.branchId} onChange={(value) => setForm({ ...form, branchId: value })} options={context?.branches?.map((item: any) => [item.id, item.name]) || []} />
              <FieldSelect label="SOAP template" value={form.templateId} onChange={applyTemplate} options={[["", "Blank note"], ...(context?.emrTemplates?.map((item: any) => [item.id, item.name]) || [])]} />
            </div>

            <TextArea label="Chief complaint" value={form.chiefComplaint} onChange={(value) => setForm({ ...form, chiefComplaint: value })} required />
            <div className="grid gap-4 md:grid-cols-2"><TextArea label="S — Subjective" value={form.subjective} onChange={(value) => setForm({ ...form, subjective: value })} required /><TextArea label="O — Objective" value={form.objective} onChange={(value) => setForm({ ...form, objective: value })} required /><TextArea label="A — Assessment" value={form.assessment} onChange={(value) => setForm({ ...form, assessment: value })} required /><TextArea label="P — Treatment plan" value={form.treatmentPlan} onChange={(value) => setForm({ ...form, treatmentPlan: value })} required /></div>

            <div className="rounded-2xl border p-4 dark:border-slate-800"><p className="mb-3 text-sm font-black">Physical examination</p><div className="grid gap-3 md:grid-cols-3"><Input value={form.physicalGeneral} onChange={(e) => setForm({ ...form, physicalGeneral: e.target.value })} placeholder="General" /><Input value={form.physicalCardio} onChange={(e) => setForm({ ...form, physicalCardio: e.target.value })} placeholder="Cardiovascular" /><Input value={form.physicalRespiratory} onChange={(e) => setForm({ ...form, physicalRespiratory: e.target.value })} placeholder="Respiratory" /></div></div>

            <div><Label className="mb-2 block text-xs font-black uppercase">ICD‑10 diagnoses</Label><div className="grid max-h-44 gap-2 overflow-y-auto rounded-2xl border p-3 dark:border-slate-800 md:grid-cols-2">{context?.icd10Codes?.map((code: any) => <button type="button" key={code.id} onClick={() => toggleDiagnosis(code.id)} className={`rounded-xl border p-3 text-left text-xs transition ${form.icd10CodeIds.includes(code.id) ? "border-teal-500 bg-teal-50 dark:bg-teal-950" : "dark:border-slate-800"}`}><span className="font-black text-teal-700 dark:text-teal-300">{code.code}</span> • {code.description}</button>)}</div></div>

            <div className="grid gap-4 md:grid-cols-2"><TextArea label="Follow-up instructions" value={form.followUpInstructions} onChange={(value) => setForm({ ...form, followUpInstructions: value })} /><div><Label className="text-xs font-bold">Follow-up date</Label><Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className="mt-1" /></div></div>
            <TextArea label="Progress / clinical notes" value={form.clinicalNotes} onChange={(value) => setForm({ ...form, clinicalNotes: value })} />

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50 md:grid-cols-2"><div><Label className="text-xs font-bold">Attachment URL (image or PDF)</Label><Input className="mt-1" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://secure-cdn/..." /><Input className="mt-2" value={form.attachmentName} onChange={(e) => setForm({ ...form, attachmentName: e.target.value })} placeholder="File name" /></div><div><Label className="text-xs font-bold">Voice note URL</Label><Input className="mt-1" value={form.voiceNoteUrl} onChange={(e) => setForm({ ...form, voiceNoteUrl: e.target.value })} placeholder="https://secure-cdn/...mp3" /><Input className="mt-2" value={form.voiceTranscription} onChange={(e) => setForm({ ...form, voiceTranscription: e.target.value })} placeholder="Optional transcription" /></div></div>

            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button disabled={submitting || !form.patientId || !form.doctorId || !form.branchId}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save SOAP record"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailId !== null} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto p-0 print:max-h-none print:max-w-none print:border-0 print:shadow-none">
          {detailLoading || !detail ? <div className="flex justify-center p-24"><Loader2 className="h-9 w-9 animate-spin text-teal-600" /></div> : (
            <div id="emr-print-document">
              <div className="bg-slate-950 p-7 text-white print:bg-white print:text-black">
                <div className="flex justify-between gap-4"><div><p className="text-xs font-black uppercase text-teal-300">Electronic medical record</p><h2 className="mt-1 text-2xl font-black">{detail.patientName}</h2><p className="mt-1 font-mono text-xs text-slate-300 print:text-slate-600">{detail.patientMrn} • {detail.encounterNumber}</p></div><div className="text-right"><Badge variant={detail.status === "Signed" ? "success" : "warning"}>{detail.status}</Badge><p className="mt-2 text-xs">{new Date(detail.visitDate).toLocaleString()}</p></div></div>
              </div>
              <div className="p-7">
                <div className="mb-5 flex flex-wrap gap-2">{detail.diagnoses?.map((diagnosis: any) => <Badge key={diagnosis.id} variant="outline" className="font-mono">{diagnosis.code} • {diagnosis.description}</Badge>)}</div>
                <Tabs defaultValue="soap">
                  <TabsList className="print:hidden"><TabsTrigger value="soap">SOAP & Exam</TabsTrigger><TabsTrigger value="files">Files & Voice</TabsTrigger><TabsTrigger value="audit">Audit trail</TabsTrigger></TabsList>
                  <TabsContent value="soap" className="space-y-5 pt-4">
                    <ClinicalBlock title="Chief complaint" text={detail.chiefComplaint} />
                    <div className="grid gap-4 md:grid-cols-2"><ClinicalBlock title="S — Subjective" text={detail.subjective} /><ClinicalBlock title="O — Objective" text={detail.objective} /><ClinicalBlock title="A — Assessment" text={detail.assessment} /><ClinicalBlock title="P — Treatment plan" text={detail.treatmentPlan} /></div>
                    <div className="rounded-2xl border p-4 dark:border-slate-800"><h3 className="text-sm font-black">Physical examination</h3><div className="mt-3 grid gap-3 md:grid-cols-3">{Object.entries(detail.physicalExamination || {}).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] font-black uppercase text-slate-400">{key}</p><p className="mt-1 text-xs font-semibold">{String(value)}</p></div>)}</div></div>
                    <div className="grid gap-4 md:grid-cols-2"><ClinicalBlock title="Follow-up" text={`${detail.followUpInstructions || "No instructions"}${detail.followUpDate ? ` • ${new Date(detail.followUpDate).toLocaleDateString()}` : ""}`} /><ClinicalBlock title="Progress / clinical notes" text={detail.clinicalNotes || "No additional notes"} /></div>
                  </TabsContent>
                  <TabsContent value="files" className="space-y-4 pt-4"><h3 className="font-black">Attachments</h3>{detail.attachments?.map((file: any) => <a key={file.id} href={file.fileUrl} target="_blank" className="flex items-center justify-between rounded-xl border p-3 text-sm font-bold hover:border-teal-500" rel="noreferrer"><span className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-teal-600" />{file.fileName}</span><FileDown className="h-4 w-4" /></a>)}<h3 className="pt-3 font-black">Voice notes</h3>{detail.voiceNotes?.map((voice: any) => <div key={voice.id} className="rounded-xl border p-4"><div className="flex items-center gap-2 font-bold"><AudioLines className="h-4 w-4 text-cyan-600" />{voice.durationSeconds}s dictation</div><audio controls className="mt-3 w-full"><source src={voice.audioUrl} /></audio><p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{voice.transcription}</p></div>)}</TabsContent>
                  <TabsContent value="audit" className="space-y-3 pt-4">{detail.auditTrail?.map((audit: any) => <div key={audit.id} className="flex gap-3 rounded-xl border p-3"><LockKeyhole className="mt-0.5 h-4 w-4 text-emerald-600" /><div><p className="text-xs font-black">{audit.action}</p><p className="text-[11px] text-slate-500">{audit.actorName} • {new Date(audit.createdAt).toLocaleString()}</p></div></div>)}</TabsContent>
                </Tabs>
                <div className="mt-7 rounded-2xl border-2 border-dashed border-teal-300 p-4 dark:border-teal-800"><p className="text-xs font-black uppercase text-slate-500">Doctor electronic signature</p>{detail.doctorSignature ? <div className="mt-2 flex items-center gap-2 text-lg font-black text-teal-700 dark:text-teal-300"><CheckCircle2 className="h-5 w-5" />{detail.doctorSignature}<span className="ml-auto text-xs font-normal text-slate-500">{new Date(detail.signedAt).toLocaleString()}</span></div> : <div className="mt-3 flex gap-2 print:hidden"><Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Doctor name • license number" /><Button onClick={signEncounter} disabled={submitting || !signature.trim()}><PenLine className="mr-2 h-4 w-4" />Sign</Button></div>}</div>
              </div>
              <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white p-4 dark:border-slate-800 dark:bg-slate-900 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button><Button onClick={() => window.print()}><FileDown className="mr-2 h-4 w-4" />Export PDF</Button><Button variant="secondary" onClick={() => setDetailId(null)}><X className="mr-2 h-4 w-4" />Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div><Label className="text-xs font-bold">{label}</Label><select className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([id, name]) => <option value={id} key={`${label}-${id}`}>{name}</option>)}</select></div>;
}
function TextArea({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <div><Label className="text-xs font-bold">{label}</Label><textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border bg-transparent p-3 text-xs outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700" /></div>;
}
function ClinicalBlock({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><h3 className="text-xs font-black uppercase tracking-wide text-teal-700 dark:text-teal-300">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{text}</p></div>;
}
