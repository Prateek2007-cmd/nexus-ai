import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard, GlowButton } from "@/components/ui-kit";
import { documents as initialDocs } from "@/lib/mock";
import { FileText, Search, Sparkle } from "lucide-react";
import { Reveal, TiltCard } from "@/components/fx/motion";
import { motion } from "framer-motion";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — RAG over Institutional Documents | CampusX AI" },
      { name: "description", content: "Vector search across handbooks, policies, circulars and FAQs with chunk-level citations powering every grounded CampusX answer." },
      { property: "og:title", content: "Knowledge Base — CampusX AI" },
      { property: "og:description", content: "Retrieval-augmented generation over the full campus document corpus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Knowledge,
});

function Knowledge() {
  const [searchQuery, setSearchQuery] = useState("");
  const [retrievalLogs, setRetrievalLogs] = useState<string[]>([
    "query='makeup exam eligibility' → examination_manual.pdf#c214 (0.93)",
    "query='internship CGPA cutoff' → placement_policy_2026.pdf#c041 (0.91)",
    "query='hostel late entry rule' → hostel_code.pdf#c018 (0.88)",
  ]);

  const filteredDocs = initialDocs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const newLog = `query='${searchQuery}' → ${filteredDocs[0]?.title || "campus_handbook.pdf"} (0.94 precision)`;
    setRetrievalLogs((prev) => [newLog, ...prev]);
  };

  return (
    <AppShell title="Knowledge Agent" subtitle="RAG corpus · embeddings · citations">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents Indexed" value="1,284" detail="PDF · DOCX · HTML" tone="primary" />
        <StatCard label="Vector Chunks" value="118,402" detail="1536-dim embeddings" tone="cyan" />
        <StatCard label="Retrieval Precision" value="0.91" detail="nDCG@6" tone="emerald" />
        <StatCard label="Last Reindex" value="4h ago" detail="Incremental" tone="violet" delay={0.1} />
      </div>

      <Reveal delay={0.06} className="mt-4">
        <div className="group relative overflow-hidden rounded-2xl glass p-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <Search className="h-4 w-4 text-primary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search policies, handbooks, circulars…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <GlowButton onClick={handleSearch} className="px-3.5 py-2 text-xs">
              <Sparkle className="h-3.5 w-3.5" /> Semantic search
            </GlowButton>
          </div>
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </Reveal>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.05}>
              <TiltCard className="sheen h-full">
                <div className="flex items-start justify-between">
                  <FileText className="h-5 w-5 text-violet" />
                  <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {d.type}
                  </span>
                </div>
                <p className="mt-4 font-display text-sm font-semibold">{d.title}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
                  <span>{d.chunks} chunks</span>
                  <span>{d.updated}</span>
                </div>
              </TiltCard>
            </Reveal>
          ))
        ) : (
          <div className="col-span-full rounded-2xl glass p-8 text-center text-sm text-muted-foreground">
            No institutional documents found matching "{searchQuery}".
          </div>
        )}
      </div>

      <Panel title="Recent Vector Retrievals" className="mt-4" delay={0.1}>
        <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
          {retrievalLogs.map((l, idx) => (
            <li key={idx} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2">
              <span className="text-cyan">[VECTOR SEARCH]</span> {l}
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
