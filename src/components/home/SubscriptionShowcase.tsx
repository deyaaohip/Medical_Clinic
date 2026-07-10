"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles } from "lucide-react";

export function SubscriptionShowcase({ currentLocale = "en" }: { currentLocale?: "en" | "ar" }) {
  const [yearly, setYearly] = React.useState(false);

  const tiers = [
    {
      id: "starter",
      name: currentLocale === "ar" ? "العيادة الناشئة" : "Starter Clinic",
      desc: currentLocale === "ar" ? "مثالي للعيادات الفردية أو الممارسين المستقلين." : "Perfect for single practitioner clinics or small medical practices.",
      priceMonthlyUsd: 199,
      priceYearlyUsd: 1990,
      features: currentLocale === "ar" ? [
        "حتى 3 أعضاء في الطاقم الطبي",
        "1,000 ملف مريض نشط",
        "جدولة المواعيد الأساسية",
        "سجل طبي إلكتروني EMR",
        "دعم كامل باللغتين العربية والإنجليزية",
      ] : [
        "Up to 3 Staff Members",
        "1,000 Active Patient Records",
        "Standard Appointment Scheduling",
        "Basic EMR & Clinical Notes",
        "English & Arabic Localization",
      ],
      popular: false,
    },
    {
      id: "professional",
      name: currentLocale === "ar" ? "المركز الطبي الاحترافي" : "Professional Practice",
      desc: currentLocale === "ar" ? "الحل المتقدم للمراكز الطبية متعددة الأطباء والتخصصات." : "Advanced solution for multi-physician medical centers.",
      priceMonthlyUsd: 499,
      priceYearlyUsd: 4990,
      features: currentLocale === "ar" ? [
        "حتى 15 عضواً في الطاقم الطبي",
        "10,000 ملف مريض نشط",
        "نظام EMR متقدم وطلبات المختبر",
        "تذكيرات تلقائية للمرضى عبر واتساب",
        "بوابة الطب الاتصالي (Telemedicine Suite)",
        "تجهيز ومطالبات التأمين والفوترة",
        "أولوية الدعم الفني 24/7",
      ] : [
        "Up to 15 Staff Members",
        "10,000 Active Patient Records",
        "Advanced EMR & Lab Orders",
        "Automated WhatsApp/SMS Reminders",
        "Telemedicine Suite",
        "Full Billing & Claim Preparation",
        "Priority 24/7 Tech Support",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: currentLocale === "ar" ? "المستشفيات وسلاسل الرعاية" : "Enterprise Healthcare",
      desc: currentLocale === "ar" ? "محرك متكامل لسلاسل المستشفيات الإقليمية والمجموعات الطبية." : "Full-scale Hospital & Regional Medical Chain SaaS Engine.",
      priceMonthlyUsd: 1299,
      priceYearlyUsd: 12990,
      features: currentLocale === "ar" ? [
        "عدد غير محدود من أعضاء الطاقم الطبي",
        "ملفات مرضى غير محدودة",
        "مدير حسابات مخصص",
        "ربط متقدم مع أنظمة HL7 و FHIR",
        "مساعد الذكاء الاصطناعي (AI Clinical Scribe)",
        "بوابة موحدة للفروع المتعددة",
        "اتفاقية مستوى خدمة SLA ونسخ احتياطي محلي",
      ] : [
        "Unlimited Staff Members",
        "Unlimited Patient Records",
        "Dedicated Account Director",
        "Custom HL7 & FHIR Integration",
        "Advanced AI Scribe & Clinical Decision Support",
        "Multi-Branch Unified Portal",
        "Custom SLA & On-Premise Backup option",
      ],
      popular: false,
    },
  ];

  return (
    <div className="mt-10">
      {/* Billing Switcher */}
      <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse font-bold text-sm">
        <span className={!yearly ? "text-slate-900 dark:text-teal-400" : "text-slate-500"}>
          {currentLocale === "ar" ? "دفع شهري" : "Monthly Billing"}
        </span>
        <Switch checked={yearly} onCheckedChange={setYearly} />
        <span className={yearly ? "text-slate-900 dark:text-teal-400 flex items-center" : "text-slate-500 flex items-center"}>
          <span>{currentLocale === "ar" ? "دفع سنوي" : "Annual Billing"}</span>
          <Badge variant="success" className="ml-2 rtl:ml-0 rtl:mr-2 text-[10px] uppercase tracking-wider py-0 px-2 animate-bounce">
            {currentLocale === "ar" ? "شهران مجاناً" : "2 Months Free"}
          </Badge>
        </span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {tiers.map((t) => (
          <Card
            key={t.id}
            className={`relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
              t.popular
                ? "border-2 border-teal-600 shadow-2xl scale-105 bg-gradient-to-b from-white to-teal-50/10 dark:from-slate-900 dark:to-teal-950/20"
                : "border border-slate-200 shadow-sm hover:shadow-lg dark:border-slate-800"
            }`}
          >
            {t.popular && (
              <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-1.5 px-4 text-center text-xs font-black uppercase tracking-widest shadow-xs flex items-center justify-center space-x-1.5 rtl:space-x-reverse">
                <Sparkles className="w-3.5 h-3.5 fill-current animate-spin" />
                <span>{currentLocale === "ar" ? "الباقة الأكثر شيوعاً واعتماداً" : "Most Popular Choice"}</span>
              </div>
            )}

            <CardHeader className={t.popular ? "pt-10" : ""}>
              <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-50">{t.name}</CardTitle>
              <CardDescription className="mt-2 h-12 text-xs leading-relaxed">{t.desc}</CardDescription>
              <div className="mt-6 flex items-baseline">
                <span className="text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  ${yearly ? t.priceYearlyUsd : t.priceMonthlyUsd}
                </span>
                <span className="ml-1 rtl:ml-0 rtl:mr-1 text-xs font-semibold text-slate-500">
                  {yearly ? (currentLocale === "ar" ? "/ سنوياً" : "/ year") : (currentLocale === "ar" ? "/ شهرياً" : "/ month")}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 flex-1">
              {t.features.map((feat, i) => (
                <div key={i} className="flex items-start space-x-2.5 rtl:space-x-reverse text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <div className="mt-0.5 rounded-full bg-teal-100 p-0.5 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="leading-tight">{feat}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter className="pt-6 pb-8 px-6">
              <Button
                variant={t.popular ? "default" : "outline"}
                className={`w-full py-6 font-extrabold text-sm shadow-sm ${t.popular ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700" : ""}`}
                onClick={() => window.location.href = "/register"}
              >
                {currentLocale === "ar" ? `بدء الفترة التجريبية لـ ${t.name}` : `Start 14-Day Free Trial`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
