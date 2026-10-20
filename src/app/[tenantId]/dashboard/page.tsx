"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/clinic/ui/page-shell";
import { PageHeader } from "@/components/clinic/ui/page-header";
import { LoadingBlock } from "@/components/clinic/ui/state-blocks";
import { DashboardKpis } from "@/components/clinic/dashboard/kpi-grid";
import { QuickActions } from "@/components/clinic/dashboard/quick-actions";
import { BranchOverview } from "@/components/clinic/dashboard/branch-overview";

export default function ClinicDashboardPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const router = useRouter();
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [overviewData, setOverviewData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedBranch, setSelectedBranch] = React.useState("all");

  React.useEffect(() => {
    params.then((res) => {
      setTenantId(res.tenantId);
    });
  }, [params]);

  React.useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clinic/${tenantId}/overview`);
        const data = await res.json();
        if (data.success) {
          setOverviewData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [tenantId]);

  const branches = overviewData?.branches || [];
  const activeBranchName =
    selectedBranch === "all"
      ? "All branches"
      : branches.find((branch: any) => branch.id === selectedBranch)?.name || "Facility";

  if (loading) {
    return (
      <PageShell>
        <LoadingBlock label="Loading clinical overview" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={Building2}
        eyebrow="Multi-branch overview"
        title={overviewData?.tenant?.name || "Medical center practice overview"}
        description="Real-time synchronisation across operating facilities. Select a branch to scope the clinical metrics below."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs font-medium"
            onClick={() => router.push(`/${tenantId}/departments`)}
          >
            Configure facilities
          </Button>
        }
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Branch</span>
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <Button
            variant={selectedBranch === "all" ? "default" : "ghost"}
            size="sm"
            className={`h-8 rounded-lg px-3 text-xs font-medium ${selectedBranch === "all" ? "" : "text-slate-600 dark:text-slate-300"}`}
            onClick={() => setSelectedBranch("all")}
          >
            All branches ({branches.length})
          </Button>
          {branches.map((branch: any) => (
            <Button
              key={branch.id}
              variant={selectedBranch === branch.id ? "default" : "ghost"}
              size="sm"
              className={`h-8 max-w-[160px] rounded-lg px-3 text-xs font-medium ${selectedBranch === branch.id ? "" : "text-slate-600 dark:text-slate-300"}`}
              onClick={() => setSelectedBranch(branch.id)}
              title={branch.name}
            >
              <span className="truncate">{branch.name.split(" ")[0]}</span>
            </Button>
          ))}
        </div>
        <span className="ms-auto text-[11px] font-medium text-slate-400">{activeBranchName}</span>
      </PageHeader>

      <DashboardKpis />
      <QuickActions tenantId={tenantId} />
      <BranchOverview branches={branches} />
    </PageShell>
  );
}
