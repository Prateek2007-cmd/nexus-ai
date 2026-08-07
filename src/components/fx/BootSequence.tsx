import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const LINES = [
  "Initializing Neural Engine",
  "Loading Agent Network",
  "Connecting Knowledge Base",
  "Activating Orchestrator",
  "Synchronizing Memory",
  "Starting Autonomous Systems",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepTimer = window.setInterval(() => setStep((s) => Math.min(s + 1, LINES.length)), 340);
    const progTimer = window.setInterval(() => setProgress((p) => Math.min(p + 2.6, 100)), 45);
    const done = window.setTimeout(onDone, 2350);
    return () => {
      clearInterval(stepTimer);
      clearInterval(progTimer);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
      exit={{ opacity: 0, filter: "blur(14px)", scale: 1.04 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 grid-fade opacity-60" />
      <div className="relative w-[min(560px,88vw)]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="relative h-9 w-9">
            <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan via-primary to-violet blur-md opacity-70" />
            <span className="absolute inset-0 rounded-lg border border-border bg-surface" />
            <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold text-foreground">
              X
            </span>
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">CAMPUSX AI</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              boot sequence
            </p>
          </div>
        </motion.div>

        <div className="space-y-2 font-mono text-sm">
          <AnimatePresence>
            {LINES.slice(0, step).map((l, i) => (
              <motion.div
                key={l}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between text-muted-foreground"
              >
                <span>
                  <span className="text-primary">›</span> {l}...
                </span>
                <span className="text-emerald">{i === step - 1 ? "···" : "OK"}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {step >= LINES.length && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2 font-display text-base font-semibold text-gradient"
            >
              Ready.
            </motion.p>
          )}
        </div>

        <div className="mt-8 h-px w-full overflow-hidden bg-border">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan via-primary to-violet"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          {Math.round(progress)}% · neural runtime v4.2
        </p>
      </div>
    </motion.div>
  );
}
