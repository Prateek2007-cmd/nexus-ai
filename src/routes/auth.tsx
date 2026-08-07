import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, Lock, Mail, User, Hash, GraduationCap, Phone, Home } from "lucide-react";
import { useState } from "react";
import { NeuralBackground } from "@/components/fx/NeuralBackground";
import { AICore } from "@/components/fx/AICore";
import { GlowButton, StatusDot } from "@/components/ui-kit";
import { Logo } from "@/components/layout/AppShell";
import { saveStudent, getStudent } from "@/lib/student-store";

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

function FloatingField({ icon: Icon, label, type, value, onChange }: {
  icon: typeof Mail; label: string; type: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
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
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
    </div>
  );
}

function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign-up state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [semester, setSemester] = useState("5");
  const [cgpa, setCgpa] = useState("");
  const [phone, setPhone] = useState("");
  const [hostel, setHostel] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = getStudent();
    if (existing.isSignedUp && existing.email === loginEmail) {
      navigate({ to: "/dashboard" });
    } else {
      // Demo login — save dynamic profile
      const username = loginEmail ? loginEmail.split("@")[0] : "Student";
      const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
      saveStudent({
        email: loginEmail || "student@campus.edu",
        name: formattedName,
        isSignedUp: true,
        cgpa: 8.5,
        attendance: 88.0,
        rollNumber: `22B81A${Math.floor(1000 + Math.random() * 8999)}`,
        department: "CSE",
        semester: 6,
      });
      navigate({ to: "/dashboard" });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    saveStudent({
      name: name.trim(),
      email: email.trim(),
      rollNumber: rollNumber.trim() || `22B81A${Math.floor(1000 + Math.random() * 8999)}`,
      department: department || "CSE",
      semester: parseInt(semester) || 5,
      cgpa: parseFloat(cgpa) || 8.25,
      phone: phone.trim(),
      hostel: hostel.trim() || "BH-2, Room 304",
      attendance: 87.5,
      skills: ["Python", "Data Structures", "SQL", "Git"],
      resumeScore: 78,
      resumeTips: [
        "Add quantifiable metrics to key software project descriptions",
        "Include links to GitHub repositories for open-source contributions",
      ],
      registeredEvents: ["AI Systems Workshop", "Placement Prep Bootcamp"],
      isSignedUp: true,
    });
    navigate({ to: "/dashboard" });
  };

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

          {/* Tab Switcher */}
          <div className="mt-4 flex gap-1 rounded-xl bg-surface/60 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${mode === "login" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${mode === "signup" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign Up
            </button>
          </div>

          {mode === "login" ? (
            <>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Access the CampusX command center.</p>
              <form className="mt-7 space-y-3" onSubmit={handleLogin}>
                <FloatingField icon={Mail} label="Campus email" type="email" value={loginEmail} onChange={setLoginEmail} />
                <FloatingField icon={Lock} label="Password" type="password" value={loginPassword} onChange={setLoginPassword} />
                <GlowButton className="w-full" type="submit">
                  Authenticate <ArrowRight className="h-4 w-4" />
                </GlowButton>
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
                <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                  Create an account
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Create Account</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Join the CampusX AI platform.</p>
              <form className="mt-5 space-y-2.5" onSubmit={handleSignUp}>
                <FloatingField icon={User} label="Full Name" type="text" value={name} onChange={setName} />
                <FloatingField icon={Mail} label="Campus Email" type="email" value={email} onChange={setEmail} />
                <FloatingField icon={Hash} label="Roll Number" type="text" value={rollNumber} onChange={setRollNumber} />
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border bg-surface/50 px-3 py-2.5">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="AI/ML">AI/ML</option>
                    </select>
                  </div>
                  <div className="rounded-xl border bg-surface/50 px-3 py-2.5">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Semester</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <FloatingField icon={GraduationCap} label="CGPA" type="number" value={cgpa} onChange={setCgpa} />
                  <FloatingField icon={Phone} label="Phone" type="tel" value={phone} onChange={setPhone} />
                </div>
                <FloatingField icon={Home} label="Hostel (optional)" type="text" value={hostel} onChange={setHostel} />
                <FloatingField icon={Lock} label="Password" type="password" value={password} onChange={setPassword} />
                <GlowButton className="w-full" type="submit">
                  Create Account <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </form>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline">
                  Sign in
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
