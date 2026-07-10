"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, Plus, Trash2, RotateCcw, FileSpreadsheet, FileText, Download, Check } from "lucide-react";

export function SuperAdminToolbar({
  moduleName,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  showDeleted,
  onShowDeletedChange,
  selectedCount,
  onBulkSoftDelete,
  onBulkRestore,
  onOpenAddModal,
  onExportExcel,
  onExportPdf,
  currentLocale = "en",
}: {
  moduleName: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  showDeleted: boolean;
  onShowDeletedChange: (val: boolean) => void;
  selectedCount: number;
  onBulkSoftDelete?: () => void;
  onBulkRestore?: () => void;
  onOpenAddModal?: () => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  currentLocale?: "en" | "ar";
}) {
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const simulateDownload = (type: "excel" | "pdf") => {
    setDownloading(type);
    if (type === "excel" && onExportExcel) onExportExcel();
    if (type === "pdf" && onExportPdf) onExportPdf();
    setTimeout(() => {
      setDownloading(null);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
      {/* Search & Bulk Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64 md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={currentLocale === "ar" ? `بحث في سجلات ${moduleName}...` : `Search ${moduleName} data...`}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs font-semibold shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 rtl:pl-4 rtl:pr-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Dynamic Status Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-extrabold space-x-1.5 rtl:space-x-reverse bg-slate-50 dark:bg-slate-800">
              <Filter className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>{statusFilter === "all" ? (currentLocale === "ar" ? "كل الحالات" : "All Statuses") : statusFilter.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-2">
            <DropdownMenuLabel className="text-xs">{currentLocale === "ar" ? "تصفية حسب الحالة :" : "Filter Status:"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusFilterChange("all")} className="cursor-pointer text-xs font-bold">
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("active")} className="cursor-pointer text-xs font-bold">
              Active / Enabled
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("inactive")} className="cursor-pointer text-xs font-bold">
              Inactive / Disabled
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("open")} className="cursor-pointer text-xs font-bold">
              Open / Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange("paid")} className="cursor-pointer text-xs font-bold">
              Paid Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Soft Delete Switch */}
        <div className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-800 rtl:space-x-reverse">
          <Trash2 className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          <span>{currentLocale === "ar" ? "الأرشيف المحذوف" : "Trash DB"}</span>
          <Switch checked={showDeleted} onCheckedChange={onShowDeletedChange} className="scale-80 ml-1 rtl:ml-0 rtl:mr-1" />
        </div>

        {/* Bulk Action Buttons (Visible if checkboxes selected) */}
        {selectedCount > 0 && (
          <div className="flex items-center space-x-2 animate-in fade-in-0 slide-in-from-left-2 rtl:space-x-reverse bg-teal-50 dark:bg-teal-950/60 p-1 px-3 rounded-xl border border-teal-200 dark:border-teal-900">
            <span className="text-xs font-black text-teal-900 dark:text-teal-200">
              {currentLocale === "ar" ? `تم تحديد (${selectedCount}) :` : `${selectedCount} selected:`}
            </span>
            {onBulkSoftDelete && (
              <Button variant="destructive" size="sm" className="h-7 text-xs font-extrabold px-2.5" onClick={onBulkSoftDelete}>
                <Trash2 className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" />
                <span>{currentLocale === "ar" ? "حذف جماعي" : "Archive Bulk"}</span>
              </Button>
            )}
            {onBulkRestore && (
              <Button variant="default" size="sm" className="h-7 text-xs font-extrabold px-2.5 bg-emerald-600 hover:bg-emerald-700" onClick={onBulkRestore}>
                <RotateCcw className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" />
                <span>{currentLocale === "ar" ? "استعادة جماعية" : "Restore Bulk"}</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Primary Creations & Export Reports */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs font-extrabold space-x-1.5 rtl:space-x-reverse hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/60 dark:hover:text-teal-300"
          onClick={() => simulateDownload("excel")}
          disabled={downloading !== null}
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>{downloading === "excel" ? (currentLocale === "ar" ? "جاري التوليد..." : "Exporting...") : (currentLocale === "ar" ? "تصدير Excel" : "Export Excel")}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs font-extrabold space-x-1.5 rtl:space-x-reverse hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300"
          onClick={() => simulateDownload("pdf")}
          disabled={downloading !== null}
        >
          <FileText className="h-4 w-4 text-rose-600" />
          <span>{downloading === "pdf" ? (currentLocale === "ar" ? "جاري التوليد..." : "Exporting...") : (currentLocale === "ar" ? "تصدير PDF" : "Export PDF")}</span>
        </Button>

        {onOpenAddModal && (
          <Button
            variant="default"
            size="sm"
            className="h-9 px-4 text-xs font-black shadow-md space-x-1.5 rtl:space-x-reverse bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            onClick={onOpenAddModal}
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>{currentLocale === "ar" ? `إضافة ${moduleName} جديد` : `+ Add New ${moduleName}`}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
