import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { getAllEvents, registerEventInStore, unregisterEventInStore, type CampusEvent } from "@/lib/events-store";
import { CalendarPlus, Check, Users } from "lucide-react";
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
  const [eventList, setEventList] = useState<CampusEvent[]>(() => getAllEvents());
  const [actionLogs, setActionLogs] = useState<string[]>([
    "events.register(student=22B81A05xx, event='Placement Prep Bootcamp')",
    "calendar.create_event(title='Placement Prep Bootcamp', at='2026-08-21T10:00')",
    "notification.schedule(offset=-60m, channel=push+email)",
  ]);

  const refreshEvents = () => {
    setEventList(getAllEvents());
  };

  useEffect(() => {
    refreshEvents();
    window.addEventListener("campusx_events_updated", refreshEvents);
    return () => {
      window.removeEventListener("campusx_events_updated", refreshEvents);
    };
  }, []);

  const toggleRegister = (title: string, date: string, currentlyRegistered: boolean) => {
    if (currentlyRegistered) {
      unregisterEventInStore(title);
      setActionLogs((logs) => [
        `events.unregister(student=22B81A05xx, event='${title}')`,
        ...logs,
      ]);
    } else {
      registerEventInStore(title, date);
      setActionLogs((logs) => [
        `events.register(student=22B81A05xx, event='${title}')`,
        `calendar.create_event(title='${title}', at='${date}')`,
        `notification.schedule(offset=-60m, channel=push+email)`,
        ...logs,
      ]);
    }
    refreshEvents();
  };

  const registeredCount = eventList.filter((e) => e.registered).length;

  return (
    <AppShell title="Events Agent" subtitle="Discovery · registration · reminders">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming" value={String(eventList.length)} detail="Next 30 days" tone="primary" />
        <StatCard label="Registered" value={String(registeredCount)} detail="All synced to calendar" tone="emerald" />
        <StatCard label="Recommended" value="5" detail="Matched to your interests" tone="violet" />
        <StatCard label="Reminders Set" value={String(registeredCount * 2)} detail="T-60min default" tone="cyan" delay={0.1} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {eventList.map((e, i) => (
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
                <GlowButton
                  onClick={() => toggleRegister(e.title, e.date, e.registered)}
                  variant={e.registered ? "ghost" : "primary"}
                  className="px-3.5 py-2 text-xs"
                >
                  {e.registered ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald" /> Registered
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="h-3.5 w-3.5" /> Register
                    </>
                  )}
                </GlowButton>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <Panel title="Live Agent Execution Logs" className="mt-4" delay={0.1}>
        <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
          {actionLogs.slice(0, 6).map((l, idx) => (
            <li key={idx} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
              <span className="text-cyan">[AUTONOMOUS ACTION]</span> {l}
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
