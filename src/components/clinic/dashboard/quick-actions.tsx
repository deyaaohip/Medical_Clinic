"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, Contact, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/clinic/ui/section-heading";

type Shortcut = {
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  cta: string;
  href: (tenantId: string) => string;
  accent: string;
  button: string;
  ring: string;
};

const shortcuts: Shortcut[] = [
  {
    icon: Contact,
    badge: "Unlimited records",
    title: "Patient master directory & EMR",
    description: "Search medical records, review allergies, log vital signs and attach imaging.",
    cta: "Launch patient system",
    href: (tenantId) => `/${tenantId}/patients`,
    accent: "bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900",
    button: "bg-teal-600 hover:bg-teal-700",
    ring: "hover:border-teal-300 dark:hover:border-teal-800",
  },
  {
    icon: CalendarClock,
    badge: "Bidi calendar",
    title: "Master interactive calendar",
    description: "Switch day, week or month views, or filter schedules by physician and room.",
    cta: "Open calendar hub",
    href: (tenantId) => `/${tenantId}/appointments/calendar`,
    accent:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
    button: "bg-emerald-600 hover:bg-emerald-700",
    ring: "hover:border-emerald-300 dark:hover:border-emerald-800",
  },
  {
    icon: ListOrdered,
    badge: "Real-time",
    title: "Live front-desk triage queue",
    description: "Manage waiting lists, inspect estimated call times and dispatch WhatsApp alerts.",
    cta: "Inspect live queues",
    href: (tenantId) => `/${tenantId}/queues`,
    accent: "bg-cyan-50 text-cyan-700 ring-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900",
    button: "bg-cyan-600 hover:bg-cyan-700",
    ring: "hover:border-cyan-300 dark:hover:border-cyan-800",
  },
];

/** Three module shortcuts shown under the KPIs. */
export function QuickActions({ tenantId }: { tenantId: string }) {
  const router = useRouter();

  return (
    <section className="space-y-4">
      <SectionHeading
        title="Module shortcuts"
        description="Jump straight into the workflows your front desk uses most."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <article
              key={shortcut.title}
              className={`flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${shortcut.ring}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${shortcut.accent}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <Badge variant="outline" className="text-[10px] font-medium text-slate-500">
                    {shortcut.badge}
                  </Badge>
                </div>

                <h3 className="mt-4 text-[15px] font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
                  {shortcut.title}
                </h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {shortcut.description}
                </p>
              </div>

              <Button
                className={`mt-5 w-full gap-2 text-xs font-semibold text-white ${shortcut.button}`}
                onClick={() => router.push(shortcut.href(tenantId))}
              >
                {shortcut.cta}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
