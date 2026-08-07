import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Activity, Cpu, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard, StatusDot } from "@/components/ui-kit";
import { AgentNetwork } from "@/components/AgentNetwork";
import { Counter } from "@/components/fx/motion";
import { activities, agentLoad, kpis, latencySeries, throughput } from "@/lib/mock";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — CampusX AI Operations Dashboard" },
      { name: "description", content: "Live AI operations: agent health, workflow success, latency, RAG volume and task queue across the CampusX agent mesh." },
      { property: "og:title", content: "Command Center — CampusX AI" },
      { property: "og:description", content: "Real-time telemetry for an autonomous multi-agent campus platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const axis = { stroke: "oklch(0.68 0.018 258)", fontSize: 10, tickLine: false, axisLine: false };

function ChartTooltip() {
  return (
    <Tooltip
      cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }}
      contentStyle={{
        background: "var(--popover)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        fontSize: 12,
      }}
    />
  );
}

function Dashboard() {
  return (
    <AppShell
      title="AI Operations Command Center"
      subtitle="Live telemetry across the autonomous agent mesh"
      actions={
        <div className="hidden items-center gap-2 rounded-xl glass px-3 py-1.5 sm:flex">
          <StatusDot />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            streaming
          </span>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <StatCard key={k.label} label={k.label} value={k.value} detail={k.detail} tone={k.tone} delay={i * 0.04} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Workflow Throughput (24h)" className="lg:col-span-2" delay={0.05}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughput}>
                <defs>
                  <linearGradient id="gWork" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTok" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--violet)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--violet)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis dataKey="t" {...axis} interval={3} />
                <YAxis {...axis} width={34} />
                <ChartTooltip />
                <Area type="monotone" dataKey="tokens" stroke="var(--violet)" fill="url(#gTok)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="workflows" stroke="var(--primary)" fill="url(#gWork)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="AI Confidence Score" delay={0.1}>
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="66%"
                outerRadius="100%"
                data={[{ name: "confidence", value: 94.6, fill: "var(--cyan)" }]}
                startAngle={220}
                endAngle={-40}
              >
                <RadialBar dataKey="value" cornerRadius={999} background={{ fill: "oklch(1 0 0 / 6%)" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-4xl font-semibold">
                <Counter value={94.6} decimals={1} suffix="%" />
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                grounded answers
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Latency Distribution" delay={0.05}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencySeries}>
                <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis dataKey="t" {...axis} interval={3} />
                <YAxis {...axis} width={34} />
                <ChartTooltip />
                <Line type="monotone" dataKey="p50" stroke="var(--cyan)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="var(--amber)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Agent Load" delay={0.1}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentLoad}>
                <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis dataKey="name" {...axis} interval={0} angle={-25} height={40} textAnchor="end" />
                <YAxis {...axis} width={30} />
                <ChartTooltip />
                <Bar dataKey="load" fill="var(--indigo)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Recent Agent Activity" delay={0.15}>
          <ul className="space-y-3">
            {activities.map((a, i) => (
              <motion.li
                key={a.text}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex gap-3 rounded-xl border border-border/60 bg-surface/40 p-3"
              >
                <StatusDot tone={a.tone} />
                <div className="min-w-0">
                  <p className="text-xs font-medium">{a.agent}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.text}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">{a.time}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Runtime Vitals" delay={0.05}>
          <div className="space-y-4">
            {[
              { icon: Cpu, label: "Inference cores", value: 62, unit: "%" },
              { icon: Activity, label: "Vector store", value: 48, unit: "%" },
              { icon: Zap, label: "Tool bandwidth", value: 31, unit: "%" },
            ].map((v) => (
              <div key={v.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <v.icon className="h-3.5 w-3.5 text-primary" /> {v.label}
                  </span>
                  <span className="font-mono">
                    {v.value}
                    {v.unit}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${v.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <AgentNetwork compact />
        </div>
      </div>
    </AppShell>
  );
}
