import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard } from "@/components/ui-kit";
import { agentLoad, latencySeries, throughput } from "@/lib/mock";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Agent Performance & System Telemetry | CampusX AI" },
      { name: "description", content: "Latency percentiles, tool-call throughput, agent load distribution and resolution rates across the CampusX multi-agent runtime." },
      { property: "og:title", content: "Analytics — CampusX AI" },
      { property: "og:description", content: "Deep telemetry for an autonomous multi-agent campus platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Analytics,
});

const axis = {
  stroke: "color-mix(in oklab, var(--muted-foreground) 60%, transparent)",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
};

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 11,
};

function Analytics() {
  return (
    <AppShell title="Analytics" subtitle="Latency · throughput · agent load · outcomes">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="p50 Latency" value="410ms" detail="-12% w/w" tone="emerald" />
        <StatCard label="p95 Latency" value="1.34s" detail="Within SLO" tone="cyan" />
        <StatCard label="Tool Calls / min" value="284" detail="Peak 612" tone="primary" />
        <StatCard label="Resolution Rate" value="96.4%" detail="No human handoff" tone="violet" delay={0.1} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Request Throughput (24h)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughput}>
                <defs>
                  <linearGradient id="tp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="t" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fill="url(#tp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Latency Percentiles" delay={0.06}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="t" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="p50" stroke="var(--cyan)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="var(--violet)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Load Distribution by Agent" className="mt-4" delay={0.1}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentLoad}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" {...axis} tickLine={false} axisLine={false} interval={0} angle={-18} height={50} textAnchor="end" />
              <YAxis {...axis} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
              <Bar dataKey="load" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </AppShell>
  );
}
