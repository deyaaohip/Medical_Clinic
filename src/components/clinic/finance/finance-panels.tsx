import * as React from "react";
import { Download, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type InvoiceRecord = {
  id: string;
  patientName?: string | null;
  invoiceNumber?: string | null;
  branchName?: string | null;
  status?: string | null;
  totalCents?: number;
  taxCents?: number;
  insuranceCoveredCents?: number;
  outstandingBalanceCents?: number;
};

const statusTone: Record<string, "success" | "warning" | "secondary"> = {
  Paid: "success",
  Partial: "warning",
};

/** Invoice ledger with the money split that matters at the front desk. */
export function InvoiceList({ invoices }: { invoices: InvoiceRecord[] }) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Invoices & outstanding balance</CardTitle>
        <CardDescription className="text-xs font-medium">
          Tax, insurance cover and patient due per invoice.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {invoices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs font-medium text-slate-500 dark:border-slate-700">
            No invoices issued yet.
          </p>
        ) : (
          invoices.map((invoice) => (
            <article
              key={invoice.id}
              className="rounded-xl border border-slate-200/80 p-4 transition-colors hover:border-teal-300 dark:border-slate-800 dark:hover:border-teal-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {invoice.patientName}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {invoice.invoiceNumber} • {invoice.branchName}
                  </p>
                </div>
                <Badge variant={statusTone[invoice.status ?? ""] ?? "secondary"} className="shrink-0 text-[10px] font-medium">
                  {invoice.status}
                </Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-[11px] sm:grid-cols-4 dark:bg-slate-800/40">
                <div>
                  <dt className="font-medium text-slate-400">Total</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    ${((invoice.totalCents ?? 0) / 100).toFixed(0)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-400">Tax</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    ${((invoice.taxCents ?? 0) / 100).toFixed(0)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-400">Insurance</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    ${((invoice.insuranceCoveredCents ?? 0) / 100).toFixed(0)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-400">Due</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-teal-700 dark:text-teal-400">
                    ${((invoice.outstandingBalanceCents ?? 0) / 100).toFixed(0)}
                  </dd>
                </div>
              </dl>

              <Button variant="outline" size="sm" className="mt-3 h-8 gap-1.5 text-xs font-medium">
                <Download className="h-3.5 w-3.5" />
                Accounting export
              </Button>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ReceiptList({ payments }: { payments: any[] }) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <ReceiptText className="h-4 w-4 text-teal-600" />
          Receipts
        </CardTitle>
        <CardDescription className="text-xs font-medium">Collected payments by method.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        {payments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-medium text-slate-500 dark:border-slate-700">
            No payments recorded yet.
          </p>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 p-3 text-xs dark:border-slate-800"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 dark:text-slate-50">{payment.receiptNumber}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{payment.method}</p>
              </div>
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                ${((payment.amountCents ?? 0) / 100).toFixed(0)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
