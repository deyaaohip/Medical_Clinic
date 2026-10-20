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

export type RoomDraft = {
  roomNumber: string;
  name: string;
  type: string;
  departmentId: string;
  branchId: string;
};

type Branch = { id: string; name: string };
type Department = { id: string; name: string };

/** Dialog that commissions a physical suite room inside a department. */
export function AddRoomDialog({
  open,
  onOpenChange,
  branches,
  departments,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  departments: Department[];
  submitting: boolean;
  onSubmit: (draft: RoomDraft) => void;
}) {
  const buildDraft = React.useCallback(
    (): RoomDraft => ({
      roomNumber: "",
      name: "",
      type: "Consultation",
      departmentId: departments[0]?.id ?? "",
      branchId: branches[0]?.id ?? "",
    }),
    [branches, departments]
  );

  const [draft, setDraft] = React.useState<RoomDraft>(buildDraft);

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
            Commission suite room
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs font-medium text-slate-500">
            Add a consultation room, radiology suite, or sterile surgical box.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft);
          }}
          className="my-2 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rNum" className="text-xs font-medium">
                Suite number
              </Label>
              <Input
                id="rNum"
                required
                placeholder="e.g. 104-B"
                value={draft.roomNumber}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, roomNumber: event.target.value }))
                }
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rType" className="text-xs font-medium">
                Suite category
              </Label>
              <select
                id="rType"
                value={draft.type}
                onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))}
                className={selectClass}
              >
                <option value="Consultation">Consultation box</option>
                <option value="Surgery">Sterile surgery</option>
                <option value="Radiology">Radiology / MRI</option>
                <option value="Laboratory">Laboratory hub</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rName" className="text-xs font-medium">
              Suite title
            </Label>
            <Input
              id="rName"
              required
              placeholder="e.g. Advanced Echocardiography Box B"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rDept" className="text-xs font-medium">
              Target department
            </Label>
            <select
              id="rDept"
              value={draft.departmentId}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, departmentId: event.target.value }))
              }
              className={selectClass}
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
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
              className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 font-semibold hover:from-teal-700 hover:to-emerald-700"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commission suite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
