"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Tags,
  Receipt,
  Ticket,
  Users,
  ShieldCheck,
  Key,
  FileText,
  Mail,
  MessageSquare,
  Settings,
  HardDrive,
  Bot,
  Activity,
  ShieldAlert,
  Database,
  Headset,
  BarChart3,
  Flame,
  GlobeLock,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";

export interface NavModule {
  key: string;
  labelEn: string;
  labelAr: string;
  icon: any;
  category: string;
  countBadge?: number;
}

export const SUPER_ADMIN_MODULES: NavModule[] = [
  // Category: Overview
  { key: "dashboard", labelEn: "Console Dashboard", labelAr: "لوحة التحكم الرئيسية", icon: LayoutDashboard, category: "Overview" },
  { key: "analytics", labelEn: "SaaS ARR & Trends", labelAr: "تحليلات العوائد ARR", icon: BarChart3, category: "Overview", countBadge: 3 },

  // Category: Multi-Tenant SaaS Engine
  { key: "tenants", labelEn: "Tenants (Clinics)", labelAr: "العيادات (Tenants)", icon: Building2, category: "SaaS Multi-Tenant", countBadge: 2 },
  { key: "subscription-plans", labelEn: "Subscription Plans", labelAr: "باقات الاشتراك (Plans)", icon: Layers, category: "SaaS Multi-Tenant", countBadge: 3 },
  { key: "feature-flags", labelEn: "Features & Modules", labelAr: "الميزات والوحدات (Flags)", icon: Flame, category: "SaaS Multi-Tenant" },

  // Category: Billing & Financial Vault
  { key: "invoices", labelEn: "Stripe Invoices", labelAr: "فواتير الدفع (Invoices)", icon: Receipt, category: "Billing Ready" },
  { key: "billing", labelEn: "Billing Gateway Hub", labelAr: "بوابة الفوترة المركزية", icon: CreditCard, category: "Billing Ready" },
  { key: "coupons", labelEn: "Discount Coupons", labelAr: "كوبونات الخصم", icon: Ticket, category: "Billing Ready", countBadge: 3 },

  // Category: Identities & Governance
  { key: "users", labelEn: "Global Users Hub", labelAr: "المستخدمين العالميين", icon: Users, category: "Identities & RBAC" },
  { key: "roles", labelEn: "System & Tenant Roles", labelAr: "الأدوار (Roles)", icon: ShieldCheck, category: "Identities & RBAC", countBadge: 4 },
  { key: "permissions", labelEn: "Dynamic Permissions", labelAr: "الصلاحيات (Permissions)", icon: GlobeLock, category: "Identities & RBAC" },

  // Category: Communications Engine
  { key: "announcements", labelEn: "Broadcast Announcements", labelAr: "التعاميم والإعلانات", icon: Sparkles, category: "Communication" },
  { key: "email-templates", labelEn: "Email HTML Templates", labelAr: "قوالب البريد الإلكتروني", icon: Mail, category: "Communication", countBadge: 2 },
  { key: "sms-templates", labelEn: "SMS & WhatsApp Rules", labelAr: "قوالب رسائل SMS", icon: MessageSquare, category: "Communication", countBadge: 2 },

  // Category: Security & Compliance
  { key: "security-rules", labelEn: "Security Center Rules", labelAr: "مركز الأمان والحماية", icon: ShieldAlert, category: "Security & Compliance", countBadge: 3 },
  { key: "audit-logs", labelEn: "HIPAA Audit Trails", labelAr: "سجلات التدقيق الأمني", icon: FileText, category: "Security & Compliance" },
  { key: "system-logs", labelEn: "Platform System Logs", labelAr: "سجلات النظام (SysLogs)", icon: Activity, category: "Security & Compliance" },

  // Category: System & Storage
  { key: "global-settings", labelEn: "Global Parameters", labelAr: "الإعدادات العامة للنظام", icon: Settings, category: "System Engine" },
  { key: "storage", labelEn: "Object Storage Vault", labelAr: "مساحة التخزين السحابية", icon: HardDrive, category: "System Engine", countBadge: 3 },
  { key: "backups", labelEn: "DB Snapshot Backups", labelAr: "النسخ الاحتياطي لقواعد البيانات", icon: Database, category: "System Engine", countBadge: 3 },

  // Category: Developer & Integrations
  { key: "ai-usage", labelEn: "AI Quota & Token Auditing", labelAr: "استهلاك الذكاء الاصطناعي", icon: Bot, category: "Integrations & API", countBadge: 3 },
  { key: "api-keys", labelEn: "Developer API Keys", labelAr: "مفاتيح الربط البرمجي API", icon: Key, category: "Integrations & API", countBadge: 3 },
  { key: "monitoring", labelEn: "System Health & Relays", labelAr: "مراقبة أداء الخوادم", icon: Activity, category: "Integrations & API" },

  // Category: Helpdesk
  { key: "support-tickets", labelEn: "Support Helpdesk", labelAr: "تذاكر الدعم الفني", icon: Headset, category: "Helpdesk Hub", countBadge: 3 },
];

export function SuperAdminSidebar({
  activeModule,
  onSelectModule,
  currentLocale = "en",
}: {
  activeModule: string;
  onSelectModule: (modKey: string) => void;
  currentLocale?: "en" | "ar";
}) {
  const [filterQuery, setFilterQuery] = React.useState("");

  const categories = ["Overview", "SaaS Multi-Tenant", "Billing Ready", "Identities & RBAC", "Communication", "Security & Compliance", "System Engine", "Integrations & API", "Helpdesk Hub"];

  return (
    <aside className="flex flex-col w-72 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 h-[calc(100vh-4rem)] overflow-y-auto shadow-xs">
      <div className="sticky top-0 z-10 bg-white p-4 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={currentLocale === "ar" ? "بحث في 24 وحدة تحكم..." : "Search 24 modules..."}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-9 pr-4 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rtl:pl-4 rtl:pr-9"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 py-4 px-3 space-y-6">
        {categories.map((cat, idx) => {
          const catMods = SUPER_ADMIN_MODULES.filter(
            (m) =>
              m.category === cat &&
              (m.labelEn.toLowerCase().includes(filterQuery.toLowerCase()) || m.labelAr.includes(filterQuery))
          );

          if (catMods.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                {cat === "Overview" ? (currentLocale === "ar" ? "نظرة عامة" : "Overview") : cat}
              </h3>
              <div className="mt-2 space-y-1">
                {catMods.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.key;
                  return (
                    <Button
                      key={mod.key}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-between h-9 px-3 font-extrabold text-xs rounded-xl transition-all",
                        isActive
                          ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:text-white dark:bg-teal-500 dark:hover:bg-teal-600"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                      )}
                      onClick={() => onSelectModule(mod.key)}
                    >
                      <div className="flex items-center space-x-2.5 rtl:space-x-reverse truncate">
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-teal-600 dark:text-teal-400")} />
                        <span className="truncate">{currentLocale === "ar" ? mod.labelAr : mod.labelEn}</span>
                      </div>
                      {mod.countBadge !== undefined && (
                        <Badge
                          variant={isActive ? "outline" : "secondary"}
                          className={cn(
                            "ml-2 rtl:ml-0 rtl:mr-2 px-1.5 py-0 text-[10px] font-bold rounded-md tracking-tighter",
                            isActive ? "border-white/40 bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          )}
                        >
                          {mod.countBadge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
