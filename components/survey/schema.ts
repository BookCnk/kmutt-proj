// components/survey/schema.ts
import * as z from "zod";

/* ---------- Sub-schemas ---------- */
const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "รูปแบบวันที่ไม่ถูกต้อง");

const programRowSchema = z.object({
  program: z.string().min(1, "กรุณาเลือกสาขาวิชา"),
  masters: z.number().int().min(0).optional(),
  doctorals: z.number().int().min(0).optional(),
});

const intakeRoundItemSchema = z.object({
  no: z.number().int().nonnegative().optional(), // ให้ว่างได้ เดี๋ยวไปจัดลำดับตอนส่ง
  interview_date: isoDate,
});

const intakeMonthlyItemSchema = z.object({
  no: z.number().int().nonnegative().optional(), // ให้ว่างได้ เดี๋ยวไปจัดลำดับตอนส่ง
  month: z.union([z.string(), z.number()]).optional(), // ชื่อเดือนหรือเลขเดือน
  interview_date: isoDate,
});

const intakeCalendarSchema = z
  .object({
    rounds: z.array(intakeRoundItemSchema).default([]),
    monthly: z.array(intakeMonthlyItemSchema).default([]),
  })
  .partial()
  .default({ rounds: [], monthly: [] });

/* ---------- Base form schema ---------- */
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

  // ✅ เพิ่ม intake_calendar แบบ optional + default เพื่อไม่ให้ค่าโดน strip
  intake_calendar: intakeCalendarSchema.optional(),
});

export type FormValues = z.infer<typeof baseSchema>;
