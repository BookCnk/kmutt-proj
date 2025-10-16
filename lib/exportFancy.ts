// ===== Dependencies =====
// 1) npm i exceljs
// 2) npm i file-saver   (ถ้าจะดาวน์โหลดในเบราว์เซอร์)
import ExcelJS from "exceljs";
// @ts-ignore: no types in your project
import { saveAs } from "file-saver";

// ===== Configs you can tweak =====
const LOGO_NODE_PATH = "D:/project/public/ICON.png"; // พาธโลโก้สำหรับ Node.js
const LOGO_WEB_URL = "/ICON.png"; // URL โลโก้สำหรับเบราว์เซอร์
const BRAND_ORANGE = "FFFF4612"; // #FF4612 (ARGB)
const TITLE_RED = "FFCC0000"; // สีแดงสำหรับหัวบรรทัดแรก

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

const normalizeId = (v: any) => (typeof v === "string" ? v : v?._id ?? "");
const asText = (v: any) => (typeof v === "string" ? v : v?.title ?? "");

// ดึง "วัน-เวลาเรียน" จากท้ายชื่อ เช่น "... - (วันเสาร์ - อาทิตย์)" หรือ "(...วัน...)"
function parseScheduleFromProgramTitle(title: string): string | undefined {
  if (!title) return undefined;
  const m = title.match(/-\s*\(([^)]+)\)\s*$/);
  if (m) return m[1]?.trim();
  const m2 = title.match(/\(([^)]+วัน[^)]*)\)\s*$/);
  if (m2) return m2[1]?.trim();
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
  isFacultyHeader?: boolean;
  facultyTotal?: number;
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
        const schedule = parseScheduleFromProgramTitle(rawTitle);
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

        return {
          programId: normalizeId(pid),
          title: cleanTitle,
          schedule,
          degree_abbr,
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

// ===== รวมข้อมูลจาก SurveyRow[] -> FancyExportRow[] =====
function buildFancyRows(data: SurveyRow[]): FancyExportRow[] {
  const grouped = new Map<string, SurveyRow[]>();
  data.forEach((r) => {
    const arr = grouped.get(r.faculty) ?? [];
    arr.push(r);
    grouped.set(r.faculty, arr);
  });

  const out: FancyExportRow[] = [];

  grouped.forEach((rows, faculty) => {
    let sum = 0;

    // แถวหัวคณะ
    out.push({
      faculty,
      degreeAbbr: "",
      programTitle: `คณะ${faculty}`,
      openFlag: "",
      amount: "",
      isRounds: false,
      isMonthly: false,
      phones: "",
      isFacultyHeader: true,
      facultyTotal: 0,
    });

    for (const r of rows) {
      for (const p of r.programs) {
        const mAmt = p.master?.amount ?? 0;
        const dAmt = p.doctoral?.amount ?? 0;
        const subtotal =
          (Number.isFinite(mAmt) ? mAmt : 0) +
          (Number.isFinite(dAmt) ? dAmt : 0);
        sum += subtotal;

        const hasRounds = Array.isArray(p.rounds) && p.rounds.length > 0;
        const hasMonthly = Array.isArray(p.monthly) && p.monthly.length > 0;
        const isOpen = subtotal > 0 || hasRounds || hasMonthly;

        out.push({
          faculty,
          degreeAbbr: p.degree_abbr || guessDegreeAbbrFromProgramTitle(p.title),
          programTitle: p.title,
          schedule: p.schedule ?? "",
          openFlag: isOpen ? "P" : "X",
          amount: subtotal || "",
          isRounds: hasRounds,
          isMonthly: hasMonthly,
          phones: (r.phone || []).filter(Boolean).join(" / "),
        });
      }
    }

    const idx = out.findLastIndex(
      (x) => x.isFacultyHeader && x.faculty === faculty
    );
    if (idx >= 0) out[idx].facultyTotal = sum;
  });

  return out;
}

// ✓/✗
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

  // Try Node.js first
  try {
    const fs = require("fs");
    const buf = fs.readFileSync(LOGO_NODE_PATH);
    const logoId = wb.addImage({ buffer: buf as any, extension: "png" });
    ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width, height } });
    return;
  } catch {
    // ignore
  }

  // Fall back to Browser fetch
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

// ===== Main exporter =====
export async function exportExcelFancy(allFormsRaw: any[]) {
  if (!allFormsRaw?.length) return;

  // ✅ แปลง allForms (โครงสร้างใหม่) → โครงสร้างกลาง
  const normalized: SurveyRow[] = (allFormsRaw || []).map(
    mapFormToSurveyRow_New
  );

  // ✅ สร้างแถวสำหรับ Excel
  const rows = buildFancyRows(normalized);

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMUTT";
  wb.created = new Date();

  const ws = wb.addWorksheet("จำนวนประกาศรับ", {
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

  // โลโก้ซ้ายบน (กินพื้นที่ราว A1:B3)
  await addLogoIfAny(wb, ws, { width: 220, height: 95 });

  // ----- Title zone -----
  ws.mergeCells("A1:I1");
  ws.mergeCells("A2:I2");
  ws.mergeCells("A3:I3");

  ws.getCell("A1").value = "จำนวนประกาศรับนักศึกษา ระดับบัณฑิตศึกษา";
  ws.getCell("A2").value =
    "ภาคการศึกษาที่ 2 ปีการศึกษา 2568 (เริ่มการศึกษา มกราคม 2569)";
  ws.getCell("A3").value =
    "สมัครเข้าศึกษา ตั้งแต่วันที่ 1 กรกฎาคม 2568 ถึง วันที่ 25 พฤศจิกายน 2568";

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
    "คณะ/สาขา",
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
    "จำนวนการรับ",
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
    { key: "open", width: 12 },
    { key: "amt", width: 14 },
    { key: "round", width: 12 },
    { key: "month", width: 12 },
    { key: "phone", width: 22 },
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
  for (const r of rows) {
    if (r.isFacultyHeader) {
      const row = ws.addRow([
        "",
        "",
        "คณะ" + r.faculty,
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
      continue;
    }

    const row = ws.addRow([
      no,
      r.degreeAbbr,
      r.programTitle,
      r.schedule ?? "",
      "",
      r.amount ?? "",
      "",
      "",
      r.phones,
    ]);

    const openCell = row.getCell(5);
    const roundCell = row.getCell(7);
    const monthCell = row.getCell(8);

    if (r.openFlag === "P") {
      openCell.value = YES;
      openCell.font = {
        name: "TH SarabunPSK",
        size: 14,
        bold: true,
        color: { argb: "FF0E7A0D" },
      };
    } else if (r.openFlag === "X") {
      openCell.value = NO;
      openCell.font = {
        name: "TH SarabunPSK",
        size: 14,
        bold: true,
        color: { argb: "FFCC0000" },
      };
    }

    if (r.isRounds) {
      roundCell.value = YES;
      roundCell.font = {
        name: "TH SarabunPSK",
        size: 14,
        bold: true,
        color: { argb: "FF0E7A0D" },
      };
    }
    if (r.isMonthly) {
      monthCell.value = YES;
      monthCell.font = {
        name: "TH SarabunPSK",
        size: 14,
        bold: true,
        color: { argb: "FF0E7A0D" },
      };
    }

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

    no++;
  }

  // พื้นที่พิมพ์ + footer
  const lastRow = ws.lastRow?.number ?? 6;
  ws.pageSetup.printArea = `A1:I${lastRow}`;
  ws.headerFooter.oddFooter = "&Cหน้า &P / &N";

  // ดาวน์โหลดไฟล์ (เบราว์เซอร์) หรือเขียนไฟล์ (Node)
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
