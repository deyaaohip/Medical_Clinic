"use client";

import * as React from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { QueueItem } from "./next-patient-banner";

/** WhatsApp / SMS dispatch dialog for a queued patient. */
export function QueueReminderDialog({
  open,
  onOpenChange,
  target,
  message,
  onMessageChange,
  sending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: QueueItem | null;
  message: string;
  onMessageChange: (value: string) => void;
  sending: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <MessageSquare className="h-4 w-4 text-teal-600" />
            Dispatch queue reminder
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs font-medium text-slate-500">
            Review or customise the bilingual message before it is sent to the patient.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="my-2 space-y-4"
        >
          {target ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 font-mono text-xs font-medium text-teal-900 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200">
              Target relay #{target.queueNumber} • {target.patientFullName}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="remMsg" className="text-xs font-medium">
              Message
            </Label>
            <textarea
              id="remMsg"
              rows={4}
              required
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 font-mono text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 bg-emerald-600 px-6 font-semibold hover:bg-emerald-700"
              disabled={sending}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
