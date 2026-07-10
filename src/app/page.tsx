import * as React from "react";
import { getSession } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n/engine";
import { AppHeader } from "@/components/layout/AppHeader";
import { DemoSelectorCards } from "@/components/home/DemoSelectorCards";
import { SubscriptionShowcase } from "@/components/home/SubscriptionShowcase";
import { ArchitectureSpecs } from "@/components/home/ArchitectureSpecs";
import { Crown, Building2, ShieldCheck, Activity, Bot, Database, Server, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const locale = await getCurrentLocale();

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${locale === "ar" ? "rtl" : "ltr"}`} dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Global App Header */}
      <AppHeader userSession={session} currentLocale={locale} />

      {/* Premium Hero Banner */}
      <main className="mx-auto max-w-7xl px-6 py-12 pb-24">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-10 md:p-16 text-white shadow-2xl">
          <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-teal-400/20 px-4 py-1 text-xs font-bold text-teal-200 backdrop-blur-md">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-400 animate-pulse rtl:mr-0 rtl:ml-2" />
              {locale === "ar" ? "الإصدار 16.4 - منصة إدارة طبية سحابية (SaaS Architecture)" : "Next.js 16 Multi-Tenant Medical SaaS Architecture"}
            </span>

            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight leading-none text-white">
              {locale === "ar" ? "محرك إدارة العيادات السحابي والمستشفيات الذكية" : "Production Medical Clinic SaaS & Super Admin Engine"}
            </h1>

            <p className="mt-6 text-lg md:text-xl text-teal-100 leading-relaxed font-light">
              {locale === "ar" ? "تم بناؤه وفق معايير Clean Architecture و DDD مع عزل تام لكل عيادة (Tenant Isolation)، تحكم بالصلاحيات RBAC، فوترة مؤتمتة، ودعم فوري للغة العربية RTL." : "Engineered with strict Multi-Tenant Isolation, Dynamic RBAC matrices, Stripe Billing pipelines, feature flags, HIPAA audit logs, and an interactive Super Admin Console."}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
            <div className="flex items-center space-x-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md rtl:space-x-reverse border border-white/5">
              <Crown className="h-6 w-6 text-amber-400" />
              <div>
                <p className="text-xs font-medium text-teal-200">{locale === "ar" ? "وحدة تحكم" : "Super Admin"}</p>
                <p className="text-sm font-bold">24 SaaS Modules</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md rtl:space-x-reverse border border-white/5">
              <Building2 className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-teal-200">{locale === "ar" ? "عزل العيادات" : "Multi-Tenant"}</p>
                <p className="text-sm font-bold">Strict Isolation</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md rtl:space-x-reverse border border-white/5">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
              <div>
                <p className="text-xs font-medium text-teal-200">{locale === "ar" ? "امتثال أمني" : "Compliance"}</p>
                <p className="text-sm font-bold">HIPAA Audit Trails</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-2xl bg-white/10 p-4 backdrop-blur-md rtl:space-x-reverse border border-white/5">
              <Activity className="h-6 w-6 text-rose-400" />
              <div>
                <p className="text-xs font-medium text-teal-200">{locale === "ar" ? "الذكاء الاصطناعي" : "AI Clinical Suite"}</p>
                <p className="text-sm font-bold">NLP Scribe & Billing</p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Instant Demo Portals Picker */}
        <section className="mt-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {locale === "ar" ? "اختبر البوابات التفاعلية الآن (Demo Portals)" : "Explore Active Interactive Portals"}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {locale === "ar" ? "انقر على أي بطاقة في الأسفل لتسجيل الدخول التلقائي فوراً واستعراض لوحات التحكم دون كتابة كلمات مرور :" : "Click any persona below to instantly switch sessions and experience fully dynamic CRUD, Soft Deletes, Restores, and Charts:"}
            </p>
          </div>

          <DemoSelectorCards currentLocale={locale} />
        </section>

        {/* Dynamic Subscription Plans Showcase */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {locale === "ar" ? "باقات واشتراكات العيادات (SaaS Billing Engine)" : "SaaS Subscription Tiers Engine"}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {locale === "ar" ? "تتم إدارتها ديناميكياً من وحدة تحكم الإدارة العليا مع تكامل كامل للدفع والدورات الشهرية :" : "Fully managed dynamically via the Super Admin Console with live monthly & annual discounting pipelines:"}
            </p>
          </div>

          <SubscriptionShowcase currentLocale={locale} />
        </section>

        {/* Complete Architectural Breakdown */}
        <section className="mt-20">
          <ArchitectureSpecs currentLocale={locale} />
        </section>
      </main>
    </div>
  );
}
