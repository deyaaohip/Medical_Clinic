"use client";

import * as React from "react";
import { BarChart3, CreditCard, DollarSign, Plus, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/clinic/ui/page-shell";
import { PageHeader } from "@/components/clinic/ui/page-header";
import { StatCard } from "@/components/clinic/ui/stat-card";
import { LoadingBlock } from "@/components/clinic/ui/state-blocks";
import { InvoiceList, ReceiptList } from "@/components/clinic/finance/finance-panels";
import { FinanceEntryDialog, type FinanceDraft } from "@/components/clinic/finance/finance-entry-dialog";

export default function FinancePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [metrics, setMetrics] = React.useState<any>({});
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [branches, setBranches] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modal, setModal] = React.useState<"invoice" | "payment" | null>(null);

  React.useEffect(() => {
    params.then((p) => setTenantId(p.tenantId));
  }, [params]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [m, inv, pay, pat, ov] = await Promise.all([
      fetch(`/api/operations/${tenantId}/finance-dashboard`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/invoices`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/payments`).then((r) => r.json()),
      fetch(`/api/clinic/${tenantId}/patients`).then((r) => r.json()),
      fetch(`/api/clinic/${tenantId}/overview`).then((r) => r.json()),
    ]);
    if (m.success) setMetrics(m.metrics);
    if (inv.success) setInvoices(inv.data || []);
    if (pay.success) setPayments(pay.data || []);
    if (pat.success) setPatients(pat.data || []);
    if (ov.success) setBranches(ov.branches || []);
    setLoading(false);
  }, [tenantId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function submit(mode: "invoice" | "payment", draft: FinanceDraft) {
    const url =
      mode === "invoice"
        ? `/api/operations/${tenantId}/invoices`
        : `/api/operations/${tenantId}/payments`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (data.success) {
      setModal(null);
      load();
      alert(
        mode === "invoice"
          ? "Invoice created with tax, discount and insurance split."
          : "Payment receipt generated."
      );
    } else {
      alert(data.error);
    }
  }

  const summary = [
    { label: "Revenue", value: `$${metrics.revenueUsd || 0}`, icon: DollarSign, tone: "teal" as const },
    { label: "Outstanding", value: `$${metrics.outstandingUsd || 0}`, icon: Wallet, tone: "amber" as const },
    { label: "Payments", value: `$${metrics.paymentsUsd || 0}`, icon: Receipt, tone: "emerald" as const },
    { label: "Invoices", value: metrics.invoiceCount || 0, icon: BarChart3, tone: "cyan" as const },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={CreditCard}
        eyebrow="Revenue cycle"
        title="Financial module"
        description="Invoices, payments, receipts, refunds, discounts, taxes, insurance billing and accounting exports."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 px-4 text-xs font-medium" onClick={() => setModal("payment")}>
              <Receipt className="h-3.5 w-3.5" />
              Record payment
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-teal-600 px-4 text-xs font-semibold shadow-sm hover:bg-teal-700"
              onClick={() => setModal("invoice")}
            >
              <Plus className="h-4 w-4" />
              New invoice
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} tone={item.tone} />
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Loading revenue cycle" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InvoiceList invoices={invoices} />
          </div>
          <ReceiptList payments={payments} />
        </div>
      )}

      <FinanceEntryDialog
        mode={modal}
        onClose={() => setModal(null)}
        patients={patients}
        branches={branches}
        invoices={invoices}
        onSubmit={submit}
      />
    </PageShell>
  );
}
