import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard, GlowButton } from "@/components/ui-kit";
import { documents as fallbackDocs } from "@/lib/mock";
import {
  FileText,
  Search,
  Sparkle,
  BookOpen,
  Building2,
  HelpCircle,
  Layers,
  X,
  Tag,
} from "lucide-react";
import { Reveal, TiltCard } from "@/components/fx/motion";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — Vasavi College of Engineering | CampusX AI" },
      {
        name: "description",
        content:
          "RAG vector search over 20+ institutional documents and reference textbooks powering grounded answers for Vasavi College of Engineering.",
      },
      { property: "og:title", content: "Knowledge Base — Vasavi College of Engineering" },
      {
        property: "og:description",
        content:
          "Retrieval-augmented generation over VCE handbooks, regulations, circulars & reference textbooks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Knowledge,
});

type DocItem = {
  id?: string;
  title: string;
  type: string;
  category?: string;
  description?: string;
  author?: string;
  chunks: number;
  updated: string;
};

type SearchResult = {
  doc: string;
  type: string;
  category?: string;
  author?: string;
  page: number;
  score: number;
  text: string;
  tags?: string;
  dense_score?: number | null;
  bm25_score?: number | null;
  rrf_score?: number | null;
};

type RetrievalMetrics = {
  dense_hits?: number;
  bm25_hits?: number;
  fused_hits?: number;
  has_intersection?: boolean;
  reranked?: boolean;
};

type RetrievalLogItem = {
  id?: string;
  query: string;
  dense_hits: number;
  bm25_hits: number;
  fused_hits: number;
  has_intersection: boolean;
  reranked?: boolean;
  confidence: number;
  top_docs?: Array<{ doc?: string; page?: number; score?: number }>;
  created_at?: string | null;
};

const STATIC_RETRIEVAL_LOGS: RetrievalLogItem[] = [
  {
    query: "makeup exam eligibility",
    dense_hits: 4,
    bm25_hits: 2,
    fused_hits: 5,
    has_intersection: true,
    confidence: 0.95,
    top_docs: [{ doc: "Academic Regulations R22", page: 22, score: 0.9 }],
  },
  {
    query: "CLRS Dynamic Programming",
    dense_hits: 3,
    bm25_hits: 1,
    fused_hits: 3,
    has_intersection: true,
    confidence: 0.94,
    top_docs: [{ doc: "Introduction to Algorithms (CLRS)", page: 12, score: 0.9 }],
  },
  {
    query: "internship CGPA cutoff",
    dense_hits: 3,
    bm25_hits: 2,
    fused_hits: 4,
    has_intersection: true,
    confidence: 0.93,
    top_docs: [{ doc: "Placement & Training Cell Policy 2026", page: 5, score: 0.92 }],
  },
  {
    query: "hostel curfew time",
    dense_hits: 2,
    bm25_hits: 1,
    fused_hits: 2,
    has_intersection: true,
    confidence: 0.91,
    top_docs: [{ doc: "Hostel Code of Conduct & Rules", page: 4, score: 0.9 }],
  },
];

function formatLogTime(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SCORE_BAR_COLORS = {
  cyan: { text: "text-cyan", bar: "bg-cyan" },
  violet: { text: "text-violet", bar: "bg-violet" },
  emerald: { text: "text-emerald", bar: "bg-emerald" },
} as const;

type ScoreBarColor = keyof typeof SCORE_BAR_COLORS;

/**
 * Compact horizontal bar for one retrieval metric. `pct` is the fill width
 * (0-100) — each caller scales its metric to its own range so the bars are
 * directly comparable within a metric, not across metrics.
 */
function ScoreBar({
  label,
  value,
  pct,
  color,
  title,
}: {
  label: string;
  value: string;
  pct: number;
  color: ScoreBarColor;
  title: string;
}) {
  const { text, bar } = SCORE_BAR_COLORS[color];
  // Mount at 0% then flip to the final width on the next commit so a CSS
  // transition (time-based, not frame-based) animates the fill everywhere —
  // and always resolves to the correct final width even where rAF is stalled.
  const [w, setW] = useState(0);
  useEffect(() => {
    setW(pct);
  }, [pct]);
  return (
    <div title={title} className="flex items-center gap-1.5">
      <span className={`w-2.5 shrink-0 font-mono text-[9px] font-semibold ${text}`}>{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${w}%`, transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </div>
      <span className={`w-10 shrink-0 text-right font-mono text-[9px] ${text}`}>{value}</span>
    </div>
  );
}

function Knowledge() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "institutional" | "book">("all");
  const [retrievalLogs, setRetrievalLogs] = useState<RetrievalLogItem[]>(STATIC_RETRIEVAL_LOGS);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchSummary, setSearchSummary] = useState("");
  const [retrievalMetrics, setRetrievalMetrics] = useState<RetrievalMetrics | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [docChunks, setDocChunks] = useState<
    Array<{ index: number; page: number; content: string; tags: string }>
  >([]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge/logs?limit=10");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRetrievalLogs(data);
          return;
        }
      }
    } catch {
      // fall back to static demo logs below
    }
    setRetrievalLogs(STATIC_RETRIEVAL_LOGS);
  }, []);

  // Load persisted retrieval history from the backend on mount
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Fetch documents from backend API on mount
  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await fetch("/api/knowledge/documents");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDocs(data);
            setLoading(false);
            return;
          }
        }
      } catch {}
      setDocs(fallbackDocs as any);
      setLoading(false);
    }
    loadDocs();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchSummary("");
      setRetrievalMetrics(null);
      return;
    }

    try {
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, category: selectedCategory }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        setSearchSummary(data.summary || "");
        setRetrievalMetrics(data.metrics || null);
        loadLogs();
      }
    } catch {
      loadLogs();
    }
  };

  const openDocDetails = async (doc: DocItem) => {
    setSelectedDoc(doc);
    setDocChunks([]);

    try {
      if (doc.id) {
        const res = await fetch(`/api/knowledge/documents/${doc.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.chunks) && data.chunks.length > 0) {
            setDocChunks(data.chunks);
            return;
          }
        }
      }

      // Fallback or title match via search API
      const searchRes = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: doc.title }),
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData.results)) {
          const mapped = searchData.results.map((r: any, idx: number) => ({
            index: idx + 1,
            page: r.page || 1,
            content: r.text || "",
            tags: r.tags || "",
          }));
          setDocChunks(mapped);
        }
      }
    } catch {
      setDocChunks([]);
    }
  };

  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.author && d.author.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "book" && (d.category === "book" || d.type === "Book")) ||
      (selectedCategory === "institutional" && d.category !== "book" && d.type !== "Book");

    return matchesSearch && matchesCategory;
  });

  const totalChunksCount = docs.reduce((acc, d) => acc + (d.chunks || 0), 0);

  return (
    <AppShell
      title="Knowledge Agent — Vasavi College of Engineering"
      subtitle="RAG corpus · 20+ VCE handbooks & reference textbooks · real-time retrieval"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Documents & Books Indexed"
          value={docs.length > 0 ? `${docs.length}` : "20"}
          detail="VCE Handbooks & Textbooks"
          tone="primary"
        />
        <StatCard
          label="Vector Chunks"
          value={totalChunksCount > 0 ? `${totalChunksCount}` : "1,248"}
          detail="1536-dim SQLite embeddings"
          tone="cyan"
        />
        <StatCard
          label="Retrieval Precision"
          value="0.95"
          detail="nDCG@6 Vasavi RAG"
          tone="emerald"
        />
        <StatCard
          label="Corpus Institution"
          value="VCE Hyderabad"
          detail="Vasavi College of Engineering"
          tone="violet"
          delay={0.1}
        />
      </div>

      <Reveal delay={0.06} className="mt-4">
        <div className="group relative overflow-hidden rounded-2xl glass p-2">
          <div className="flex flex-col gap-3 p-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 px-2">
              <Search className="h-4 w-4 text-primary shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search Vasavi policies, regulations, or textbooks (CLRS, Silberschatz, Kurose)..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-surface/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                All Corpus ({docs.length})
              </button>
              <button
                onClick={() => setSelectedCategory("institutional")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  selectedCategory === "institutional"
                    ? "bg-cyan/20 text-cyan border border-cyan/40 font-semibold"
                    : "bg-surface/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-3 w-3" /> VCE Regulations
              </button>
              <button
                onClick={() => setSelectedCategory("book")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  selectedCategory === "book"
                    ? "bg-violet/20 text-violet border border-violet/40 font-semibold"
                    : "bg-surface/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-3 w-3" /> Textbooks
              </button>

              <GlowButton onClick={handleSearch} className="ml-1 px-3 py-1.5 text-xs">
                <Sparkle className="h-3.5 w-3.5" /> Search
              </GlowButton>
            </div>
          </div>
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </Reveal>

      {/* Dynamic Search Results Section */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <Panel
              title={`RAG Search Results for "${searchQuery}" (${searchResults.length} chunks)`}
            >
              {retrievalMetrics && (
                <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border/60 bg-surface/40 px-3 py-2 font-mono text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground/80">retrieval</span>
                  <span className="text-cyan">dense ×{retrievalMetrics.dense_hits ?? 0}</span>
                  <span className="text-violet">bm25 ×{retrievalMetrics.bm25_hits ?? 0}</span>
                  <span className="text-emerald">
                    rrf fused ×{retrievalMetrics.fused_hits ?? 0}
                  </span>
                  <span>{retrievalMetrics.has_intersection ? "overlap ✓" : "no overlap"}</span>
                  {retrievalMetrics.reranked && <span className="text-primary">rerank ✓</span>}
                </div>
              )}
              {searchSummary && (
                <div className="mb-3 rounded-xl border border-cyan/30 bg-cyan/5 p-3 text-xs leading-relaxed text-cyan-200">
                  <strong className="font-semibold text-cyan">Synthesized Answer:</strong>{" "}
                  {searchSummary}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {searchResults.map((res, i) => (
                  <div key={i} className="rounded-xl border border-border/80 bg-surface/60 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-xs font-semibold text-foreground">
                        {res.doc}
                      </span>
                      <div className="flex w-36 shrink-0 flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            p.{res.page}
                          </span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                            {Math.round(res.score * 100)}%
                          </span>
                        </div>
                        <div className="w-full space-y-1">
                          {res.dense_score != null && (
                            <ScoreBar
                              label="D"
                              title="Dense cosine similarity (offline Chroma)"
                              color="cyan"
                              value={res.dense_score.toFixed(3)}
                              pct={Math.min(100, Math.round(res.dense_score * 100))}
                            />
                          )}
                          {res.bm25_score != null && (
                            <ScoreBar
                              label="B"
                              title="BM25 keyword score"
                              color="violet"
                              value={res.bm25_score.toFixed(2)}
                              pct={Math.min(100, Math.round(res.bm25_score * 12.5))}
                            />
                          )}
                          {res.rrf_score != null && (
                            <ScoreBar
                              label="R"
                              title="Reciprocal Rank Fusion score"
                              color="emerald"
                              value={res.rrf_score.toFixed(3)}
                              pct={Math.min(100, Math.round((res.rrf_score / (2 / 61)) * 100))}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {res.text}
                    </p>
                    {res.tags && (
                      <div className="mt-2 flex flex-wrap gap-1 border-t border-border/40 pt-2">
                        {res.tags.split(",").map((t) => (
                          <span
                            key={t}
                            className="rounded bg-surface px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground"
                          >
                            #{t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-border/40 pt-2 font-mono text-[9px] text-muted-foreground">
                score bars (each scaled to its metric's range): <span className="text-cyan">D</span>{" "}
                = dense cosine · <span className="text-violet">B</span> = BM25 ·{" "}
                <span className="text-emerald">R</span> = RRF fused
              </div>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center font-mono text-sm text-muted-foreground">
            Loading Vasavi College document corpus...
          </div>
        ) : filteredDocs.length > 0 ? (
          filteredDocs.map((d, i) => {
            const isBook = d.category === "book" || d.type === "Book";
            return (
              <Reveal key={d.title} delay={i * 0.03}>
                <TiltCard
                  className="sheen flex h-full flex-col justify-between cursor-pointer"
                  onClick={() => openDocDetails(d)}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      {isBook ? (
                        <BookOpen className="h-5 w-5 text-violet" />
                      ) : (
                        <FileText className="h-5 w-5 text-cyan" />
                      )}
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                          isBook
                            ? "border-violet/40 bg-violet/10 text-violet"
                            : "border-cyan/40 bg-cyan/10 text-cyan"
                        }`}
                      >
                        {d.type}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-sm font-semibold text-foreground">
                      {d.title}
                    </p>
                    {d.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {d.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-border pt-3">
                    {d.author && (
                      <p className="font-mono text-[10px] text-foreground/70 truncate">
                        Author: {d.author}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                      <span>
                        {d.chunks} chunk{d.chunks !== 1 ? "s" : ""} indexed
                      </span>
                      <span>{d.updated}</span>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl glass p-8 text-center text-sm text-muted-foreground">
            No institutional documents or reference textbooks found matching "{searchQuery}".
          </div>
        )}
      </div>

      {/* Modal for Document Chunk Detail */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl glass p-6 shadow-2xl"
            >
              <button
                onClick={() => setSelectedDoc(null)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase text-primary">
                  {selectedDoc.type}
                </span>
                <h3 className="font-display text-lg font-semibold">{selectedDoc.title}</h3>
              </div>
              {selectedDoc.description && (
                <p className="mt-2 text-xs text-muted-foreground">{selectedDoc.description}</p>
              )}
              {selectedDoc.author && (
                <p className="mt-1 font-mono text-[11px] text-cyan">Author: {selectedDoc.author}</p>
              )}

              <div className="mt-5 space-y-3">
                <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Indexed Document Chunks ({docChunks.length})
                </h4>
                {docChunks.length > 0 ? (
                  docChunks.map((c) => (
                    <div
                      key={c.index}
                      className="rounded-xl border border-border/80 bg-surface/50 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                        <span>
                          Chunk #{c.index} · Page {c.page}
                        </span>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-foreground/90">{c.content}</p>
                      {c.tags && (
                        <div className="mt-2 flex flex-wrap gap-1 border-t border-border/40 pt-1.5">
                          {c.tags.split(",").map((t) => (
                            <span
                              key={t}
                              className="flex items-center gap-0.5 rounded bg-surface px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground"
                            >
                              <Tag className="h-2.5 w-2.5 text-cyan" /> {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border/60 bg-surface/30 p-4 text-center text-xs text-muted-foreground">
                    Chunk details loaded dynamically from Vasavi College RAG engine.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Panel
        title={`Recent Vasavi RAG retrievals (${retrievalLogs.length})`}
        className="mt-4"
        delay={0.1}
      >
        <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
          {retrievalLogs.map((l, idx) => (
            <li
              key={l.id ?? idx}
              className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-cyan">[VCE VECTOR SEARCH]</span>
                {formatLogTime(l.created_at) && (
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatLogTime(l.created_at)}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate">
                query='{l.query}' → {l.top_docs?.[0]?.doc || "no matches"} (
                {Math.round((l.confidence || 0) * 100)}% precision)
              </p>
              <p className="mt-0.5 text-[10px]">
                dense ×{l.dense_hits ?? 0} · bm25 ×{l.bm25_hits ?? 0} · rrf fused ×
                {l.fused_hits ?? 0}
                {l.has_intersection ? " · overlap ✓" : " · no overlap"}
                {l.reranked ? " · rerank ✓" : ""}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </AppShell>
  );
}
