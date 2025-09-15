// components/survey/schema.ts
import * as z from "zod";

/**
 * baseSchema: สคีมาแบบพื้นฐาน (ไม่ผูกกับค่าคอนฟิกภายนอก)
 * - กฏ domain ของ email และ regex มือถือจะถูกเพิ่มผ่าน superRefine ในระดับฟอร์ม
 */
export const baseSchema = z.object({
  faculty: z.string().min(1, "กรุณาเลือกคณะ"),
  department: z.string().min(1, "กรุณาเลือกภาควิชา/สาขาวิชา"),
  program: z.string().min(1, "กรุณาเลือกสาขาวิชา"),
  intakeMode: z.string().min(1, "กรุณาเลือกรูปแบบการรับสมัคร"),
  intakeRound: z.string().optional(),
  coordinator: z.string().min(1, "กรุณากรอกชื่อผู้ประสานงาน"),
  phone: z.string().min(1, "กรุณากรอกหมายเลขโทรศัพท์"),
  email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
});

export type FormValues = z.infer<typeof baseSchema>;
