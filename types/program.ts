export type Program = {
  _id: string;
  faculty_id: {
    _id: string;
    title: string;
  };
  department_id: {
    _id: string;
    title: string;
  };
  title: string;
  time: string;
  degree_level: string;
  degree_abbr: string;
  active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  __v?: number;
};

export type CreateProgramDto = {
  faculty_id: string; // MongoId ของคณะ (จำเป็น)
  department_id?: string; // MongoId ของภาควิชา (ไม่จำเป็น)
  title: string; // ชื่อสาขา
  time: string; // วัน-เวลาที่ดำเนินการเรียนการสอน (จำเป็น)
  degree_level: "master" | "doctoral"; // ระดับปริญญา
  degree_abbr: string; // ตัวย่อปริญญา (เช่น "วศ.ม.", "ปร.ด.")
  active?: boolean; // เปิดใช้งานหรือไม่ (ไม่จำเป็น)
  degree_req?: "bachelor" | "master"; // วุฒิขั้นต่ำที่ต้องจบ (ไม่จำเป็น)
  order?: number; // ลำดับการแสดงผล (ไม่จำเป็น)
};


export type UpdateProgramDto = Partial<CreateProgramDto>;

export type ProgramResponse = {
  status: boolean;
  info: {
    pages: number;
    limit: number;
    currentCount: number;
    totalCount: number;
  };
  data: Program[];
};
