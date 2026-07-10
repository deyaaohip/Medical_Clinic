"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, RotateCcw, Pencil, Eye, Check, X, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

export function SuperAdminDynamicTableView({
  moduleKey,
  data,
  selectedIds,
  onToggleSelectId,
  onSelectAll,
  onEdit,
  onSoftDelete,
  onRestore,
  page,
  totalPages,
  onPageChange,
  currentLocale = "en",
}: {
  moduleKey: string;
  data: any[];
  selectedIds: string[];
  onToggleSelectId: (id: string) => void;
  onSelectAll: (ids: string[], isAll: boolean) => void;
  onEdit?: (record: any) => void;
  onSoftDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  currentLocale?: "en" | "ar";
}) {
  const [inspectingJson, setInspectingJson] = React.useState<any | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mt-6">
        <span className="text-4xl">📭</span>
        <h3 className="mt-4 text-base font-black text-slate-800 dark:text-slate-100">
          {currentLocale === "ar" ? "لم يتم العثور على أي سجلات في هذه الوحدة" : "No records matching your active criteria"}
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          {currentLocale === "ar" ? "حاول تغيير كلمات البحث أو حالة التصفية أو أضف سجلاً جديداً من الزر بالأعلى." : "Try adjusting your search filters, or click '+ Add New' to provision new entities."}
        </p>
      </div>
    );
  }

  // Derive dynamic columns from the first object
  const rawKeys = Object.keys(data[0]).filter((k) => k !== "passwordHash" && k !== "secretHash");
  const isAllSelected = data.every((r) => selectedIds.includes(r.id || r.settingKey || r.templateKey || r.code));

  const handleSelectAllCheckbox = () => {
    const ids = data.map((r) => r.id || r.settingKey || r.templateKey || r.code);
    onSelectAll(ids, !isAllSelected);
  };

  const renderCellContent = (key: string, val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic text-[11px]">-</span>;

    if (typeof val === "boolean") {
      return (
        <Badge variant={val ? "success" : "secondary"} className="px-2 py-0 text-[10px] font-bold">
          {val ? (currentLocale === "ar" ? "نشط" : "Active") : (currentLocale === "ar" ? "معطل" : "Disabled")}
        </Badge>
      );
    }

    if (key === "status" || key === "level" || key === "type") {
      let v = "default";
      if (val === "paid" || val === "completed" || val === "success" || val === "info") v = "success";
      if (val === "warn" || val === "warning" || val === "open" || val === "In Progress") v = "warning";
      if (val === "error" || val === "failed" || val === "urgent" || val === "void") v = "destructive";
      return (
        <Badge variant={v as any} className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
          {val}
        </Badge>
      );
    }

    if (key.toLowerCase().includes("url") || key.toLowerCase().includes("link")) {
      return (
        <a
          href={val}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 hover:text-teal-700 font-bold flex items-center space-x-1 dark:text-teal-400 text-xs truncate max-w-[150px]"
        >
          <span className="truncate">{val}</span>
          <ExternalLink className="w-3 h-3 shrink-0 ml-1 rtl:ml-0 rtl:mr-1" />
        </a>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px] truncate">
          {val.slice(0, 3).map((item, i) => (
            <Badge key={i} variant="outline" className="px-1.5 py-0 text-[10px] bg-slate-50 dark:bg-slate-800 truncate max-w-[80px]">
              {item}
            </Badge>
          ))}
          {val.length > 3 && <span className="text-[10px] text-slate-500 font-bold">+{val.length - 3} more</span>}
        </div>
      );
    }

    if (typeof val === "object") {
      return (
        <Button variant="secondary" size="sm" className="h-6 px-2 text-[10px] font-extrabold" onClick={() => setInspectingJson(val)}>
          <Eye className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
          <span>{currentLocale === "ar" ? "عرض JSON" : "View JSON"}</span>
        </Button>
      );
    }

    if (key.toLowerCase().includes("at") || key.toLowerCase().includes("date")) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return <span className="text-[11px] text-slate-600 font-semibold dark:text-slate-300">{d.toISOString().split("T")[0]}</span>;
        }
      } catch (e) {}
    }

    if (typeof val === "number") {
      if (key.toLowerCase().includes("price") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("cost")) {
        return <span className="font-extrabold text-xs">${(val > 1000 ? val / 100 : val).toLocaleString()}</span>;
      }
      return <span className="font-extrabold text-xs">{val.toLocaleString()}</span>;
    }

    return <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate block max-w-[220px]">{String(val)}</span>;
  };

  return (
    <div className="mt-6 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden animate-in fade-in-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left rtl:text-right">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-600 h-4 w-4"
                  checked={isAllSelected}
                  onChange={handleSelectAllCheckbox}
                />
              </th>
              {rawKeys.map((colKey) => (
                <th key={colKey} className="py-3.5 px-4 truncate">
                  {colKey.replace(/([A-Z])/g, " $1").trim()}
                </th>
              ))}
              <th className="py-3.5 px-4 text-center w-28">{currentLocale === "ar" ? "الإجراءات" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {data.map((row, rIdx) => {
              const rowId = row.id || row.settingKey || row.templateKey || row.code;
              const isChecked = selectedIds.includes(rowId);
              const isDeleted = row.deletedAt !== null && row.deletedAt !== undefined;

              return (
                <tr
                  key={rIdx}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    isChecked ? "bg-teal-50/50 dark:bg-teal-950/30" : ""
                  } ${isDeleted ? "opacity-60 bg-rose-50/20 dark:bg-rose-950/20" : ""}`}
                >
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded-md border-slate-300 text-teal-600 focus:ring-teal-600 h-4 w-4"
                      checked={isChecked}
                      onChange={() => onToggleSelectId(rowId)}
                    />
                  </td>

                  {rawKeys.map((colKey) => (
                    <td key={colKey} className="py-3 px-4 truncate">
                      {renderCellContent(colKey, row[colKey])}
                    </td>
                  ))}

                  <td className="py-3 px-4 text-center space-x-1 rtl:space-x-reverse whitespace-nowrap">
                    {onEdit && !isDeleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-600 hover:text-teal-600 hover:bg-teal-50 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => onEdit(row)}
                        title={currentLocale === "ar" ? "تعديل السجل" : "Edit Entity"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {isDeleted ? (
                      onRestore && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 space-x-1 rtl:space-x-reverse font-extrabold text-[10px]"
                          onClick={() => onRestore(rowId)}
                          title={currentLocale === "ar" ? "استعادة من الأرشيف" : "Restore Entity"}
                        >
                          <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                          <span>{currentLocale === "ar" ? "استعادة" : "Restore"}</span>
                        </Button>
                      )
                    ) : (
                      onSoftDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/60"
                          onClick={() => onSoftDelete(rowId)}
                          title={currentLocale === "ar" ? "نقل إلى الأرشيف DB" : "Soft Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar bottom row */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-500">
            {currentLocale === "ar" ? `الصفحة ${page} من ${totalPages}` : `Showing page ${page} of ${totalPages}`}
          </span>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold px-3"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 rtl:rotate-180 rtl:mr-0 rtl:ml-1" />
              <span>{currentLocale === "ar" ? "السابق" : "Prev"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold px-3"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <span>{currentLocale === "ar" ? "التالي" : "Next"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 rtl:rotate-180 rtl:ml-0 rtl:mr-1" />
            </Button>
          </div>
        </div>
      )}

      {/* JSON Metadata / Details Inspection Modal */}
      <Dialog open={inspectingJson !== null} onOpenChange={() => setInspectingJson(null)}>
        <DialogContent className="max-w-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black">{currentLocale === "ar" ? "مواصفات وتكوين JSON (Metadata Inspect)" : "JSON Object Structure & Metadata"}</DialogTitle>
          </DialogHeader>
          <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl overflow-x-auto text-xs font-mono border border-slate-800 shadow-inner max-h-96">
            {JSON.stringify(inspectingJson, null, 2)}
          </pre>
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setInspectingJson(null)}>
              {currentLocale === "ar" ? "إغلاق" : "Close Inspection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
