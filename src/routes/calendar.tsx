import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlowButton, Panel, StatCard } from "@/components/ui-kit";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, Tag, Filter } from "lucide-react";
import { getAllEvents, getRegisteredEventTitles, type CampusEvent } from "@/lib/events-store";
import { Reveal } from "@/components/fx/motion";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Agent-Synced Campus Schedule | CampusX AI" },
      { name: "description", content: "A unified schedule of classes, exams, drives and events kept in sync automatically by the CampusX agents." },
      { property: "og:title", content: "Calendar — CampusX AI" },
      { property: "og:description", content: "Your campus week, orchestrated by autonomous agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

type CalendarBlock = {
  id: string;
  title: string;
  date: string; // e.g. "Aug 12" or "2026-08-12"
  dayNumber: number; // e.g. 12
  time: string;
  tone: "primary" | "cyan" | "emerald" | "amber" | "violet";
  type: string;
  venue?: string;
  registered?: boolean;
};

const BASE_SCHEDULE: CalendarBlock[] = [
  { id: "b1", title: "Distributed Systems Lecture", date: "Aug 10", dayNumber: 10, time: "09:00 – 10:00 AM", tone: "primary", type: "Class", venue: "Room 304, IT Block" },
  { id: "b2", title: "Compiler Design Lab", date: "Aug 11", dayNumber: 11, time: "10:15 – 12:15 PM", tone: "cyan", type: "Lab", venue: "AI-Lab 2" },
  { id: "b3", title: "Machine Learning Concepts", date: "Aug 14", dayNumber: 14, time: "09:00 – 10:00 AM", tone: "emerald", type: "Class", venue: "Hall A" },
  { id: "b4", title: "Compiler Design Semester Exam", date: "Aug 22", dayNumber: 22, time: "10:00 – 01:00 PM", tone: "amber", type: "Exam", venue: "Examination Hall 1" },
  { id: "b5", title: "Library Book Return Due", date: "Aug 25", dayNumber: 25, time: "05:00 PM", tone: "cyan", type: "Deadline", venue: "Central Library" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<number>(18); // Default Aug 18
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [allBlocks, setAllBlocks] = useState<CalendarBlock[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Study");
  const [newTime, setNewTime] = useState("03:00 PM");

  const syncEventsToCalendar = async () => {
    const campusEvents: CampusEvent[] = getAllEvents();
    const registeredTitles = getRegisteredEventTitles().map((t) => t.toLowerCase());

    const eventBlocks: CalendarBlock[] = campusEvents.map((e, idx) => {
      let dayNum = 18;
      if (e.date.includes("12")) dayNum = 12;
      else if (e.date.includes("18")) dayNum = 18;
      else if (e.date.includes("21")) dayNum = 21;
      else if (e.date.includes("24")) dayNum = 24;
      else if (e.date.includes("28")) dayNum = 28;

      const isRegistered = registeredTitles.includes(e.title.toLowerCase());

      return {
        id: `event-${e.id || idx}`,
        title: e.title,
        date: e.date,
        dayNumber: dayNum,
        time: "02:00 – 05:00 PM",
        tone: isRegistered ? "emerald" : "violet",
        type: e.tag || "Event",
        venue: e.org || "Vasavi Campus",
        registered: isRegistered,
      };
    });

    let backendBlocks: CalendarBlock[] = [];
    try {
      const res = await fetch("/api/calendar/schedule");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          backendBlocks = data.map((b: any) => {
            let dayNum = 18;
            const match = b.date?.match(/\d+/);
            if (match) dayNum = parseInt(match[0], 10);
            return {
              id: b.id || `backend-${Math.random()}`,
              title: b.title,
              date: b.date || `Aug ${dayNum}`,
              dayNumber: dayNum,
              time: b.time || "10:00 AM",
              tone: (b.tone as any) || "primary",
              type: b.type || "Block",
              venue: b.venue || "Campus",
              registered: b.registered || false,
            };
          });
        }
      }
    } catch {}

    const baseList = backendBlocks.length > 0 ? backendBlocks : BASE_SCHEDULE;
    const combined = [...baseList];

    eventBlocks.forEach((eb) => {
      if (!combined.some((c) => c.title.toLowerCase() === eb.title.toLowerCase())) {
        combined.push(eb);
      }
    });

    setAllBlocks(combined);
  };

  useEffect(() => {
    syncEventsToCalendar();
    window.addEventListener("campusx_events_updated", syncEventsToCalendar);
    return () => window.removeEventListener("campusx_events_updated", syncEventsToCalendar);
  }, []);

  const addCustomBlock = async () => {
    if (!newTitle.trim()) return;

    const blockDate = `Aug ${selectedDay}`;
    const newBlock: CalendarBlock = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      date: blockDate,
      dayNumber: selectedDay,
      time: newTime,
      tone: "primary",
      type: newType,
      venue: "Student Schedule",
      registered: true,
    };

    setAllBlocks((prev) => [newBlock, ...prev]);
    setNewTitle("");
    setShowAddModal(false);

    // Sync to backend so AI assistant immediately knows about this block
    try {
      await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBlock.title,
          date: blockDate,
          time: newTime,
          type: newType,
          venue: "Student Schedule",
        }),
      });
    } catch (err) {
      console.error("Failed to sync calendar block to backend:", err);
    }
  };

  // August 2026 starts on a Saturday (index 6)
  const augustDaysCount = 31;
  const paddingDaysBefore = 6; // Saturday start

  const selectedDayBlocks = allBlocks.filter((b) => b.dayNumber === selectedDay);
  const registeredCount = allBlocks.filter((b) => b.registered).length;

  return (
    <AppShell title="Calendar Agent" subtitle="Interactive August 2026 campus grid · auto-synced events · AI scheduling">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Blocks" value={String(allBlocks.length)} detail="Scheduled in August 2026" tone="primary" />
        <StatCard label="Registered Events" value={String(registeredCount)} detail="Synced from Events store" tone="emerald" />
        <StatCard label="Selected Date" value={`Aug ${selectedDay}`} detail={`${selectedDayBlocks.length} entries for this date`} tone="cyan" />
        <StatCard label="AI Conflicts Resolved" value="0 Conflicts" detail="Automated buffer checks" tone="violet" delay={0.1} />
      </div>

      {/* Header controls */}
      <Reveal delay={0.04} className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-cyan" /> August 2026
          </h2>
          <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2.5 py-0.5 font-mono text-[11px] text-cyan">
            Vasavi College of Engineering (Autonomous)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border/80 bg-surface/60 p-1 font-mono text-xs">
            <button
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-3 py-1 transition-all ${
                viewMode === "month" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`rounded-lg px-3 py-1 transition-all ${
                viewMode === "agenda" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Agenda List
            </button>
          </div>

          <GlowButton onClick={() => setShowAddModal(true)} className="px-3 py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Block
          </GlowButton>
        </div>
      </Reveal>

      {/* Main View Grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Month View Component */}
        <Panel title="August 2026 Interactive Grid" className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-muted-foreground pb-2 border-b border-border/40">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {/* Blank padding cells before Saturday */}
            {Array.from({ length: paddingDaysBefore }).map((_, i) => (
              <div key={`pad-${i}`} className="h-16 rounded-xl border border-border/10 bg-surface/10 opacity-30" />
            ))}

            {/* Days of August 1 to 31 */}
            {Array.from({ length: augustDaysCount }).map((_, i) => {
              const dayNum = i + 1;
              const dayBlocks = allBlocks.filter((b) => b.dayNumber === dayNum);
              const isSelected = selectedDay === dayNum;
              const hasRegistered = dayBlocks.some((b) => b.registered);

              return (
                <motion.div
                  key={dayNum}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`group relative flex h-16 cursor-pointer flex-col justify-between rounded-xl border p-1.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/15 shadow-md shadow-primary/20 ring-1 ring-primary"
                      : dayBlocks.length > 0
                      ? "border-border/80 bg-surface/60 hover:border-cyan/50 hover:bg-surface/90"
                      : "border-border/30 bg-surface/20 hover:border-border/60 hover:bg-surface/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {hasRegistered && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" title="Registered Event" />
                    )}
                  </div>

                  {dayBlocks.length > 0 && (
                    <div className="space-y-0.5">
                      <div
                        className={`truncate rounded px-1 font-mono text-[9px] font-medium leading-tight ${
                          hasRegistered
                            ? "bg-emerald/20 text-emerald"
                            : isSelected
                            ? "bg-primary/20 text-primary"
                            : "bg-cyan/20 text-cyan"
                        }`}
                      >
                        {dayBlocks[0].title}
                      </div>
                      {dayBlocks.length > 1 && (
                        <p className="font-mono text-[8px] text-muted-foreground">+{dayBlocks.length - 1} more</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Panel>

        {/* Selected Date Agenda Details */}
        <Panel title={`Agenda for August ${selectedDay}, 2026`} className="h-full">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan" /> {selectedDayBlocks.length} entries scheduled
            </span>
            <GlowButton onClick={() => setShowAddModal(true)} variant="ghost" className="px-2 py-1 text-[11px]">
              <Plus className="h-3 w-3" /> Add Item
            </GlowButton>
          </div>

          <div className="mt-4 space-y-3">
            {selectedDayBlocks.length > 0 ? (
              selectedDayBlocks.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-xl border p-3 transition-all ${
                    b.registered
                      ? "border-emerald/40 bg-emerald/5 hover:border-emerald/70"
                      : "border-border/80 bg-surface/50 hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                        b.tone === "primary"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : b.tone === "emerald"
                          ? "border-emerald/40 bg-emerald/10 text-emerald"
                          : b.tone === "amber"
                          ? "border-amber/40 bg-amber/10 text-amber"
                          : "border-cyan/40 bg-cyan/10 text-cyan"
                      }`}
                    >
                      {b.type}
                    </span>
                    {b.registered && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-emerald">
                        <CheckCircle2 className="h-3 w-3" /> Registered
                      </span>
                    )}
                  </div>

                  <p className="mt-2 font-display text-sm font-semibold text-foreground">{b.title}</p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-cyan" /> {b.time}
                    </span>
                    {b.venue && (
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin className="h-3 w-3 text-violet" /> {b.venue}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-xl border border-border/40 bg-surface/20 p-8 text-center text-xs text-muted-foreground">
                No entries scheduled for <strong>August {selectedDay}</strong>.<br />
                Click <strong>"Add Block"</strong> to schedule a class, exam, or study block!
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Add Custom Schedule Block Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl glass p-6 shadow-2xl"
            >
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan" /> Add Block to Aug {selectedDay}, 2026
              </h3>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-mono text-muted-foreground mb-1">Title / Event Name</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Data Structures Prep, Hackathon Sync..."
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-muted-foreground mb-1">Category</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Study">Study Session</option>
                      <option value="Class">Class / Lecture</option>
                      <option value="Lab">Lab Session</option>
                      <option value="Exam">Exam / Quiz</option>
                      <option value="Meeting">Club / Meeting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-muted-foreground mb-1">Time Slot</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <GlowButton onClick={() => setShowAddModal(false)} variant="ghost" className="px-3 py-1.5 text-xs">
                  Cancel
                </GlowButton>
                <GlowButton onClick={addCustomBlock} className="px-4 py-1.5 text-xs">
                  Save Block
                </GlowButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
