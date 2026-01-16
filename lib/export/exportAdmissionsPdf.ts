// src/lib/exportAdmissionsPdf.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

type ProgramInForm = {
  programId: string;
  title: string;
  master?: { amount?: number; bachelor_req?: boolean; master_req?: boolean };
  doctoral?: { amount?: number; bachelor_req?: boolean; master_req?: boolean };
  rounds?: Array<{
    no?: number;
    title?: string;
    interview_date?: string;
    active?: boolean;
  }>;
  monthly?: Array<{
    month?: string | number;
    title?: string;
    interview_date?: string;
    active?: boolean;
  }>;
  message?: string;
  degree_abbr?: Record<string, any>;
};

export type SurveyRow = {
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

type ExportPdfOptions = {
  fontUrl?: string; // default "/fonts/THSarabun.ttf"
  fileName?: string;
  title?: string; // header title
  fontSize?: number; // default 11
  lineHeight?: number; // default 14
  // ✅ แยก marginX / marginY (ซ้ายขวา / บนล่าง)
  marginX?: number; // default 12
  marginY?: number; // default 36
};

export async function exportAdmissionsPdf(
  rows: SurveyRow[],
  formatDateTH: (d?: string) => string,
  opts: ExportPdfOptions = {}
) {
  if (!rows?.length) throw new Error("ไม่มีข้อมูลสำหรับส่งออก PDF");

  const {
    fontUrl = "/fonts/THSarabun.ttf",
    title = "แบบฟอร์มรับสมัคร",
    fontSize = 11,
    lineHeight = 14,
    marginX = 12, // ✅ ลดซ้าย-ขวาให้ตารางชิดขึ้น
    marginY = 36, // ✅ บน-ล่าง
    fileName,
  } = opts;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await fetch(fontUrl).then((res) => {
    if (!res.ok) throw new Error(`ไม่พบฟอนต์ ${fontUrl}`);
    return res.arrayBuffer();
  });

  const font = await pdfDoc.embedFont(fontBytes, { subset: true });
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ---------- helpers ----------
  const safeText = (t?: any) => (t ?? "").toString().trim();

  // wrap based on real font width + support \n + split very long tokens
  const wrapByWidth = (text: string, maxWidth: number) => {
    const t = safeText(text);
    if (!t) return ["-"];

    const result: string[] = [];
    const paragraphs: string[] = t.split("\n");

    const pushWrapped = (raw: string) => {
      const s = raw.trim();
      if (!s) {
        result.push("");
        return;
      }

      const hasSpace = /\s/.test(s);
      const tokens = hasSpace ? s.split(/\s+/) : s.split("");

      let cur = "";
      const flush = () => {
        if (cur) result.push(cur);
        cur = "";
      };

      for (const token of tokens) {
        const candidate = hasSpace
          ? (cur ? cur + " " : "") + token
          : cur + token;

        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
          cur = candidate;
          continue;
        }

        flush();

        if (font.widthOfTextAtSize(token, fontSize) > maxWidth) {
          // split long token char-by-char
          let chunk = "";
          for (const ch of token.split("")) {
            const next = chunk + ch;
            if (font.widthOfTextAtSize(next, fontSize) > maxWidth) {
              if (chunk) result.push(chunk);
              chunk = ch;
            } else {
              chunk = next;
            }
          }
          if (chunk) result.push(chunk);
        } else {
          cur = token;
        }
      }

      flush();
    };

    paragraphs.forEach((p, i) => {
      pushWrapped(p);
      if (i < paragraphs.length - 1) result.push("");
    });

    return result.length ? result : ["-"];
  };

  // ---------- page / layout ----------
  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();

  const usableW = width - marginX * 2;
  let y = height - marginY;

  const newPage = () => {
    page = pdfDoc.addPage();
    ({ width, height } = page.getSize());
    y = height - marginY;
  };

  const ensureSpace = (needH: number) => {
    if (y - needH < marginY) newPage();
  };

  const drawTextLine = (text: string, x: number, yy: number) => {
    page.drawText(text || "-", {
      x,
      y: yy,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  };

  // ---------- report header ----------
  const headerLines = [
    `${title} (${rows.length} รายการ)`,
    `ออกรายงาน: ${formatDateTH(new Date().toISOString())}`,
    "",
  ];

  headerLines.forEach((t) => {
    ensureSpace(lineHeight);
    drawTextLine(t, marginX, y);
    y -= lineHeight;
  });

  // ---------- table UI config ----------
  const paddingX = 8;
  const paddingY = 6;

  const borderColor = rgb(0.75, 0.75, 0.75);
  const headerBg = rgb(0.92, 0.92, 0.92);
  const zebraBg = rgb(0.98, 0.98, 0.98);

  const cols = [
    { key: "faculty", title: "Faculty", w: 0.18 },
    { key: "department", title: "Department", w: 0.18 },
    { key: "programs", title: "Programs (title)", w: 0.22 },
    { key: "schedule", title: "Schedule (Rounds / Monthly)", w: 0.26 },
    { key: "submitterEmail", title: "Submitter Email", w: 0.1 },
    { key: "submittedAt", title: "Submitted At", w: 0.06 },
  ] as const;

  const tableX = marginX;
  const tableW = usableW;

  // rounding fix
  const rawWidths = cols.map((c) => usableW * c.w);
  const colWidths = rawWidths.map((w) => Math.floor(w));
  const diff = usableW - colWidths.reduce((a, b) => a + b, 0);
  colWidths[colWidths.length - 1] += diff;

  const colXs = colWidths.reduce<number[]>((acc, _w, i) => {
    acc.push((acc[i - 1] ?? tableX) + (i === 0 ? 0 : colWidths[i - 1]));
    return acc;
  }, []);

  const cellTextMaxW = (cw: number) => cw - paddingX * 2;

  const rowTopPadding = paddingY;
  const rowBottomPadding = paddingY;
  const rowLineStep = lineHeight * 0.95;

  const measureChunkHeight = (chunkLines: string[][]) => {
    const maxLines = Math.max(...chunkLines.map((c) => Math.max(1, c.length)));
    return Math.max(
      lineHeight * 1.8,
      rowTopPadding + rowBottomPadding + maxLines * rowLineStep
    );
  };

  // ---------- header row (repeatable) ----------
  const drawTableHeader = () => {
    const headerCells = cols.map((c, i) =>
      wrapByWidth(c.title, cellTextMaxW(colWidths[i]))
    );

    const headerH = measureChunkHeight(headerCells);
    ensureSpace(headerH);

    // header background
    page.drawRectangle({
      x: tableX,
      y: y - headerH,
      width: tableW,
      height: headerH,
      color: headerBg,
      borderWidth: 0,
    });

    // borders + text
    cols.forEach((_, i) => {
      const x = colXs[i];
      const cw = colWidths[i];

      page.drawRectangle({
        x,
        y: y - headerH,
        width: cw,
        height: headerH,
        borderColor,
        borderWidth: 1,
      });

      const lines = headerCells[i] ?? ["-"];
      let textY = y - rowTopPadding - fontSize;

      for (const ln of lines) {
        if (textY < y - headerH + rowBottomPadding) break;
        page.drawText(ln, {
          x: x + paddingX,
          y: textY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        textY -= rowLineStep;
      }
    });

    y -= headerH;
  };

  // ---------- row draw (split across pages) ----------
  const drawRowChunk = (
    chunkLines: string[][],
    chunkHeight: number,
    zebra: boolean
  ) => {
    // row background (no border)
    page.drawRectangle({
      x: tableX,
      y: y - chunkHeight,
      width: tableW,
      height: chunkHeight,
      color: zebra ? zebraBg : undefined,
      borderWidth: 0,
    });

    cols.forEach((_, i) => {
      const x = colXs[i];
      const cw = colWidths[i];

      page.drawRectangle({
        x,
        y: y - chunkHeight,
        width: cw,
        height: chunkHeight,
        borderColor,
        borderWidth: 1,
      });

      const lines = chunkLines[i] ?? ["-"];
      let textY = y - rowTopPadding - fontSize;

      for (const ln of lines) {
        if (textY < y - chunkHeight + rowBottomPadding) break;
        page.drawText(ln, {
          x: x + paddingX,
          y: textY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        textY -= rowLineStep;
      }
    });

    y -= chunkHeight;
  };

  const drawRowWrappedAcrossPages = (
    allCellLines: string[][],
    zebra: boolean
  ) => {
    const remaining = allCellLines.map((ls) => [...(ls?.length ? ls : ["-"])]);

    while (true) {
      const anyLeft = remaining.some((ls) => ls.length > 0);
      if (!anyLeft) break;

      const availableH = y - marginY;
      const minChunkH = rowTopPadding + rowBottomPadding + rowLineStep;

      if (availableH < minChunkH) {
        newPage();
        drawTableHeader();
        continue;
      }

      const maxLinesFit = Math.max(
        1,
        Math.floor(
          (availableH - rowTopPadding - rowBottomPadding) / rowLineStep
        )
      );

      const chunk = remaining.map((ls) => ls.splice(0, maxLinesFit));
      const chunkH = measureChunkHeight(chunk);

      if (y - chunkH < marginY) {
        newPage();
        drawTableHeader();
        continue;
      }

      drawRowChunk(chunk, chunkH, zebra);
    }
  };

  // ---------- content builders ----------
  const buildProgramsTitles = (r: SurveyRow) => {
    const list = Array.isArray(r.programs) ? r.programs : [];
    if (!list.length) return "-";
    return list
      .map((p, i) => `${i + 1}) ${safeText(p.title) || "-"}`)
      .join("\n");
  };

  // ✅ replace only buildSchedule() in exportAdmissionsPdf.ts

  const buildSchedule = (r: SurveyRow) => {
    const programs = Array.isArray(r.programs) ? r.programs : [];
    if (!programs.length) return "-";

    const safe = (v: any) => (v ?? "").toString().trim();

    // Build normalized schedule entries for a program (for comparison + rendering)
    const buildEntries = (p: ProgramInForm) => {
      const entries: Array<{
        kind: "round" | "monthly";
        title: string;
        month: string;
        date: string;
      }> = [];

      const rounds = Array.isArray(p.rounds) ? p.rounds : [];
      rounds.forEach((rd, i) => {
        const t = safe(rd?.title) || `รอบที่ ${rd?.no ?? i + 1}`;
        const dt = rd?.interview_date ? formatDateTH(rd.interview_date) : "-";
        entries.push({ kind: "round", title: t, month: "", date: dt });
      });

      const monthly = Array.isArray(p.monthly) ? p.monthly : [];
      monthly.forEach((m, i) => {
        const mm = safe(m?.month);
        const mt = safe(m?.title);
        const dt = m?.interview_date ? formatDateTH(m.interview_date) : "-";
        const label = mt || (mm ? `Month ${mm}` : `Monthly ${i + 1}`);
        entries.push({ kind: "monthly", title: label, month: mm, date: dt });
      });

      return entries;
    };

    const entriesToLines = (
      entries: ReturnType<typeof buildEntries>,
      prefix?: string
    ) => {
      const lines: string[] = [];
      entries.forEach((e) => {
        if (e.kind === "round") {
          lines.push(
            `${prefix ? `${prefix} ` : ""}[Round] ${e.title}: ${e.date}`
          );
        } else {
          lines.push(
            `${prefix ? `${prefix} ` : ""}[Monthly] ${e.title}${
              e.month ? ` (month: ${e.month})` : ""
            }: ${e.date}`
          );
        }
      });
      return lines;
    };

    // Make a comparable key (same schedule => same key)
    const makeKey = (entries: ReturnType<typeof buildEntries>) =>
      entries
        .map(
          (e) =>
            `${e.kind}|${safe(e.title).toLowerCase()}|${safe(
              e.month
            ).toLowerCase()}|${safe(e.date)}`
        )
        .join("||");

    // group programs by identical schedule
    const byKey = new Map<
      string,
      { entries: ReturnType<typeof buildEntries>; programIdxs: number[] }
    >();

    programs.forEach((p, pi) => {
      const entries = buildEntries(p);
      const key = makeKey(entries);
      const hit = byKey.get(key);
      if (hit) hit.programIdxs.push(pi);
      else byKey.set(key, { entries, programIdxs: [pi] });
    });

    // ✅ if all programs share the same schedule -> show only ONE set (no 1)/2)/3) prefix
    if (byKey.size === 1 && programs.length > 1) {
      const only = Array.from(byKey.values())[0];
      const lines = entriesToLines(only.entries);
      return lines.length ? lines.join("\n") : "-";
    }

    // otherwise, fallback to the original behavior (show per-program)
    const lines: string[] = [];
    programs.forEach((p, pi) => {
      const prefix = `${pi + 1})`;
      const entries = buildEntries(p);
      lines.push(...entriesToLines(entries, prefix));
    });

    return lines.length ? lines.join("\n") : "-";
  };

  // ---------- draw table ----------
  drawTableHeader();

  rows.forEach((r, idx) => {
    const faculty = safeText(r.faculty) || "-";
    const department = safeText(r.department) || "-";
    const programsTitles = buildProgramsTitles(r);
    const schedule = buildSchedule(r);
    const submitterEmail = safeText(r.submitterEmail) || "-";
    const submittedAt = r.submittedAt ? formatDateTH(r.submittedAt) : "-";

    const bodyTexts = [
      faculty,
      department,
      programsTitles,
      schedule,
      submitterEmail,
      submittedAt,
    ];

    const bodyCells = bodyTexts.map((t, i) =>
      wrapByWidth(t, cellTextMaxW(colWidths[i]))
    );

    drawRowWrappedAcrossPages(bodyCells, idx % 2 === 0);
  });

  // ---------- footer: page numbers ----------
  const pages = pdfDoc.getPages();
  pages.forEach((p, i) => {
    const { width: pw } = p.getSize();
    const label = `Page ${i + 1}/${pages.length}`;
    p.drawText(label, {
      x: pw - marginX - 70,
      y: marginY * 0.6,
      size: 10,
      font: bold,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  // ---------- save + preview ----------
  const pdfBytes: any = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // Preview in new tab
  window.open(url, "_blank", "noopener,noreferrer");

  // revoke later (do NOT revoke immediately)
  setTimeout(() => URL.revokeObjectURL(url), 60_000);

  // optional download (if you ever want)
  // const a = document.createElement("a");
  // a.href = url;
  // a.download = fileName || `admissions-${rows.length}.pdf`;
  // a.click();
}
