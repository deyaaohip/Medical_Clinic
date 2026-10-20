"use client";

import * as React from "react";
import { Building2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Branch = { id: string; name: string };

/** Branch and milestone filters for the live triage queue. */
export function QueueToolbar({
  branches,
  selectedBranch,
  onBranchChange,
  statusFilter,
  onStatusChange,
}: {
  branches: Branch[];
  selectedBranch: string;
  onBranchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}) {
  const triggerClass = "h-9 gap-1.5 bg-slate-50 px-3 text-xs font-medium dark:bg-slate-800";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={triggerClass}>
            <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {selectedBranch === "all"
                ? "All branches"
                : branches.find((branch) => branch.id === selectedBranch)?.name || "Facility"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2">
          <DropdownMenuLabel className="text-xs">Filter operating facility</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onBranchChange("all")} className="cursor-pointer text-xs font-medium">
            All branches ({branches.length})
          </DropdownMenuItem>
          {branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => onBranchChange(branch.id)}
              className="cursor-pointer text-xs font-medium"
            >
              {branch.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={triggerClass}>
            <Filter className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>{statusFilter === "all" ? "All states" : statusFilter}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52 p-2">
          <DropdownMenuLabel className="text-xs">Filter milestone state</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStatusChange("all")} className="cursor-pointer text-xs font-medium">
            All patients
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("Waiting")} className="cursor-pointer text-xs font-medium">
            Waiting in lobby
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("Called")} className="cursor-pointer text-xs font-medium">
            Called to room
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("InRoom")} className="cursor-pointer text-xs font-medium">
            In room / active
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("Completed")} className="cursor-pointer text-xs font-medium">
            Completed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
