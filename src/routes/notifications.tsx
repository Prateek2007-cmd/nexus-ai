import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { notifications as initialNotifications } from "@/lib/mock";
import { motion } from "framer-motion";
import { Bell, Check, Trash2 } from "lucide-react";

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
  const [items, setItems] = useState(
    initialNotifications.map((n, idx) => ({ ...n, id: idx, read: false }))
  );

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setItems([]);
  };

  const toggleRead = (id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <AppShell title="Notification Agent" subtitle="Proactive nudges · deadlines · escalations">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unread" value={String(unreadCount)} detail="2 high priority" tone="amber" />
        <StatCard label="Sent Today" value="23" detail="Push + email" tone="primary" />
        <StatCard label="Open Rate" value="94%" detail="7-day average" tone="emerald" />
        <StatCard label="Muted Channels" value="1" detail="Marketing digest" tone="violet" delay={0.1} />
      </div>

      <Panel
        title="Agent Inbox"
        className="mt-4"
        actions={
          <div className="flex items-center gap-2">
            <GlowButton onClick={markAllRead} variant="ghost" className="px-2.5 py-1 text-xs">
              <Check className="h-3 w-3" /> Mark all read
            </GlowButton>
            <GlowButton onClick={clearAll} variant="ghost" className="px-2.5 py-1 text-xs">
              <Trash2 className="h-3 w-3" /> Clear inbox
            </GlowButton>
          </div>
        }
      >
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((n, i) => (
              <motion.div
                key={n.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggleRead(n.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  n.read
                    ? "border-border/40 bg-surface/20 opacity-60"
                    : "border-border/80 bg-surface/60 hover:border-primary/40"
                }`}
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background">
                  <Bell className={`h-3.5 w-3.5 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-block rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan">
                      {n.tone}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {n.read ? "Read" : "Click to mark read"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-surface/20 p-8 text-center text-xs text-muted-foreground">
            Inbox is clear. No unread agent notifications.
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
