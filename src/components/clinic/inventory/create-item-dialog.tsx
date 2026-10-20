"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type StockDraft = {
  itemType: string;
  name: string;
  sku: string;
  unit: string;
  lowStockThreshold: number;
};

const selectClass =
  "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Dialog that registers a new stock item with barcode/QR generation. */
export function CreateItemDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: StockDraft) => void;
}) {
  const buildDraft = (): StockDraft => ({
    itemType: "Medicine",
    name: "Insulin Glargine",
    sku: "MED-INS-001",
    unit: "pen",
    lowStockThreshold: 15,
  });

  const [draft, setDraft] = React.useState<StockDraft>(buildDraft);

  React.useEffect(() => {
    if (open) setDraft(buildDraft());
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">Create inventory item</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
          className="my-2 space-y-3"
        >
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Item type</Label>
            <select
              value={draft.itemType}
              onChange={(event) => setDraft({ ...draft, itemType: event.target.value })}
              className={selectClass}
            >
              <option>Medicine</option>
              <option>Medical Supply</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="itemName" className="text-xs font-medium">
              Name
            </Label>
            <Input
              id="itemName"
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="itemSku" className="text-xs font-medium">
                SKU
              </Label>
              <Input
                id="itemSku"
                required
                value={draft.sku}
                onChange={(event) => setDraft({ ...draft, sku: event.target.value })}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itemUnit" className="text-xs font-medium">
                Unit
              </Label>
              <Input
                id="itemUnit"
                required
                value={draft.unit}
                onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="itemThreshold" className="text-xs font-medium">
              Low stock threshold
            </Label>
            <Input
              id="itemThreshold"
              type="number"
              value={draft.lowStockThreshold}
              onChange={(event) =>
                setDraft({ ...draft, lowStockThreshold: Number(event.target.value) })
              }
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-teal-600 px-6 font-semibold hover:bg-teal-700">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
