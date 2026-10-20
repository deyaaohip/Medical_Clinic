"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type FinanceDraft = {
  patientId: string;
  branchId: string;
  invoiceId: string;
  subtotalCents: number;
  discountCents: number;
  taxPercent: number;
  insuranceCoveredCents: number;
  method: string;
  amountCents: number;
};

type Patient = { id: string; fullName: string };
type Branch = { id: string; name: string };
type Invoice = { id: string; invoiceNumber: string; patientName?: string | null };

const selectClass =
  "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Shared invoice / payment entry dialog for the finance module. */
export function FinanceEntryDialog({
  mode,
  onClose,
  patients,
  branches,
  invoices,
  onSubmit,
}: {
  mode: "invoice" | "payment" | null;
  onClose: () => void;
  patients: Patient[];
  branches: Branch[];
  invoices: Invoice[];
  onSubmit: (mode: "invoice" | "payment", draft: FinanceDraft) => void;
}) {
  const isInvoice = mode === "invoice";

  const buildDraft = React.useCallback(
    (): FinanceDraft => ({
      patientId: patients[0]?.id ?? "",
      branchId: branches[0]?.id ?? "",
      invoiceId: invoices[0]?.id ?? "",
      subtotalCents: 25000,
      discountCents: 1000,
      taxPercent: 5,
      insuranceCoveredCents: 5000,
      method: "Cash",
      amountCents: 19000,
    }),
    [patients, branches, invoices]
  );

  const [draft, setDraft] = React.useState<FinanceDraft>(buildDraft);

  React.useEffect(() => {
    if (mode) setDraft(buildDraft());
  }, [mode, buildDraft]);

  const numericFields: { key: keyof FinanceDraft; label: string }[] = [
    { key: "subtotalCents", label: "Subtotal (cents)" },
    { key: "discountCents", label: "Discount (cents)" },
    { key: "taxPercent", label: "Tax (%)" },
    { key: "insuranceCoveredCents", label: "Insurance covered (cents)" },
  ];

  return (
    <Dialog open={!!mode} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            {isInvoice ? "Create invoice" : "Record payment"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (mode) onSubmit(mode, draft);
          }}
          className="my-2 space-y-3"
        >
          {isInvoice ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Patient</Label>
                <select
                  className={selectClass}
                  value={draft.patientId}
                  onChange={(event) => setDraft({ ...draft, patientId: event.target.value })}
                >
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Facility branch</Label>
                <select
                  className={selectClass}
                  value={draft.branchId}
                  onChange={(event) => setDraft({ ...draft, branchId: event.target.value })}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {numericFields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs font-medium">{field.label}</Label>
                    <Input
                      type="number"
                      className="font-mono text-xs"
                      value={draft[field.key] as number}
                      onChange={(event) =>
                        setDraft({ ...draft, [field.key]: Number(event.target.value) })
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Invoice</Label>
                <select
                  className={selectClass}
                  value={draft.invoiceId}
                  onChange={(event) => setDraft({ ...draft, invoiceId: event.target.value })}
                >
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} — {invoice.patientName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Method</Label>
                <select
                  className={selectClass}
                  value={draft.method}
                  onChange={(event) => setDraft({ ...draft, method: event.target.value })}
                >
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Insurance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Amount (cents)</Label>
                <Input
                  type="number"
                  className="font-mono text-xs"
                  value={draft.amountCents}
                  onChange={(event) => setDraft({ ...draft, amountCents: Number(event.target.value) })}
                />
              </div>
            </>
          )}

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-teal-600 px-6 font-semibold hover:bg-teal-700">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
