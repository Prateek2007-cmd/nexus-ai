import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Counter, Reveal, TiltCard } from "@/components/fx/motion";

const TONE_VAR: Record<string, string> = {
  primary: "var(--primary)",
  cyan: "var(--cyan)",
  violet: "var(--violet)",
  emerald: "var(--emerald)",
  amber: "var(--amber)",
};

export function Panel({
  title,
  action,
  children,
  className,
  delay = 0,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={cn("h-full", className)}>
      <section className="relative h-full overflow-hidden rounded-2xl glass p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--gradient-line)]" />
        {(title || action) && (
          <header className="mb-4 flex items-center justify-between gap-3">
            {title && <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>}
            {action}
          </header>
        )}
        {children}
      </section>
    </Reveal>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = "primary",
  delay = 0,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <TiltCard className="sheen h-full p-5" tilt={5}>
        <div className="flex items-start justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: TONE_VAR[tone], boxShadow: `0 0 10px ${TONE_VAR[tone]}` }}
          />
        </div>
        <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </TiltCard>
    </Reveal>
  );
}

export function MetricPill({
  icon: Icon,
  label,
  value,
  suffix,
  decimals,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl glass px-4 py-3">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="font-display text-lg font-semibold leading-none">
          <Counter value={value} suffix={suffix ?? ""} decimals={decimals ?? 0} />
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

type MotionButtonProps = React.ComponentProps<typeof motion.button>;

export function GlowButton({
  children,
  variant = "primary",
  className,
  ...props
}: MotionButtonProps & { variant?: "primary" | "ghost" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      className={cn(
        "sheen relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors",
        variant === "primary"
          ? "text-primary-foreground bg-gradient-to-r from-cyan via-primary to-violet shadow-[0_10px_40px_-12px_color-mix(in_oklab,var(--primary)_80%,transparent)]"
          : "glass text-foreground hover:bg-accent/60",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid h-16 w-16 place-items-center rounded-2xl glass"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan/25 to-violet/25 blur-lg" />
        <Icon className="relative h-7 w-7 text-primary" />
      </motion.div>
      <p className="mt-5 font-display text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <GlowButton variant="ghost" className="mt-5 px-4 py-2 text-xs">
        {actionLabel}
      </GlowButton>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer-bg rounded-lg", className)} />;
}

export function StatusDot({ tone = "emerald" }: { tone?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
        style={{ background: TONE_VAR[tone] }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: TONE_VAR[tone] }} />
    </span>
  );
}
