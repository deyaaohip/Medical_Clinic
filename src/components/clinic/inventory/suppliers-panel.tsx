import * as React from "react";
import { Truck, Warehouse } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Named = { id: string; name: string };

/** Suppliers and warehouses side panel. */
export function SuppliersPanel({
  suppliers,
  warehouses,
}: {
  suppliers: Named[];
  warehouses: Named[];
}) {
  const group = (title: string, icon: React.ElementType, rows: Named[]) => {
    const Icon = icon;
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{title}</p>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 p-3 text-[11px] font-medium text-slate-500 dark:border-slate-700">
            None registered yet.
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200/80 p-2.5 text-xs font-medium dark:border-slate-800"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="truncate text-slate-700 dark:text-slate-300">{row.name}</span>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Suppliers & warehouses</CardTitle>
        <CardDescription className="text-xs font-medium">Procurement network for this tenant.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {group("Suppliers", Truck, suppliers)}
        {group("Warehouses", Warehouse, warehouses)}
      </CardContent>
    </Card>
  );
}
