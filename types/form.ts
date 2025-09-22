// types/form.ts

export type FormStatus =
  | "draft"
  | "received"
  | "reviewing"
  | "approved"
  | "rejected"; // ปรับให้ตรงกับแบ็กเอนด์ได้

export interface IntakeDegreeItem {
  amount: number;
  bachelor_req?: boolean;
  master_req?: boolean; // ใช้กับ doctoral
}

export interface IntakeDegree {
  master?: IntakeDegreeItem;
  doctoral?: IntakeDegreeItem;
}

export interface RoundItem {
  active: boolean;
  no: number; // เลขรอบ
  interview_date: string; // ISO 8601
}

export interface MonthlyItem {
  active: boolean;
  month: string; // e.g. "มกราคม"
  interview_date: string; // ISO 8601
}

export interface IntakeCalendar {
  rounds?: RoundItem[];
  monthly?: MonthlyItem[];
}

export interface Submitter {
  name: string;
  phone: string;
  email: string;
}

export interface CreateFormDto {
  admission_id: string;
  faculty_id: string;
  department_id: string;
  program_id: string;
  intake_degree: IntakeDegree;
  intake_calendar: IntakeCalendar;
  submitter: Submitter;
  status: FormStatus; // ตัวอย่างในโจทย์: "received"
}

// ใช้เวลาตอบกลับจาก API
export interface Form extends CreateFormDto {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

// สำหรับอัปเดตทั่วไป
export type UpdateFormDto = Partial<CreateFormDto>;
