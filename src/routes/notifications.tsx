import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard } from "@/components/ui-kit";
import { notifications } from "@/lib/mock";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center — Proactive Agent Alerts | CampusX AI" },
      { name: "description", content: "Deadline nudges, drive alerts, attendance warnings and event reminders pushed proactively by the CampusX Notification Agent." },
      { property: "og:title", content: "Notification Center — CampusX AI" },
      { property: "og:description", content: "Proactive, prioritized alerts from your campus agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  return (
    <AppShell title="Notification Agent" subtitle="Proactive nudges · deadlines · escalations">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unread" value="5" detail="2 high priority" tone="amber" />
        <StatCard label="Sent Today" value="23" detail="Push + email" tone="primary" />
        <StatCard label="Open Rate" value="94%" detail="7-day average" tone="emerald" />
        <StatCard label="Muted Channels" value="1" detail="Marketing digest" tone="violet" delay={0.1} />
      </div>

      <Panel title="Inbox" className="mt-4">
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-3.5 transition-colors hover:border-primary/40"
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background">
                <Bell className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <span className="mt-2 inline-block rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan">
                  {n.tone}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
