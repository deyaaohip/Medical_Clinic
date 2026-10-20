import * as React from "react";
import { AlertTriangle, Barcode, Package, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type StockRecord = {
  id: string;
  name: string;
  sku?: string | null;
  itemType?: string | null;
  unit?: string | null;
  totalQuantity: number;
  lowStockThreshold: number;
  barcode?: string | null;
  qrCode?: string | null;
  batches?: { id: string; batchNumber: string }[];
};

/** Stock ledger with batch numbers, barcode/QR and low-stock warnings. */
export function StockList({ stock }: { stock: StockRecord[] }) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Stock & batch numbers</CardTitle>
        <CardDescription className="text-xs font-medium">
          Scan-ready identifiers for medicines and medical supplies.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {stock.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
            <Package className="h-6 w-6 text-slate-400" />
            <p className="mt-2 text-xs font-medium text-slate-500">No stock items match this search.</p>
          </div>
        ) : (
          stock.map((item) => {
            const isLow = item.totalQuantity <= item.lowStockThreshold;
            return (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200/80 p-4 transition-colors hover:border-teal-300 dark:border-slate-800 dark:hover:border-teal-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {item.sku} • {item.itemType}
                    </p>
                  </div>
                  <Badge variant={isLow ? "destructive" : "success"} className="shrink-0 text-[10px] font-semibold tabular-nums">
                    {item.totalQuantity} {item.unit}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="gap-1 font-mono text-[10px] font-medium">
                    <Barcode className="h-3 w-3" />
                    {item.barcode}
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-mono text-[10px] font-medium">
                    <QrCode className="h-3 w-3" />
                    {item.qrCode}
                  </Badge>
                  {item.batches?.map((batch) => (
                    <Badge key={batch.id} variant="secondary" className="text-[10px] font-medium">
                      Batch {batch.batchNumber}
                    </Badge>
                  ))}
                </div>

                {isLow ? (
                  <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Low stock — reorder required.
                  </p>
                ) : null}
              </article>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
