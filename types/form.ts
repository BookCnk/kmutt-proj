// types/form.ts
export type IntakeRoundItem = {
  no: number;
  interview_date: string; // ISO string
  active?: boolean; // optional
};

export type IntakeMonthlyItem = {
  month: string; // "มกราคม" | "กุมภาพันธ์" | ...
  interview_date: string; // ISO string
  active?: boolean; // optional
};

export type IntakeCalendar = {
  rounds: { no: number; interview_date: string; active?: boolean }[];
  monthly: { month: string; interview_date: string; active?: boolean }[];
};

export type IntakeDegree = {
  master?: {
    amount: number;
    bachelor_req: boolean;
  };
  doctoral?: {
    amount: number;
    bachelor_req: boolean;
    master_req: boolean;
  };
};

export type IntakeProgramItem = {
  program_id: string;
  intake_degree: IntakeDegree;
  intake_calendar: IntakeCalendar;
};

export type Submitter = {
  name: string;
  phone: string;
  email: string;
};

export type CreateFormDto = {
  user_id?: string;
  admission_id: string;
  faculty_id: string;
  department_id: string;
  intake_programs: IntakeProgramItem[];
  submitter: Submitter;
  status: "received" | "draft" | "submitted";
};

export interface Form extends CreateFormDto {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateFormPayloadV2 = {
  admission_id: string;
  faculty_id: string;
  department_id: string;
  intake_programs: {
    program_id: string;
    intake_degree: {
      master: { amount: number; bachelor_req: boolean };
      doctoral: { amount: number; bachelor_req: boolean; master_req: boolean };
    };
    intake_calendar: IntakeCalendar;
  }[];
  submitter: { name: string; phone: string; email: string };
  status: "received" | "draft" | "submitted";
};

// สำหรับอัปเดตทั่วไป
export type UpdateFormDto = Partial<CreateFormDto>;
