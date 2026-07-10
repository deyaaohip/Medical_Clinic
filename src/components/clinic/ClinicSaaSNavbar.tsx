"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  Layers,
  Clock,
  Bed,
  UserPlus,
  GitMerge,
  Calendar,
  ListOrdered,
  PlusCircle,
  Stethoscope,
  Activity,
  ChevronRight,
  Headset,
  FileHeart,
  Pill,
  FlaskConical,
  ScanLine,
  ShieldCheck,
  CreditCard,
  Package,
  Brain,
} from "lucide-react";

export function ClinicSaaSNavbar({ tenantId, currentLocale = "en" }: { tenantId: string; currentLocale?: "en" | "ar" }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuSections = [
    {
      category: currentLocale === "ar" ? "نظام إدارة العيادة (Clinic Module)" : "Clinic Management",
      items: [
        { href: `/${tenantId}/dashboard`, labelEn: "Clinic Core Overview", labelAr: "نظرة عامة والمركز الطبي", icon: Building2 },
        { href: `/${tenantId}/staff`, labelEn: "Staff Profiles (Doctors & Nurses)", labelAr: "الطاقم الطبي (أطباء وممرضين)", icon: Users },
        { href: `/${tenantId}/departments`, labelEn: "Departments & Room Suites", labelAr: "الأقسام والغرف الطبية", icon: Layers },
        { href: `/${tenantId}/working-hours`, labelEn: "Working Hours & Vacations", labelAr: "أوقات العمل والإجازات", icon: Clock },
      ],
    },
    {
      category: currentLocale === "ar" ? "نظام إدارة المرضى (Patient Management)" : "Patient Management System",
      items: [
        { href: `/${tenantId}/patients`, labelEn: "Master Patient Directory", labelAr: "سجل المرضى الشامل (Directory)", icon: Bed, badge: "Unlimited" },
        { href: `/${tenantId}/patients/register`, labelEn: "+ Register New Patient", labelAr: "+ تسجيل مريض جديد", icon: UserPlus },
        { href: `/${tenantId}/patients/merge`, labelEn: "Merge Duplicate Patients", labelAr: "دمج المرضى المكررين Utility", icon: GitMerge },
      ],
    },
    {
      category: currentLocale === "ar" ? "العمليات السريرية (Clinical Care)" : "Clinical Care Operations",
      items: [
        { href: `/${tenantId}/emr`, labelEn: "Electronic Medical Records", labelAr: "السجل الطبي الإلكتروني EMR", icon: FileHeart, badge: "SOAP" },
        { href: `/${tenantId}/prescriptions`, labelEn: "Prescription Management", labelAr: "إدارة الوصفات والأدوية", icon: Pill, badge: "QR" },
        { href: `/${tenantId}/laboratory`, labelEn: "Laboratory & Results", labelAr: "المختبر والنتائج", icon: FlaskConical, badge: "Live" },
        { href: `/${tenantId}/radiology`, labelEn: "Radiology Imaging & DICOM", labelAr: "الأشعة و DICOM", icon: ScanLine, badge: "DICOM" },
        { href: `/${tenantId}/insurance`, labelEn: "Insurance Claims & Approvals", labelAr: "التأمين والمطالبات", icon: ShieldCheck, badge: "Claims" },
        { href: `/${tenantId}/finance`, labelEn: "Financial Revenue & Accounting", labelAr: "المالية والمحاسبة", icon: CreditCard, badge: "AR" },
        { href: `/${tenantId}/inventory`, labelEn: "Inventory & Stock Control", labelAr: "المخزون والمستودعات", icon: Package, badge: "Stock" },
        { href: `/${tenantId}/ai-engine`, labelEn: "Clinical AI Engine", labelAr: "محرك الذكاء الاصطناعي السريري", icon: Brain, badge: "MD Review" },
      ],
    },
    {
      category: currentLocale === "ar" ? "نظام إدارة المواعيد (Appointments)" : "Appointment Management System",
      items: [
        { href: `/${tenantId}/appointments/calendar`, labelEn: "Master Interactive Calendar", labelAr: "التقويم التفاعلي (Calendar)", icon: Calendar },
        { href: `/${tenantId}/queues`, labelEn: "Live Live Triage Queues", labelAr: "طوابير المرضى المباشرة (Queue)", icon: ListOrdered, badge: "Live" },
        { href: `/${tenantId}/appointments/book`, labelEn: "+ Book Triage / Walk-in", labelAr: "+ حجز موعد / مريض مباشر", icon: PlusCircle },
      ],
    },
  ];

  return (
    <aside className="flex flex-col w-72 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 h-[calc(100vh-4rem)] overflow-y-auto shadow-xs">
      <div className="p-4 bg-teal-50/50 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-sm shadow-xs">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-800 dark:text-teal-200">
              {tenantId === "al-shifa" ? (currentLocale === "ar" ? "مركز الشفاء الطبي" : "Al Shifa Medical") : "Apex Healthcare"}
            </p>
            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400">
              {currentLocale === "ar" ? "بوابة الإدارة الطبية الموحدة" : "Unified Healthcare OS"}
            </p>
          </div>
        </div>
        <Badge variant="success" className="px-1.5 py-0 text-[9px] uppercase font-black tracking-widest animate-pulse">
          Live DB
        </Badge>
      </div>

      <div className="flex-1 py-4 px-3 space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {section.category}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-between h-9 px-3 font-extrabold text-xs rounded-xl transition-all group",
                      isActive
                        ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                    onClick={() => router.push(item.href)}
                  >
                    <div className="flex items-center space-x-2.5 rtl:space-x-reverse truncate">
                      <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-teal-600 dark:text-teal-400")} />
                      <span className="truncate">{currentLocale === "ar" ? item.labelAr : item.labelEn}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                      {item.badge && (
                        <Badge
                          variant={isActive ? "outline" : "default"}
                          className={cn(
                            "px-1.5 py-0 text-[9px] font-black tracking-tighter uppercase rounded-md",
                            isActive ? "border-white/40 bg-white/20 text-white" : "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180 shrink-0", isActive ? "text-white opacity-100" : "text-slate-400")} />
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
