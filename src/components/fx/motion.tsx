import { motion, useInView, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Scroll-triggered reveal with directional offset. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

const wordVariants: Variants = {
  hidden: { opacity: 0, y: "0.5em", filter: "blur(10px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: i * 0.06, ease: easeOut },
  }),
};

/** Word-by-word headline reveal. */
export function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={cn("inline-block", className)}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] pr-[0.28em]">
          <motion.span
            className="inline-block"
            custom={i + delay * 10}
            variants={wordVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Spring-driven animated counter that starts when scrolled into view. */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 22 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, mv, value]);

  useEffect(
    () =>
      spring.on("change", (v) =>
        setDisplay(
          v.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }),
        ),
      ),
    [spring, decimals],
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/** Magnetic hover wrapper — element drifts toward the cursor. */
export function Magnetic({
  children,
  strength = 0.32,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 240, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 240, damping: 18 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x, y }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left - rect.width / 2) * strength);
        y.set((e.clientY - rect.top - rect.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Glass card with 3D tilt, cursor-tracked border glow and lift. */
export function TiltCard({
  children,
  className,
  tilt = 8,
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), { stiffness: 200, damping: 20 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  return (
    <motion.div
      ref={ref}
      className={cn(
        "group relative rounded-2xl glass p-6 transition-shadow duration-500 hover:shadow-[var(--shadow-float)]",
        className,
      )}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={{ y: -4 }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        px.set(nx);
        py.set(ny);
        setGlow({ x: nx * 100, y: ny * 100 });
      }}
      onMouseLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at ${glow.x}% ${glow.y}%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 60%)`,
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/** Section heading with eyebrow + gradient rule. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
          {eyebrow}
        </span>
      </Reveal>
      <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] md:text-5xl">
        <WordReveal text={title} />
      </h2>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
