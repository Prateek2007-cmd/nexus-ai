import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard, GlowButton } from "@/components/ui-kit";
import { Reveal, TiltCard } from "@/components/fx/motion";
import { ShieldCheck, GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Student Profile — Identity & Agent Memory | CampusX AI" },
      { name: "description", content: "Your verified campus identity, academic record and the profile context CampusX agents use to personalize every response." },
      { property: "og:title", content: "Student Profile — CampusX AI" },
      { property: "og:description", content: "Verified identity and agent memory for personalized campus assistance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  return (
    <AppShell title="Profile" subtitle="Identity · academic record · agent memory">
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal>
          <TiltCard className="h-full text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan via-primary to-violet font-display text-2xl font-semibold text-primary-foreground">
              AR
            </div>
            <p className="mt-4 font-display text-lg font-semibold">Aarav Raman</p>
            <p className="font-mono text-[11px] text-muted-foreground">22B81A05C4</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald">
              <ShieldCheck className="h-3 w-3" /> verified
            </span>
            <div className="mt-6 space-y-2.5 text-left text-xs text-muted-foreground">
              {[
                { i: GraduationCap, t: "B.Tech CSE · Semester V" },
                { i: Mail, t: "aarav.r@campus.edu" },
                { i: Phone, t: "+91 98••• ••421" },
                { i: MapPin, t: "Hostel Block C · Room 214" },
              ].map(({ i: I, t }) => (
                <div key={t} className="flex items-center gap-2.5">
                  <I className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t}</span>
                </div>
              ))}
            </div>
            <GlowButton variant="ghost" className="mt-6 w-full px-4 py-2 text-xs">Edit profile</GlowButton>
          </TiltCard>
        </Reveal>

        <div className="grid gap-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="CGPA" value="8.64" detail="Top 12% of batch" tone="primary" />
            <StatCard label="Attendance" value="87.2%" detail="Above threshold" tone="emerald" />
            <StatCard label="Credits Earned" value="102" detail="of 160" tone="cyan" />
            <StatCard label="Agent Sessions" value="248" detail="Lifetime" tone="violet" delay={0.1} />
          </div>

          <Panel title="Agent Memory" delay={0.08}>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {[
                "Prefers concise answers with a source citation.",
                "Interested in ML infrastructure and distributed systems roles.",
                "Wants attendance warnings at the 78% mark, not 75%.",
                "Time zone IST · reminders 60 minutes before an event.",
              ].map((m) => (
                <li key={m} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2.5">{m}</li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
