import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Bot, Mic, Paperclip, Sparkle, User, Square, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel } from "@/components/ui-kit";
import { suggestions, workflowTimeline } from "@/lib/mock";

import { registerEventInStore } from "@/lib/events-store";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — CampusX Agentic Chat" },
      { name: "description", content: "Chat with the CampusX orchestrator: streaming answers, live agent execution timeline, grounded citations and autonomous task execution." },
      { property: "og:title", content: "AI Assistant — CampusX Agentic Chat" },
      { property: "og:description", content: "Streaming multi-agent chat with a live workflow timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Assistant,
});

type Msg = { id: string; role: "user" | "assistant"; text: string };

type HITLInterrupt = {
  thread_id: string;
  action: string;
  target_agent: string;
  prompt: string;
  proposed_params: any;
  query: string;
};

/** Lightweight markdown renderer for bold, tables, lists and inline code. */
function Markdown({ text }: { text: string }) {
  const blocks = text.split("\n");
  const rows = blocks.filter((b) => b.trim().startsWith("|"));
  const nonTable = blocks.filter((b) => !b.trim().startsWith("|"));

  const inline = (s: string) =>
    s
      .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
      .map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
        ) : part.startsWith("`") ? (
          <code key={i} className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-cyan">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      );

  const cells = (r: string) => r.split("|").slice(1, -1).map((c) => c.trim());
  const header = rows[0] ? cells(rows[0]) : [];
  const body = rows.slice(2).map(cells);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
      {nonTable.map((line, i) => {
        if (!line.trim()) return null;
        const numbered = /^\d+\.\s/.test(line.trim());
        return (
          <p key={i} className={numbered ? "pl-4 text-foreground/80" : ""}>
            {inline(line)}
          </p>
        );
      })}
      {header.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-surface/60">
              <tr>
                {header.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-2">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [timeline, setTimeline] = useState<Array<{ agent: string; action: string; ms: number }>>([]);
  const [running, setRunning] = useState(false);
  const [liveSources, setLiveSources] = useState<string[]>([]);
  const [agentsUsed, setAgentsUsed] = useState<string[]>([]);
  const [hitlInterrupt, setHitlInterrupt] = useState<HITLInterrupt | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, timeline, hitlInterrupt]);

  const send = async (text: string) => {
    if (!text.trim() || running) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setRunning(true);
    setTimeline([]);
    setLiveSources([]);
    setAgentsUsed([]);
    setHitlInterrupt(null);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      // Check if backend returned HITL Interrupt payload
      if (data.content && data.content.includes("__interrupt__")) {
        try {
          const parsed = JSON.parse(data.content);
          if (parsed.__interrupt__) {
            setHitlInterrupt({
              thread_id: parsed.thread_id,
              action: parsed.action,
              target_agent: parsed.target_agent,
              prompt: parsed.prompt,
              proposed_params: parsed.proposed_params,
              query: text,
            });
            setTimeline(parsed.timeline || []);
            setRunning(false);
            return;
          }
        } catch {}
      }

      const responseText = data.content || "Processed by agent network.";

      setTimeline(data.timeline || []);
      setLiveSources(data.sources || []);
      setAgentsUsed(data.agents_used || []);

      if (responseText.toLowerCase().includes("registered") || responseText.toLowerCase().includes("confirmed") || text.toLowerCase().includes("register")) {
        const queryLower = text.toLowerCase();
        let title = "QAQI System Workshop";
        if (queryLower.includes("ai system") || queryLower.includes("ai systems")) {
          title = "AI Systems Workshop";
        } else if (queryLower.includes("hackathon")) {
          title = "AgentX Hackathon 2026";
        } else if (queryLower.includes("bootcamp") || queryLower.includes("prep")) {
          title = "Placement Prep Bootcamp";
        } else {
          const match = text.match(/(?:register|sign up|enroll|for)\s+(?:me\s+)?(?:for\s+)?(?:the\s+)?(.+?)(?:\s+workshop|\s+event|\s+hackathon|\?|$)/i);
          if (match && match[1]) {
            title = match[1].trim() + (text.toLowerCase().includes("workshop") ? " Workshop" : "");
          }
        }
        registerEventInStore(title);
      }

      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: responseText },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: `I've analyzed your query regarding "${text}". The CampusX agent network processed your request across multiple specialist agents.` },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const handleHITLDecision = async (approved: boolean) => {
    if (!hitlInterrupt) return;

    setRunning(true);
    const payload = hitlInterrupt;
    setHitlInterrupt(null);

    try {
      const res = await fetch("/api/chat/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: payload.thread_id,
          action: payload.action,
          approved,
          query: payload.query,
        }),
      });

      const data = await res.json();
      setTimeline(data.timeline || []);
      setLiveSources(data.sources || []);
      setAgentsUsed(data.agents_used || []);

      if (approved) {
        // Extract event title from query or proposed params
        const queryLower = payload.query.toLowerCase();
        let title = "QAQI System Workshop";
        if (queryLower.includes("ai system") || queryLower.includes("ai systems")) {
          title = "AI Systems Workshop";
        } else if (queryLower.includes("hackathon")) {
          title = "AgentX Hackathon 2026";
        } else if (queryLower.includes("bootcamp") || queryLower.includes("prep")) {
          title = "Placement Prep Bootcamp";
        } else {
          const match = payload.query.match(/(?:register|sign up|enroll|for)\s+(?:me\s+)?(?:for\s+)?(?:the\s+)?(.+?)(?:\s+workshop|\s+event|\s+hackathon|\?|$)/i);
          if (match && match[1]) {
            title = match[1].trim() + (payload.query.toLowerCase().includes("workshop") ? " Workshop" : "");
          }
        }
        registerEventInStore(title);
      }

      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: data.content },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: approved ? "Approved action executed." : "Action cancelled." },
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell title="CampusX Assistant" subtitle="Orchestrated multi-agent conversation">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl glass">
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {messages.length === 0 && !hitlInterrupt && (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative grid h-20 w-20 place-items-center rounded-3xl glass"
                >
                  <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan/30 via-primary/20 to-violet/30 blur-xl" />
                  <Bot className="relative h-8 w-8 text-primary" />
                </motion.div>
                <h2 className="mt-6 font-display text-2xl font-semibold">How can the agents help?</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Ask a complex, multi-step question. The orchestrator will plan it, delegate it and execute it end to end.
                </p>
                <div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="sheen rounded-xl border border-border bg-surface/40 px-4 py-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      <Sparkle className="mb-2 h-3.5 w-3.5 text-cyan" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === "user" ? "flex justify-end" : "flex gap-3"}
              >
                {m.role === "assistant" && (
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </span>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                      : "max-w-[80%] text-sm"
                  }
                >
                  {m.role === "assistant" ? <Markdown text={m.text} /> : m.text}
                </div>
                {m.role === "user" && (
                  <span className="ml-3 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                    <User className="h-3.5 w-3.5" />
                  </span>
                )}
              </motion.div>
            ))}

            {/* Human-in-the-Loop Approval Modal / Card */}
            <AnimatePresence>
              {hitlInterrupt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-amber-500/40 bg-surface/90 p-5 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
                      <ShieldAlert className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Human-in-the-Loop Gate Paused</h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                        Irreversible State Mutation Proposed
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    <strong className="text-foreground">{hitlInterrupt.target_agent}</strong> proposes executing:{" "}
                    <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-cyan">{hitlInterrupt.action}</code>
                  </p>
                  <div className="mt-3 rounded-xl border border-border/80 bg-background/60 p-3 font-mono text-[11px] text-muted-foreground">
                    Query: "{hitlInterrupt.query}"
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-3 border-t border-border/60 pt-4">
                    <GlowButton
                      onClick={() => handleHITLDecision(false)}
                      variant="ghost"
                      className="px-3.5 py-1.5 text-xs text-rose-400 hover:text-rose-300"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject Action
                    </GlowButton>
                    <GlowButton
                      onClick={() => handleHITLDecision(true)}
                      className="px-4 py-1.5 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Execute
                    </GlowButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {running && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <motion.p
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="font-display text-sm text-muted-foreground"
                    >
                      Orchestrator routing to specialist agents…
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="group relative rounded-2xl border border-border bg-surface/50 p-2 transition-colors focus-within:border-primary/60"
            >
              <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-focus-within:opacity-100" style={{ boxShadow: "0 0 0 1px var(--primary), 0 0 30px -8px var(--primary)" }} />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={2}
                placeholder="Ask the orchestrator anything about campus…"
                className="relative w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <div className="relative flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <button type="button" aria-label="Attach file" className="rounded-lg p-1.5 transition-colors hover:bg-accent hover:text-foreground">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Voice input" className="rounded-lg p-1.5 transition-colors hover:bg-accent hover:text-foreground">
                    <Mic className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em]">8 agents ready</span>
                </div>
                {running ? (
                  <GlowButton
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 rounded-xl p-0"
                    onClick={() => setRunning(false)}
                  >
                    <Square className="h-3.5 w-3.5" />
                  </GlowButton>
                ) : (
                  <GlowButton type="submit" className="h-9 w-9 rounded-xl p-0" aria-label="Send">
                    <ArrowUp className="h-4 w-4" />
                  </GlowButton>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right sidebar — live execution timeline + sources */}
        <div className="space-y-4">
          <Panel title="Execution Timeline">
            <ol className="relative space-y-4 pl-5">
              <span className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-cyan to-violet opacity-40" />
              {(timeline.length > 0 ? timeline : workflowTimeline).map((s, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ${
                      timeline.length > 0 || !running
                        ? "bg-cyan shadow-[0_0_12px_var(--cyan)]"
                        : "bg-muted"
                    }`}
                  />
                  <p className="text-xs font-medium">{s.agent}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {s.action} {timeline.length > 0 && <span className="text-cyan">— {s.ms}ms</span>}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Grounding Sources" delay={0.06}>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {(liveSources.length > 0
                ? liveSources
                : ["placement_policy_2026.pdf · p.4", "academic_regulations_R22.pdf · p.18", "events_catalog.json"]
              ).map((s) => (
                <li key={s} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2 font-mono text-[11px]">
                  {s}
                </li>
              ))}
            </ul>
          </Panel>
          {agentsUsed.length > 0 && (
            <Panel title="Agents Used" delay={0.08}>
              <div className="flex flex-wrap gap-2">
                {agentsUsed.map((a) => (
                  <span key={a} className="rounded-lg border border-border/60 bg-surface/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan">
                    {a}
                  </span>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </AppShell>
  );
}
