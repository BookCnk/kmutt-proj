// lib/exportFancy.ts
// ===== Dependencies =====
// 1) npm i exceljs
// 2) npm i file-saver   (ถ้าจะดาวน์โหลดในเบราว์เซอร์)
import ExcelJS from "exceljs";
// @ts-ignore: no types in your project
import { saveAs } from "file-saver";

// ===== Configs you can tweak =====
const LOGO_NODE_PATH = "D:/project/public/ICON.png"; // พาธโลโก้สำหรับ Node.js
const LOGO_WEB_URL = "/ICON.png"; // URL โลโก้สำหรับเบราว์เซอร์
const BRAND_ORANGE = "FFFF4616"; // #FA4616 (ARGB)
const TITLE_RED = "FFCC0000"; // สีแดงสำหรับหัวบรรทัดแรก
const DIRECT_CONTACT_MESSAGE = "ติดต่อสมัครโดยตรงที่สาขาวิชา";

const FACULTY_ORDER = [
  "คณะวิศวกรรมศาสตร์",
  "คณะวิทยาศาสตร์",
  "คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี",
  "คณะพลังงานสิ่งแวดล้อมและวัสดุ",
  "คณะทรัพยากรชีวภาพและเทคโนโลยี",
  "คณะศิลปศาสตร์",
  "คณะสถาปัตยกรรมศาสตร์และการออกแบบ",
  "สถาบันวิทยาการหุ่นยนต์ภาคสนาม",
  "คณะเทคโนโลยีสารสนเทศ",
  "บัณฑิตวิทยาลัยร่วมด้านพลังงานและสิ่งแวดล้อม",
  "บัณฑิตวิทยาลัยการจัดการและนวัตกรรม",
] as const;

function normText(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()\-–—]/g, "");
}

function getFacultyRank(facultyName: string): number {
  const f = normText(facultyName);

  for (let i = 0; i < FACULTY_ORDER.length; i++) {
    const o = normText(FACULTY_ORDER[i]);
    if (!o) continue;
    if (f.includes(o) || o.includes(f)) return i;
  }

  if (f.includes("jgsee")) return FACULTY_ORDER.length - 2;
  if (f.includes("gmi")) return FACULTY_ORDER.length - 1;

  return 999;
}

// ===== Helpers =====
const thaiMonthYearNow = () => {
  const d = new Date();
  const thYear = d.getFullYear() + 543;
  const thMonths = [
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
  ];
  return `${thMonths[d.getMonth()]} ${thYear}`;
};

function formatThaiDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const months = [
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
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

const normalizeId = (v: any) => (typeof v === "string" ? v : v?._id ?? "");
const asText = (v: any) => (typeof v === "string" ? v : v?.title ?? "");

// ดึง "วัน-เวลาเรียน" จากท้ายชื่อ
function parseScheduleFromProgramTitle(title: string): string | undefined {
  if (!title) return undefined;

  const patterns = [
    /-\s*\(([^)]+)\)\s*$/, // Explicit schedule in "- ( ... )" format
    /\(([^()]+วัน[^()]*)\)\s*$/, // Parentheses that mention "day" words
    /\(([^()]+เวลา[^()]*)\)\s*$/, // Parentheses that mention "time" words
    /\[([^\]]+)\]\s*$/, // Trailing bracketed note
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const value = match[1].trim();
      if (value) return value;
    }
  }

  return undefined;
}

// ตัดส่วนกำกับเวลาออก เพื่อให้เหลือชื่อหลักสูตรสะอาด
function stripScheduleFromTitle(title: string): string {
  if (!title) return title;
  let t = title.replace(/-\s*\([^)]+\)\s*$/, "").trim();
  t = t.replace(/\s*\([^)]+\)\s*$/, "").trim();
  return t;
}

function guessDegreeAbbrFromProgramTitle(t: string) {
  const m = t.match(/\(([^()]+)\)\s*$/);
  if (m) return m[1];
  return "";
}

// ===== Types (โครงสร้างกลางสำหรับ export) =====
type ProgramInForm = {
  programId: string;
  title: string;
  schedule?: string;
  degree_abbr?: string;
  degree_level?: string; // "master" | "doctoral" | etc.
  master?: { amount: number; bachelor_req: boolean; master_req: boolean };
  doctoral?: { amount: number; bachelor_req: boolean; master_req: boolean };
  rounds: any[];
  monthly: any[];
  message?: string;
};

type SurveyRow = {
  id: string;
  faculty: string;
  department: string;
  program: string;
  programs: ProgramInForm[];
  submitterEmail: string;
  submitterName: string;
  coordinator: string;
  phone: string[];
  submittedAt: string;
};

type FancyExportRow = {
  faculty: string;
  degreeAbbr: string;
  programTitle: string;
  schedule?: string;
  openFlag: "P" | "X" | "";
  amount?: number | string;
  isRounds: boolean;
  isMonthly: boolean;
  phones: string;
  isActiveOnly?: boolean;
  admissionText?: string;
  isFacultyHeader?: boolean;
  facultyTotal?: number;
};

export type AdmissionMeta = {
  term?: { label?: string; semester?: number; academic_year_th?: number };
  application_window?: {
    open_at?: string;
    close_at?: string;
    notice?: string;
    calendar_url?: string;
  };
  rounds?: { no?: number; title?: string; interview_date?: string }[];
  monthly?: { month?: string; title?: string; interview_date?: string }[];
  _id?: string;
};

export type ExportFancyMeta = {
  admission?: AdmissionMeta;
  activePrograms?: any[];
};

// ===== Normalizer: allForms (โครงสร้างใหม่) -> SurveyRow =====
function mapFormToSurveyRow_New(doc: any): SurveyRow {
  const id = normalizeId(doc._id);
  const faculty = asText(doc.faculty_id);
  const department = asText(doc.department_id);

  const intakePrograms: ProgramInForm[] = Array.isArray(doc.intake_programs)
    ? doc.intake_programs.map((ip: any) => {
        const pid = ip?.program_id ?? {};
        const rawTitle: string = pid?.title ?? "";
        const scheduleValue =
          typeof pid?.time === "string" && pid.time.trim().length > 0
            ? pid.time.trim()
            : parseScheduleFromProgramTitle(rawTitle);
        const schedule = scheduleValue || undefined;
        const cleanTitle = stripScheduleFromTitle(rawTitle);

        const deg = ip?.intake_degree ?? {};
        const master = deg?.master
          ? {
              amount: Number(deg.master.amount ?? 0),
              bachelor_req: !!deg.master.bachelor_req,
              master_req: !!deg.master.master_req,
            }
          : undefined;
        const doctoral = deg?.doctoral
          ? {
              amount: Number(deg.doctoral.amount ?? 0),
              bachelor_req: !!deg.doctoral.bachelor_req,
              master_req: !!deg.doctoral.master_req,
            }
          : undefined;

        const cal = ip?.intake_calendar ?? {};
        const rounds = Array.isArray(cal.rounds) ? cal.rounds : [];
        const monthly = Array.isArray(cal.monthly) ? cal.monthly : [];
        const degree_abbr: string | undefined = pid?.degree_abbr || undefined;
        const degree_level: string | undefined = pid?.degree_level || undefined;

        return {
          programId: normalizeId(pid),
          title: cleanTitle,
          schedule,
          degree_abbr,
          degree_level,
          master,
          doctoral,
          rounds,
          monthly,
          message: "",
        };
      })
    : [];

  const programSummary =
    intakePrograms.length === 0
      ? "-"
      : intakePrograms.length === 1
      ? intakePrograms[0].title
      : `${intakePrograms[0].title} +${intakePrograms.length - 1}`;

  const submitterName = doc?.submitter?.name ?? "-";
  const submitterEmail = doc?.submitter?.email ?? "-";
  const coordinator = submitterName;
  const phone: string[] = Array.isArray(doc?.submitter?.phone)
    ? doc.submitter.phone
    : doc?.submitter?.phone
    ? [String(doc.submitter.phone)]
    : [];

  const submittedAt =
    doc?.created_at ?? doc?.updated_at ?? new Date().toISOString();

  return {
    id,
    faculty,
    department,
    program: programSummary,
    programs: intakePrograms,
    submitterEmail,
    submitterName,
    coordinator,
    phone,
    submittedAt,
  };
}

// ===== Merge activePrograms into SurveyRow[] (กันซ้ำด้วย key) =====
type PrepareSurveyRowsOptions = {
  activePrograms?: any[];
};

function buildProgramKey(input: {
  faculty: string;
  department: string;
  title: string;
  degree_level?: string;
  degree_abbr?: string;
}) {
  return [
    normText(input.faculty),
    normText(input.department),
    normText(stripScheduleFromTitle(input.title)),
    (input.degree_level || "").toLowerCase(),
    normText(input.degree_abbr || ""),
  ].join("|");
}

function normalizePhones(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value.trim() ? [value.trim()] : [];
  }
  return [];
}

function mergeActiveProgramsIntoRows(
  normalized: SurveyRow[],
  activePrograms: any[]
): SurveyRow[] {
  if (!activePrograms?.length) return normalized;

  const existing = new Set<string>();
  normalized.forEach((row) => {
    row.programs.forEach((prog) => {
      existing.add(
        buildProgramKey({
          faculty: row.faculty,
          department: row.department,
          title: prog.title,
          degree_level: prog.degree_level,
          degree_abbr: prog.degree_abbr,
        })
      );
    });
  });

  const merged = [...normalized];

  for (const ap of activePrograms) {
    // กันเคสส่งมาทั้งหมด แต่เราอยากเอาเฉพาะ active = true
    if (ap?.active === false) continue;

    const faculty = asText(ap?.faculty_id);
    const department = asText(ap?.department_id);
    const rawTitle: string = ap?.title ?? "";
    const cleanTitle = stripScheduleFromTitle(rawTitle);
    const scheduleValue =
      typeof ap?.time === "string" && ap.time.trim()
        ? ap.time.trim()
        : parseScheduleFromProgramTitle(rawTitle);

    const key = buildProgramKey({
      faculty,
      department,
      title: cleanTitle,
      degree_level: ap?.degree_level,
      degree_abbr: ap?.degree_abbr,
    });

    if (existing.has(key)) continue;
    existing.add(key);

    const degreeLevel =
      typeof ap?.degree_level === "string"
        ? ap.degree_level.toLowerCase()
        : undefined;

    const masterInfo =
      degreeLevel === "master"
        ? { amount: 0, bachelor_req: false, master_req: false }
        : undefined;
    const doctoralInfo =
      degreeLevel === "doctoral"
        ? { amount: 0, bachelor_req: false, master_req: false }
        : undefined;

    const program: ProgramInForm = {
      programId: normalizeId(ap?._id),
      title: cleanTitle,
      schedule: scheduleValue || undefined,
      degree_abbr: ap?.degree_abbr,
      degree_level: ap?.degree_level,
      master: masterInfo,
      doctoral: doctoralInfo,
      rounds: [],
      monthly: [],
      message: DIRECT_CONTACT_MESSAGE, // ✅ ตรง requirement
    };

    const phones = normalizePhones(
      ap?.contact_phone ?? ap?.phones ?? ap?.phone
    );

    merged.push({
      id: normalizeId(ap?._id),
      faculty,
      department,
      program: cleanTitle,
      programs: [program],
      submitterEmail: "-",
      submitterName: "-",
      coordinator: "-",
      phone: phones,
      submittedAt: new Date().toISOString(),
    });
  }

  return merged;
}

function prepareSurveyRows(
  allFormsRaw: any[],
  options?: PrepareSurveyRowsOptions
): SurveyRow[] {
  const baseRows: SurveyRow[] = (allFormsRaw || []).map(mapFormToSurveyRow_New);
  const activePrograms = options?.activePrograms ?? [];
  if (!activePrograms.length) return baseRows;
  return mergeActiveProgramsIntoRows(baseRows, activePrograms);
}

// ===== รวมข้อมูลจาก SurveyRow[] -> FancyExportRow[] แยกตาม degree =====
function buildFancyRowsByDegree(
  data: SurveyRow[],
  degreeLevel: "master" | "doctoral"
): FancyExportRow[] {
  const grouped = new Map<string, SurveyRow[]>();
  data.forEach((r) => {
    const arr = grouped.get(r.faculty) ?? [];
    arr.push(r);
    grouped.set(r.faculty, arr);
  });

  const orderedFaculties = Array.from(grouped.entries()).sort(([fa], [fb]) => {
    const ra = getFacultyRank(fa);
    const rb = getFacultyRank(fb);
    if (ra !== rb) return ra - rb;
    return (fa || "").localeCompare(fb || "", "th");
  });

  const out: FancyExportRow[] = [];

  for (const [faculty, rowsRaw] of orderedFaculties) {
    const rows = [...rowsRaw].sort((a, b) => {
      const da = a.department || "";
      const db = b.department || "";
      const cmp = da.localeCompare(db, "th");
      if (cmp !== 0) return cmp;
      const pa = a.program || "";
      const pb = b.program || "";
      return pa.localeCompare(pb, "th");
    });

    let sum = 0;
    const facultyRows: FancyExportRow[] = [];

    for (const r of rows) {
      const programsOfLevel = r.programs.filter((p) => {
        const lvl = (p.degree_level || "").toLowerCase();
        if (lvl === degreeLevel) return true;

        const hasMaster = !!p.master;
        const hasDoctoral = !!p.doctoral;
        if (degreeLevel === "master" && hasMaster && !hasDoctoral) return true;
        if (degreeLevel === "doctoral" && hasDoctoral && !hasMaster)
          return true;
        return false;
      });

      if (!programsOfLevel.length) continue;

      const sortedPrograms = [...programsOfLevel].sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "th")
      );

      for (const p of sortedPrograms) {
        const amtRaw =
          degreeLevel === "master"
            ? p.master?.amount ?? 0
            : p.doctoral?.amount ?? 0;

        const subtotal = Number.isFinite(amtRaw) ? Number(amtRaw) : 0;
        sum += subtotal;

        const hasRounds = Array.isArray(p.rounds) && p.rounds.length > 0;
        const hasMonthly = Array.isArray(p.monthly) && p.monthly.length > 0;
        const isOpen = subtotal > 0 || hasRounds || hasMonthly;

        const admissionText = (p.message || "").trim();
        const isActiveOnly = admissionText === DIRECT_CONTACT_MESSAGE;

        facultyRows.push({
          faculty,
          degreeAbbr: p.degree_abbr || guessDegreeAbbrFromProgramTitle(p.title),
          programTitle: p.title,
          schedule: p.schedule ?? "",
          openFlag: isOpen ? "P" : "X",
          amount: subtotal || "",
          isRounds: hasRounds,
          isMonthly: hasMonthly,
          phones: (r.phone || []).filter(Boolean).join(" / "),
          admissionText,
          isActiveOnly,
        });
      }
    }

    if (facultyRows.length > 0) {
      out.push({
        faculty,
        degreeAbbr: "",
        programTitle: `${faculty}`,
        openFlag: "",
        amount: "",
        isRounds: false,
        isMonthly: false,
        phones: "",
        isFacultyHeader: true,
        facultyTotal: sum,
      });

      out.push(...facultyRows);
    }
  }

  return out;
}

// ✓ เท่านั้น (ยกเลิก ✗ ตามที่ขอ)
const YES = "✓";
const NO = "✗";

// ===== Logo loader (works in Node or Browser) =====
async function addLogoIfAny(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  opts?: { width?: number; height?: number }
) {
  const width = opts?.width ?? 220;
  const height = opts?.height ?? 95;

  try {
    const fs = require("fs");
    const buf = fs.readFileSync(LOGO_NODE_PATH);
    const logoId = wb.addImage({ buffer: buf as any, extension: "png" });
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width, height } });
    return;
  } catch {}

  try {
    // @ts-ignore
    if (typeof window !== "undefined" && typeof fetch !== "undefined") {
      const res = await fetch(LOGO_WEB_URL);
      const arrBuf = await res.arrayBuffer();
      // @ts-ignore
      const base64 = (
        typeof Buffer !== "undefined"
          ? Buffer.from(arrBuf).toString("base64")
          : (() => {
              const bytes = new Uint8Array(arrBuf);
              let binary = "";
              const chunkSize = 0x8000;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(
                  null,
                  bytes.subarray(i, i + chunkSize) as any
                );
              }
              return btoa(binary);
            })()
      ) as string;

      const logoId = wb.addImage({ base64, extension: "png" });
      ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width, height } });
    }
  } catch (e) {
    console.warn("โหลดโลโก้ไม่สำเร็จ:", e);
  }
}

// ===== Sheet builder (ใช้ซ้ำได้ทั้งโท/เอก) =====
async function buildSheetForRows(
  wb: ExcelJS.Workbook,
  sheetName: string,
  rows: FancyExportRow[],
  admission?: AdmissionMeta,
  degreeLabel?: string
) {
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    },
  });

  // โลโก้ซ้ายบน
  await addLogoIfAny(wb, ws, { width: 220, height: 95 });

  // ====== Header dynamic จาก admission ======
  const term = admission?.term;
  const aw = admission?.application_window;
  const noticeLines = (aw?.notice || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const a1Base = "จำนวนประกาศรับนักศึกษา ระดับบัณฑิตศึกษา";
  const a1 = degreeLabel ? `${a1Base}  (${degreeLabel})` : a1Base;

  const a2 =
    noticeLines[0]?.replace(/^การรับสมัครระดับบัณฑิตศึกษา\s*/, "") ||
    (term
      ? `ภาคการศึกษาที่ ${term.label} ปีการศึกษา ${term.academic_year_th}`
      : "");

  const a3 =
    noticeLines[1] ||
    (aw?.open_at && aw?.close_at
      ? `สมัครเข้าศึกษา ตั้งแต่วันที่ ${formatThaiDate(
          aw.open_at
        )} ถึง วันที่ ${formatThaiDate(aw.close_at)}`
      : "");

  // ----- Title zone -----
  ws.mergeCells("A1:I1");
  ws.mergeCells("A2:I2");
  ws.mergeCells("A3:I3");

  ws.getCell("A1").value = a1;
  ws.getCell("A2").value = a2 || "";
  ws.getCell("A3").value = a3 || "";

  [1, 2, 3].forEach((r) => {
    const c = ws.getCell(`A${r}`);
    c.font = {
      name: "TH SarabunPSK",
      size: 24,
      bold: true,
      color: r === 1 ? { argb: TITLE_RED } : undefined,
    };
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    ws.getRow(r).height = 32;
  });

  // ----- Header meta (row 4) -----
  ws.mergeCells("A4:H4");
  ws.getCell("I4").value = `ข้อมูล ณ ${thaiMonthYearNow()}`;
  ws.getCell("I4").alignment = { horizontal: "right", vertical: "middle" };
  ws.getCell("I4").font = { name: "TH SarabunPSK", size: 12, bold: true };

  // ----- Table header (rows 5–6) -----
  ws.addRow([
    "ที่",
    "ปริญญา",
    "คณะ/สาขาวิชา",
    "วัน - เวลาในการดำเนินการเรียนการสอน",
    "การรับนักศึกษา",
    "",
    "การสัมภาษณ์",
    "",
    "เบอร์ติดต่อคณะ/สาขาวิชา",
  ]);
  ws.addRow([
    "",
    "",
    "",
    "",
    "การเปิดรับ",
    "จำนวนการรับ (คน)",
    "เป็นรอบ",
    "ทุกเดือน",
    "",
  ]);

  ws.mergeCells("A5:A6");
  ws.mergeCells("B5:B6");
  ws.mergeCells("C5:C6");
  ws.mergeCells("D5:D6");
  ws.mergeCells("E5:F5");
  ws.mergeCells("G5:H5");
  ws.mergeCells("I5:I6");

  ws.columns = [
    { key: "no", width: 6 },
    { key: "deg", width: 10 },
    { key: "prog", width: 58 },
    { key: "sch", width: 45 },
    { key: "open", width: 12 }, // E
    { key: "amt", width: 14 }, // F
    { key: "round", width: 12 }, // G
    { key: "month", width: 12 }, // H
    { key: "phone", width: 22 }, // I
  ];

  [5, 6].forEach((r) => {
    ws.getRow(r).height = 24;
    ws.getRow(r).eachCell((cell) => {
      cell.font = {
        name: "TH SarabunPSK",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: BRAND_ORANGE },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF666666" } },
        left: { style: "thin", color: { argb: "FF666666" } },
        bottom: { style: "thin", color: { argb: "FF666666" } },
        right: { style: "thin", color: { argb: "FF666666" } },
      };
    });
  });

  // ----- Data -----
  let no = 1;
  let grandTotal = 0;

  for (const r of rows) {
    if (r.isFacultyHeader) {
      const row = ws.addRow([
        "",
        "",
        r.faculty,
        "",
        "",
        r.facultyTotal ?? "",
        "",
        "",
        "",
      ]);
      row.eachCell((cell, col) => {
        cell.font = { name: "TH SarabunPSK", size: 14, bold: true };
        cell.alignment = {
          vertical: "middle",
          horizontal: col === 3 ? "left" : "center",
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E5E5" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFAAAAAA" } },
          left: { style: "thin", color: { argb: "FFAAAAAA" } },
          bottom: { style: "thin", color: { argb: "FFAAAAAA" } },
          right: { style: "thin", color: { argb: "FFAAAAAA" } },
        };
      });
      no = 1; // reset running number per faculty
      continue;
    }

    const row = ws.addRow([
      no,
      r.degreeAbbr,
      r.programTitle,
      r.schedule ?? "",
      "", // E
      r.amount ?? "", // F
      "", // G
      "", // H
      r.phones, // I
    ]);

    // สไตล์พื้นฐาน
    row.height = 22;
    row.eachCell((cell, col) => {
      cell.font = { name: "TH SarabunPSK", size: 14 };
      cell.alignment = {
        vertical: "middle",
        horizontal: col === 3 || col === 4 || col === 9 ? "left" : "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    const openCell = row.getCell(5); // E
    const amtCell = row.getCell(6); // F
    const roundCell = row.getCell(7); // G
    const monthCell = row.getCell(8); // H

    const setYes = (cell: ExcelJS.Cell) => {
      cell.value = YES;
      cell.font = {
        name: "TH SarabunPSK",
        size: 14,
        bold: true,
        color: { argb: "FF0E7A0D" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    };

    const setNo = (cell: ExcelJS.Cell) => {
      cell.value = NO;
      cell.font = {
        name: "TH SarabunPSK",
        size: 14,
        bold: true,
        color: { argb: "FFB00020" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    };

    const setBlank = (cell: ExcelJS.Cell) => {
      cell.value = "";
      cell.font = { name: "TH SarabunPSK", size: 14 };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    };

    // ✅ UPDATE: ถ้าเป็น "ติดต่อสมัคร..." ให้ merge E-H แล้วโชว์ข้อความในช่วงนั้น
    if (r.admissionText) {
      // ล้างค่าเดิมก่อน (กันหลงค่า)
      amtCell.value = "";
      roundCell.value = "";
      monthCell.value = "";

      // merge E..H ในแถวนี้
      try {
        ws.mergeCells(row.number, 5, row.number, 8); // E..H
      } catch {
        // ถ้าโดน merge ซ้ำ จะ throw — ปล่อยผ่าน
      }

      openCell.value = r.admissionText;
      openCell.font = { name: "TH SarabunPSK", size: 14, bold: true };
      openCell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
    } else if (r.openFlag === "P") {
      setYes(openCell);

      if (!r.isRounds && !r.isMonthly) {
        setNo(roundCell);
        setNo(monthCell);
      } else {
        if (r.isRounds) setYes(roundCell);
        else setBlank(roundCell);

        if (r.isMonthly) setYes(monthCell);
        else setBlank(monthCell);
      }
    } else {
      setNo(openCell);
      setBlank(roundCell);
      setBlank(monthCell);
    }

    const amtNumeric =
      typeof r.amount === "number" ? r.amount : Number(r.amount) || 0;
    grandTotal += amtNumeric;

    no++;
  }

  // ----- Grand total row -----
  const totalRow = ws.addRow([
    "",
    "",
    "รวมทั้งหมด",
    "",
    "",
    grandTotal,
    "",
    "",
    "",
  ]);
  totalRow.eachCell((cell, col) => {
    cell.font = { name: "TH SarabunPSK", size: 14, bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: col === 6 ? "right" : "center",
      wrapText: true,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E5E5" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFAAAAAA" } },
      left: { style: "thin", color: { argb: "FFAAAAAA" } },
      bottom: { style: "thin", color: { argb: "FFAAAAAA" } },
      right: { style: "thin", color: { argb: "FFAAAAAA" } },
    };
  });

  const totalAmtCell = totalRow.getCell(6);
  totalAmtCell.font = {
    name: "TH SarabunPSK",
    size: 14,
    bold: true,
    underline: true,
  };

  const lastRow = ws.lastRow?.number ?? 6;
  ws.pageSetup.printArea = `A1:I${lastRow}`;
  ws.headerFooter.oddFooter = "&Cหน้า &P / &N";
}

// ===== Main exporter =====
export async function exportExcelFancy(
  allFormsRaw: any[],
  meta?: ExportFancyMeta
) {
  const admission = meta?.admission;
  const activePrograms = meta?.activePrograms ?? [];

  const normalized = prepareSurveyRows(allFormsRaw, { activePrograms });
  if (!normalized.length) return;

  const masterRows = buildFancyRowsByDegree(normalized, "master");
  const doctoralRows = buildFancyRowsByDegree(normalized, "doctoral");

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMUTT";
  wb.created = new Date();

  if (masterRows.length) {
    await buildSheetForRows(
      wb,
      "จำนวนประกาศรับ_ปริญญาโท",
      masterRows,
      admission,
      "ปริญญาโท"
    );
  }
  if (doctoralRows.length) {
    await buildSheetForRows(
      wb,
      "จำนวนประกาศรับ_ปริญญาเอก",
      doctoralRows,
      admission,
      "ปริญญาเอก"
    );
  }

  if (!masterRows.length && !doctoralRows.length) return;

  const buf = await wb.xlsx.writeBuffer();

  // @ts-ignore
  if (typeof window !== "undefined") {
    saveAs(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `จำนวนประกาศรับ_${thaiMonthYearNow()}.xlsx`
    );
  } else {
    const fs = require("fs");
    fs.writeFileSync(
      `จำนวนประกาศรับ_${thaiMonthYearNow()}.xlsx`,
      Buffer.from(buf)
    );
  }
}

export async function buildExcelFancyBuffer(
  allFormsRaw: any[],
  meta?: ExportFancyMeta
): Promise<ArrayBuffer | undefined> {
  const admission = meta?.admission;
  const activePrograms = meta?.activePrograms ?? [];

  const normalized = prepareSurveyRows(allFormsRaw, { activePrograms });
  if (!normalized.length) return;

  const masterRows = buildFancyRowsByDegree(normalized, "master");
  const doctoralRows = buildFancyRowsByDegree(normalized, "doctoral");

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMUTT";
  wb.created = new Date();

  if (masterRows.length) {
    await buildSheetForRows(
      wb,
      "จำนวนประกาศรับ_ปริญญาโท",
      masterRows,
      admission,
      "ปริญญาโท"
    );
  }
  if (doctoralRows.length) {
    await buildSheetForRows(
      wb,
      "จำนวนประกาศรับ_ปริญญาเอก",
      doctoralRows,
      admission,
      "ปริญญาเอก"
    );
  }

  if (!masterRows.length && !doctoralRows.length) return;

  const buf = await wb.xlsx.writeBuffer();
  return buf;
}
