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

export type StaffDraft = {
  fullName: string;
  email: string;
  staffType: string;
  specialization: string;
  licenseNumber: string;
  hourlyRateCents: number;
  branchId: string;
  bio: string;
};

type Branch = { id: string; name: string };

const selectClass =
  "flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/** Dialog that provisions a new clinical staff persona. */
export function AddStaffDialog({
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
  onSubmit: (draft: StaffDraft) => void;
}) {
  const buildDraft = React.useCallback(
    (): StaffDraft => ({
      fullName: "",
      email: "",
      staffType: "Doctor",
      specialization: "",
      licenseNumber: "",
      hourlyRateCents: 15000,
      branchId: branches[0]?.id ?? "",
      bio: "",
    }),
    [branches]
  );

  const [draft, setDraft] = React.useState<StaffDraft>(buildDraft);

  React.useEffect(() => {
    if (open) setDraft(buildDraft());
  }, [open, buildDraft]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">
            Provision staff profile
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs font-medium text-slate-500">
            Enrol a doctor, nurse or receptionist into this branch&apos;s secure tenant container.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
          className="my-2 max-h-[26rem] space-y-4 overflow-y-auto pe-1"
        >
          <div className="space-y-1.5">
            <Label htmlFor="staffFullName" className="text-xs font-medium">
              Full name
            </Label>
            <Input
              id="staffFullName"
              required
              placeholder="e.g. Dr. Jessica Sterling"
              value={draft.fullName}
              onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sRole" className="text-xs font-medium">
                Persona type
              </Label>
              <select
                id="sRole"
                value={draft.staffType}
                onChange={(event) => setDraft((prev) => ({ ...prev, staffType: event.target.value }))}
                className={selectClass}
              >
                <option value="Doctor">Doctor / Physician</option>
                <option value="Nurse">Nurse / Triage</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sBranch" className="text-xs font-medium">
                Posted facility
              </Label>
              <select
                id="sBranch"
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
            <Label htmlFor="sSpec" className="text-xs font-medium">
              Specialization
            </Label>
            <Input
              id="sSpec"
              placeholder="e.g. Outpatient day surgeon"
              value={draft.specialization}
              onChange={(event) => setDraft((prev) => ({ ...prev, specialization: event.target.value }))}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sLic" className="text-xs font-medium">
                License number
              </Label>
              <Input
                id="sLic"
                placeholder="e.g. DHA-9812-44"
                value={draft.licenseNumber}
                onChange={(event) => setDraft((prev) => ({ ...prev, licenseNumber: event.target.value }))}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sRate" className="text-xs font-medium">
                Hourly rate ($)
              </Label>
              <Input
                id="sRate"
                type="number"
                value={Math.round(draft.hourlyRateCents / 100)}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    hourlyRateCents: (parseFloat(event.target.value) || 0) * 100,
                  }))
                }
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sBio" className="text-xs font-medium">
              Bio & accreditations
            </Label>
            <textarea
              id="sBio"
              rows={3}
              value={draft.bio}
              onChange={(event) => setDraft((prev) => ({ ...prev, bio: event.target.value }))}
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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enrol profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
