import * as React from "react";
import { getSession } from "@/lib/auth/session";
import { getCurrentLocale } from "@/lib/i18n/engine";
import { AppHeader } from "@/components/layout/AppHeader";
import { ClinicSaaSNavbar } from "@/components/clinic/ClinicSaaSNavbar";

export default async function ClinicPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const session = await getSession();
  const locale = await getCurrentLocale();
  const resolvedParams = await params;
  const { tenantId } = resolvedParams;

  return (
    <div className={`min-h-screen bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${locale === "ar" ? "rtl" : "ltr"}`} dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Shared Platform Header */}
      <AppHeader userSession={session} currentLocale={locale} />

      {/* Main Container with Left Modular Navigation Navbar and Right Action Area */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <ClinicSaaSNavbar tenantId={tenantId} currentLocale={locale} />
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
