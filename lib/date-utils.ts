// src/lib/date-utils.ts

// ---------- Types ----------
export type IntakeMode = "none" | "rounds" | "monthly";

export interface MonthlyRow {
  interview_date: string; // "YYYY-MM-DD" หรือ ISO string
  month?: number; // 1-12 (optional; auto-fill ถ้าไม่ให้มา)
  label?: string; // ป้ายกำกับเดือนภาษาไทย (optional; auto-fill)
}

// ---------- Constants ----------
export const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

// ---------- Formatters / Labels ----------
export const formatDateTH = (iso: string) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
    new Date(iso)
  );

export const intakeModeLabel = (m: IntakeMode) =>
  m === "none"
    ? "ไม่กำหนด"
    : m === "rounds"
    ? "สัมภาษณ์เป็นรอบ"
    : "สัมภาษณ์รายเดือน";

export const computeLabel = (semester: number, yearTH: number) =>
  `${semester}/${yearTH}`;

export const computeSortKey = (semester: number, yearTH: number) =>
  Number((yearTH + semester / 10).toFixed(1));

// ---------- Day boundaries (UTC ISO) ----------
export const toISOStartOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  ).toISOString();

export const toISOEndOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  ).toISOString();

// ---------- Local date parse/format ----------
export const parseISODateLocal = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const toISODateLocal = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(
    2,
    "0"
  )}-${`${d.getDate()}`.padStart(2, "0")}`;

// Convert full ISO UTC -> local Date (keep calendar day)
export const parseUTCDateToLocalDate = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// ---------- Time helpers ----------
export const getTimeFromISO = (iso: string) => {
  try {
    const d = new Date(iso);
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "00:00";
  }
};

// Combine local date "YYYY-MM-DD" + "HH:MM" -> ISO(UTC)
export const localDateAndTimeToISOUTC = (dateISO: string, timeHHMM: string) => {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map((v) => Number(v || 0));
  const local = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  return local.toISOString();
};

// ---------- Monthly helpers ----------
export const fillMonthly = (rows: MonthlyRow[]) =>
  rows.map((m) => {
    const d = parseISODateLocal(m.interview_date);
    const month = m.month ?? d.getMonth() + 1;
    const label = m.label ?? MONTHS_TH[month - 1];
    return { ...m, month, label };
  });

// ---------- Payload helpers ----------
export const toUTCStartISOFromLocalDate = (dateISO: string) => {
  // "YYYY-MM-DD" -> ISO(UTC) 00:00
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return new Date(dateISO).toISOString();
  const local = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0);
  return local.toISOString();
};

export const ensureFullISO = (v: string) =>
  v.includes("T") ? v : toUTCStartISOFromLocalDate(v);

export const monthLabelFromDateLike = (v: string) => {
  const dd = v.includes("T") ? new Date(v) : parseISODateLocal(v);
  return MONTHS_TH[dd.getMonth()];
};
