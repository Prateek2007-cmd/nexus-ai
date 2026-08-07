import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard } from "@/components/ui-kit";
import { services } from "@/lib/mock";
import { Award, BookOpen, Bus, HelpCircle, Home, LifeBuoy } from "lucide-react";
import { Reveal, TiltCard } from "@/components/fx/motion";
import { EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Student Services Agent — Hostel, Library & Grievances | CampusX AI" },
      { name: "description", content: "Hostel, library, scholarships, transport and grievance handling, resolved autonomously by the CampusX Student Services Agent." },
      { property: "og:title", content: "Student Services Agent — CampusX AI" },
      { property: "og:description", content: "Every campus service in one autonomous agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Services,
});

const ICONS = { home: Home, book: BookOpen, award: Award, bus: Bus, life: LifeBuoy, help: HelpCircle };

function Services() {
  return (
    <AppShell title="Student Services Agent" subtitle="Hostel · library · scholarships · transport · grievances">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Tickets" value="0" detail="Nothing pending" tone="emerald" />
        <StatCard label="Library Items" value="2" detail="1 due in 2 days" tone="amber" />
        <StatCard label="Hostel Dues" value="Cleared" detail="Receipt #4821" tone="primary" />
        <StatCard label="Scholarships" value="1 open" detail="Merit · closes Aug 30" tone="violet" delay={0.1} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => {
          const Icon = ICONS[s.icon as keyof typeof ICONS];
          return (
            <Reveal key={s.name} delay={i * 0.05}>
              <TiltCard className="h-full">
                <Icon className="h-5 w-5 text-cyan" />
                <p className="mt-4 font-display text-sm font-semibold">{s.name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>

      <Panel title="Grievance Tracker" className="mt-4" delay={0.1}>
        <EmptyState
          icon={LifeBuoy}
          title="No open grievances"
          body="When you raise one, the agent routes it to the right department, tracks SLA and escalates automatically."
          actionLabel="Raise a grievance"
        />
      </Panel>
    </AppShell>
  );
}
