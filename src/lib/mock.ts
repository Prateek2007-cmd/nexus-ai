export type AgentStatus = "idle" | "thinking" | "planning" | "retrieving" | "calling" | "reasoning" | "completed";

export const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Thinking",
  planning: "Planning",
  retrieving: "Retrieving Knowledge",
  calling: "Calling APIs",
  reasoning: "Reasoning",
  completed: "Completed",
};

export const agents = [
  { id: "orchestrator", name: "Orchestrator Agent", tag: "core", desc: "Intent parsing, task decomposition, agent routing", tasks: 18422, success: 99.2 },
  { id: "academic", name: "Academic Agent", tag: "academics", desc: "Courses, timetables, attendance, exam schedules", tasks: 6120, success: 98.4 },
  { id: "placement", name: "Placement Agent", tag: "careers", desc: "Eligibility, internships, resume analysis, prep", tasks: 4380, success: 97.6 },
  { id: "events", name: "Events Agent", tag: "campus", desc: "Workshops, hackathons, registrations, reminders", tasks: 3915, success: 99.0 },
  { id: "knowledge", name: "Knowledge Agent", tag: "RAG", desc: "Vector retrieval over policies, handbooks, circulars", tasks: 9024, success: 96.8 },
  { id: "services", name: "Student Services Agent", tag: "services", desc: "Hostel, library, scholarships, transport, grievances", tasks: 2870, success: 98.1 },
  { id: "communication", name: "Communication Agent", tag: "comms", desc: "Drafts emails, announcements, appointment scheduling", tasks: 2310, success: 98.9 },
  { id: "notification", name: "Notification Agent", tag: "scheduling", desc: "Reminders, calendar sync, push delivery", tasks: 5641, success: 99.7 },
] as const;

export const heroStats = [
  { label: "Autonomous Workflows", value: 128400, suffix: "+" },
  { label: "Agents Online", value: 8, suffix: "/8" },
  { label: "Avg. Latency", value: 412, suffix: "ms" },
  { label: "Workflow Success", value: 99.2, suffix: "%", decimals: 1 },
];

export const kpis = [
  { label: "System Health", value: "Optimal", detail: "All subsystems nominal", tone: "emerald" },
  { label: "Agents Online", value: "8 / 8", detail: "0 degraded", tone: "primary" },
  { label: "Workflow Success", value: "99.2%", detail: "+0.4% vs last week", tone: "cyan" },
  { label: "Median Latency", value: "412ms", detail: "-38ms vs last week", tone: "violet" },
  { label: "Knowledge Searches", value: "24,918", detail: "RAG hits today", tone: "primary" },
  { label: "Memory Usage", value: "62%", detail: "12.4 GB vector store", tone: "amber" },
  { label: "External API Calls", value: "8,142", detail: "Calendar · Mail · ERP", tone: "cyan" },
  { label: "Task Queue", value: "17", detail: "Avg wait 0.8s", tone: "violet" },
];

export const throughput = Array.from({ length: 24 }, (_, i) => ({
  t: `${String(i).padStart(2, "0")}:00`,
  workflows: Math.round(180 + Math.sin(i / 2.4) * 90 + (i % 5) * 14),
  tokens: Math.round(900 + Math.cos(i / 3) * 320 + (i % 4) * 60),
}));

export const latencySeries = Array.from({ length: 16 }, (_, i) => ({
  t: `T-${16 - i}`,
  p50: Math.round(300 + Math.sin(i / 2) * 60),
  p95: Math.round(680 + Math.cos(i / 1.7) * 120),
}));

export const agentLoad = agents.slice(1).map((a) => ({
  name: a.name.replace(" Agent", ""),
  load: Math.round(a.tasks / 100),
}));

export const activities = [
  { agent: "Placement Agent", text: "Verified Google SDE internship eligibility for 42 students", time: "12s ago", tone: "primary" },
  { agent: "Knowledge Agent", text: "Retrieved 6 chunks from Academic Regulations R22 handbook", time: "48s ago", tone: "cyan" },
  { agent: "Events Agent", text: "Registered 118 participants for AI Systems Workshop", time: "2m ago", tone: "violet" },
  { agent: "Notification Agent", text: "Scheduled 96 reminders across campus calendar", time: "4m ago", tone: "emerald" },
  { agent: "Communication Agent", text: "Drafted makeup-exam permission email for review", time: "7m ago", tone: "amber" },
  { agent: "Orchestrator", text: "Decomposed multi-step request into 5 agent tasks", time: "9m ago", tone: "primary" },
];

export const workflowTimeline = [
  { agent: "Orchestrator", action: "Parsed intent · decomposed into 5 subtasks", ms: 180 },
  { agent: "Placement Agent", action: "Checked CGPA + branch eligibility against criteria", ms: 640 },
  { agent: "Knowledge Agent", action: "RAG over placement_policy_2026.pdf (6 chunks)", ms: 820 },
  { agent: "Events Agent", action: "Registered student for Placement Prep Workshop", ms: 410 },
  { agent: "Notification Agent", action: "Created calendar entry + T-60min reminder", ms: 240 },
  { agent: "Orchestrator", action: "Synthesized grounded final response", ms: 310 },
];

export const suggestions = [
  "Am I eligible for the Google internship?",
  "Summarize the examination regulations",
  "Show today's classes and recommend AI workshops",
  "Draft an email requesting a makeup exam",
];

export const events = [
  { title: "AI Systems Workshop", org: "Dept. of CSE", date: "Aug 12", seats: 42, tag: "Workshop" },
  { title: "AgentX Hackathon 2026", org: "HackerRank Campus Crew", date: "Aug 18", seats: 120, tag: "Hackathon" },
  { title: "Placement Prep Bootcamp", org: "T&P Cell", date: "Aug 21", seats: 8, tag: "Bootcamp" },
  { title: "Robotics Club Open Lab", org: "Robotics Club", date: "Aug 24", seats: 60, tag: "Club" },
];

export const companies = [
  { name: "Google", role: "SDE Intern", ctc: "₹2.1L/mo", cgpa: 8.0, eligible: true },
  { name: "Microsoft", role: "SWE Intern", ctc: "₹1.8L/mo", cgpa: 7.5, eligible: true },
  { name: "Nvidia", role: "Systems Intern", ctc: "₹1.6L/mo", cgpa: 8.5, eligible: false },
  { name: "Stripe", role: "Backend Intern", ctc: "₹2.4L/mo", cgpa: 8.2, eligible: false },
];

export const courses = [
  { code: "CS502", name: "Distributed Systems", attendance: 92, slot: "09:00 — 10:00", room: "B-204" },
  { code: "CS514", name: "Machine Learning", attendance: 87, slot: "10:10 — 11:10", room: "B-301" },
  { code: "CS522", name: "Compiler Design", attendance: 74, slot: "11:20 — 12:20", room: "A-108" },
  { code: "CS540", name: "Agentic AI Systems", attendance: 96, slot: "14:00 — 15:00", room: "AI Lab" },
];

export const documents = [
  { title: "Academic Regulations R22", type: "Handbook", category: "institutional", description: "VCE academic regulations, attendance criteria & grading system.", author: "Academic Audit Cell, VCE", chunks: 4, updated: "Aug 07, 2026" },
  { title: "Placement & Training Cell Policy 2026", type: "Policy", category: "institutional", description: "Campus recruitment guidelines & eligibility.", author: "Training & Placement Cell, VCE", chunks: 3, updated: "Aug 07, 2026" },
  { title: "Hostel Code of Conduct & Rules", type: "Circular", category: "institutional", description: "Curfew timings, mess schedule & entry rules.", author: "Chief Warden, VCE", chunks: 2, updated: "Aug 07, 2026" },
  { title: "Scholarship & Fee Concession Manual", type: "Notice", category: "institutional", description: "ePASS and VCE management merit awards.", author: "Admin Office, VCE", chunks: 2, updated: "Aug 07, 2026" },
  { title: "Introduction to Algorithms (CLRS)", type: "Book", category: "book", description: "Standard textbook for Algorithms & Dynamic Programming.", author: "Cormen, Leiserson, Rivest, Stein", chunks: 2, updated: "Aug 07, 2026" },
  { title: "Operating System Concepts", type: "Book", category: "book", description: "Textbook for Processes, Deadlocks & Paging.", author: "Silberschatz, Galvin, Gagne", chunks: 2, updated: "Aug 07, 2026" },
];

export const notifications = [
  { title: "Google internship shortlist released", body: "You are on the shortlist. Interview slot booking opens tomorrow.", time: "2m", tone: "primary", unread: true },
  { title: "Attendance alert — Compiler Design", body: "You are at 74%. 3 more classes required to reach 75%.", time: "1h", tone: "amber", unread: true },
  { title: "AI Systems Workshop confirmed", body: "Seat reserved. Calendar entry and reminder created.", time: "3h", tone: "cyan", unread: false },
  { title: "Library book due", body: "Introduction to Algorithms is due in 2 days.", time: "1d", tone: "violet", unread: false },
];

export const services = [
  { name: "Hostel", detail: "Room B-214 · Mess plan A · No dues", icon: "home" },
  { name: "Library", detail: "2 books issued · 1 due in 2 days", icon: "book" },
  { name: "Scholarships", detail: "Merit scholarship application open", icon: "award" },
  { name: "Transport", detail: "Route 7 · Bus arrives 07:45", icon: "bus" },
  { name: "Grievances", detail: "0 open tickets · Avg resolution 1.4d", icon: "life" },
  { name: "Campus FAQs", detail: "1,240 answers indexed", icon: "help" },
];

export type ScheduleItem = { title: string; time: string; tone: "primary" | "cyan" | "violet" | "emerald" | "amber" };

export const schedule: ScheduleItem[] = [
  { title: "Distributed Systems", time: "09:00 – 10:00", tone: "primary" },
  { title: "Compiler Design Lab", time: "10:15 – 12:15", tone: "cyan" },
  { title: "Placement Prep Bootcamp", time: "14:00 – 16:00", tone: "violet" },
  { title: "Machine Learning", time: "09:00 – 10:00", tone: "emerald" },
  { title: "Nexus Labs Drive", time: "11:00 – 17:00", tone: "amber" },
  { title: "AI Research Seminar", time: "16:00 – 17:30", tone: "violet" },
  { title: "Compiler Design Exam", time: "10:00 – 13:00", tone: "amber" },
  { title: "Library Return Due", time: "17:00", tone: "cyan" },
  { title: "Hackathon Kickoff", time: "18:00 – 21:00", tone: "primary" },
  { title: "Mentor Sync", time: "12:00 – 12:30", tone: "emerald" },
  { title: "Mock Interview", time: "15:00 – 15:45", tone: "violet" },
  { title: "Robotics Club", time: "17:30 – 19:00", tone: "cyan" },
];
