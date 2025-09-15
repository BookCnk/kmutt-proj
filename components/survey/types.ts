
export type Option = { value: string; label: string };

export type DepartmentOption = { id: string; name: string };
export type ProgramOption = { id: string; name: string; open: boolean };

export type IntakeModeDayBased = { id: string; label: string; days: number[] };
export type IntakeModeRoundBased = {
  id: string;
  label: string;
  rounds: string[];
};
export type IntakeModeConfig = IntakeModeDayBased | IntakeModeRoundBased;

export type IntakeConfig = {
  term: string;
  announcementText: string;
  calendarUrl: string;
  status: "open" | "closing" | "closed" | "unknown";
  applyWindow: { start: string; end: string }; // ISO
  emailPolicy: { allowedDomains: string[] };
  intakeModes: IntakeModeConfig[];
};

export type LoadingState<T> = {
  data: T;
  loading: boolean;
  error?: string;
};


