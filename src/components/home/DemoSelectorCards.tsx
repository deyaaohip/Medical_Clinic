"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Building2, User, ArrowRight, CheckCircle2 } from "lucide-react";

export function DemoSelectorCards({ currentLocale = "en" }: { currentLocale?: "en" | "ar" }) {
  const router = useRouter();
  const [loadingPersona, setLoadingPersona] = React.useState<string | null>(null);

  const executeLogin = async (email: string, tenantId?: string, label?: string) => {
    setLoadingPersona(label || email);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tenantId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.redirectUrl);
      }
    } catch (err) {
      console.error(err);
      setLoadingPersona(null);
    }
  };

  return (
    <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
      {/* Super Admin Card */}
      <Card className="relative overflow-hidden border-2 border-amber-500/30 hover:border-amber-500/80 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between group bg-gradient-to-b from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <Badge variant="warning" className="px-3 py-1 font-extrabold space-x-1 rtl:space-x-reverse">
              <Crown className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-amber-600 dark:text-amber-400" />
              <span>Persona #1</span>
            </Badge>
            <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
              Full Platform Control
            </span>
          </div>
          <CardTitle className="mt-4 text-2xl font-black text-slate-900 dark:text-slate-50 flex items-center space-x-2 rtl:space-x-reverse">
            <span>Super Admin Console</span>
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {currentLocale === "ar"
              ? "استعراض والتحكم الشامل بجميع العيادات المشتركة، الباقات، الفواتير، الكوبونات، قوالب الإيميل و SMS، إعدادات النظام وسجلات الأمان."
              : "Master management console across all medical practices, Stripe invoices, discount coupons, HTML email/SMS templates, global AI quotas, and dynamic API Keys."}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>24 Dynamic CRUD Modules with Soft Delete & Restore</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Platform ARR & AI Clinical Tokens Analytics Charts</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>S3 / UploadThing Object Vault & DB Backup Snapshot Triggers</span>
          </div>
        </CardContent>
        <CardFooter className="pt-4 pb-6 px-6">
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold shadow-md space-x-2 rtl:space-x-reverse py-6 text-base"
            onClick={() => executeLogin("admin@medsaas.com", undefined, "Super Admin")}
            disabled={loadingPersona !== null}
          >
            <span>{loadingPersona === "Super Admin" ? (currentLocale === "ar" ? "جاري الدخول..." : "Entering Console...") : (currentLocale === "ar" ? "الدخول كـ الإدارة العليا (Super Admin)" : "Launch Super Admin Console")}</span>
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Button>
        </CardFooter>
      </Card>

      {/* Al Shifa Clinic Admin Card */}
      <Card className="relative overflow-hidden border-2 border-teal-600/30 hover:border-teal-600/80 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between group bg-gradient-to-b from-white to-teal-50/20 dark:from-slate-900 dark:to-teal-950/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="px-3 py-1 font-extrabold space-x-1 rtl:space-x-reverse">
              <Building2 className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-teal-800 dark:text-teal-200" />
              <span>Persona #2</span>
            </Badge>
            <span className="text-xs font-bold text-teal-700 bg-teal-100 dark:bg-teal-900/50 dark:text-teal-300 px-2.5 py-0.5 rounded-full">
              SaaS Multi-Tenant Portal
            </span>
          </div>
          <CardTitle className="mt-4 text-2xl font-black text-slate-900 dark:text-slate-50 flex items-center space-x-2 rtl:space-x-reverse">
            <span>Al Shifa Medical Center</span>
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {currentLocale === "ar"
              ? "مركز طبي متعدد التخصصات يعمل باللغة العربية (RTL) مع باقة احترافية. إدارة المرضى، المواعيد، الفواتير ومصفوفة الصلاحيات."
              : "Multi-specialty practice running on Professional Active Plan. Test localized bilingual clinic management, patient registrations, EMR, and staff RBAC."}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Multi-Tenant Strict DB Isolation Container</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Interactive Telemedicine & Virtual Care Gateways</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Custom RBAC Role Definitions & Permission Enforcements</span>
          </div>
        </CardContent>
        <CardFooter className="pt-4 pb-6 px-6">
          <Button
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold shadow-md space-x-2 rtl:space-x-reverse py-6 text-base"
            onClick={() => executeLogin("admin@medsaas.com", "al-shifa", "Al Shifa Admin")}
            disabled={loadingPersona !== null}
          >
            <span>{loadingPersona === "Al Shifa Admin" ? (currentLocale === "ar" ? "جاري الدخول..." : "Entering Clinic...") : (currentLocale === "ar" ? "إدارة مركز الشفاء الطبي" : "Launch Clinic Portal")}</span>
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Button>
        </CardFooter>
      </Card>

      {/* Clinical Staff persona Card */}
      <Card className="relative overflow-hidden border-2 border-cyan-600/30 hover:border-cyan-600/80 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between group bg-gradient-to-b from-white to-cyan-50/20 dark:from-slate-900 dark:to-cyan-950/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="px-3 py-1 font-extrabold space-x-1 rtl:space-x-reverse">
              <User className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-cyan-700 dark:text-cyan-300" />
              <span>Persona #3</span>
            </Badge>
            <span className="text-xs font-bold text-cyan-700 bg-cyan-100 dark:bg-cyan-900/50 dark:text-cyan-300 px-2.5 py-0.5 rounded-full">
              Restricted RBAC Identity
            </span>
          </div>
          <CardTitle className="mt-4 text-2xl font-black text-slate-900 dark:text-slate-50 flex items-center space-x-2 rtl:space-x-reverse">
            <span>Dr. Ahmed Mansour</span>
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {currentLocale === "ar"
              ? "طبيب أخصائي بمركز الشفاء الطبي. يملك صلاحيات سريرية فقط (EMR والمرضى) ومحجوب تماماً عن إعدادات الفوترة والعيادة."
              : "Senior Physician role inside Al Shifa practice. Authorized for patient clinical charts, lab prescriptions, and EMR records with billing matrices blocked."}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>AI Clinical Scribe Speech Dictation Ready</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Live Notifications Center & Emergency Alerts</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 rtl:space-x-reverse">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>HIPAA Access Auditing per Encounter</span>
          </div>
        </CardContent>
        <CardFooter className="pt-4 pb-6 px-6">
          <Button
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-extrabold shadow-md space-x-2 rtl:space-x-reverse py-6 text-base"
            onClick={() => executeLogin("dr.ahmed@alshifaclinic.ae", "al-shifa", "Dr Ahmed")}
            disabled={loadingPersona !== null}
          >
            <span>{loadingPersona === "Dr Ahmed" ? (currentLocale === "ar" ? "جاري الدخول..." : "Entering EMR...") : (currentLocale === "ar" ? "الدخول كـ د. أحمد منصور" : "Enter Physician Persona")}</span>
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
