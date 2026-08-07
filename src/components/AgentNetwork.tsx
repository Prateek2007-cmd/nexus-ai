import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NodeDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  tone: "primary" | "cyan" | "violet" | "emerald" | "amber";
  kind?: "endpoint";
};

const NODES: NodeDef[] = [
  { id: "user", label: "User", x: 50, y: 6, tone: "cyan", kind: "endpoint" },
  { id: "orchestrator", label: "Orchestrator", x: 50, y: 26, tone: "primary" },
  { id: "academic", label: "Academic", x: 8, y: 52, tone: "violet" },
  { id: "placement", label: "Placement", x: 22, y: 52, tone: "violet" },
  { id: "events", label: "Events", x: 36, y: 52, tone: "violet" },
  { id: "knowledge", label: "Knowledge · RAG", x: 50, y: 52, tone: "cyan" },
  { id: "services", label: "Services", x: 64, y: 52, tone: "violet" },
  { id: "communication", label: "Comms", x: 78, y: 52, tone: "violet" },
  { id: "notification", label: "Notify", x: 92, y: 52, tone: "violet" },
  { id: "apis", label: "External Tools & APIs", x: 50, y: 76, tone: "amber" },
  { id: "response", label: "Final Response", x: 50, y: 94, tone: "emerald", kind: "endpoint" },
];

const SPECIALISTS = NODES.filter((n) => n.y === 52).map((n) => n.id);

const LINKS: [string, string][] = [
  ["user", "orchestrator"],
  ...SPECIALISTS.map((s) => ["orchestrator", s] as [string, string]),
  ...SPECIALISTS.map((s) => [s, "apis"] as [string, string]),
  ["apis", "response"],
];

const TONE: Record<NodeDef["tone"], string> = {
  primary: "var(--primary)",
  cyan: "var(--cyan)",
  violet: "var(--violet)",
  emerald: "var(--emerald)",
  amber: "var(--amber)",
};

const PHASES = [
  { active: ["user", "orchestrator"], status: "Thinking" },
  { active: ["orchestrator"], status: "Planning" },
  { active: ["orchestrator", "placement", "knowledge"], status: "Retrieving Knowledge" },
  { active: ["placement", "events", "apis"], status: "Calling APIs" },
  { active: ["notification", "communication", "apis"], status: "Reasoning" },
  { active: ["orchestrator", "response"], status: "Completed" },
];

function node(id: string) {
  return NODES.find((n) => n.id === id)!;
}

/** Live multi-agent network: pulsing nodes, animated links, travelling data packets. */
export function AgentNetwork({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 2200);
    return () => clearInterval(t);
  }, []);

  const current = PHASES[phase]!;
  const isActive = (id: string) => current.active.includes(id);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-3xl glass", className)}>
      <div className="absolute inset-0 grid-fade opacity-50" />

      <div className="relative flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            live agent network
          </span>
        </div>
        <motion.span
          key={current.status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] text-cyan"
        >
          {current.status}
        </motion.span>
      </div>

      <div className={cn("relative w-full", compact ? "h-[380px]" : "h-[560px]")}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {LINKS.map(([a, b], i) => {
            const A = node(a);
            const B = node(b);
            const on = isActive(a) && isActive(b);
            return (
              <g key={`${a}-${b}`}>
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke={on ? TONE[B.tone] : "oklch(1 0 0 / 12%)"}
                  strokeWidth={on ? 0.4 : 0.18}
                  vectorEffect="non-scaling-stroke"
                  opacity={on ? 0.95 : 0.5}
                />
                {on && (
                  <circle r="0.7" fill={TONE[B.tone]}>
                    <animate
                      attributeName="cx"
                      values={`${A.x};${B.x}`}
                      dur="1.1s"
                      repeatCount="indefinite"
                      begin={`${(i % 4) * 0.18}s`}
                    />
                    <animate
                      attributeName="cy"
                      values={`${A.y};${B.y}`}
                      dur="1.1s"
                      repeatCount="indefinite"
                      begin={`${(i % 4) * 0.18}s`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {NODES.map((n) => {
          const on = isActive(n.id);
          return (
            <motion.div
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              animate={on ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 1.4, repeat: on ? Infinity : 0 }}
            >
              <div
                className={cn(
                  "whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-center text-[10px] font-medium transition-all duration-500 sm:px-3 sm:text-xs",
                  n.kind === "endpoint" ? "rounded-full" : "",
                  on ? "border-transparent text-foreground" : "border-border bg-surface/70 text-muted-foreground",
                )}
                style={
                  on
                    ? {
                        background: `color-mix(in oklab, ${TONE[n.tone]} 22%, transparent)`,
                        boxShadow: `0 0 26px color-mix(in oklab, ${TONE[n.tone]} 55%, transparent)`,
                        borderColor: TONE[n.tone],
                      }
                    : undefined
                }
              >
                {n.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
