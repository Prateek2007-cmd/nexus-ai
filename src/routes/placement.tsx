import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { companies } from "@/lib/mock";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { Reveal, TiltCard } from "@/components/fx/motion";

export const Route = createFileRoute("/placement")({
  head: () => ({
    meta: [
      { title: "Placement Agent — Eligibility & Internships | CampusX AI" },
      { name: "description", content: "Autonomous eligibility checks, internship discovery, resume analysis and interview prep from the CampusX Placement Agent." },
      { property: "og:title", content: "Placement Agent — CampusX AI" },
      { property: "og:description", content: "Eligibility, internships and resume intelligence, automated." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Placement,
});

function Placement() {
  return (
    <AppShell title="Placement Agent" subtitle="Eligibility · internships · resume intelligence">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Drives" value="14" detail="4 closing this week" tone="primary" />
        <StatCard label="You're Eligible For" value="9" detail="Auto-verified" tone="emerald" />
        <StatCard label="Resume Score" value="82 / 100" detail="+6 after last edit" tone="cyan" />
        <StatCard label="Mock Interviews" value="3" detail="Avg score 7.8" tone="violet" delay={0.1} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Live Eligibility Matrix" className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-surface/60 font-mono uppercase tracking-widest text-muted-foreground">
                <tr>
                  {["Company", "Role", "Stipend", "Min CGPA", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.name} className="border-t border-border transition-colors hover:bg-accent/40">
                    <td className="px-3 py-3 font-medium">{c.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{c.role}</td>
                    <td className="px-3 py-3 font-mono text-cyan">{c.ctc}</td>
                    <td className="px-3 py-3 font-mono text-muted-foreground">{c.cgpa}</td>
                    <td className="px-3 py-3">
                      {c.eligible ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5" /> Not eligible
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Reveal delay={0.08}>
          <TiltCard className="h-full">
            <FileText className="h-5 w-5 text-violet" />
            <p className="mt-4 font-display text-sm font-semibold">Resume Analysis</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The agent parsed <span className="font-mono text-cyan">resume_v4.pdf</span> and mapped 18 skills
              against 14 active drives.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              {[
                "Add measurable impact to 2 project bullets",
                "Surface system design coursework higher",
                "Missing keyword: distributed systems",
              ].map((s) => (
                <li key={s} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">{s}</li>
              ))}
            </ul>
            <GlowButton variant="ghost" className="mt-5 w-full px-4 py-2 text-xs">
              Re-run analysis
            </GlowButton>
          </TiltCard>
        </Reveal>
      </div>
    </AppShell>
  );
}
