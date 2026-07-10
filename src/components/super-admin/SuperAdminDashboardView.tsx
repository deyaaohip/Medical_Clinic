"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Building2, Users, Bot, Headset, TrendingUp, Cpu, Server, Activity, Database } from "lucide-react";

export function SuperAdminDashboardView({
  metrics,
  revenueChart,
  currentLocale = "en",
}: {
  metrics: any;
  revenueChart: any[];
  currentLocale?: "en" | "ar";
}) {
  if (!metrics) return null;

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* 4 Summary Top KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {currentLocale === "ar" ? "مجموع العوائد السنوية ARR" : "Platform ARR"}
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <DollarSign className="h-5 w-5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">${metrics.totalArrUsd?.toLocaleString()}</div>
            <p className="mt-1 text-xs text-emerald-600 font-bold flex items-center space-x-1 rtl:space-x-reverse">
              <TrendingUp className="h-3 w-3" />
              <span>+18.4% {currentLocale === "ar" ? "مقارنة بالشهر السابق" : "vs last month"}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {currentLocale === "ar" ? "العيادات النشطة (Tenants)" : "Active Practices"}
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
              <Building2 className="h-5 w-5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{metrics.totalTenants}</div>
            <p className="mt-1 text-xs text-slate-500">
              {currentLocale === "ar" ? "تعمل ضمن حاويات معزولة" : "Fully partitioned DB containers"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {currentLocale === "ar" ? "المستخدمين المسجلين" : "Global User Accounts"}
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
              <Users className="h-5 w-5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{metrics.totalUsers}</div>
            <p className="mt-1 text-xs text-slate-500">
              {currentLocale === "ar" ? "أطباء وإداريين بامتثال RBAC" : "Physicians & Staff Members"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {currentLocale === "ar" ? "تذاكر الدعم المفتوحة" : "Pending Helpdesk"}
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Headset className="h-5 w-5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">{metrics.openTickets}</div>
            <p className="mt-1 text-xs text-amber-600 font-bold">
              {metrics.openTickets > 0 ? (currentLocale === "ar" ? "تتطلب استجابة أو تصعيد" : "Requires SLA Escalation") : (currentLocale === "ar" ? "جميع التذاكر محلولة" : "All queues resolved")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Beautiful Custom SVG Revenue Bar Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between overflow-hidden border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-black">{currentLocale === "ar" ? "نمو العوائد الشهرية MRR (Stripe Pipelines)" : "Monthly Recurring Revenue ARR/MRR Trajectory"}</CardTitle>
            <CardDescription>{currentLocale === "ar" ? "تتبع تدفق دفعات العيادات في الوقت الفعلي عبر ويب هوك Stripe" : "Chronological active recurring billing volume aggregated across all SaaS Tiers"}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-64 w-full flex items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 px-2 pt-8">
              {revenueChart.map((d, i) => {
                const maxVal = 45000;
                const heightPercent = Math.min(100, Math.round((d.revenueUsd / maxVal) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black py-1 px-2 rounded-md shadow-lg pointer-events-none mb-1">
                      ${d.revenueUsd.toLocaleString()}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-teal-700 to-emerald-500 rounded-t-lg transition-all duration-500 group-hover:from-teal-600 group-hover:to-teal-400 shadow-xs"
                    />
                    <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 mt-1">{d.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs font-bold text-slate-500 px-2">
              <span>{currentLocale === "ar" ? "البداية (سبتمبر)" : "Baseline (Sep)"}</span>
              <span className="text-emerald-600 font-extrabold flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 animate-pulse" />
                <span>Active Projection: $41,200 / MRR</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI & Infrastructure Quota Breakdown */}
        <Card className="flex flex-col justify-between overflow-hidden border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-black">{currentLocale === "ar" ? "توزيع باقات العيادات واستهلاك الذكاء الاصطناعي" : "SaaS Tiers & AI Quota Consumption"}</CardTitle>
            <CardDescription>{currentLocale === "ar" ? "نسبة اعتماد الباقات الطبية من إجمالي المستأجرين" : "Active clinical practice distribution & GPT-4o Token cost telemetry"}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase text-slate-500 tracking-wider">{currentLocale === "ar" ? "توزيع الاشتراكات :" : "Active Plan Allocation:"}</p>
              {metrics.tierDistribution?.map((t: any, idx: number) => {
                const total = metrics.totalTenants || 1;
                const percent = Math.round((t.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-black">
                      <span className="uppercase text-teal-700 dark:text-teal-400">{t.tier} Tier</span>
                      <span>{t.count} Practices ({percent}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full ${idx === 0 ? "bg-teal-600" : idx === 1 ? "bg-emerald-500" : "bg-amber-500"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-xs text-slate-900 dark:text-slate-100">
                <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
                <span>{currentLocale === "ar" ? "استهلاك الـ AI Speech Scribe" : "AI Scribe NLP Audio Tokens"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black">${metrics.totalAiCostUsd}</span>
                <span className="text-[11px] font-bold text-slate-500">12,410 Prompt Tokens</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Telemetry & Servers Health Status */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-black">{currentLocale === "ar" ? "حالة الخوادم السحابية وبوابات الطب الاتصالي (System Monitoring)" : "Platform Relays & Gateway Node Monitoring"}</CardTitle>
            <CardDescription>{currentLocale === "ar" ? "جميع العقد السحابية في الشرق الأوسط وأمريكا تعمل بامتثال 99.99%" : "Live active Postgres, Redis cache, and WebRTC media relays status"}</CardDescription>
          </div>
          <Badge variant="success" className="px-3 py-1 font-bold space-x-1.5 rtl:space-x-reverse">
            <span className="h-2 w-2 rounded-full bg-white animate-ping mr-1 rtl:mr-0 rtl:ml-1" />
            <span>99.99% Uptime SLA</span>
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 rtl:space-x-reverse">
            <Database className="w-8 h-8 text-teal-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500">PostgreSQL PgBouncer Pool</p>
              <p className="text-sm font-black">45 Active Connections</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Latency: 2.1ms (Healthy)</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 rtl:space-x-reverse">
            <Cpu className="w-8 h-8 text-cyan-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500">Redis In-Memory Cache Cluster</p>
              <p className="text-sm font-black">98.4% Cache Hit Rate</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Throughput: 14.2k ops/sec</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/50 rtl:space-x-reverse">
            <Server className="w-8 h-8 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500">WebRTC SFU Media Relay (Dubai)</p>
              <p className="text-sm font-black">12 Active HD Video Consults</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Jitter: 4ms / 1080p WebRTC</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
