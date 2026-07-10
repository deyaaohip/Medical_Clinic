"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { SuperAdminToolbar } from "@/components/super-admin/SuperAdminToolbar";
import { SuperAdminDashboardView } from "@/components/super-admin/SuperAdminDashboardView";
import { SuperAdminDynamicTableView } from "@/components/super-admin/SuperAdminDynamicTableView";
import { SuperAdminDynamicModal } from "@/components/super-admin/SuperAdminDynamicModal";
import { Crown, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminConsolePage() {
  const router = useRouter();

  // Console Master States
  const [session, setSession] = React.useState<any | null>(null);
  const [locale, setLocale] = React.useState<"en" | "ar">("en");
  const [initializing, setInitializing] = React.useState(true);

  const [activeModule, setActiveModule] = React.useState("dashboard");
  const [data, setData] = React.useState<any[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = React.useState<any | null>(null);
  const [revenueChart, setRevenueChart] = React.useState<any[]>([]);

  // Filtering & Pagination States
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loadingData, setLoadingData] = React.useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalInitialData, setModalInitialData] = React.useState<any | null>(null);

  // Authentication & Initial Bootstrap
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@medsaas.com" }),
        });
        const data = await res.json();
        if (data.success) {
          setSession(data.user);
          setLocale(data.user.preferredLocale || "en");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitializing(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch active module data
  const fetchData = React.useCallback(async () => {
    if (!session) return;
    setLoadingData(true);

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
        status: statusFilter,
        showDeleted: String(showDeleted),
      });

      const res = await fetch(`/api/superadmin/${activeModule}?${query}`);
      const result = await res.json();

      if (result.success) {
        if (activeModule === "dashboard") {
          setDashboardMetrics(result.metrics);
          setRevenueChart(result.revenueChart);
        } else {
          setData(result.data || []);
          setTotalCount(result.total || result.data?.length || 0);
          setTotalPages(result.totalPages || 1);
        }
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
      setData([]);
    } finally {
      setLoadingData(false);
    }
  }, [activeModule, page, limit, searchQuery, statusFilter, showDeleted, session]);

  React.useEffect(() => {
    fetchData();
    setSelectedIds([]); // reset selected rows when changing module or page
  }, [fetchData]);

  const handleSelectModule = (modKey: string) => {
    setActiveModule(modKey);
    setPage(1);
    setSearchQuery("");
    setStatusFilter("all");
    setShowDeleted(false);
    setSelectedIds([]);
  };

  const handleToggleSelectId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = (ids: string[], isAll: boolean) => {
    setSelectedIds(isAll ? ids : []);
  };

  // Single entity operations
  const handleEditRecord = (record: any) => {
    setModalInitialData(record);
    setModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setModalInitialData(null);
    setModalOpen(true);
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من رغبتك في أرشفة هذا السجل DB ؟" : "Are you sure you wish to soft delete and archive this entity?")) return;
    await fetch(`/api/superadmin/${activeModule}/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleRestore = async (id: string) => {
    await fetch(`/api/superadmin/${activeModule}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    });
    fetchData();
  };

  // Bulk entity operations
  const handleBulkSoftDelete = async () => {
    if (!confirm(locale === "ar" ? `هل أنت متأكد من أرشفة (${selectedIds.length}) سجل محدد ؟` : `Are you sure you wish to bulk archive ${selectedIds.length} entities?`)) return;
    await fetch(`/api/superadmin/${activeModule}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulkSoftDelete", ids: selectedIds }),
    });
    setSelectedIds([]);
    fetchData();
  };

  const handleBulkRestore = async () => {
    await fetch(`/api/superadmin/${activeModule}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulkRestore", ids: selectedIds }),
    });
    setSelectedIds([]);
    fetchData();
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white flex-col space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        <p className="text-xs font-black tracking-widest uppercase">Initializing Secure Container...</p>
      </div>
    );
  }

  if (!session || !session.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-3xl font-black">Super Admin Authentication Required</h1>
        <p className="mt-2 text-slate-400 text-sm max-w-md">
          {locale === "ar"
            ? "بوابة الإدارة العليا محجوبة بامتثال صارم. يرجى تسجيل الدخول بحساب الإدارة العليا (Crown Admin)."
            : "The Super Admin SaaS Engine console requires explicit platform credentials with verified MFA keys."}
        </p>
        <Button className="mt-6 py-6 px-8 font-extrabold text-base bg-teal-600 hover:bg-teal-700 space-x-2" onClick={() => window.location.href = "/"}>
          <span>{locale === "ar" ? "العودة لاختيار حساب الإدارة" : "Return to Persona Select"}</span>
          <ArrowRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:rotate-180" />
        </Button>
      </div>
    );
  }

  const currentModLabel = activeModule === "dashboard" ? (locale === "ar" ? "لوحة التحكم الرئيسية" : "Console Dashboard") : activeModule.replace("-", " ").toUpperCase();

  return (
    <div className={`min-h-screen bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${locale === "ar" ? "rtl" : "ltr"}`} dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Global Application Header */}
      <AppHeader userSession={session} currentLocale={locale} />

      {/* Main UI Tree with Left Sidebar and Right View Container */}
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Navigation Sidebar */}
        <SuperAdminSidebar
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          currentLocale={locale}
        />

        {/* Active Module Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex flex-col">
          {activeModule === "dashboard" ? (
            <SuperAdminDashboardView
              metrics={dashboardMetrics}
              revenueChart={revenueChart}
              currentLocale={locale}
            />
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Dynamic Action Bar Top Row */}
              <SuperAdminToolbar
                moduleName={currentModLabel}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                showDeleted={showDeleted}
                onShowDeletedChange={setShowDeleted}
                selectedCount={selectedIds.length}
                onBulkSoftDelete={handleBulkSoftDelete}
                onBulkRestore={handleBulkRestore}
                onOpenAddModal={handleOpenAddModal}
                currentLocale={locale}
              />

              {/* Dynamic Reusable Table View Area */}
              <div className="flex-1 p-6">
                {loadingData ? (
                  <div className="flex items-center justify-center p-24 text-teal-600 dark:text-teal-400 space-x-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-black tracking-widest uppercase">
                      {locale === "ar" ? "جاري جلب البيانات من قواعد Drizzle ORM..." : "Querying Drizzle Container..."}
                    </span>
                  </div>
                ) : (
                  <SuperAdminDynamicTableView
                    moduleKey={activeModule}
                    data={data}
                    selectedIds={selectedIds}
                    onToggleSelectId={handleToggleSelectId}
                    onSelectAll={handleSelectAll}
                    onEdit={handleEditRecord}
                    onSoftDelete={handleSoftDelete}
                    onRestore={handleRestore}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    currentLocale={locale}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Reusable Master Entity Creation & Editing Modal */}
      <SuperAdminDynamicModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        moduleKey={activeModule}
        initialData={modalInitialData}
        onSuccess={fetchData}
        currentLocale={locale}
      />
    </div>
  );
}
