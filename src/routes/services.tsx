import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { services } from "@/lib/mock";
import { Award, BookOpen, Bus, HelpCircle, Home, LifeBuoy, CheckCircle2, Plus } from "lucide-react";
import { Reveal, TiltCard } from "@/components/fx/motion";

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

type Ticket = { id: string; category: string; description: string; status: string; date: string };

function Services() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Hostel");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newTicket: Ticket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      description,
      status: "In Progress (SLA: 24h)",
      date: "Just now",
    };

    setTickets([newTicket, ...tickets]);
    setDescription("");
    setShowForm(false);
  };

  return (
    <AppShell title="Student Services Agent" subtitle="Hostel · library · scholarships · transport · grievances">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Tickets" value={String(tickets.length)} detail={tickets.length > 0 ? "Agent tracking SLA" : "Nothing pending"} tone="emerald" />
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

      <Panel title="Autonomous Grievance Tracker" className="mt-4" delay={0.1}>
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/80 bg-surface/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Raise a Campus Grievance / Service Request</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Department</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                >
                  <option value="Hostel Maintenance">Hostel Maintenance</option>
                  <option value="Library Services">Library Services</option>
                  <option value="Transport & Shuttle">Transport & Shuttle</option>
                  <option value="Scholarship / Accounts">Scholarship / Accounts</option>
                  <option value="Academic Support">Academic Support</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Issue Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your request or grievance..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
            </div>
            <GlowButton type="submit" className="px-4 py-2 text-xs">
              <Plus className="h-3.5 w-3.5" /> Submit to Services Agent
            </GlowButton>
          </form>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                The Student Services Agent automatically routes tickets, monitors SLAs, and notifies authorities.
              </p>
              <GlowButton onClick={() => setShowForm(true)} className="px-3.5 py-2 text-xs">
                <Plus className="h-3.5 w-3.5" /> Raise Grievance
              </GlowButton>
            </div>

            {tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-surface/40 p-3 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-cyan">{t.id}</span> — <span className="font-semibold">{t.category}</span>
                      <p className="mt-0.5 text-muted-foreground">{t.description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald">
                      <CheckCircle2 className="h-3 w-3" /> {t.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-surface/20 p-6 text-center text-xs text-muted-foreground">
                No open tickets. Click "Raise Grievance" above to submit an issue.
              </div>
            )}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
