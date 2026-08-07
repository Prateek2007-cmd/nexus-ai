import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { companies } from "@/lib/mock";
import { fetchApi } from "@/lib/api";
import { CheckCircle2, XCircle, FileText, RefreshCw, Sparkle } from "lucide-react";
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
  const [liveCompanies, setLiveCompanies] = useState(companies);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeScore, setResumeScore] = useState(82);
  const [resumeTips, setResumeTips] = useState([
    "Add measurable impact to 2 project bullets",
    "Surface system design coursework higher",
    "Missing keyword: distributed systems",
  ]);

  useEffect(() => {
    fetchApi<any[]>("/placement/companies").then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setLiveCompanies(data);
      }
    });
  }, []);

  const handleReanalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResumeScore(88);
      setResumeTips([
        "✓ Measurable impact bullets validated",
        "✓ Distributed systems keyword mapped to Google SDE drive",
        "Recommended: Add link to GitHub open-source PRs",
      ]);
      setAnalyzing(false);
    }, 1200);
  };

  return (
    <AppShell title="Placement Agent" subtitle="Eligibility · internships · resume intelligence">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Drives" value={String(liveCompanies.length)} detail="4 closing this week" tone="primary" />
        <StatCard label="You're Eligible For" value={String(liveCompanies.filter((c) => c.eligible).length)} detail="Auto-verified by agent" tone="emerald" />
        <StatCard label="Resume Score" value={`${resumeScore} / 100`} detail={resumeScore > 82 ? "+6 freshly boosted!" : "+6 after last edit"} tone="cyan" />
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
                {liveCompanies.map((c) => (
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
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-violet" />
              <span className="font-mono text-[10px] text-cyan">AI PARSER ACTIVE</span>
            </div>
            <p className="mt-4 font-display text-sm font-semibold">Resume Analysis</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              The agent parsed <span className="font-mono text-cyan">resume_v4.pdf</span> and mapped 18 skills against active placement drives.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              {resumeTips.map((s, idx) => (
                <li key={idx} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2 font-mono text-[11px]">
                  {s}
                </li>
              ))}
            </ul>
            <GlowButton
              onClick={handleReanalyze}
              disabled={analyzing}
              variant="ghost"
              className="mt-5 w-full px-4 py-2 text-xs"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analyzing resume...
                </>
              ) : (
                <>
                  <Sparkle className="h-3.5 w-3.5" /> Re-run AI analysis
                </>
              )}
            </GlowButton>
          </TiltCard>
        </Reveal>
      </div>
    </AppShell>
  );
}
