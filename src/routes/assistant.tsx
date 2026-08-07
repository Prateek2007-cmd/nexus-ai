import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Bot, Mic, Paperclip, Sparkle, User, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatusDot } from "@/components/ui-kit";
import { suggestions, workflowTimeline } from "@/lib/mock";

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

type Msg = { id: string; role: "user" | "assistant"; text: string; streaming?: boolean };

const ANSWER = `**Yes — you're eligible for the Google SDE Internship.**

| Criterion | Requirement | You |
| --- | --- | --- |
| CGPA | ≥ 8.0 | 8.64 |
| Branch | CSE / IT | CSE |
| Backlogs | 0 active | 0 |

I've completed the full workflow autonomously:

1. Verified eligibility against \`placement_policy_2026.pdf\`
2. Registered you for the **Placement Prep Workshop** (Aug 21, 10:00, Seminar Hall B)
3. Added the event to your campus calendar
4. Scheduled a reminder for **T-60 minutes**

Application window closes Aug 14 — your resume is already parsed and attached.`;

function useStreaming(text: string, active: boolean) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) return;
    setOut("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 3;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [text, active]);
  return out;
}

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
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const streamed = useStreaming(ANSWER, running && phase >= workflowTimeline.length);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    if (phase >= workflowTimeline.length) return;
    const t = window.setTimeout(() => setPhase((p) => p + 1), 700);
    return () => clearTimeout(t);
  }, [running, phase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamed, phase]);

  const send = (text: string) => {
    if (!text.trim() || running) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setPhase(0);
    setRunning(true);
  };

  return (
    <AppShell title="CampusX Assistant" subtitle="Orchestrated multi-agent conversation">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl glass">
          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {messages.length === 0 && (
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
                  Ask a complex, multi-step question. The orchestrator will plan it, delegate it and
                  execute it end to end.
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
                  {m.text}
                </div>
                {m.role === "user" && (
                  <span className="ml-3 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                    <User className="h-3.5 w-3.5" />
                  </span>
                )}
              </motion.div>
            ))}

            <AnimatePresence>
              {running && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 space-y-1.5">
                      {workflowTimeline.slice(0, phase).map((s) => (
                        <motion.div
                          key={s.agent + s.action}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground"
                        >
                          <StatusDot tone="cyan" />
                          <span className="text-foreground/80">{s.agent}</span>
                          <span className="truncate">{s.action}</span>
                          <span className="ml-auto shrink-0 text-cyan">{s.ms}ms</span>
                        </motion.div>
                      ))}
                    </div>
                    {phase < workflowTimeline.length ? (
                      <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="font-display text-sm text-muted-foreground"
                      >
                        Thinking…
                      </motion.p>
                    ) : (
                      <>
                        <Markdown text={streamed} />
                        {streamed.length < ANSWER.length && (
                          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-cyan align-middle" />
                        )}
                      </>
                    )}
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
                    onClick={() => {
                      setRunning(false);
                      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: ANSWER }]);
                    }}
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

        <div className="space-y-4">
          <Panel title="Execution Timeline">
            <ol className="relative space-y-4 pl-5">
              <span className="absolute left-[5px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-cyan to-violet opacity-40" />
              {workflowTimeline.map((s, i) => (
                <li key={s.action} className="relative">
                  <span
                    className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ${i < phase ? "bg-cyan shadow-[0_0_12px_var(--cyan)]" : "bg-muted"}`}
                  />
                  <p className="text-xs font-medium">{s.agent}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{s.action}</p>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Grounding Sources" delay={0.06}>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {["placement_policy_2026.pdf · p.4", "academic_regulations_R22.pdf · p.18", "events_catalog.json"].map((s) => (
                <li key={s} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2 font-mono text-[11px]">
                  {s}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
