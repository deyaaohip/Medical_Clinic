"use client";

import * as React from "react";
import { Building2, Filter, Search } from "lucide-react";
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

/** Search + branch + persona filters for the staff directory. */
export function StaffToolbar({
  searchQuery,
  onSearchChange,
  branches,
  selectedBranch,
  onBranchChange,
  selectedStaffType,
  onStaffTypeChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  branches: Branch[];
  selectedBranch: string;
  onBranchChange: (value: string) => void;
  selectedStaffType: string;
  onStaffTypeChange: (value: string) => void;
}) {
  const triggerClass =
    "h-9 gap-1.5 bg-slate-50 px-3 text-xs font-medium dark:bg-slate-800";

  return (
    <>
      <div className="relative w-full sm:w-72">
        <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search name, specialization, license..."
          className="h-9 w-full rounded-lg border border-slate-300 bg-white py-2 ps-9 pe-3 text-xs font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

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
          <DropdownMenuLabel className="text-xs">Filter by operating branch</DropdownMenuLabel>
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
            <span>{selectedStaffType === "all" ? "All personas" : selectedStaffType}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 p-2">
          <DropdownMenuLabel className="text-xs">Filter persona type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onStaffTypeChange("all")} className="cursor-pointer text-xs font-medium">
            All personas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStaffTypeChange("Doctor")} className="cursor-pointer text-xs font-medium">
            Doctors / Physicians
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStaffTypeChange("Nurse")} className="cursor-pointer text-xs font-medium">
            Nurses / Triage staff
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onStaffTypeChange("Receptionist")}
            className="cursor-pointer text-xs font-medium"
          >
            Front desk reception
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
