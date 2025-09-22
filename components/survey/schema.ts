// components/survey/schema.ts
import * as z from "zod";

const programRowSchema = z.object({
  program: z.string().min(1, "กรุณาเลือกสาขาวิชา"),
  masters: z.number().int().min(0).optional(),
  doctorals: z.number().int().min(0).optional(),
});

export const baseSchema = z.object({
  faculty: z.string().min(1, "กรุณาเลือกคณะ"),
  department: z.string().min(1, "กรุณาเลือกภาควิชา/สาขาวิชา"),

  programs: z
    .array(programRowSchema)
    .min(1, "กรุณาเพิ่มสาขาวิชาอย่างน้อย 1 รายการ"),

  intakeModes: z
    .array(z.enum(["none", "rounds", "monthly"]))
    .min(1, "กรุณาเลือกรูปแบบการรับสมัครอย่างน้อย 1 ตัวเลือก"),

  intakeRound: z.string().optional(),
  coordinator: z.string().min(1, "กรุณากรอกชื่อผู้ประสานงาน"),
  phone: z.string().min(1, "กรุณากรอกหมายเลขโทรศัพท์"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
});

export type FormValues = z.infer<typeof baseSchema>;
