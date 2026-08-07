import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { events } from "@/lib/mock";
import { CalendarPlus, Users } from "lucide-react";
import { Reveal, TiltCard } from "@/components/fx/motion";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events Agent — Workshops, Hackathons & Registration | CampusX AI" },
      { name: "description", content: "Discover campus workshops and hackathons, auto-register, sync to calendar and receive reminders through the CampusX Events Agent." },
      { property: "og:title", content: "Events Agent — CampusX AI" },
      { property: "og:description", content: "Autonomous event discovery, registration and reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Events,
});

function Events() {
  return (
    <AppShell title="Events Agent" subtitle="Discovery · registration · reminders">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming" value="12" detail="Next 30 days" tone="primary" />
        <StatCard label="Registered" value="3" detail="All synced to calendar" tone="emerald" />
        <StatCard label="Recommended" value="5" detail="Matched to your interests" tone="violet" />
        <StatCard label="Reminders Set" value="7" detail="T-60min default" tone="cyan" delay={0.1} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {events.map((e, i) => (
          <Reveal key={e.title} delay={i * 0.06}>
            <TiltCard className="sheen h-full">
              <div className="flex items-start justify-between">
                <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan">
                  {e.tag}
                </span>
                <span className="font-display text-sm font-semibold">{e.date}</span>
              </div>
              <p className="mt-4 font-display text-lg font-semibold">{e.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{e.org}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {e.seats} seats left
                </span>
                <GlowButton className="px-3.5 py-2 text-xs">
                  <CalendarPlus className="h-3.5 w-3.5" /> Register
                </GlowButton>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Panel title="Agent Actions Queued" className="mt-4" delay={0.1}>
        <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
          {[
            "events.register(student=22B81A05xx, event=wk-2026-08-21)",
            "calendar.create_event(title='Placement Prep Bootcamp', at='2026-08-21T10:00')",
            "notification.schedule(offset=-60m, channel=push+email)",
          ].map((l) => (
            <li key={l} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">{l}</li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
