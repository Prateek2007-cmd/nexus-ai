import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { NeuralBackground } from "@/components/fx/NeuralBackground";
import { AICore } from "@/components/fx/AICore";
import { GlowButton, StatusDot } from "@/components/ui-kit";
import { Logo } from "@/components/layout/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Secure Access — CampusX AI" },
      { name: "description", content: "Authenticate into the CampusX AI command center with campus SSO or institutional credentials." },
      { property: "og:title", content: "Secure Access — CampusX AI" },
      { property: "og:description", content: "Sign in to the autonomous multi-agent campus platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Auth,
});

function Field({ icon: Icon, label, type }: { icon: typeof Mail; label: string; type: string }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const floating = focused || value.length > 0;
  return (
    <div
      className="relative rounded-xl border bg-surface/50 px-3 pb-2 pt-5 transition-colors"
      style={focused ? { borderColor: "var(--primary)", boxShadow: "0 0 26px -8px var(--primary)" } : undefined}
    >
      <motion.label
        animate={{ y: floating ? -8 : 4, fontSize: floating ? "10px" : "13px", opacity: floating ? 0.7 : 1 }}
        className="pointer-events-none absolute left-9 top-3 font-mono uppercase tracking-[0.16em] text-muted-foreground"
      >
        {label}
      </motion.label>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function Auth() {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <NeuralBackground density={0.8} />

      <div className="relative hidden flex-col justify-between p-10 lg:flex">
        <Logo />
        <div className="relative h-[420px] w-full">
          <AICore />
        </div>
        <div>
          <p className="font-display text-2xl font-semibold leading-tight">
            Eight autonomous agents.
            <br />
            <span className="text-gradient">One secure identity.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Session-scoped memory, encrypted tool credentials and per-action policy checks.
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm rounded-3xl glass-strong p-7"
        >
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="mt-6 flex items-center gap-2 lg:mt-0">
            <StatusDot />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              secure channel
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Access the CampusX command center.</p>

          <form className="mt-7 space-y-3" onSubmit={(e) => e.preventDefault()}>
            <Field icon={Mail} label="Campus email" type="email" />
            <Field icon={Lock} label="Password" type="password" />
            <Link to="/dashboard" className="block">
              <GlowButton className="w-full">
                Authenticate <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </Link>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GlowButton variant="ghost" className="w-full">
            <Fingerprint className="h-4 w-4" /> Continue with Campus SSO
          </GlowButton>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link to="/dashboard" className="text-primary hover:underline">
              Request access
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
