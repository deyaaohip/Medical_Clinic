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
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileDown,
  FileWarning,
  Loader2,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

type EntityType = "company" | "plan" | "policy" | "authorization" | "claim";

export default function InsuranceManagementPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [entityType, setEntityType] = React.useState<EntityType | null>(null);
  const [actionTarget, setActionTarget] = React.useState<any>(null);
  const [actionType, setActionType] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<any>({});
  const [decision, setDecision] = React.useState({ approvedAmountCents: "", externalReference: "", rejectionCode: "", rejectionReason: "", reviewNotes: "" });

  React.useEffect(() => void params.then((value) => setTenantId(value.tenantId)), [params]);
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/operations/${tenantId}/insurance`);
      const payload = await response.json();
      if (payload.success) setData(payload.data);
    } finally { setLoading(false); }
  }, [tenantId]);
  React.useEffect(() => void load(), [load]);

  const openCreate = (type: EntityType) => {
    setEntityType(type);
    if (type === "company") setForm({ entityType: type, payerCode: "", name: "", companyType: "Commercial", phone: "", email: "", electronicPayerId: "" });
    if (type === "plan") setForm({ entityType: type, insuranceCompanyId: data?.companies?.[0]?.id || "", planCode: "", name: "", networkTier: "GN+", defaultCoveragePercent: 80, defaultCoPaymentCents: 5000, annualDeductibleCents: 100000, annualLimitCents: 5000000 });
    if (type === "policy") setForm({ entityType: type, patientId: data?.patients?.[0]?.id || "", insuranceCompanyId: data?.companies?.[0]?.id || "", insurancePlanId: data?.plans?.[0]?.id || "", policyNumber: "", memberId: "", groupNumber: "", holderName: data?.patients?.[0]?.fullName || "", relationshipToHolder: "Self", coverageStart: new Date().toISOString().split("T")[0], coverageEnd: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0], coPaymentCents: 5000 });
    if (type === "authorization") { const p = data?.policies?.[0]; setForm({ entityType: type, patientPolicyId: p?.id || "", patientId: p?.patientId || "", serviceType: "MRI Brain with Contrast", diagnosisCodes: ["R51.9"], requestedAmountCents: 125000, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] }); }
    if (type === "claim") { const p = data?.policies?.[0]; setForm({ entityType: type, patientPolicyId: p?.id || "", authorizationId: "", attachmentUrl: "", attachmentName: "", items: [{ serviceCode: "99214", description: "Specialist outpatient consultation", quantity: 1, unitPriceCents: 50000 }] }); }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true);
    try {
      const response = await fetch(`/api/operations/${tenantId}/insurance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json(); if (!payload.success) throw new Error(payload.error);
      setEntityType(null); await load();
    } catch (error: any) { alert(error.message || "Unable to create insurance record."); } finally { setSubmitting(false); }
  };

  const transition = async () => {
    if (!actionTarget) return; setSubmitting(true);
    try {
      const isAuth = actionTarget.authorizationNumber;
      const module = isAuth ? "insurance-authorization" : "insurance-claim";
      const body: any = { action: actionType, ...decision };
      if (decision.approvedAmountCents) body.approvedAmountCents = Number(decision.approvedAmountCents);
      const response = await fetch(`/api/operations/${tenantId}/${module}/${actionTarget.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json(); if (!payload.success) throw new Error(payload.error);
      setActionTarget(null); setActionType(""); await load();
    } catch (error: any) { alert(error.message || "Insurance transition failed."); } finally { setSubmitting(false); }
  };

  const money = (cents: number | null | undefined) => `$${((cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const claims = data?.claims || [];
  const filteredClaims = claims.filter((claim: any) => `${claim.patientName} ${claim.claimNumber} ${claim.companyName}`.toLowerCase().includes(search.toLowerCase()));
  const submittedTotal = claims.reduce((sum: number, claim: any) => sum + claim.totalAmountCents, 0);
  const approvedTotal = claims.filter((claim: any) => ["Approved", "Paid"].includes(claim.status)).reduce((sum: number, claim: any) => sum + (claim.approvedAmountCents || claim.coveredAmountCents), 0);
  const copayTotal = claims.reduce((sum: number, claim: any) => sum + claim.patientCoPaymentCents, 0);
  const rejected = claims.filter((claim: any) => claim.status === "Rejected");

  const openAction = (target: any, type: string) => {
    setActionTarget(target); setActionType(type);
    setDecision({ approvedAmountCents: String(target.approvedAmountCents || target.coveredAmountCents || target.requestedAmountCents || ""), externalReference: target.externalReference || "", rejectionCode: target.rejectionCode || "", rejectionReason: target.rejectionReason || "", reviewNotes: "" });
  };

  if (loading || !data) return <div className="flex justify-center p-24"><Loader2 className="h-9 w-9 animate-spin text-violet-600" /></div>;

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl bg-gradient-to-r from-violet-950 via-slate-950 to-emerald-950 p-7 text-white shadow-xl print:hidden"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><Badge className="mb-3 bg-violet-400/15 text-violet-200">Revenue cycle & payer gateway</Badge><h1 className="flex items-center gap-3 text-3xl font-black"><ShieldCheck className="h-8 w-8 text-emerald-300" />Insurance Management</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Eligibility, coverage, authorization, billing rules, claims, rejection resolution, resubmission, invoices and co-payments.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => openCreate("authorization")}>Authorization</Button><Button onClick={() => openCreate("claim")} className="bg-emerald-400 font-black text-slate-950 hover:bg-emerald-300"><Plus className="mr-2 h-4 w-4" />New claim</Button></div></div></section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden"><Metric label="Submitted charges" value={money(submittedTotal)} icon={BadgeDollarSign} color="text-violet-600" /><Metric label="Approved revenue" value={money(approvedTotal)} icon={CheckCircle2} color="text-emerald-600" /><Metric label="Patient co-payment" value={money(copayTotal)} icon={CircleDollarSign} color="text-cyan-600" /><Metric label="Rejected claims" value={rejected.length} icon={FileWarning} color="text-rose-600" /></div>

      <Tabs defaultValue="claims">
        <TabsList className="h-auto flex-wrap print:hidden"><TabsTrigger value="claims">Claims</TabsTrigger><TabsTrigger value="authorizations">Authorizations</TabsTrigger><TabsTrigger value="policies">Policies & coverage</TabsTrigger><TabsTrigger value="payers">Companies & plans</TabsTrigger><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="rules">Billing rules</TabsTrigger><TabsTrigger value="reports">Insurance reports</TabsTrigger></TabsList>

        <TabsContent value="claims" className="space-y-4 pt-4"><div className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="relative w-full max-w-xl"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search claim, patient or payer..." /></div><Button onClick={() => openCreate("claim")}><Plus className="mr-2 h-4 w-4" />Claim</Button></div><div className="grid gap-4 xl:grid-cols-2">{filteredClaims.map((claim: any) => <Card key={claim.id} className={claim.status === "Rejected" ? "border-rose-300 dark:border-rose-900" : "hover:border-emerald-400"}><CardHeader className="pb-3"><div className="flex justify-between gap-3"><div><CardTitle>{claim.patientName}</CardTitle><CardDescription className="mt-1 font-mono">{claim.claimNumber} • {claim.policyNumber}</CardDescription></div><Status status={claim.status} /></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><MoneyBox label="Total" value={money(claim.totalAmountCents)} /><MoneyBox label="Insurance" value={money(claim.coveredAmountCents)} /><MoneyBox label="Co-pay" value={money(claim.patientCoPaymentCents)} /></div><div className="space-y-2">{claim.items.map((item: any) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800"><div><b>{item.serviceCode}</b> • {item.description}</div><span className="font-mono font-black">{money(item.unitPriceCents * item.quantity)}</span></div>)}</div>{claim.status === "Rejected" && <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-200"><b>{claim.rejectionCode}:</b> {claim.rejectionReason}</div>}<div className="flex flex-wrap gap-2">{claim.status === "Draft" && <Button size="sm" onClick={() => openAction(claim, "submit")}>Submit</Button>}{claim.status === "Rejected" && <Button size="sm" onClick={() => openAction(claim, "resubmit")}><RefreshCw className="mr-2 h-4 w-4" />Resubmit</Button>}{["Submitted", "Resubmitted"].includes(claim.status) && <><Button size="sm" onClick={() => openAction(claim, "approve")}>Approve</Button><Button size="sm" variant="destructive" onClick={() => openAction(claim, "reject")}>Reject</Button></>}{claim.status === "Approved" && <Button size="sm" onClick={() => openAction(claim, "mark-paid")}>Mark paid</Button>}<Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button></div></CardContent></Card>)}</div></TabsContent>

        <TabsContent value="authorizations" className="space-y-4 pt-4"><div className="flex justify-end"><Button onClick={() => openCreate("authorization")}><Plus className="mr-2 h-4 w-4" />Approval request</Button></div><div className="grid gap-4 lg:grid-cols-2">{data.authorizations.map((auth: any) => <Card key={auth.id}><CardHeader><div className="flex justify-between"><div><CardTitle>{auth.patientName}</CardTitle><CardDescription className="mt-1 font-mono">{auth.authorizationNumber} • {auth.companyName}</CardDescription></div><Status status={auth.status} /></div></CardHeader><CardContent className="space-y-4"><p className="font-bold">{auth.serviceType}</p><div className="grid grid-cols-2 gap-2"><MoneyBox label="Requested" value={money(auth.requestedAmountCents)} /><MoneyBox label="Approved" value={money(auth.approvedAmountCents)} /></div>{auth.rejectionReason && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{auth.rejectionReason}</p>}{auth.status === "Pending" && <div className="flex gap-2"><Button onClick={() => openAction(auth, "approve")}>Approve</Button><Button variant="destructive" onClick={() => openAction(auth, "reject")}>Reject</Button></div>}</CardContent></Card>)}</div></TabsContent>

        <TabsContent value="policies" className="space-y-4 pt-4"><div className="flex justify-end"><Button onClick={() => openCreate("policy")}><Plus className="mr-2 h-4 w-4" />Patient policy</Button></div><div className="grid gap-4 lg:grid-cols-2">{data.policies.map((policy: any) => <Card key={policy.id}><CardHeader><div className="flex justify-between"><div><CardTitle>{policy.patientName}</CardTitle><CardDescription>{policy.patientMrn} • {policy.policyNumber}</CardDescription></div><Status status={policy.status} /></div></CardHeader><CardContent className="space-y-3"><p className="font-black text-violet-700 dark:text-violet-300">{policy.companyName} • {policy.planName}</p><div className="grid grid-cols-3 gap-2"><MoneyBox label="Coverage" value={`${policy.coveragePercent}%`} /><MoneyBox label="Co-pay" value={money(policy.coPaymentCents)} /><MoneyBox label="Valid until" value={new Date(policy.coverageEnd).toLocaleDateString()} /></div><Badge variant="success">Eligibility verified</Badge></CardContent></Card>)}</div></TabsContent>

        <TabsContent value="payers" className="space-y-5 pt-4"><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => openCreate("plan")}>Add plan</Button><Button onClick={() => openCreate("company")}><Plus className="mr-2 h-4 w-4" />Insurance company</Button></div><div className="grid gap-4 lg:grid-cols-3">{data.companies.map((company: any) => <Card key={company.id}><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-violet-600" />{company.name}</CardTitle><CardDescription>{company.payerCode} • {company.companyType}</CardDescription></CardHeader><CardContent className="text-xs"><p>{company.electronicPayerId}</p><p className="mt-2 text-slate-500">{company.email} • {company.phone}</p></CardContent></Card>)}</div><div className="grid gap-4 lg:grid-cols-3">{data.plans.map((plan: any) => <Card key={plan.id}><CardContent className="space-y-3 p-5"><div className="flex justify-between"><p className="font-black">{plan.name}</p><Badge>{plan.networkTier}</Badge></div><div className="grid grid-cols-2 gap-2"><MoneyBox label="Coverage" value={`${plan.defaultCoveragePercent}%`} /><MoneyBox label="Default co-pay" value={money(plan.defaultCoPaymentCents)} /></div></CardContent></Card>)}</div></TabsContent>

        <TabsContent value="invoices" className="pt-4"><div className="overflow-hidden rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900"><table className="w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="p-3">Invoice</th><th>Total</th><th>Insurance due</th><th>Patient co-pay</th><th>Status</th><th className="print:hidden">Report</th></tr></thead><tbody>{data.invoices.map((invoice: any) => <tr key={invoice.id} className="border-t dark:border-slate-800"><td className="p-3 font-mono font-black">{invoice.invoiceNumber}</td><td>{money(invoice.totalAmountCents)}</td><td>{money(invoice.insuranceDueCents)}</td><td>{money(invoice.patientCoPaymentCents)}</td><td><Status status={invoice.status} /></td><td className="print:hidden"><Button size="sm" variant="outline" onClick={() => window.print()}><FileDown className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div></TabsContent>

        <TabsContent value="rules" className="space-y-4 pt-4"><div className="grid gap-4 lg:grid-cols-2">{data.billingRules.map((rule: any) => <Card key={rule.id}><CardContent className="space-y-4 p-5"><div className="flex justify-between"><div><p className="font-black">{rule.ruleName}</p><p className="mt-1 font-mono text-xs text-slate-500">{rule.serviceCategory} • {rule.procedureCodePattern}</p></div><Badge variant={rule.requiresAuthorization ? "warning" : "success"}>{rule.requiresAuthorization ? "Pre-auth" : "Auto covered"}</Badge></div><div className="grid grid-cols-3 gap-2"><MoneyBox label="Coverage" value={`${rule.coveragePercent}%`} /><MoneyBox label="Co-pay" value={money(rule.patientCoPaymentCents)} /><MoneyBox label="Max" value={rule.maxCoveredAmountCents ? money(rule.maxCoveredAmountCents) : "No cap"} /></div></CardContent></Card>)}</div></TabsContent>

        <TabsContent value="reports" className="space-y-6 pt-4"><Card><CardHeader><div className="flex justify-between"><div><CardTitle>Insurance performance report</CardTitle><CardDescription>Current revenue-cycle snapshot across active payer submissions.</CardDescription></div><div className="flex gap-2 print:hidden"><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button><Button onClick={() => window.print()}><FileDown className="mr-2 h-4 w-4" />PDF</Button></div></div></CardHeader><CardContent className="space-y-5"><ReportBar label="Approved / paid" value={approvedTotal} max={Math.max(submittedTotal, 1)} color="bg-emerald-500" money={money} /><ReportBar label="Patient responsibility" value={copayTotal} max={Math.max(submittedTotal, 1)} color="bg-cyan-500" money={money} /><ReportBar label="Rejected amount" value={rejected.reduce((s: number, c: any) => s + c.totalAmountCents, 0)} max={Math.max(submittedTotal, 1)} color="bg-rose-500" money={money} /></CardContent></Card></TabsContent>
      </Tabs>

      <Dialog open={entityType !== null} onOpenChange={() => setEntityType(null)}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Create {entityType}</DialogTitle><DialogDescription>Add a dynamic revenue-cycle record to the tenant-isolated payer workflow.</DialogDescription></DialogHeader><form onSubmit={create} className="space-y-4">{entityType === "company" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Company name" value={form.name} set={(v) => setForm({ ...form, name: v })} /><Field label="Payer code" value={form.payerCode} set={(v) => setForm({ ...form, payerCode: v })} /><Field label="Electronic payer ID" value={form.electronicPayerId} set={(v) => setForm({ ...form, electronicPayerId: v })} /><Field label="Claims email" value={form.email} set={(v) => setForm({ ...form, email: v })} /></div>}{entityType === "plan" && <div className="grid gap-4 sm:grid-cols-2"><Select label="Insurance company" value={form.insuranceCompanyId} onChange={(v) => setForm({ ...form, insuranceCompanyId: v })} options={data.companies.map((x: any) => [x.id, x.name])} /><Field label="Plan name" value={form.name} set={(v) => setForm({ ...form, name: v })} /><Field label="Plan code" value={form.planCode} set={(v) => setForm({ ...form, planCode: v })} /><Field label="Network tier" value={form.networkTier} set={(v) => setForm({ ...form, networkTier: v })} /><Field label="Coverage %" value={String(form.defaultCoveragePercent)} set={(v) => setForm({ ...form, defaultCoveragePercent: Number(v) })} type="number" /><Field label="Co-pay (cents)" value={String(form.defaultCoPaymentCents)} set={(v) => setForm({ ...form, defaultCoPaymentCents: Number(v) })} type="number" /></div>}{entityType === "policy" && <div className="grid gap-4 sm:grid-cols-2"><Select label="Patient" value={form.patientId} onChange={(v) => { const patient = data.patients.find((x: any) => x.id === v); setForm({ ...form, patientId: v, holderName: patient?.fullName || "" }); }} options={data.patients.map((x: any) => [x.id, x.fullName])} /><Select label="Company" value={form.insuranceCompanyId} onChange={(v) => setForm({ ...form, insuranceCompanyId: v })} options={data.companies.map((x: any) => [x.id, x.name])} /><Select label="Plan" value={form.insurancePlanId} onChange={(v) => setForm({ ...form, insurancePlanId: v })} options={data.plans.map((x: any) => [x.id, x.name])} /><Field label="Policy number" value={form.policyNumber} set={(v) => setForm({ ...form, policyNumber: v })} /><Field label="Member ID" value={form.memberId} set={(v) => setForm({ ...form, memberId: v })} /><Field label="Holder name" value={form.holderName} set={(v) => setForm({ ...form, holderName: v })} /><Field label="Coverage start" value={form.coverageStart} set={(v) => setForm({ ...form, coverageStart: v })} type="date" /><Field label="Coverage end" value={form.coverageEnd} set={(v) => setForm({ ...form, coverageEnd: v })} type="date" /></div>}{entityType === "authorization" && <div className="grid gap-4 sm:grid-cols-2"><Select label="Patient policy" value={form.patientPolicyId} onChange={(v) => { const p = data.policies.find((x: any) => x.id === v); setForm({ ...form, patientPolicyId: v, patientId: p?.patientId }); }} options={data.policies.map((x: any) => [x.id, `${x.patientName} • ${x.companyName}`])} /><Field label="Service type" value={form.serviceType} set={(v) => setForm({ ...form, serviceType: v })} /><Field label="Requested amount (cents)" value={String(form.requestedAmountCents)} set={(v) => setForm({ ...form, requestedAmountCents: Number(v) })} type="number" /><Field label="Expires" value={form.expiresAt} set={(v) => setForm({ ...form, expiresAt: v })} type="date" /></div>}{entityType === "claim" && <div className="space-y-4"><Select label="Patient policy" value={form.patientPolicyId} onChange={(v) => setForm({ ...form, patientPolicyId: v })} options={data.policies.map((x: any) => [x.id, `${x.patientName} • ${x.planName}`])} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Service code" value={form.items?.[0]?.serviceCode} set={(v) => setForm({ ...form, items: [{ ...form.items[0], serviceCode: v }] })} /><Field label="Description" value={form.items?.[0]?.description} set={(v) => setForm({ ...form, items: [{ ...form.items[0], description: v }] })} /><Field label="Quantity" value={String(form.items?.[0]?.quantity)} set={(v) => setForm({ ...form, items: [{ ...form.items[0], quantity: Number(v) }] })} type="number" /><Field label="Unit price (cents)" value={String(form.items?.[0]?.unitPriceCents)} set={(v) => setForm({ ...form, items: [{ ...form.items[0], unitPriceCents: Number(v) }] })} type="number" /></div><Field label="Supporting attachment URL" value={form.attachmentUrl} set={(v) => setForm({ ...form, attachmentUrl: v })} /></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setEntityType(null)}>Cancel</Button><Button disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save record"}</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={actionTarget !== null} onOpenChange={() => setActionTarget(null)}><DialogContent><DialogHeader><DialogTitle>{actionType} {actionTarget?.authorizationNumber ? "authorization" : "claim"}</DialogTitle><DialogDescription>Record a payer decision with a complete audit trail.</DialogDescription></DialogHeader><div className="space-y-4">{["approve"].includes(actionType) && <Field label="Approved amount (cents)" value={decision.approvedAmountCents} set={(v) => setDecision({ ...decision, approvedAmountCents: v })} type="number" />}{actionTarget?.authorizationNumber && <Field label="External payer reference" value={decision.externalReference} set={(v) => setDecision({ ...decision, externalReference: v })} />}{["reject"].includes(actionType) && <><Field label="Rejection code" value={decision.rejectionCode} set={(v) => setDecision({ ...decision, rejectionCode: v })} /><div><Label className="text-xs font-bold">Rejection reason</Label><textarea rows={3} value={decision.rejectionReason} onChange={(e) => setDecision({ ...decision, rejectionReason: e.target.value })} className="mt-1 w-full rounded-xl border bg-transparent p-3 text-xs dark:border-slate-700" /></div></>}</div><DialogFooter><Button variant="outline" onClick={() => setActionTarget(null)}>Cancel</Button><Button onClick={transition} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm transition"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Metric({ label, value, icon: Icon, color }: any) { return <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div><Icon className={`h-8 w-8 ${color}`} /></CardContent></Card>; }
function Status({ status }: { status: string }) { const variant = ["Approved", "Paid", "Active"].includes(status) ? "success" : status === "Rejected" ? "destructive" : ["Pending", "Open", "Submitted", "Resubmitted"].includes(status) ? "warning" : "secondary"; return <Badge variant={variant as any}>{status}</Badge>; }
function MoneyBox({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800"><p className="text-[9px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>; }
function Field({ label, value, set, type = "text" }: { label: string; value: string; set: (v: string) => void; type?: string }) { return <div><Label className="text-xs font-bold">{label}</Label><Input type={type} className="mt-1" value={value || ""} onChange={(e) => set(e.target.value)} /></div>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) { return <div><Label className="text-xs font-bold">{label}</Label><select className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([id, text]) => <option key={`${label}-${id}`} value={id}>{text}</option>)}</select></div>; }
function ReportBar({ label, value, max, color, money }: any) { const pct = Math.min(100, Math.round(value / max * 100)); return <div><div className="flex justify-between text-xs font-black"><span>{label}</span><span>{money(value)} • {pct}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full ${color}`} style={{ width: `${pct}%` }} /></div></div>; }
