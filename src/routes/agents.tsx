import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { AgentNetwork } from "@/components/AgentNetwork";
import { Panel, StatusDot } from "@/components/ui-kit";
import { Counter, Reveal, TiltCard } from "@/components/fx/motion";
import { agents, STATUS_LABEL } from "@/lib/mock";
import { fetchApi } from "@/lib/api";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agent Network — Live Multi-Agent Topology | CampusX AI" },
      { name: "description", content: "Inspect the live CampusX agent mesh: orchestrator routing, specialist agents, RAG retrieval and external tool calls with per-node status." },
      { property: "og:title", content: "Agent Network — CampusX AI" },
      { property: "og:description", content: "Live topology of the CampusX autonomous agent mesh." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Agents,
});

const STATES = Object.values(STATUS_LABEL);

function Agents() {
  const [liveAgents, setLiveAgents] = useState(agents);

  useEffect(() => {
    fetchApi<any[]>("/agents").then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setLiveAgents(data);
      }
    });
  }, []);

  return (
    <AppShell title="Agent Network" subtitle="Live orchestration topology and specialist health">
      <AgentNetwork />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {liveAgents.map((a, i) => (
          <Reveal key={a.id} delay={i * 0.04}>
            <TiltCard className="h-full">
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface">
                  <Bot className="h-4 w-4 text-primary" />
                </span>
                <StatusDot tone={i % 3 === 0 ? "cyan" : i % 3 === 1 ? "violet" : "emerald"} />
              </div>
              <p className="mt-4 font-display text-sm font-semibold">{a.name}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
                {a.status || STATES[i % STATES.length]}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
                <span>
                  <Counter value={a.tasks} /> tasks
                </span>
                <span className="text-emerald">{a.success}%</span>
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Agent-to-Agent Message Bus">
          <ul className="space-y-2 font-mono text-[11px]">
            {[
              "orchestrator → placement.check_eligibility({ rollNo, company })",
              "placement → knowledge.retrieve({ query: 'eligibility criteria' })",
              "knowledge → placement.result({ chunks: 6, score: 0.91 })",
              "orchestrator → events.register({ eventId: 'wk-2026-08-21' })",
              "events → notification.schedule({ offsetMin: -60 })",
              "orchestrator → user.respond({ grounded: true })",
            ].map((l) => (
              <li key={l} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2 text-muted-foreground">
                {l}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Fallback & Guardrails" delay={0.06}>
          <div className="space-y-3 text-xs text-muted-foreground">
            {[
              { t: "Retry with backoff", d: "3 attempts on transient tool failure, exponential jitter." },
              { t: "Degrade to retrieval", d: "If a tool is unreachable, answer from grounded knowledge only." },
              { t: "Human-in-the-loop", d: "Any irreversible action requires explicit user confirmation." },
              { t: "Provenance required", d: "Policy answers must cite a document chunk or they are rejected." },
            ].map((g) => (
              <div key={g.t} className="rounded-xl border border-border/60 bg-surface/40 p-3">
                <p className="text-xs font-medium text-foreground">{g.t}</p>
                <p className="mt-0.5">{g.d}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
