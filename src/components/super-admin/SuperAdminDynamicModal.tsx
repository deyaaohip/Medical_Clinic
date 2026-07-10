"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Sparkles, Loader2 } from "lucide-react";

export function SuperAdminDynamicModal({
  isOpen,
  onClose,
  moduleKey,
  initialData,
  onSuccess,
  currentLocale = "en",
}: {
  isOpen: boolean;
  onClose: () => void;
  moduleKey: string;
  initialData?: any;
  onSuccess: () => void;
  currentLocale?: "en" | "ar";
}) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Default initial states based on module
      if (moduleKey === "tenants") setFormData({ name: "", slug: "", defaultLocale: "en", country: "UAE" });
      if (moduleKey === "subscription-plans") setFormData({ id: "", name: "", description: "", priceMonthly: 199, priceYearly: 1990, maxUsers: 5, maxPatients: 1000, features: ["Standard Telemedicine Suite", "Bilingual Localization Support"] });
      if (moduleKey === "coupons") setFormData({ code: "", name: "", discountPercent: 20, maxRedemptions: 100 });
      if (moduleKey === "announcements") setFormData({ title: "", message: "", type: "success" });
      if (moduleKey === "email-templates") setFormData({ templateKey: "", name: "", subject: "", bodyHtml: "<div style='font-family:sans-serif;'><h1>Update Dispatch</h1><p>Content goes here...</p></div>" });
      if (moduleKey === "sms-templates") setFormData({ templateKey: "", name: "", messageText: "Your appointment is confirmed." });
      if (moduleKey === "api-keys") setFormData({ name: "", permissions: ["*"], rateLimitPerMin: 120 });
      if (moduleKey === "security-rules") setFormData({ ruleType: "blacklist", targetIpOrRange: "192.168.1.50", reason: "Suspicious scraping traffic." });
      if (moduleKey === "backups") setFormData({ backupName: "manual_db_snapshot_" + Date.now(), triggerType: "manual" });
    }
    setErrorMsg(null);
  }, [isOpen, initialData, moduleKey]);

  if (!isOpen) return null;

  const isEdit = initialData && (initialData.id || initialData.settingKey || initialData.templateKey || initialData.code);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const url = isEdit ? `/api/superadmin/${moduleKey}/${initialData.id || initialData.settingKey || initialData.templateKey || initialData.code}` : `/api/superadmin/${moduleKey}`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Operation failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to communicate with API routes.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const renderFields = () => {
    const keys = Object.keys(formData).filter((k) => k !== "id" && k !== "createdAt" && k !== "updatedAt" && k !== "deletedAt" && k !== "passwordHash" && k !== "secretHash" && k !== "metadata");

    return keys.map((fieldKey) => {
      const val = formData[fieldKey];
      const label = fieldKey.replace(/([A-Z])/g, " $1").trim();

      if (typeof val === "boolean") {
        return (
          <div key={fieldKey} className="flex items-center space-x-3 py-2 rtl:space-x-reverse">
            <input
              type="checkbox"
              id={fieldKey}
              checked={val}
              onChange={(e) => handleChange(fieldKey, e.target.checked)}
              className="h-4 w-4 rounded-md border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <Label htmlFor={fieldKey} className="text-xs font-black capitalize cursor-pointer">
              {label}
            </Label>
          </div>
        );
      }

      if (typeof val === "number") {
        return (
          <div key={fieldKey} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-xs font-bold capitalize">
              {label}
            </Label>
            <Input
              id={fieldKey}
              type="number"
              value={val}
              onChange={(e) => handleChange(fieldKey, parseFloat(e.target.value) || 0)}
              className="text-xs"
            />
          </div>
        );
      }

      if (Array.isArray(val)) {
        return (
          <div key={fieldKey} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-xs font-bold capitalize">
              {label} (Comma separated array)
            </Label>
            <Input
              id={fieldKey}
              type="text"
              value={val.join(", ")}
              onChange={(e) => handleChange(fieldKey, e.target.value.split(",").map((s) => s.trim()))}
              className="text-xs"
            />
          </div>
        );
      }

      if (fieldKey.toLowerCase().includes("html") || fieldKey.toLowerCase().includes("message") || fieldKey.toLowerCase().includes("description")) {
        return (
          <div key={fieldKey} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-xs font-bold capitalize">
              {label}
            </Label>
            <textarea
              id={fieldKey}
              rows={4}
              value={val || ""}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-mono"
            />
          </div>
        );
      }

      return (
        <div key={fieldKey} className="space-y-1.5">
          <Label htmlFor={fieldKey} className="text-xs font-bold capitalize">
            {label}
          </Label>
          <Input
            id={fieldKey}
            type="text"
            value={val || ""}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            className="text-xs"
            disabled={isEdit && fieldKey === "slug"} // slug or ID should generally not be modified on active entities
          />
        </div>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-teal-600 dark:text-teal-400">
            <Sparkles className="w-4 h-4 animate-spin" />
            <DialogTitle className="text-base font-black">
              {isEdit
                ? (currentLocale === "ar" ? `تعديل السجل في (${moduleKey})` : `Edit Entity in (${moduleKey})`)
                : (currentLocale === "ar" ? `تسجيل كيان جديد في (${moduleKey})` : `Create New Entity in (${moduleKey})`)}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs mt-1">
            {currentLocale === "ar" ? "أدخل المواصفات والبيانات الديناميكية ليتم تطبيقها فوراً على حاويات المنصة :" : "Enter the dynamic domain attributes to enforce immediately across platform containers:"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2 max-h-96 overflow-y-auto pr-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-extrabold border border-rose-200 dark:border-rose-900">
              ⚠️ {errorMsg}
            </div>
          )}

          {renderFields()}

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2 rtl:space-x-reverse">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={submitting}>
              {currentLocale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="default" size="sm" type="submit" className="bg-gradient-to-r from-teal-600 to-emerald-600 font-extrabold px-6" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentLocale === "ar" ? "حفظ وتطبيق التغييرات" : "Execute Operation")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
