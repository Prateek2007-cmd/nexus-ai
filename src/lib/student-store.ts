/**
 * Student profile store.
 *
 * Lightweight in-memory store that mirrors the demo student seeded in the
 * backend (`demo-user-001` / Aarav Raman). Emits a `campusx_profile_updated`
 * window event on save so any mounted UI can refresh, mirroring the contract
 * used by AppShell / profile / placement / auth routes.
 */

export type StudentProfile = {
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  semester: number;
  cgpa: number;
  attendance: number;
  phone: string;
  hostel: string;
  skills: string[];
  resumeScore?: number;
  resumeTips?: string[];
  resumeText?: string;
};

export const PROFILE_UPDATED_EVENT = "campusx_profile_updated";

const DEFAULT_STUDENT: StudentProfile = {
  name: "Aarav Raman",
  email: "aarav.r@campus.edu",
  rollNumber: "22B81A05C4",
  department: "CSE",
  semester: 5,
  cgpa: 8.64,
  attendance: 85,
  phone: "+91 98xxx xx421",
  hostel: "Block C · Room 214",
  skills: ["Python", "React", "FastAPI", "Machine Learning", "Git", "SQL"],
};

let cached: StudentProfile = { ...DEFAULT_STUDENT };

export function getStudent(): StudentProfile {
  return { ...cached };
}

export function saveStudent(patch: Partial<StudentProfile>): StudentProfile {
  cached = { ...cached, ...patch };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }
  return getStudent();
}

export function getInitials(name?: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AR";
  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}
