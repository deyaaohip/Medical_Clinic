import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PurchaseOrder = { id: string; poNumber: string; status?: string | null; totalCents?: number };
type Transfer = { id: string; quantity: number; status?: string | null };

/** Purchase orders and warehouse transfers in one panel. */
export function OrdersPanel({
  purchaseOrders,
  transfers,
}: {
  purchaseOrders: PurchaseOrder[];
  transfers: Transfer[];
}) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Purchase orders & transfers</CardTitle>
        <CardDescription className="text-xs font-medium">Accounting-ready inventory movement.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Purchase orders
          </p>
          {purchaseOrders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-3 text-[11px] font-medium text-slate-500 dark:border-slate-700">
              No purchase orders yet.
            </p>
          ) : (
            purchaseOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 p-3 text-xs dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono font-semibold text-slate-900 dark:text-slate-50">{order.poNumber}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{order.status}</p>
                </div>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  ${((order.totalCents ?? 0) / 100).toFixed(0)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Transfers</p>
          {transfers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 p-3 text-[11px] font-medium text-slate-500 dark:border-slate-700">
              No transfers recorded.
            </p>
          ) : (
            transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 p-3 text-xs dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Warehouse transfer</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{transfer.status}</p>
                </div>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {transfer.quantity} units
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
