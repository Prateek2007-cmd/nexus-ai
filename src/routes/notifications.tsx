import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { notifications as initialNotifications } from "@/lib/mock";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Plus, Sparkles, AlertCircle, ShieldAlert, BookOpen, Briefcase } from "lucide-react";
import { Reveal } from "@/components/fx/motion";

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

type NotifItem = {
  id: string | number;
  title: string;
  body: string;
  time: string;
  tone: string;
  read: boolean;
  source_agent?: string;
};

function Notifications() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("unread");
  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          setLoading(false);
          return;
        }
      }
    } catch {}
    setItems(initialNotifications.map((n, idx) => ({ ...n, id: `mock-${idx}`, read: false })));
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch {}
  };

  const clearAll = async () => {
    setItems([]);
    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch {}
  };

  const toggleRead = async (id: string | number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
    try {
      await fetch(`/api/notifications/${id}/toggle-read`, { method: "POST" });
    } catch {}
  };

  const triggerAgentNudge = async () => {
    setIsTriggering(true);
    const sampleNudges = [
      { title: "ServiceNow Drive Deadline Tomorrow", body: "Registration closes at 11:59 PM. Ensure your ATS resume score is above 80%.", tone: "amber", source_agent: "placement" },
      { title: "Attendance Warning — Compiler Design", body: "Current attendance: 74%. 2 consecutive missed classes will drop you below eligibility threshold.", tone: "amber", source_agent: "academic" },
      { title: "Agentic AI Hackathon Registration Confirmed", body: "Your team 'Vasavi Innovators' is registered for Room AI-Lab on Aug 18.", tone: "cyan", source_agent: "events" },
      { title: "IEEE Xplore Access Granted", body: "VCE Central Library digital remote access activated for your student account.", tone: "emerald", source_agent: "knowledge" },
    ];

    const randomNudge = sampleNudges[Math.floor(Math.random() * sampleNudges.length)];

    try {
      const res = await fetch("/api/notifications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(randomNudge),
      });

      if (res.ok) {
        const newNotif = await res.json();
        setItems((prev) => [newNotif, ...prev]);
      } else {
        const fallbackId = `custom-${Date.now()}`;
        setItems((prev) => [{ ...randomNudge, id: fallbackId, time: "Just now", read: false }, ...prev]);
      }
    } catch {
      const fallbackId = `custom-${Date.now()}`;
      setItems((prev) => [{ ...randomNudge, id: fallbackId, time: "Just now", read: false }, ...prev]);
    } finally {
      setIsTriggering(false);
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;
  const readCount = items.filter((n) => n.read).length;

  const filteredItems = items.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "read") return n.read;
    return true;
  });

  const getAgentIcon = (agent?: string) => {
    switch (agent) {
      case "placement":
        return <Briefcase className="h-3.5 w-3.5 text-primary" />;
      case "academic":
        return <AlertCircle className="h-3.5 w-3.5 text-amber" />;
      case "knowledge":
        return <BookOpen className="h-3.5 w-3.5 text-emerald" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-cyan" />;
    }
  };

  return (
    <AppShell title="Notification Agent" subtitle="Proactive nudges · deadlines · escalations · real-time campus alerts">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unread Nudges" value={String(unreadCount)} detail={unreadCount > 0 ? "Requires student action" : "Inbox up to date"} tone={unreadCount > 0 ? "amber" : "emerald"} />
        <StatCard label="Sent Today" value={`${items.length + 18}`} detail="Push + WebSocket stream" tone="primary" />
        <StatCard label="Agent Resolution" value="96.4%" detail="7-day automated actions" tone="cyan" />
        <StatCard label="Proactive Channels" value="4 Active" detail="Placement, Academic, Events, Library" tone="violet" delay={0.1} />
      </div>

      <Reveal delay={0.05} className="mt-4">
        <Panel
          title="Agent Inbox"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <GlowButton onClick={triggerAgentNudge} className="px-3 py-1 text-xs">
                <Sparkles className={`h-3.5 w-3.5 ${isTriggering ? "animate-spin" : ""}`} /> Trigger Agent Nudge
              </GlowButton>
              <GlowButton onClick={markAllRead} variant="ghost" className="px-2.5 py-1 text-xs">
                <Check className="h-3 w-3" /> Mark all read
              </GlowButton>
              <GlowButton onClick={clearAll} variant="ghost" className="px-2.5 py-1 text-xs">
                <Trash2 className="h-3 w-3" /> Clear inbox
              </GlowButton>
            </div>
          }
        >
          {/* Unread / Read Filter Tabs */}
          <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
            <button
              onClick={() => setActiveTab("unread")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-mono text-xs transition-all ${
                activeTab === "unread"
                  ? "bg-amber/20 text-amber border border-amber/40 font-semibold shadow-sm"
                  : "bg-surface/50 text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
              Unread ({unreadCount})
            </button>

            <button
              onClick={() => setActiveTab("read")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-mono text-xs transition-all ${
                activeTab === "read"
                  ? "bg-emerald/20 text-emerald border border-emerald/40 font-semibold shadow-sm"
                  : "bg-surface/50 text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <Check className="h-3 w-3 text-emerald" />
              Read ({readCount})
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 font-mono text-xs transition-all ${
                activeTab === "all"
                  ? "bg-primary/20 text-primary border border-primary/40 font-semibold shadow-sm"
                  : "bg-surface/50 text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <Bell className="h-3 w-3 text-primary" />
              All Notifications ({items.length})
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-sm text-muted-foreground">Loading proactive agent notifications...</div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {filteredItems.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleRead(n.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                      n.read
                        ? "border-border/40 bg-surface/20 opacity-60 hover:opacity-90"
                        : "border-border/80 bg-surface/60 shadow-sm hover:border-primary/50 hover:bg-surface/80"
                    }`}
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-background">
                      {getAgentIcon(n.source_agent)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                              n.tone === "primary"
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : n.tone === "amber"
                                ? "border-amber/40 bg-amber/10 text-amber"
                                : n.tone === "emerald"
                                ? "border-emerald/40 bg-emerald/10 text-emerald"
                                : "border-cyan/40 bg-cyan/10 text-cyan"
                            }`}
                          >
                            {n.tone}
                          </span>
                          {n.source_agent && (
                            <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                              agent:{n.source_agent}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {n.read ? "✓ Read" : "● Click to mark read"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-surface/20 p-8 text-center text-xs text-muted-foreground">
              Inbox is clear. Click <strong>"Trigger Agent Nudge"</strong> to simulate a real-time agent notification.
            </div>
          )}
        </Panel>
      </Reveal>
    </AppShell>
  );
}
