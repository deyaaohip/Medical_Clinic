"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Calendar,
  UserPlus,
  Activity,
  TrendingUp,
  Clock,
  Sparkles,
  Bed,
  PhoneCall,
  Loader2,
  ArrowRight,
} from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-24 text-teal-600 dark:text-teal-400 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-xs font-black tracking-widest uppercase">Loading Unified Clinical Overview...</span>
      </div>
    );
  }

  const branches = overviewData?.branches || [];

  return (
    <div className="p-6 space-y-8 animate-in fade-in-0">
      {/* Top Multi-Branch Bar */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-2xl">🏢</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {overviewData?.tenant?.name || "Medical Center Practice Overview"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium max-w-xl">
            Real-time multi-branch synchronization container. Select an operating facility to filter clinical metrics below:
          </p>
        </div>

        {/* Multi-Branch Switcher */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
          <Button
            variant={selectedBranch === "all" ? "default" : "ghost"}
            size="sm"
            className="text-xs font-black px-3.5 h-8 rounded-lg"
            onClick={() => setSelectedBranch("all")}
          >
            All multiple branches ({branches.length})
          </Button>
          {branches.map((b: any) => (
            <Button
              key={b.id}
              variant={selectedBranch === b.id ? "default" : "ghost"}
              size="sm"
              className="text-xs font-black px-3.5 h-8 rounded-lg max-w-[150px] truncate"
              onClick={() => setSelectedBranch(b.id)}
              title={b.name}
            >
              <span className="truncate">{b.name.split(" ")[0]} {b.name.split(" ")[1]}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* 4 Primary Clinical KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-teal-50/40 dark:from-slate-900 dark:to-teal-950/20 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Scheduled Today</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">14 Active</div>
            <p className="mt-1 text-xs text-teal-600 font-bold flex items-center space-x-1 rtl:space-x-reverse">
              <TrendingUp className="h-3 w-3" />
              <span>4 Walk-ins Added / Live Queues</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Active Patient Flow</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">2 In Room</div>
            <p className="mt-1 text-xs text-emerald-600 font-bold">
              <span>Avg Wait Triage: 8.4 Minutes</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-cyan-50/40 dark:from-slate-900 dark:to-cyan-950/20 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Clinical Staff Hub</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">8 On Shift</div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              <span>2 Physicians, 4 Nurses, 2 Triage</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-amber-950/20 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-wider">Master Telemetry</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
              <PhoneCall className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">100% SLA</div>
            <p className="mt-1 text-xs text-amber-600 font-bold">
              <span>All Reminders Sent Successfully</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Deck */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">
          Specialized Quick Actions & Module Shortcuts
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all flex flex-col justify-between group">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl">📇</span>
                <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">Unlimited Records</Badge>
              </div>
              <CardTitle className="mt-4 text-xl font-black group-hover:text-teal-600 transition-colors">
                Patient Master Directory & EMR
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-relaxed">
                Search medical records, view allergies, log vital signs, and upload DICOM attachments.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700 font-extrabold space-x-2"
                onClick={() => router.push(`/${tenantId}/patients`)}
              >
                <span>Launch Patient System</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between group">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl">📅</span>
                <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">Bidi Calendar</Badge>
              </div>
              <CardTitle className="mt-4 text-xl font-black group-hover:text-emerald-600 transition-colors">
                Master Interactive Calendar
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-relaxed">
                Switch between Daily, Weekly, and Monthly views or filter schedules by Physician and Room.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button
                variant="default"
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-extrabold space-x-2"
                onClick={() => router.push(`/${tenantId}/appointments/calendar`)}
              >
                <span>Open Calendar Hub</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all flex flex-col justify-between group">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🚨</span>
                <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">Real-Time</Badge>
              </div>
              <CardTitle className="mt-4 text-xl font-black group-hover:text-cyan-600 transition-colors">
                Live Front Desk Triage Queue
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-relaxed">
                Manage waiting lists, inspect estimated call times, and dispatch instant WhatsApp alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Button
                variant="default"
                className="w-full bg-cyan-600 hover:bg-cyan-700 font-extrabold space-x-2"
                onClick={() => router.push(`/${tenantId}/queues`)}
              >
                <span>Inspect Live Live Queues</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Branch Sync Details Row */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">
          Active Operating multiple branches Synchronization Overview
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {branches.map((b: any, index: number) => (
            <Card key={b.id} className="border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <CardHeader className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white font-extrabold ${index === 0 ? "bg-teal-600" : "bg-emerald-600"}`}>
                      <span className="text-base">📍</span>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-50">{b.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{b.address}</p>
                    </div>
                  </div>
                  <Badge variant={b.isPrimary ? "default" : "secondary"} className="text-[10px] font-bold">
                    {b.isPrimary ? "Primary Facility" : "Specialty Branch"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Direct Contact Desk:</span>
                  <span className="font-extrabold font-mono text-teal-600 dark:text-teal-400">{b.phone}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Consult Suites</p>
                    <p className="text-base font-black mt-0.5">{index === 0 ? "6 Suites" : "4 Suites"}</p>
                  </div>
                  <div className="p-2 border-x border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Staff Posted</p>
                    <p className="text-base font-black mt-0.5">{index === 0 ? "14 Staff" : "9 Staff"}</p>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                    <p className="text-xs font-black text-emerald-600 mt-1 flex items-center justify-center space-x-1">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                      <span>Operational</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
