import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard } from "@/components/ui-kit";
import { motion } from "framer-motion";
import { schedule } from "@/lib/mock";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Agent-Synced Campus Schedule | CampusX AI" },
      { name: "description", content: "A unified schedule of classes, exams, drives and events kept in sync automatically by the CampusX agents." },
      { property: "og:title", content: "Calendar — CampusX AI" },
      { property: "og:description", content: "Your campus week, orchestrated by autonomous agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage() {
  return (
    <AppShell title="Calendar" subtitle="Classes · exams · drives · events — auto-synced">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="This Week" value="18" detail="Scheduled blocks" tone="primary" />
        <StatCard label="Conflicts Resolved" value="2" detail="By orchestrator" tone="emerald" />
        <StatCard label="Deadlines" value="4" detail="Nearest in 2 days" tone="amber" />
        <StatCard label="Auto-Added" value="6" detail="From agent actions" tone="violet" delay={0.1} />
      </div>

      <Panel title="Week View" className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {DAYS.map((d, di) => (
            <div key={d} className="rounded-xl border border-border/60 bg-surface/40 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{d}</p>
              <div className="mt-3 space-y-2">
                {schedule
                  .filter((_, i) => i % DAYS.length === di)
                  .map((s, i) => (
                    <motion.div
                      key={s.title + i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: di * 0.05 + i * 0.04 }}
                      className="rounded-lg border-l-2 bg-background/60 px-2.5 py-2"
                      style={{ borderLeftColor: `var(--${s.tone})` }}
                    >
                      <p className="truncate text-[11px] font-medium">{s.title}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{s.time}</p>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
