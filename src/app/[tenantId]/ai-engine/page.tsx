"use client";

import * as React from "react";
import { Brain, CheckCircle2, ClipboardList, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/clinic/ui/page-shell";
import { PageHeader } from "@/components/clinic/ui/page-header";
import { SectionHeading } from "@/components/clinic/ui/section-heading";
import { StatCard } from "@/components/clinic/ui/stat-card";
import { EmptyState, LoadingBlock } from "@/components/clinic/ui/state-blocks";
import { AiSafetyNotice } from "@/components/clinic/ai-engine/ai-safety-notice";
import { AiFeatureGrid, AI_FEATURE_KEYS } from "@/components/clinic/ai-engine/ai-feature-grid";
import { AiActionCard, type AiAction } from "@/components/clinic/ai-engine/ai-action-card";
import { AiAssistDialog, type AiDraft } from "@/components/clinic/ai-engine/ai-assist-dialog";

export default function AIEnginePage({ params }: { params: Promise<{ tenantId: string }> }) {
  const [tenantId, setTenantId] = React.useState("al-shifa");
  const [actions, setActions] = React.useState<AiAction[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modal, setModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    params.then((p) => setTenantId(p.tenantId));
  }, [params]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [f, a, p, s] = await Promise.all([
      fetch(`/api/operations/${tenantId}/ai-features`).then((r) => r.json()),
      fetch(`/api/operations/${tenantId}/ai-actions`).then((r) => r.json()),
      fetch(`/api/clinic/${tenantId}/patients`).then((r) => r.json()),
      fetch(`/api/clinic/${tenantId}/staff?staffType=Doctor`).then((r) => r.json()),
    ]);
    if (a.success) setActions(a.data || []);
    if (p.success) setPatients(p.data || []);
    if (s.success) setStaff(s.data || []);
    setLoading(false);
  }, [tenantId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function run(draft: AiDraft) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/operations/${tenantId}/ai-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (data.success) {
        setModal(false);
        load();
        alert("AI action logged. Doctor review required before patient visibility.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function approve(id: string) {
    const res = await fetch(`/api/operations/${tenantId}/ai-actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const data = await res.json();
    if (data.success) {
      load();
      alert("Doctor approved. Output can now be patient-visible if physician chooses.");
    }
  }

  const pending = actions.filter((action) => action.status !== "DoctorApproved").length;
  const approved = actions.length - pending;

  return (
    <PageShell>
      <PageHeader
        icon={Brain}
        eyebrow="Clinical intelligence"
        title="Clinic AI engine"
        description="Visit summaries, SOAP generation, treatment suggestions, interaction checks, OCR, translation, voice notes and coding assistance."
        actions={
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-teal-600 px-4 text-xs font-semibold shadow-sm hover:bg-teal-700"
            onClick={() => setModal(true)}
          >
            <Sparkles className="h-4 w-4" />
            Run AI assist
          </Button>
        }
      />

      <AiSafetyNotice />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Logged actions" value={actions.length} hint="All capabilities" icon={ClipboardList} tone="teal" />
        <StatCard label="Pending review" value={pending} hint="Awaiting a physician" icon={ShieldCheck} tone="amber" />
        <StatCard label="Approved" value={approved} hint="Signed off" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Capabilities" value={AI_FEATURE_KEYS.length} hint="Assistive workflows" icon={Brain} tone="cyan" />
      </div>

      <AiFeatureGrid />

      <section className="space-y-4">
        <SectionHeading
          title="Review queue"
          count={actions.length}
          description="Physician approval is required before any output becomes patient-visible."
        />

        {loading ? (
          <LoadingBlock label="Loading AI actions" />
        ) : actions.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="No AI actions logged yet"
            description="Run an assist to draft a summary, SOAP note or follow-up suggestion for physician review."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {actions.map((action) => (
              <AiActionCard key={action.id} action={action} onApprove={() => approve(action.id)} />
            ))}
          </div>
        )}
      </section>

      <AiAssistDialog
        open={modal}
        onOpenChange={setModal}
        features={AI_FEATURE_KEYS}
        patients={patients}
        staff={staff}
        submitting={submitting}
        onSubmit={run}
      />
    </PageShell>
  );
}
