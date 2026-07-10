"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Database, Cpu, ShieldCheck, FileCode2, RotateCw } from "lucide-react";

export function ArchitectureSpecs({ currentLocale = "en" }: { currentLocale?: "en" | "ar" }) {
  const specs = [
    {
      title: currentLocale === "ar" ? "عزل متعدد المستأجرين (Tenant Isolation)" : "Multi-Tenant Security Container",
      desc: currentLocale === "ar"
        ? "كل عيادة تمتلك معرف UUID معزول تماماً في طبقة ORM وقواعد البيانات لضمان عدم حدوث أي تسريب للبيانات الطبية (HIPAA/GDPR Compliance)."
        : "Automated cryptographic column-level or logical PostgreSQL database tenant isolation guaranteeing zero clinical chart leakage between clinic branches.",
      icon: Database,
      badge: "Clean Architecture",
    },
    {
      title: currentLocale === "ar" ? "تصميم موجه بالمجال (DDD & Repository)" : "DDD & Clean Repository Pattern",
      desc: currentLocale === "ar"
        ? "فصل تام بين كيانات المجال (Domain Entities) في src/core وطبقة البنية التحتية (Infrastructure Drizzle ORM) في src/infrastructure."
        : "Strict decoupling of Domain Entities from DB frameworks, enforcing business invariants and allowing seamless unit testing and API mocking.",
      icon: Layers,
      badge: "SOLID",
    },
    {
      title: currentLocale === "ar" ? "تحكم تفاعلي بالصلاحيات (Dynamic RBAC)" : "Dynamic RBAC & Permission Matrices",
      desc: currentLocale === "ar"
        ? "مصفوفة صلاحيات ديناميكية بالكامل مع دعم الأنماط الشاملة (Wildcards) ومراجعة الأمان عند كل طلب للواجهات البرمجية."
        : "No hardcoded user roles. Fully dynamic custom role definitions, fine-grained permission arrays, and Super Admin impersonation keys.",
      icon: ShieldCheck,
      badge: "Auth.js Ready",
    },
    {
      title: currentLocale === "ar" ? "كاشينج عالي الأداء (Redis & CQRS)" : "Scalable Redis Cache & CQRS Ready",
      desc: currentLocale === "ar"
        ? "توزيع أحمال الاستعلامات باستخدام واجهة تخزين مؤقت مع طبقة ذاكرة احتياطية لضمان سرعة استجابة فائقة تحت ضغط ملايين المرضى."
        : "Optimized read-side analytical views decoupled from transaction write pipelines with high-throughput Redis caching adapters.",
      icon: Cpu,
      badge: "CQRS",
    },
  ];

  return (
    <div>
      <div className="text-center">
        <span className="text-xs font-black uppercase tracking-widest text-teal-600 bg-teal-100 dark:bg-teal-900/60 dark:text-teal-300 px-3 py-1 rounded-full">
          {currentLocale === "ar" ? "معايير بناء البرمجيات المتقدمة" : "Senior Enterprise Software Architecture"}
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {currentLocale === "ar" ? "مواصفات التقنية والبنية التحتية" : "Technology Stack & Core Specifications"}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm">
          {currentLocale === "ar"
            ? "تم تصميم هذا النظام من قبل مهندسي برمجيات بخبرة +15 عاماً ليتحمل التوسع لآلاف العيادات وملايين المعاملات الطبية :"
            : "Architected by software veterans (15+ years) adhering to rigorous enterprise design patterns for uncompromised stability:"}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        {specs.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="relative overflow-hidden transition-all duration-300 hover:shadow-md border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-100 dark:border-teal-900 shadow-xs">
                    <Icon className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <Badge variant="outline" className="text-xs font-bold bg-slate-50 dark:bg-slate-800">
                    {s.badge}
                  </Badge>
                </div>
                <CardTitle className="mt-6 text-xl font-black text-slate-900 dark:text-slate-50">{s.title}</CardTitle>
                <CardDescription className="mt-3 text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                  {s.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
