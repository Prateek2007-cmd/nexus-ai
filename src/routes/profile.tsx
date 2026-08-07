import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, StatCard, GlowButton } from "@/components/ui-kit";
import { Reveal, TiltCard } from "@/components/fx/motion";
import { ShieldCheck, GraduationCap, Mail, Phone, MapPin, Edit3, Check, X, Sparkle, Code } from "lucide-react";
import { getStudent, saveStudent, getInitials, StudentProfile } from "@/lib/student-store";

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
  const [student, setStudent] = useState<StudentProfile>(getStudent());
  const [editing, setEditing] = useState(false);

  // Form states
  const [name, setName] = useState(student.name || "Aarav Raman");
  const [email, setEmail] = useState(student.email || "aarav.r@campus.edu");
  const [rollNumber, setRollNumber] = useState(student.rollNumber || "22B81A05C4");
  const [department, setDepartment] = useState(student.department || "CSE");
  const [semester, setSemester] = useState(String(student.semester || 6));
  const [cgpa, setCgpa] = useState(String(student.cgpa || 8.64));
  const [attendance, setAttendance] = useState(String(student.attendance || 87.2));
  const [phone, setPhone] = useState(student.phone || "+91 98765 43210");
  const [hostel, setHostel] = useState(student.hostel || "Hostel Block C · Room 214");
  const [skillsText, setSkillsText] = useState(student.skills.length > 0 ? student.skills.join(", ") : "Python, React, Machine Learning, SQL, Distributed Systems");

  useEffect(() => {
    const handleUpdate = () => {
      const updated = getStudent();
      setStudent(updated);
      if (!editing) {
        setName(updated.name || "Aarav Raman");
        setEmail(updated.email || "aarav.r@campus.edu");
        setRollNumber(updated.rollNumber || "22B81A05C4");
        setDepartment(updated.department || "CSE");
        setSemester(String(updated.semester || 6));
        setCgpa(String(updated.cgpa || 8.64));
        setAttendance(String(updated.attendance || 87.2));
        setPhone(updated.phone || "+91 98765 43210");
        setHostel(updated.hostel || "Hostel Block C · Room 214");
        setSkillsText(updated.skills.length > 0 ? updated.skills.join(", ") : "Python, React, Machine Learning, SQL, Distributed Systems");
      }
    };

    window.addEventListener("campusx_profile_updated", handleUpdate);
    return () => window.removeEventListener("campusx_profile_updated", handleUpdate);
  }, [editing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skillsText.split(",").map((s) => s.trim()).filter(Boolean);

    saveStudent({
      name,
      email,
      rollNumber,
      department,
      semester: parseInt(semester) || 6,
      cgpa: parseFloat(cgpa) || 8.0,
      attendance: parseFloat(attendance) || 85.0,
      phone,
      hostel,
      skills: skillsArray,
      isSignedUp: true,
    });

    setEditing(false);
  };

  const displayName = student.name || "Aarav Raman";
  const displayRoll = student.rollNumber || "22B81A05C4";
  const displayEmail = student.email || "aarav.r@campus.edu";
  const displayDept = student.department || "CSE";
  const displaySem = student.semester || 6;
  const displayCgpa = student.cgpa || 8.64;
  const displayAtt = student.attendance || 87.2;
  const displayPhone = student.phone || "+91 98765 43210";
  const displayHostel = student.hostel || "Hostel Block C · Room 214";
  const displaySkills = student.skills.length > 0 ? student.skills : ["Python", "React", "Machine Learning", "SQL", "Distributed Systems"];

  return (
    <AppShell title="Profile" subtitle="Identity · academic record · agent memory">
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal>
          <TiltCard className="h-full text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-cyan via-primary to-violet font-display text-2xl font-semibold text-primary-foreground">
              {getInitials(displayName)}
            </div>
            <p className="mt-4 font-display text-lg font-semibold">{displayName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">{displayRoll}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald">
              <ShieldCheck className="h-3 w-3" /> verified identity
            </span>

            <div className="mt-6 space-y-2.5 text-left text-xs text-muted-foreground">
              {[
                { i: GraduationCap, t: `B.Tech ${displayDept} · Semester ${displaySem}` },
                { i: Mail, t: displayEmail },
                { i: Phone, t: displayPhone },
                { i: MapPin, t: displayHostel },
              ].map(({ i: I, t }) => (
                <div key={t} className="flex items-center gap-2.5">
                  <I className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{t}</span>
                </div>
              ))}
            </div>

            <GlowButton
              onClick={() => setEditing(!editing)}
              variant="ghost"
              className="mt-6 w-full px-4 py-2 text-xs"
            >
              {editing ? <X className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />} {editing ? "Cancel Editing" : "Edit Profile"}
            </GlowButton>
          </TiltCard>
        </Reveal>

        <div className="grid gap-4 lg:col-span-2">
          {editing ? (
            <Panel title="Edit Student Profile">
              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Full Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Campus Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Roll Number</label>
                    <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary">
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="AI/ML">AI/ML</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Semester</label>
                    <input type="number" value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">CGPA</label>
                    <input type="number" step="0.01" value={cgpa} onChange={(e) => setCgpa(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Attendance (%)</label>
                    <input type="number" step="0.1" value={attendance} onChange={(e) => setAttendance(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Hostel / Address</label>
                    <input value={hostel} onChange={(e) => setHostel(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-muted-foreground mb-1">Skills (comma separated)</label>
                  <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="w-full rounded-lg border border-border bg-surface/60 p-2 text-xs outline-none focus:border-primary" />
                </div>

                <div className="flex gap-2 pt-2">
                  <GlowButton type="submit" variant="primary" className="flex-1 py-2 text-xs">
                    <Check className="h-3.5 w-3.5" /> Save Changes
                  </GlowButton>
                  <GlowButton type="button" onClick={() => setEditing(false)} variant="ghost" className="py-2 text-xs">
                    Cancel
                  </GlowButton>
                </div>
              </form>
            </Panel>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label="CGPA" value={String(displayCgpa)} detail={`Branch: ${displayDept}`} tone="primary" />
                <StatCard label="Attendance" value={`${displayAtt}%`} detail={displayAtt >= 75 ? "Above threshold" : "Warning"} tone="emerald" />
                <StatCard label="Extracted Skills" value={String(displaySkills.length)} detail="Parsed from resume" tone="cyan" />
                <StatCard label="Agent Sessions" value="248" detail="Lifetime personalized" tone="violet" delay={0.1} />
              </div>

              {/* Skills Display */}
              <Panel title="Technical Competencies & Skills">
                <div className="flex flex-wrap gap-1.5">
                  {displaySkills.map((sk) => (
                    <span key={sk} className="inline-flex items-center gap-1 rounded-lg border border-cyan/30 bg-cyan/10 px-2.5 py-1 font-mono text-xs text-cyan">
                      <Code className="h-3 w-3" /> {sk}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel title="Agent Personalized Context" delay={0.08}>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {[
                    `Target student: ${displayName} (${displayRoll}) · CGPA ${displayCgpa} · ${displayDept}`,
                    `Skills indexed: ${displaySkills.slice(0, 4).join(", ")}`,
                    `Attendance monitoring active for ${displayDept} Semester ${displaySem} courses`,
                    "All AI agents inject live profile context for intent execution and eligibility checks.",
                  ].map((m) => (
                    <li key={m} className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2.5 font-mono text-[11px]">
                      {m}
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
