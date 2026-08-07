import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessagesSquare,
  Network,
  GraduationCap,
  Briefcase,
  CalendarDays,
  LifeBuoy,
  BookOpen,
  Bell,
  BarChart3,
  Settings,
  UserRound,
  Menu,
  X,
  Search,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NeuralBackground } from "@/components/fx/NeuralBackground";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: MessagesSquare },
  { to: "/agents", label: "Agent Network", icon: Network },
  { to: "/academic", label: "Academic", icon: GraduationCap },
  { to: "/placement", label: "Placement", icon: Briefcase },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/services", label: "Student Services", icon: LifeBuoy },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative grid h-8 w-8 place-items-center">
        <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan via-primary to-violet opacity-80 blur-[6px]" />
        <span className="absolute inset-0 rounded-lg border border-border bg-surface" />
        <span className="relative font-display text-sm font-bold">X</span>
      </span>
      {!compact && (
        <span className="font-display text-[15px] font-semibold tracking-tight">
          CAMPUSX <span className="text-gradient">AI</span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl border border-border bg-sidebar-accent"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <item.icon
              className={cn(
                "relative h-4 w-4 transition-transform group-hover:scale-110",
                active && "text-primary",
              )}
            />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <NeuralBackground density={0.5} />
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-5 backdrop-blur-xl lg:flex">
        <Logo />
        <div className="mt-7 flex-1 overflow-y-auto pr-1">{nav}</div>
        <div className="mt-4 rounded-2xl glass p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            orchestrator
          </p>
          <p className="mt-1 text-sm">8 agents online</p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
              animate={{ width: ["30%", "88%", "52%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar px-4 py-5"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-6 overflow-y-auto">{nav}</div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="hidden items-center gap-2 rounded-xl glass px-3 py-1.5 md:flex">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Ask anything</span>
              <kbd className="rounded border border-border px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            {actions}
            <div className="h-8 w-8 rounded-full border border-border bg-gradient-to-br from-primary/40 to-violet/40" />
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
