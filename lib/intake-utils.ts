// src/lib/intake-utils.ts
import {
  MONTHS_TH,
  parseISODateLocal,
  toISOStartOfDayUTC,
} from "@/lib/date-utils";

/** แปลง "YYYY-MM-DD" -> "YYYY-MM-DDT00:00:00.000Z"
 * ถ้าเป็น ISO อยู่แล้ว จะคงค่าไว้ (ไม่แก้เวลา)
 */
function toUTCStartISOFromDateLike(v: string) {
  if (!v) return v;
  return v.includes("T") ? v : toISOStartOfDayUTC(parseISODateLocal(v)); // ใช้ UTC midnight จริง ๆ
}

/** แปลง month ให้เป็นชื่อเดือนภาษาไทย
 *  - ถ้า MonthlyDraft.month เป็น string แล้ว (เช่น "ตุลาคม") -> ใช้เลย
 *  - ถ้าเป็น number (1-12) -> map เป็นชื่อเดือน
 *  - ถ้าไม่ส่ง month มา -> เดาจาก interview_date
 */
function resolveThaiMonthName(m: any): string {
  const raw = m as any;
  const monthField = raw.month as string | number | undefined;

  if (typeof monthField === "string" && monthField.trim()) {
    return monthField; // ผู้ใช้ป้อนชื่อเดือนมาแล้ว
  }
  if (typeof monthField === "number" && monthField >= 1 && monthField <= 12) {
    return MONTHS_TH[monthField - 1];
  }
  // เดาจากวันที่สัมภาษณ์
  const d = m.interview_date
    ? new Date(toUTCStartISOFromDateLike(m.interview_date))
    : undefined;
  return typeof d?.getMonth === "function" ? MONTHS_TH[d.getMonth()] : "";
}

/** ลบ field ที่ไม่ต้องการ และแปลงวันที่ให้เป็น ISO ที่ต้องการก่อนส่ง */
export function buildCreateAdmissionPayload(draft: any | any) {
  return {
    term: {
      semester: draft.term.semester,
      academic_year_th: draft.term.academic_year_th,
      label: draft.term.label,
      sort_key: draft.term.sort_key,
    },
    application_window: {
      // ถ้าเป็น "YYYY-MM-DD" จะถูกเซ็ตเป็น 00:00:00.000Z
      open_at: toUTCStartISOFromDateLike(draft.application_window.open_at),
      close_at: toUTCStartISOFromDateLike(draft.application_window.close_at),
      notice: draft.application_window.notice,
      calendar_url: draft.application_window.calendar_url,
    },
    rounds: (draft.rounds ?? [])
      // ตัด field ที่ไม่ต้องการออก เช่น open
      .map((r: any & { open?: boolean }) => ({
        no: r.no,
        title: r.title,
        interview_date: toUTCStartISOFromDateLike(r.interview_date),
      })),
    monthly: (draft.monthly ?? [])
      // ตัด field ที่ไม่ต้องการออก เช่น open, label/number month (แปลงเป็นชื่อเดือน)
      .map((m: any & { open?: boolean }) => ({
        month: resolveThaiMonthName(m),
        title: m.title,
        interview_date: toUTCStartISOFromDateLike(m.interview_date),
      })),
  };
}

export type CreateAdmissionPayload = ReturnType<
  typeof buildCreateAdmissionPayload
>;
