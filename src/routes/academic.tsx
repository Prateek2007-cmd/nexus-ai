import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard } from "@/components/ui-kit";
import { courses } from "@/lib/mock";
import { motion } from "framer-motion";
import { Reveal } from "@/components/fx/motion";
import { getStudent, StudentProfile } from "@/lib/student-store";

export const Route = createFileRoute("/academic")({
  head: () => ({
    meta: [
      { title: "Academic Agent — Timetable, Attendance & Exams | CampusX AI" },
      { name: "description", content: "The Academic Agent tracks your timetable, attendance thresholds, exam schedules and elective recommendations, grounded in institutional regulations." },
      { property: "og:title", content: "Academic Agent — CampusX AI" },
      { property: "og:description", content: "Timetable, attendance and exam intelligence from an autonomous academic agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Academic,
});

function Academic() {
  const [student, setStudent] = useState<StudentProfile>(getStudent());

  useEffect(() => {
    const handleUpdate = () => setStudent(getStudent());
    window.addEventListener("campusx_profile_updated", handleUpdate);
    return () => window.removeEventListener("campusx_profile_updated", handleUpdate);
  }, []);

  const cgpaDisplay = student.cgpa ? String(student.cgpa) : "8.64";
  const attendanceDisplay = student.attendance ? `${student.attendance}%` : "87.2%";
  const deptDisplay = student.department || "CSE";
  const semDisplay = student.semester || 5;
  const nameDisplay = student.name || "Student";

  return (
    <AppShell title="Academic Agent" subtitle={`Courses · timetable · attendance (${nameDisplay})`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Aggregate Attendance" value={attendanceDisplay} detail="Threshold 75%" tone="emerald" />
        <StatCard label="Active Courses" value="4" detail={`Semester ${semDisplay} · ${deptDisplay}`} tone="primary" />
        <StatCard label="Next Exam" value="Aug 26" detail="Compiler Design · A-108" tone="amber" />
        <StatCard label="CGPA" value={cgpaDisplay} detail={`Branch: ${deptDisplay}`} tone="cyan" delay={0.1} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title={`Today's Timetable (${nameDisplay})`} className="lg:col-span-2">
          <div className="space-y-2">
            {courses.map((c, i) => (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-surface/40 p-3 transition-colors hover:border-primary/40"
              >
                <span className="w-24 shrink-0 font-mono text-[11px] text-cyan">{c.slot}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {c.code} · {c.room}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${c.attendance < 75 ? "border-destructive/50 text-destructive" : "border-emerald/40 text-emerald"}`}
                >
                  {c.attendance}%
                </span>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel title="Attendance Health" delay={0.08}>
          <div className="space-y-4">
            {courses.map((c) => (
              <div key={c.code}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{c.name}</span>
                  <span className="font-mono">{c.attendance}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`h-full rounded-full ${c.attendance < 75 ? "bg-destructive" : "bg-gradient-to-r from-cyan to-violet"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.attendance}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Reveal delay={0.1} className="mt-4">
        <div className="rounded-2xl glass p-5">
          <p className="font-display text-sm font-semibold">Academic Agent Recommendation for {nameDisplay}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Compiler Design is at <span className="text-destructive">74%</span> — below the 75% eligibility
            threshold in <span className="font-mono text-cyan">academic_regulations_R22.pdf §6.2</span>.
            Attend the next 3 sessions to restore eligibility. I can draft a condonation request if you fall
            further behind.
          </p>
        </div>
      </Reveal>
    </AppShell>
  );
}
