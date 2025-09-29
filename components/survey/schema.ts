// components/survey/schema.ts
import * as z from "zod";

/* ---------- Sub-schemas ---------- */
const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "รูปแบบวันที่ไม่ถูกต้อง");

// ✅ เพิ่มฟิลด์ *_req (boolean) และใส่ .passthrough() กันคีย์หลุด
const programRowSchema = z
  .object({
    program: z.string().min(1, "กรุณาเลือกสาขาวิชา"),

    // master
    masters: z.number().int().min(0).optional(),
    master_bachelor_req: z.boolean().optional(),

    // doctoral
    doctorals: z.number().int().min(0).optional(),
    doctoral_bachelor_req: z.boolean().optional(),
    doctoral_master_req: z.boolean().optional(),
  })
  .passthrough();

const intakeRoundItemSchema = z.object({
  no: z.number().int().nonnegative().optional(), // ให้ว่างได้ เดี๋ยวไปจัดลำดับตอนส่ง
  interview_date: isoDate,
});

const intakeMonthlyItemSchema = z.object({
  month: z.union([z.string(), z.number()]).optional(),
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
  phone: z
    .array(z.string().trim().min(1, "กรุณากรอกเบอร์"))
    .min(1, "กรุณากรอกหมายเลขโทรศัพท์อย่างน้อย 1 เบอร์"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),

  // เก็บปฏิทินแบบ optional + default กันโดน strip
  intake_calendar: intakeCalendarSchema.optional(),
});

export type FormValues = z.infer<typeof baseSchema>;
