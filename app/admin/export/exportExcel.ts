// exportExcel.ts
import { Fill } from "exceljs";
import { DataRow, ExportConfig } from "./types";
import { convertExcelToPdf } from "@/api/conversionService";

/* =========================
 * Helpers: Thai date + sizing
 * ========================= */

const thaiMonths = [
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

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatThaiDateRange(startDateStr: string, endDateStr: string): string {
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);

  if (!startDate && !endDate) return "";

  const formatThaiDate = (date: Date) => {
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543;
    return { day, month, year };
  };

  if (!startDate && endDate) {
    const { day, month, year } = formatThaiDate(endDate);
    return `วันที่ ${day} ${month} ${year}`;
  }

  if (startDate && !endDate) {
    const { day, month, year } = formatThaiDate(startDate);
    return `วันที่ ${day} ${month} ${year}`;
  }

  if (startDate && endDate) {
    const start = formatThaiDate(startDate);
    const end = formatThaiDate(endDate);

    if (
      start.day === end.day &&
      start.month === end.month &&
      start.year === end.year
    ) {
      return `วันที่ ${start.day} ${start.month} ${start.year}`;
    } else if (start.year === end.year && start.month === end.month) {
      return `วันที่ ${start.day} - ${end.day} ${start.month} ${start.year}`;
    } else if (start.year === end.year) {
      return `วันที่ ${start.day} ${start.month} - ${end.day} ${end.month} ${start.year}`;
    } else {
      return `วันที่ ${start.day} ${start.month} ${start.year} - ${end.day} ${end.month} ${end.year}`;
    }
  }

  return "";
}

function calcDurationDays(
  startDateStr: string,
  endDateStr: string
): number | null {
  const s = parseDate(startDateStr);
  const e = parseDate(endDateStr);
  if (!s || !e) return null;

  // inclusive
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((e.getTime() - s.getTime()) / msPerDay);
  return diff + 1;
}

// ✅ Ensure "today" is Thailand time (Asia/Bangkok)
function getBangkokNow(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const map = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  ) as Record<string, string>;

  return new Date(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
}

function formatThaiTodayBE(date = getBangkokNow()) {
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

// --- Row height base on column width (wrap estimation) ---
function getColWidth(ws: any, col: number) {
  return Number(ws.getColumn(col)?.width ?? 10);
}

function countWrappedLines(text: string, colWidth: number) {
  const t = String(text ?? "");
  if (!t.trim()) return 1;

  // Tune for Thai font width
  const maxCharsPerLine = Math.max(1, Math.floor(colWidth * 1.15));

  return t.split("\n").reduce((sum, line) => {
    const len = line.length || 1;
    return sum + Math.max(1, Math.ceil(len / maxCharsPerLine));
  }, 0);
}

function ensureRowHeightsForMergedCell(opts: {
  ws: any;
  startRow: number;
  endRow: number;
  colWidth: number; // merged cell total width
  text: string;
  fontSize?: number; // default 14
  padding?: number; // default 6
  minRowHeight?: number; // default 18
}) {
  const {
    ws,
    startRow,
    endRow,
    colWidth,
    text,
    fontSize = 14,
    padding = 6,
    minRowHeight = 18,
  } = opts;

  const rowsCount = endRow - startRow + 1;
  const lines = countWrappedLines(text, colWidth);

  const lineHeight = Math.ceil(fontSize * 1.35);
  const totalHeight = lines * lineHeight + padding;
  const perRow = Math.max(minRowHeight, Math.ceil(totalHeight / rowsCount));

  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    row.height = Math.max(Number(row.height ?? 0), perRow);
  }
}

/* =========================
 * Workbook builder (shared)
 * ========================= */

async function buildWorkbook(rows: DataRow[], config: ExportConfig) {
  const ExcelJS = (await import("exceljs")).default;

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMUTT";
  wb.created = new Date();

  const ws = wb.addWorksheet("Round " + config.roundNumber, {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      verticalCentered: false,
      // ✅ include D + allow footer
      printArea: "A1:D200",
      margins: {
        left: 1.27 / 2.54,
        right: 1.27 / 2.54,
        top: 1.91 / 2.54,
        bottom: 1.91 / 2.54,
        header: 0.76 / 2.54,
        footer: 0.76 / 2.54,
      },
    },
  });

  // === Columns ===
  ws.columns = [
    { width: 3.3 }, // A
    { width: 20 }, // B
    { width: 90 }, // C
    { width: 35 }, // D
  ];

  // === Row heights ===
  ws.getRow(1).height = 30;
  ws.getRow(2).height = 18;
  ws.getRow(3).height = 18;
  ws.getRow(4).height = 10;

  // ===== Logo =====
  try {
    const response = await fetch("/ICON_White.jpg");
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const logoId = wb.addImage({ buffer: uint8Array, extension: "jpeg" });

    ws.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 190, height: 100 },
    });
  } catch (e) {
    console.warn("Could not load logo:", e);
  }

  // ===== Header Section =====
  ws.mergeCells("C1:C4");
  ws.mergeCells("D2:D4");

  const titleCell = ws.getCell("C1");
  titleCell.value = {
    richText: [
      {
        font: { name: "TH SarabunPSK", size: 18, bold: true },
        text: config.sheetTitle || "",
      },
    ],
  };
  titleCell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };
  ["C1", "C2", "C3", "C4"].forEach((addr) => {
    ws.getCell(addr).fill = titleCell.fill;
  });

  // รอบที่
  const roundCell = ws.getCell("D1");
  roundCell.value = "รอบที่ " + config.roundNumber;
  roundCell.font = {
    name: "TH SarabunPSK",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  roundCell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  roundCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2F3235" },
  };

  // สำนักงานคัดเลือก
  const officeCell = ws.getCell("D2");
  officeCell.value = config.roundTitle || "";
  officeCell.font = {
    name: "TH SarabunPSK",
    size: 14,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  officeCell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  officeCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFF4616" },
  };
  ["D2", "D3", "D4"].forEach((addr) => {
    ws.getCell(addr).fill = officeCell.fill;
  });

  // ===== Header Row (row 5) =====
  ws.getRow(5).height = 22;
  ws.mergeCells("A5:C5");

  const headerABC = ws.getCell("A5");
  const headerD = ws.getCell("D5");

  headerABC.value = "การดำเนินการ";
  headerD.value = "วันที่";

  const yellowFill: Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC72C" },
  };

  [headerABC, headerD].forEach((cell) => {
    cell.font = { name: "TH SarabunPSK", size: 14, bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.fill = yellowFill;
    cell.border = {
      top: { style: "thin", color: { argb: "FF2F3235" } },
      left: { style: "thin", color: { argb: "FF2F3235" } },
      bottom: { style: "thin", color: { argb: "FF2F3235" } },
      right: { style: "thin", color: { argb: "FF2F3235" } },
    };
  });

  /* =========================
   * DATA ROWS
   * ========================= */

  let i = 0;

  rows.forEach((row, index) => {
    const labelTh = String(row.label_on_web_th || "");
    const labelThDescription = String(row.label_on_web_th_description || "");
    const startDate = String(row.start_date || "");
    const endDate = String(row.end_date || "");
    const dateRange = formatThaiDateRange(startDate, endDate);
    const dateDescription = String(row.date_description || "");
    const durationDays = calcDurationDays(startDate, endDate);
    const dateRangeText = row.show_date_range
      ? `${
          dateRange +
          (durationDays ? `\n(ระยะเวลาสมัคร ${durationDays} วัน)` : "")
        }`
      : `${dateRange}`;
    const dateDescriptionText = row.date_description
      ? `\n${dateDescription}`
      : "";
    const dateTextPlain = `${dateRangeText}${dateDescriptionText}`;
    const dateCellValue = row.date_description
      ? {
          richText: [
            {
              font: { name: "TH SarabunPSK", size: 14 },
              text: dateRangeText,
            },
            {
              font: {
                name: "TH SarabunPSK",
                size: 14,
                color: { argb: "FFFF0000" },
              },
              text: dateDescriptionText,
            },
          ],
        }
      : dateTextPlain;

    const rowNumber = 6 + index + i;

    const hasDescRow = Boolean(
      row.label_on_web_th_description || row.date_description
    );

    const dataRow = ws.addRow([`${index + 1}.`, "", labelTh, ""]);
    dataRow.height = 26;

    if (hasDescRow) {
      const descRow = ws.addRow(["", "", labelThDescription, ""]);
      descRow.height = 18;

      if (row.label_on_web_th_description) {
        ws.mergeCells(`B${rowNumber}:C${rowNumber}`);
        ws.mergeCells(`B${rowNumber + 1}:C${rowNumber + 1}`);
        ws.getCell(`B${rowNumber + 1}`).value = `${labelThDescription}`;
      } else {
        ws.mergeCells(`B${rowNumber}:C${rowNumber + 1}`);
      }

      // D merged
      ws.mergeCells(`D${rowNumber}:D${rowNumber + 1}`);
      const dTop = ws.getCell(`D${rowNumber}`);
      dTop.value = dateCellValue;
      dTop.font = { name: "TH SarabunPSK", size: 14 };
      dTop.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      descRow.eachCell((cell, colNumber) => {
        cell.font = { name: "TH SarabunPSK", size: 14 };
        cell.alignment = {
          vertical: colNumber === 4 ? "middle" : "top",
          horizontal: colNumber === 4 ? "center" : "left",
          wrapText: true,
        };
        cell.border = {
          left:
            colNumber === 1
              ? { style: "medium", color: { argb: "FF2F3235" } }
              : {},
          bottom: { style: "medium", color: { argb: "FF2F3235" } },
          right:
            colNumber === 1
              ? {}
              : { style: "medium", color: { argb: "FF2F3235" } },
        };
      });

      // Height based on merged widths
      const dWidth = getColWidth(ws, 4);
      ensureRowHeightsForMergedCell({
        ws,
        startRow: rowNumber,
        endRow: rowNumber + 1,
        colWidth: dWidth,
        text: dateTextPlain,
        fontSize: 14,
      });

      const bcWidth = getColWidth(ws, 2) + getColWidth(ws, 3);

      ensureRowHeightsForMergedCell({
        ws,
        startRow: rowNumber,
        endRow: rowNumber,
        colWidth: bcWidth,
        text: labelTh,
        fontSize: 14,
      });

      if (row.label_on_web_th_description) {
        ensureRowHeightsForMergedCell({
          ws,
          startRow: rowNumber + 1,
          endRow: rowNumber + 1,
          colWidth: bcWidth,
          text: labelThDescription,
          fontSize: 14,
        });
      }

      i++;
    } else {
      ws.mergeCells(`B${rowNumber}:C${rowNumber}`);
      const dCell = ws.getCell(`D${rowNumber}`);
      dCell.value = dateCellValue;
      dCell.font = { name: "TH SarabunPSK", size: 14 };
      dCell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      const dWidth = getColWidth(ws, 4);
      ensureRowHeightsForMergedCell({
        ws,
        startRow: rowNumber,
        endRow: rowNumber,
        colWidth: dWidth,
        text: dateTextPlain,
        fontSize: 14,
      });

      const bcWidth = getColWidth(ws, 2) + getColWidth(ws, 3);
      ensureRowHeightsForMergedCell({
        ws,
        startRow: rowNumber,
        endRow: rowNumber,
        colWidth: bcWidth,
        text: labelTh,
        fontSize: 14,
      });
    }

    ws.getCell(`B${rowNumber}`).value = `${labelTh}`;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = { name: "TH SarabunPSK", size: 14 };
      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 3 ? "left" : "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF2F3235" } },
        left:
          colNumber === 1
            ? { style: "medium", color: { argb: "FF2F3235" } }
            : {},
        bottom: hasDescRow
          ? {}
          : { style: "medium", color: { argb: "FF2F3235" } },
        right:
          colNumber === 1
            ? {}
            : { style: "medium", color: { argb: "FF2F3235" } },
      };
    });

    if (hasDescRow) {
      const dTop = ws.getCell(`D${rowNumber}`);
      dTop.border = {
        top: { style: "medium", color: { argb: "FF2F3235" } },
        left: { style: "medium", color: { argb: "FF2F3235" } },
        right: { style: "medium", color: { argb: "FF2F3235" } },
        bottom: {},
      };
    }
  });

  /* =========================
   * Footer notes - FIX hyperlink getter-only
   * ========================= */

  const todayTh = formatThaiTodayBE(getBangkokNow());
  const footerDateText = `ข้อมูล ณ วันที่ ${todayTh}`;

  const grayFill: Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9D9D9" }, // #D9D9D9
  };

  const footerRowsFixed = [
    {
      mergeStart: "A",
      mergeEnd: "D",
      prefixText:
        "หมายเหตุ : ข้อมูลอาจมีการเปลี่ยนแปลง ติดตามกำหนดการล่าสุดได้ที่ : ",
      linkText: "https://join.kmutt.ac.th/",
      suffixText: "",
      rightText: "",
    },
    {
      mergeStart: "A",
      mergeEnd: "C",
      prefixText: "*อัตราค่าธรรมเนียมเป็นไปตามประกาศมหาวิทยาลัยฯ",
      linkText: "",
      suffixText: "",
      rightText: footerDateText,
    },
  ];

  const colLetterToIndex = (col: string) =>
    col.toUpperCase().charCodeAt(0) - 64;

  footerRowsFixed.forEach((item, index) => {
    const r = ws.addRow(["", "", "", ""]);
    const rowNo = r.number;

    ws.mergeCells(`${item.mergeStart}${rowNo}:${item.mergeEnd}${rowNo}`);

    const mainCell: any = ws.getCell(`${item.mergeStart}${rowNo}`);
    const plainText = `${item.prefixText}${item.linkText || ""}${
      item.suffixText || ""
    }`;
    const startIndex = colLetterToIndex(item.mergeStart);
    const endIndex = colLetterToIndex(item.mergeEnd);
    const hasSeparateRightCell = endIndex < colLetterToIndex("D");
    const isFirstFooterRow = index === 0;

    if (item.linkText) {
      const richText = [] as any[];
      if (item.prefixText) {
        richText.push({
          font: { name: "TH SarabunPSK", size: 14 },
          text: item.prefixText,
        });
      }
      richText.push({
        font: {
          name: "TH SarabunPSK",
          size: 14,
          color: { argb: "FF0000FF" },
          underline: true,
        },
        text: item.linkText,
        hyperlink: item.linkText,
      });
      if (item.suffixText) {
        richText.push({
          font: { name: "TH SarabunPSK", size: 14 },
          text: item.suffixText,
        });
      }
      mainCell.value = { richText };
    } else {
      mainCell.value = plainText;
      mainCell.font = { name: "TH SarabunPSK", size: 14 };
    }

    mainCell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    };
    mainCell.fill = grayFill;
    if (isFirstFooterRow) {
      const borderStyle = { style: "medium", color: { argb: "FF2F3235" } };
      mainCell.border = { ...(mainCell.border || {}), top: borderStyle };
    }

    if (hasSeparateRightCell) {
      const rightCell: any = ws.getCell(`D${rowNo}`);
      if (item.rightText) {
        rightCell.value = item.rightText;
        rightCell.font = { name: "TH SarabunPSK", size: 14, bold: true };
        rightCell.alignment = {
          vertical: "bottom",
          horizontal: "right",
          wrapText: true,
        };
        rightCell.fill = grayFill;
      } else {
        rightCell.value = "";
        rightCell.fill = grayFill;
      }
      if (isFirstFooterRow) {
        const borderStyle = {
          style: "medium",
          color: { argb: "FF2F3235" },
        };
        rightCell.border = { ...(rightCell.border || {}), top: borderStyle };
      }
    }

    // height based on merged widths
    let mergedWidth = 0;
    for (let colIdx = startIndex; colIdx <= endIndex; colIdx++) {
      mergedWidth += getColWidth(ws, colIdx);
    }

    ensureRowHeightsForMergedCell({
      ws,
      startRow: rowNo,
      endRow: rowNo,
      colWidth: mergedWidth,
      text: plainText,
      fontSize: 14,
      minRowHeight: 20,
    });

    if (hasSeparateRightCell && item.rightText) {
      ensureRowHeightsForMergedCell({
        ws,
        startRow: rowNo,
        endRow: rowNo,
        colWidth: getColWidth(ws, 4),
        text: item.rightText,
        fontSize: 14,
        minRowHeight: 20,
      });
    }
  });

  return wb;
}

/* =========================
 * Export selected rows to Excel
 * ========================= */

export async function exportToStyledExcel(
  rows: DataRow[],
  headers: string[],
  config: ExportConfig
) {
  const selectedRows = rows.filter((r) => r.selected);
  if (selectedRows.length === 0) {
    alert("กรุณาเลือกอย่างน้อย 1 แถวเพื่อ Export");
    return;
  }

  const fileSaver = await import("file-saver");
  const saveAs = fileSaver.default || fileSaver.saveAs;

  const wb = await buildWorkbook(selectedRows, config);

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `KMUTT_Admission_Round_${config.roundNumber}_${dateStr}.xlsx`;

  try {
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  } catch (error) {
    console.error("Export error:", error);
    alert("เกิดข้อผิดพลาดในการ Export ไฟล์: " + error);
  }
}

/* =========================
 * Export selected rows to PDF
 * ========================= */

export async function exportToStyledPdf(
  rows: DataRow[],
  headers: string[],
  config: ExportConfig
) {
  const selectedRows = rows.filter((r) => r.selected);
  if (selectedRows.length === 0) {
    alert("กรุณาเลือกอย่างน้อย 1 แถวเพื่อ Export");
    return;
  }

  const fileSaver = await import("file-saver");
  const saveAs = fileSaver.default || fileSaver.saveAs;

  const wb = await buildWorkbook(selectedRows, config);

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `KMUTT_Admission_Round_${config.roundNumber}_${dateStr}.pdf`;

  try {
    const buffer = await wb.xlsx.writeBuffer();
    const pdfBlob = await convertExcelToPdf(buffer);
    saveAs(pdfBlob, filename);
  } catch (error) {
    console.error("PDF Export error:", error);
    alert("เกิดข้อผิดพลาดในการ Export PDF: " + error);
  }
}
