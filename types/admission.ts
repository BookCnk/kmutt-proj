// types/admission.ts

export type IntakeMode = "none" | "rounds" | "monthly";

export type AdmissionTerm = {
  semester: number; // 1 | 2 | 3
  academic_year_th: number; // พ.ศ.
  label: string; // "1/2568"
  sort_key: number; // 2568.1
};

export type ApplicationWindow = {
  open_at: string; // ISO string
  close_at: string; // ISO string
  notice?: string;
  calendar_url?: string;
};

export type RoundRow = {
  no: number;
  interview_date: string; // ISO date
};

export type MonthlyRow = {
  // คุณใช้ชื่อเดือนเป็นภาษาไทยใน payload ตัวอย่าง
  month?: string; // เช่น "มกราคม" (ถ้าไม่ต้องการ เก็บเฉพาะ interview_date ก็ลบออกได้)
  interview_date: string; // ISO date
};

export type Admission = {
  _id: string; // เช่น "2-2568"
  term: AdmissionTerm;
  active: boolean;
  intake_mode?: IntakeMode; // optional เผื่อบาง payload ไม่ส่งมา
  application_window?: ApplicationWindow | null;
  rounds?: RoundRow[];
  monthly?: MonthlyRow[];
  meta?: {
    program_id?: string | null;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  };
};

export type AdmissionResponse = {
  items: Admission[];
  total: number;
};

// ----- DTOs -----
export type CreateAdmissionDto = Omit<Admission, "_id">;

export type UpdateAdmissionDto = Partial<Omit<Admission, "_id" | "term">> & {
  term?: AdmissionTerm;
};
