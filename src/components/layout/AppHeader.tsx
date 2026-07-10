"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Crown, Building2, UserCheck, LogOut, ArrowRightLeft, ShieldAlert } from "lucide-react";

export function AppHeader({ userSession, currentLocale = "en" }: { userSession?: any; currentLocale?: "en" | "ar" }) {
  const router = useRouter();

  const toggleLocale = async () => {
    const nextLocale = currentLocale === "en" ? "ar" : "en";
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    window.location.reload();
  };

  const executeDemoLogin = async (email: string, tenantId?: string) => {
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tenantId }),
    });
    const data = await res.json();
    if (data.success) {
      router.push(data.redirectUrl);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        <div className="flex items-center space-x-2 cursor-pointer rtl:space-x-reverse" onClick={() => router.push("/")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md">
            <span className="text-xl font-bold tracking-wider">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {currentLocale === "ar" ? "ميد ساس SaaS" : "MedSaaS Core"}
            </h1>
            <p className="text-xs text-teal-600 font-medium dark:text-teal-400">
              {currentLocale === "ar" ? "نظام إدارة العيادات الشامل" : "Enterprise Healthcare Platform"}
            </p>
          </div>
        </div>

        {userSession && userSession.isSuperAdmin && (
          <Badge variant="success" className="hidden md:inline-flex space-x-1 px-3 py-1 font-semibold rtl:space-x-reverse">
            <Crown className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-amber-500 animate-pulse" />
            <span>{currentLocale === "ar" ? "وحدة تحكم الإدارة العليا" : "Super Admin Mode"}</span>
          </Badge>
        )}

        {userSession && userSession.activeTenantId && (
          <Badge variant="outline" className="hidden md:inline-flex px-3 py-1 bg-slate-50 dark:bg-slate-800">
            <Building2 className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-teal-600 dark:text-teal-400" />
            <span>{userSession.activeTenantId === "al-shifa" ? (currentLocale === "ar" ? "مركز الشفاء الطبي" : "Al Shifa Medical Center") : "Apex International Healthcare"}</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {/* Localization Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLocale}
          className="flex items-center space-x-1.5 rounded-full px-3 rtl:space-x-reverse border-teal-200 bg-teal-50/50 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/40"
        >
          <Globe className="w-4 h-4 text-teal-700 dark:text-teal-300" />
          <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
            {currentLocale === "en" ? "العربية RTL" : "English LTR"}
          </span>
        </Button>

        {/* Instant Demo User Switcher Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="hidden sm:inline-flex text-xs font-semibold space-x-1 rtl:space-x-reverse">
              <UserCheck className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-slate-600 dark:text-slate-400" />
              <span>{currentLocale === "ar" ? "تبديل المستخدم التجريبي" : "Demo Roles Switcher"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            <DropdownMenuLabel className="text-xs text-slate-500">
              {currentLocale === "ar" ? "بوابات الإدارة المتاحة :" : "Select Operating Identity:"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => executeDemoLogin("admin@medsaas.com")} className="cursor-pointer flex items-center p-2 rounded-lg hover:bg-teal-50 font-medium text-xs">
              <Crown className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-amber-500" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Super Admin Console</p>
                <p className="text-[10px] text-slate-500">Platform-wide management & SaaS Engine</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => executeDemoLogin("admin@medsaas.com", "al-shifa")} className="cursor-pointer flex items-center p-2 rounded-lg hover:bg-teal-50 font-medium text-xs">
              <Building2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-teal-600" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Al Shifa Clinic Admin</p>
                <p className="text-[10px] text-slate-500">Full Arabic & English Practice Manager</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => executeDemoLogin("dr.ahmed@alshifaclinic.ae", "al-shifa")} className="cursor-pointer flex items-center p-2 rounded-lg hover:bg-teal-50 font-medium text-xs">
              <span className="text-base mr-2 rtl:mr-0 rtl:ml-2">🩺</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Dr. Ahmed Mansour</p>
                <p className="text-[10px] text-slate-500">Senior Physician (AI Scribe & EMR)</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => executeDemoLogin("reception@alshifaclinic.ae", "al-shifa")} className="cursor-pointer flex items-center p-2 rounded-lg hover:bg-teal-50 font-medium text-xs">
              <span className="text-base mr-2 rtl:mr-0 rtl:ml-2">🤝</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Fatima Al-Hassan</p>
                <p className="text-[10px] text-slate-500">Front Desk & Patient Queues</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile / Logout */}
        {userSession ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer rtl:space-x-reverse hover:opacity-80 transition-opacity">
                <Avatar className="h-9 w-9 border-2 border-teal-600 shadow-xs">
                  <AvatarImage src={userSession.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} />
                  <AvatarFallback className="bg-teal-100 font-bold text-teal-900">
                    {userSession.fullName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-bold leading-none text-slate-900 dark:text-slate-100">{userSession.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{userSession.email}</p>
              </div>
              <DropdownMenuSeparator />
              {userSession.isSuperAdmin && (
                <DropdownMenuItem onClick={() => router.push("/super-admin")} className="cursor-pointer text-xs font-semibold py-2">
                  <Crown className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-teal-600" />
                  <span>{currentLocale === "ar" ? "بوابة الإدارة العليا (Console)" : "Super Admin Portal"}</span>
                </DropdownMenuItem>
              )}
              {userSession.activeTenantId && (
                <DropdownMenuItem onClick={() => router.push(`/${userSession.activeTenantId}/dashboard`)} className="cursor-pointer text-xs font-semibold py-2">
                  <Building2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-teal-600" />
                  <span>{currentLocale === "ar" ? "لوحة تحكم العيادة" : "Clinic Dashboard"}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 font-bold text-xs py-2 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                <span>{currentLocale === "ar" ? "تسجيل الخروج" : "Log Out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" size="sm" onClick={() => executeDemoLogin("admin@medsaas.com")}>
            {currentLocale === "ar" ? "دخول سريع للإدارة" : "Enter Console"}
          </Button>
        )}
      </div>
    </header>
  );
}
