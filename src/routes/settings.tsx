import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, GlowButton } from "@/components/ui-kit";
import { agents } from "@/lib/mock";
import { useState } from "react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Agent Autonomy & Preferences | CampusX AI" },
      { name: "description", content: "Tune agent autonomy levels, notification channels, memory retention and tool permissions for the CampusX multi-agent platform." },
      { property: "og:title", content: "Settings — CampusX AI" },
      { property: "og:description", content: "Control autonomy, permissions and memory for your campus agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Toggle({ label, hint, initial = true }: { label: string; hint: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-surface/40 p-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        aria-label={label}
        className="relative h-6 w-11 shrink-0 rounded-full border border-border transition-colors"
        style={{ background: on ? "var(--primary)" : "var(--muted)" }}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-0.5 h-4.5 w-4.5 rounded-full bg-background"
          style={{ left: on ? 22 : 3, height: 18, width: 18 }}
        />
      </button>
    </div>
  );
}

function Settings() {
  return (
    <AppShell title="Settings" subtitle="Autonomy · permissions · memory · channels">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Agent Autonomy">
          <div className="space-y-2.5">
            <Toggle label="Proactive actions" hint="Agents may act before you ask, within policy." />
            <Toggle label="Confirm irreversible steps" hint="Ask before registrations, submissions or payments." />
            <Toggle label="Auto-sync calendar" hint="Write agent-created events straight to your calendar." />
            <Toggle label="Cross-agent delegation" hint="Let the orchestrator chain specialists automatically." />
          </div>
        </Panel>

        <Panel title="Channels & Memory" delay={0.06}>
          <div className="space-y-2.5">
            <Toggle label="Push notifications" hint="Real-time nudges on device." />
            <Toggle label="Email digest" hint="Daily summary at 08:00." initial={false} />
            <Toggle label="Persistent memory" hint="Remember preferences across sessions." />
            <Toggle label="Share anonymized telemetry" hint="Helps improve routing accuracy." initial={false} />
          </div>
        </Panel>
      </div>

      <Panel title="Tool Permissions" className="mt-4" delay={0.1}>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((a) => (
            <div key={a.id} className="rounded-xl border border-border/60 bg-surface/40 p-3">
              <p className="text-xs font-medium">{a.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-emerald">granted</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <GlowButton variant="ghost" className="px-4 py-2 text-xs">Reset defaults</GlowButton>
          <GlowButton className="px-4 py-2 text-xs">Save changes</GlowButton>
        </div>
      </Panel>
    </AppShell>
  );
}
