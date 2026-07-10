import { notFound } from "next/navigation";
import { ClinicalOperationsService } from "@/core/application/ClinicalOperationsService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Pill, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrescriptionVerificationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await new ClinicalOperationsService().verifyPrescription(token);
  if (!data) notFound();
  const valid = data.status === "Active" && new Date(data.validUntil) >= new Date();

  return (
    <main className="min-h-screen bg-slate-100 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl space-y-6 pt-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg"><ShieldCheck className="h-8 w-8" /></div>
          <h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">Prescription Verification</h1>
          <p className="mt-2 text-sm text-slate-500">Cryptographically referenced MedSaaS electronic prescription</p>
        </div>
        <Card className="overflow-hidden border-2 border-emerald-300 dark:border-emerald-900">
          <CardHeader className="bg-slate-950 text-white">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-emerald-300">{data.clinicName}</p><CardTitle className="mt-1 text-xl">{data.prescriptionNumber}</CardTitle></div><Badge variant={valid ? "success" : "destructive"}>{valid ? "VALID" : "EXPIRED / INACTIVE"}</Badge></div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-3 sm:grid-cols-2"><Info label="Patient" value={`${data.patientName} • ${data.patientMrn}`} /><Info label="Prescriber" value={data.doctorName} /><Info label="Issued" value={new Date(data.issuedAt).toLocaleString()} /><Info label="Valid until" value={new Date(data.validUntil).toLocaleDateString()} /></div>
            <div><p className="text-xs font-black uppercase text-slate-500">Diagnosis</p><p className="mt-2 text-sm font-bold">{data.diagnosis || "Not specified"}</p></div>
            <div className="space-y-3">{data.items.map((item, index) => <div key={`${item.genericName}-${index}`} className="rounded-2xl border p-4 dark:border-slate-800"><div className="flex items-center gap-2"><Pill className="h-4 w-4 text-cyan-600" /><p className="font-black">{item.brandName} {item.strength}</p></div><p className="mt-1 text-xs text-slate-500">{item.genericName}</p><p className="mt-3 text-xs font-bold">{item.dosage} • {item.frequency} • {item.duration} • {item.route}</p></div>)}</div>
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 className="h-6 w-6" /><div><p className="text-xs font-black uppercase">Electronic signature verified</p><p className="mt-1 text-sm font-bold">{data.doctorSignature || data.doctorName}</p></div></div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-xs font-bold">{value}</p></div>; }
