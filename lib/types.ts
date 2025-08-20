// Data Types for KMUTT Survey System
export interface IntakeConfig {
  term: string;
  applyWindow: { start: string; end: string };
  calendarUrl: string;
  emailPolicy: { allowedDomains: string[] };
  intakeModes: Array<
    | { id: "none"; label: string }
    | { id: "batch"; label: string; rounds: string[] }
    | { id: "monthly"; label: string; days: number[] }
  >;
  announcementText: string;
  status: "open" | "closing" | "closed";
}

export interface Faculty {
  id: string;
  name: string;
  departments: Department[];
}

export interface Department {
  id: string;
  name: string;
  programs: Program[];
}

export interface Program {
  id: string;
  name: string;
  open: boolean;
}

export interface SurveyRow {
  id: string;
  faculty: string;
  department: string;
  program: string;
  submitterName: string;
  submitterEmail: string;
  submittedAt: string;
  intakeMode: string;
  coordinator: string;
  phone: string;
}

export interface FormData {
  faculty: string;
  department: string;
  program: string;
  intakeMode: string;
  intakeRound?: string;
  coordinator: string;
  phone: string;
  email: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  initials: string;
  role: string;
}

export interface TableFilters {
  faculty: string;
  department: string;
  program: string;
  submitterName: string;
  submitterEmail: string;
}