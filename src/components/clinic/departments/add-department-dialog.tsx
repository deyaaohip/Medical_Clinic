"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DepartmentDraft = {
  name: string;
  code: string;
  description: string;
  branchId: string;
};

type Branch = { id: string; name: string };

/** Dialog that classifies a new clinical department against a facility branch. */
export function AddDepartmentDialog({
  open,
  onOpenChange,
  branches,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  submitting: boolean;
  onSubmit: (draft: DepartmentDraft) => void;
}) {
  const buildDraft = React.useCallback(
    (): DepartmentDraft => ({
      name: "",
      code: "GEN-01",
      description: "",
      branchId: branches[0]?.id ?? "",
    }),
    [branches]
  );

  const [draft, setDraft] = React.useState<DepartmentDraft>(buildDraft);

  React.useEffect(() => {
    if (open) setDraft(buildDraft());
  }, [open, buildDraft]);

  const selectClass =
    "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            Add clinical department
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs font-medium text-slate-500">
            Classify practice modules, lab orders, and billing codes.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
          className="my-2 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="dName" className="text-xs font-medium">
              Department name
            </Label>
            <Input
              id="dName"
              required
              placeholder="e.g. Outpatient Day Surgery"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dCode" className="text-xs font-medium">
                ICD code prefix
              </Label>
              <Input
                id="dCode"
                required
                placeholder="e.g. SURG-01"
                value={draft.code}
                onChange={(event) => setDraft((prev) => ({ ...prev, code: event.target.value }))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dBranch" className="text-xs font-medium">
                Facility branch
              </Label>
              <select
                id="dBranch"
                value={draft.branchId}
                onChange={(event) => setDraft((prev) => ({ ...prev, branchId: event.target.value }))}
                className={selectClass}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dDesc" className="text-xs font-medium">
              Scope description
            </Label>
            <textarea
              id="dDesc"
              rows={3}
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-teal-600 px-6 font-semibold hover:bg-teal-700"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enforce classification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
