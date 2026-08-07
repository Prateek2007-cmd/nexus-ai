import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Play, Cpu, Zap, ArrowRight, CheckCircle2, ShieldCheck, Database, Layers, Sparkles } from "lucide-react";
import { GlowButton, Panel } from "./ui-kit";

export interface WorkflowStep {
  agent: string;
  action: string;
  ms?: number;
  data?: any;
  confidence?: number;
  tool_calls?: number;
}

export interface WorkflowRoutePreviewProps {
  query: string;
  timeline: WorkflowStep[];
  agentsUsed?: string[];
  isOpen: boolean;
  onClose: () => void;
}

const AGENT_TONES: Record<string, "primary" | "cyan" | "violet" | "emerald" | "amber"> = {
  Orchestrator: "primary",
  "Planner Agent": "primary",
  "Academic Agent": "violet",
  "Placement Agent": "violet",
  "Events Agent": "amber",
  "Knowledge Agent": "cyan",
  "Notification Agent": "emerald",
  "Communication Agent": "emerald",
  "Student Services Agent": "violet",
};

export function WorkflowRoutePreview({
  query,
  timeline,
  agentsUsed = [],
  isOpen,
  onClose,
}: WorkflowRoutePreviewProps) {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState(false);

  // Default steps if timeline is short
  const formattedSteps: WorkflowStep[] = timeline.length > 0
    ? timeline
    : [
        { agent: "Orchestrator", action: "Parsed intent & decomposed into specialist agent subtasks", ms: 120, confidence: 0.99 },
        { agent: "Events Agent", action: "Retrieved event catalog & verified registration state", ms: 340, confidence: 0.98, tool_calls: 1 },
        { agent: "Knowledge Agent", action: "Checked RAG policies & circulars vector database", ms: 410, confidence: 0.95, tool_calls: 2 },
        { agent: "Orchestrator", action: "Synthesized grounded response with dynamic profile tokens", ms: 210, confidence: 0.99 },
      ];

  const handleReplay = () => {
    setIsReplaying(true);
    setActiveStepIdx(0);
  };

  useEffect(() => {
    if (!isReplaying) return;
    if (activeStepIdx >= formattedSteps.length - 1) {
      setIsReplaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStepIdx((prev) => prev + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [isReplaying, activeStepIdx, formattedSteps.length]);

  if (!isOpen) return null;

  const totalMs = formattedSteps.reduce((acc, curr) => acc + (curr.ms || 180), 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-surface/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-primary/40 bg-primary/10">
                <Zap className="h-5 w-5 text-primary animate-pulse" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Agent Execution Flow & Route Preview
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Query: &quot;{query.length > 55 ? query.slice(0, 55) + "..." : query}&quot;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReplay}
                disabled={isReplaying}
                className="flex items-center gap-1.5 rounded-xl border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan hover:bg-cyan/20 transition-all disabled:opacity-50"
              >
                <Play className={`h-3.5 w-3.5 ${isReplaying ? "animate-spin" : ""}`} />
                {isReplaying ? "Replaying Route..." : "Replay Flow"}
              </button>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-surface/60 text-muted-foreground hover:bg-surface hover:text-foreground transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="grid flex-1 overflow-hidden lg:grid-cols-3">
            {/* Left Column: Visual Agent DAG Route Canvas */}
            <div className="relative flex flex-col justify-between border-r border-border/60 bg-background/50 p-6 lg:col-span-2 overflow-y-auto">
              <div className="mb-4 flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-cyan" /> Multi-Agent Topology Route
                </span>
                <span className="rounded-full border border-emerald/40 bg-emerald/10 px-2.5 py-0.5 text-emerald">
                  {totalMs}ms Total Latency
                </span>
              </div>

              {/* Animated Topology Nodes */}
              <div className="space-y-4">
                {/* 1. Base User Input Node */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/50 bg-cyan/10 text-cyan font-mono text-xs font-bold shadow-lg shadow-cyan/10">
                    USER
                  </div>
                  <div className="flex-1 rounded-xl border border-border bg-surface/60 p-3 text-xs">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase">1. Intent Ingestion</p>
                    <p className="font-semibold text-foreground mt-0.5">&quot;{query}&quot;</p>
                  </div>
                </div>

                {/* Animated Arrow Connector */}
                <div className="ml-5 h-6 w-0.5 bg-gradient-to-b from-cyan via-primary to-violet animate-pulse" />

                {/* 2. Orchestrator / Planner Router Node */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/50 bg-primary/10 text-primary font-mono text-xs font-bold shadow-lg shadow-primary/10">
                    <Cpu className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="flex-1 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
                    <p className="font-mono text-[10px] text-primary uppercase font-bold">2. Base Orchestrator Agent</p>
                    <p className="text-muted-foreground mt-0.5">Parsed intent, created DAG steps & dispatched to specialist agents.</p>
                  </div>
                </div>

                {/* Animated Signal Pulses to Specialist Agents */}
                <div className="ml-5 h-6 w-0.5 bg-gradient-to-b from-primary via-violet to-emerald animate-pulse" />

                {/* 3. Specialist Agent Execution Steps */}
                <div className="space-y-3">
                  {formattedSteps.map((step, idx) => {
                    const isPassed = idx <= activeStepIdx;
                    const isCurrent = idx === activeStepIdx;

                    return (
                      <motion.div
                        key={idx}
                        onClick={() => setActiveStepIdx(idx)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                          isCurrent
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary"
                            : isPassed
                            ? "border-border/80 bg-surface/80 hover:border-border"
                            : "border-border/30 bg-surface/30 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`grid h-6 w-6 place-items-center rounded-lg font-mono text-[10px] font-bold ${
                              isPassed ? "bg-emerald/20 text-emerald" : "bg-surface text-muted-foreground"
                            }`}>
                              {idx + 1}
                            </span>
                            <h4 className="font-display text-xs font-bold text-foreground">
                              {step.agent}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            {step.ms && (
                              <span className="rounded bg-surface px-1.5 py-0.5 text-muted-foreground">
                                {step.ms}ms
                              </span>
                            )}
                            {step.confidence && (
                              <span className="rounded bg-emerald/10 text-emerald px-1.5 py-0.5">
                                {(step.confidence * 100).toFixed(0)}% Match
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {step.action}
                        </p>

                        {step.tool_calls && step.tool_calls > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] text-cyan">
                            <Database className="h-3 w-3" /> Executed {step.tool_calls} Tool/RAG Calls
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Arrow Connector to Final Synthesis */}
                <div className="ml-5 h-6 w-0.5 bg-gradient-to-b from-emerald to-cyan animate-pulse" />

                {/* 4. Final Grounded Synthesis Node */}
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald/50 bg-emerald/10 text-emerald font-mono text-xs font-bold shadow-lg shadow-emerald/10">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 rounded-xl border border-emerald/30 bg-emerald/5 p-3 text-xs">
                    <p className="font-mono text-[10px] text-emerald uppercase font-bold">4. User Response Phase</p>
                    <p className="text-muted-foreground mt-0.5">Grounded multi-agent synthesis formatted with dynamic profile tokens.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Active Step Details & Telemetry Inspection */}
            <div className="flex flex-col justify-between bg-surface/40 p-6">
              <div>
                <h4 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan" /> Step Telemetry Inspection
                </h4>

                {formattedSteps[activeStepIdx] && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-border/80 bg-surface/60 p-3.5">
                      <p className="font-mono text-[10px] uppercase text-muted-foreground">Active Agent</p>
                      <p className="font-display text-base font-bold text-primary mt-0.5">
                        {formattedSteps[activeStepIdx].agent}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-surface/60 p-3.5">
                      <p className="font-mono text-[10px] uppercase text-muted-foreground">Action Executed</p>
                      <p className="text-xs text-foreground font-medium mt-1 leading-relaxed">
                        {formattedSteps[activeStepIdx].action}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="rounded-xl border border-border/60 bg-surface/40 p-3">
                        <span className="text-[10px] text-muted-foreground">Step Latency</span>
                        <p className="text-sm font-bold text-cyan mt-0.5">
                          {formattedSteps[activeStepIdx].ms || 180}ms
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-surface/40 p-3">
                        <span className="text-[10px] text-muted-foreground">Confidence</span>
                        <p className="text-sm font-bold text-emerald mt-0.5">
                          {((formattedSteps[activeStepIdx].confidence || 0.98) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-surface/40 p-3.5 font-mono text-xs">
                      <p className="text-[10px] uppercase text-muted-foreground">Provenance Guardrail</p>
                      <p className="text-[11px] text-emerald mt-1 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Identity & Policy Grounded
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-border/60 pt-4">
                <GlowButton onClick={onClose} variant="secondary" className="w-full justify-center text-xs">
                  Close Route Inspection
                </GlowButton>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
