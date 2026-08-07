import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Network,
  Shield,
  Sparkle,
  Workflow,
  Zap,
  Gauge,
  Bot,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AICore } from "@/components/fx/AICore";
import { NeuralBackground } from "@/components/fx/NeuralBackground";
import { BootSequence } from "@/components/fx/BootSequence";
import { AgentNetwork } from "@/components/AgentNetwork";
import { Counter, Magnetic, Reveal, SectionHeading, TiltCard, WordReveal } from "@/components/fx/motion";
import { GlowButton, StatusDot } from "@/components/ui-kit";
import { Logo } from "@/components/layout/AppShell";
import { agents, heroStats, workflowTimeline } from "@/lib/mock";
import { AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusX AI — Autonomous Multi-Agent Intelligence Platform" },
      {
        name: "description",
        content:
          "CampusX AI orchestrates specialized autonomous agents across academics, placements, events and campus services — planning, retrieving and executing complete workflows.",
      },
      { property: "og:title", content: "CampusX AI — Autonomous Multi-Agent Intelligence Platform" },
      {
        property: "og:description",
        content:
          "An autonomous multi-agent AI platform for smart campuses: orchestration, RAG, tool calling and end-to-end workflow execution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const capabilities = [
  { icon: Workflow, title: "Autonomous Planning", body: "The orchestrator decomposes ambiguous requests into typed, ordered subtasks with fallbacks." },
  { icon: Network, title: "Multi-Agent Collaboration", body: "Eight specialists negotiate over a shared blackboard with A2A message passing." },
  { icon: Database, title: "Grounded RAG", body: "Vector retrieval across handbooks, circulars and policies with citation-level provenance." },
  { icon: GitBranch, title: "Tool & Function Calling", body: "Typed tool schemas for calendar, mail, registration, ERP and search endpoints." },
  { icon: Brain, title: "Persistent Memory", body: "Episodic and semantic memory keeps context across sessions, devices and agents." },
  { icon: Shield, title: "Guarded Execution", body: "Policy checks, human-in-the-loop approvals and graceful fallback on every action." },
];

const pipeline = [
  { icon: Sparkle, label: "Intent", detail: "Natural language understanding" },
  { icon: Layers, label: "Plan", detail: "Task graph construction" },
  { icon: Bot, label: "Delegate", detail: "Specialist agent routing" },
  { icon: Database, label: "Retrieve", detail: "RAG over campus corpus" },
  { icon: Zap, label: "Execute", detail: "Tool + API invocation" },
  { icon: Gauge, label: "Synthesize", detail: "Grounded final response" },
];

function Landing() {
  const [booting, setBooting] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  useEffect(() => {
    if (booting) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [booting]);

  return (
    <div className="relative">
      <AnimatePresence>{booting && <BootSequence onDone={() => setBooting(false)} />}</AnimatePresence>

      {/* Nav */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: booting ? 2.4 : 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/60 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#platform" className="transition-colors hover:text-foreground">Platform</a>
            <a href="#network" className="transition-colors hover:text-foreground">Agent Network</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">Workflows</a>
            <Link to="/dashboard" className="transition-colors hover:text-foreground">Command Center</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
              Sign in
            </Link>
            <Magnetic strength={0.2}>
              <Link to="/dashboard">
                <GlowButton className="px-4 py-2 text-xs">
                  Launch <ArrowRight className="h-3.5 w-3.5" />
                </GlowButton>
              </Link>
            </Magnetic>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} className="relative flex min-h-[100svh] items-center overflow-hidden pt-24">
        <NeuralBackground density={1.2} />
        <motion.div style={{ scale, opacity: fade }} className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[min(900px,90vw)] w-[min(900px,90vw)] -translate-x-1/2 -translate-y-1/2 opacity-90">
            <AICore />
          </div>
        </motion.div>

        <motion.div style={{ y, opacity: fade }} className="relative mx-auto w-full max-w-6xl px-5">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: booting ? 2.5 : 0.2, duration: 0.7 }}
              className="inline-flex items-center gap-2.5 rounded-full glass px-4 py-1.5"
            >
              <StatusDot />
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                8 agents online · orchestrator active
              </span>
            </motion.div>

            <h1 className="mt-8 font-display text-[clamp(3rem,11vw,9rem)] font-bold leading-[0.88] tracking-[-0.05em]">
              <span className="text-gradient drop-shadow-[0_0_60px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
                <WordReveal text="CampusX AI" />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: booting ? 2.9 : 0.55, duration: 0.9 }}
              className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl"
            >
              The Autonomous Multi-Agent Intelligence Platform — one system that reasons, plans,
              retrieves and executes across every campus service.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: booting ? 3.1 : 0.75, duration: 0.7 }}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
            >
              <Magnetic>
                <Link to="/dashboard">
                  <GlowButton>
                    <Cpu className="h-4 w-4" /> Launch Command Center
                  </GlowButton>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link to="/agents">
                  <GlowButton variant="ghost">
                    <Network className="h-4 w-4" /> View Live Agent Network
                  </GlowButton>
                </Link>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: booting ? 3.3 : 0.95, duration: 0.8 }}
              className="mt-16 grid w-full grid-cols-2 gap-3 md:grid-cols-4"
            >
              {heroStats.map((s) => (
                <div key={s.label} className="rounded-2xl glass px-4 py-4 text-left">
                  <p className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                    <Counter value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* PIPELINE */}
      <section id="platform" className="relative py-28">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeading
            eyebrow="reasoning pipeline"
            title="Beyond chatbots. A reasoning runtime."
            subtitle="Every request flows through a deterministic agentic pipeline — observable at each hop, with fallbacks at every boundary."
          />
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {pipeline.map((p, i) => (
              <Reveal key={p.label} delay={i * 0.07}>
                <div className="group relative h-full overflow-hidden rounded-2xl glass p-5">
                  <div className="absolute inset-x-0 top-0 h-px bg-[var(--gradient-line)] opacity-0 transition-opacity group-hover:opacity-100" />
                  <p.icon className="h-5 w-5 text-cyan transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                  <p className="mt-4 font-display text-sm font-semibold">{p.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                  <span className="mt-4 block font-mono text-[10px] text-muted-foreground/60">
                    0{i + 1}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* NETWORK */}
      <section id="network" className="relative py-20">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeading
            eyebrow="live topology"
            title="Watch the agents collaborate in real time."
            subtitle="Nodes glow while working, packets travel across the wire, and the orchestrator narrates its state — thinking, planning, retrieving, calling, reasoning, completed."
          />
          <Reveal delay={0.15} className="mt-12">
            <AgentNetwork />
          </Reveal>
        </div>
      </section>

      {/* AGENTS GRID */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeading
            eyebrow="the roster"
            title="Eight specialists. One intelligence."
            align="left"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.05}>
                <TiltCard className="h-full">
                  <div className="flex items-start justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface">
                      <Bot className="h-4 w-4 text-primary" />
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {a.tag}
                    </span>
                  </div>
                  <p className="mt-4 font-display text-sm font-semibold">{a.name}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.desc}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
                    <span>
                      <Counter value={a.tasks} /> tasks
                    </span>
                    <span className="text-emerald">{a.success}%</span>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="relative py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="end-to-end execution"
              title="One sentence. Six agents. Zero clicks."
              align="left"
              subtitle="“I'm a third-year CSE student. Am I eligible for the Google internship? If yes, register me for tomorrow's placement workshop, add it to my calendar, and remind me an hour before.”"
            />
          </div>
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl glass p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-[var(--gradient-line)]" />
              <ol className="relative space-y-5 pl-6">
                <span className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-cyan via-primary to-violet opacity-50" />
                {workflowTimeline.map((s, i) => (
                  <motion.li
                    key={s.agent + i}
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.6 }}
                    className="relative"
                  >
                    <span className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary shadow-[0_0_14px_var(--primary)]" />
                    <p className="font-display text-sm font-semibold">{s.agent}</p>
                    <p className="text-xs text-muted-foreground">{s.action}</p>
                    <p className="mt-1 font-mono text-[10px] text-cyan">{s.ms}ms</p>
                  </motion.li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-5">
          <SectionHeading eyebrow="architecture" title="Built like production infrastructure." />
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06}>
                <TiltCard className="sheen h-full">
                  <c.icon className="h-5 w-5 text-violet" />
                  <p className="mt-4 font-display text-base font-semibold">{c.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-28">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] glass-strong px-8 py-16 text-center">
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-[100px]" />
                <div className="absolute bottom-0 right-10 h-56 w-56 rounded-full bg-violet/20 blur-[90px]" />
              </div>
              <h2 className="relative text-balance font-display text-4xl font-semibold leading-tight md:text-5xl">
                <WordReveal text="Your campus, running itself." />
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
                Enter the command center and watch autonomous agents handle the work students used to
                chase across a dozen portals.
              </p>
              <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic>
                  <Link to="/assistant">
                    <GlowButton>
                      Talk to CampusX <ArrowRight className="h-4 w-4" />
                    </GlowButton>
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link to="/dashboard">
                    <GlowButton variant="ghost">Open Dashboard</GlowButton>
                  </Link>
                </Magnetic>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="relative border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo />
          <p className="font-mono text-[11px] text-muted-foreground">
            AgentX National Hackathon 2026 · Smart Campus Multi-Agent AI System
          </p>
        </div>
      </footer>
    </div>
  );
}
