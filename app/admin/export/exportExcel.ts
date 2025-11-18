import { Fill } from "exceljs";
import { DataRow, ExportConfig } from "./types";

/**
 * Export selected rows to a styled Excel file with KMUTT branding (true A4 setup)
 */
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

  const ExcelJS = (await import("exceljs")).default;
  const fileSaver = await import("file-saver");
  const saveAs = fileSaver.default || fileSaver.saveAs;

  const wb = new ExcelJS.Workbook();
  wb.creator = "KMUTT";
  wb.created = new Date();

  // 🧾 A4 Page Setup: 21.0 × 29.7 cm = 8.27 × 11.69 inch
  const ws = wb.addWorksheet("Round " + config.roundNumber, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait", // แนวตั้ง
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      verticalCentered: false,
      printArea: "A1:C100",
      // ขอบกระดาษมาตรฐาน A4 (เซนติเมตร → นิ้ว)
      margins: {
        left: 1.27 / 2.54,   // 1.27 cm = 0.5"
        right: 1.27 / 2.54,
        top: 1.91 / 2.54,    // 1.91 cm = 0.75"
        bottom: 1.91 / 2.54,
        header: 0.76 / 2.54, // 0.3"
        footer: 0.76 / 2.54,
      },
    },
  });

  // === Columns ===
  ws.columns = [
    { width: 3 },   // A
    { width: 90 },  // B
    { width: 35 },  // C
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
      ext: { width: 190, height: 100 }, // สูงประมาณ 4 แถว
    });
  } catch (e) {
    console.warn("Could not load logo:", e);
  }

  // ===== Header Section =====
  ws.mergeCells("B1:B4");
  ws.mergeCells("C2:C4");

  const titleCell = ws.getCell("B1");
  titleCell.value = {
    richText: [
      {
        font: { name: "TH SarabunPSK", size: 18, bold: true },
        text: "กำหนดการรับสมัครนักศึกษา\n",
      },
      {
        font: { name: "TH SarabunPSK", size: 16, bold: true },
        text: "โครงการ KMUTT International Admission ปีการศึกษา 2569",
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
  ["B1", "B2", "B3", "B4"].forEach((addr) => {
    const c = ws.getCell(addr);
    c.fill = titleCell.fill;
    c.border = {
      top: { style: "thin", color: { argb: "FF2F3235" } },
      left: { style: "thin", color: { argb: "FF2F3235" } },
      bottom: { style: "thin", color: { argb: "FF2F3235" } },
      right: { style: "thin", color: { argb: "FF2F3235" } },
    };
  });

  // รอบที่
  const roundCell = ws.getCell("C1");
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
  roundCell.border = {
    top: { style: "thin", color: { argb: "FF2F3235" } },
    left: { style: "thin", color: { argb: "FF2F3235" } },
    bottom: { style: "thin", color: { argb: "FF2F3235" } },
    right: { style: "thin", color: { argb: "FF2F3235" } },
  };

  // สำนักงานคัดเลือก
  const officeCell = ws.getCell("C2");
  officeCell.value = "สำนักงานคัดเลือก\nและสรรหานักศึกษา";
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
  ["C2", "C3", "C4"].forEach((addr) => {
    const c = ws.getCell(addr);
    c.fill = officeCell.fill;
    c.border = {
      top: { style: "thin", color: { argb: "FF2F3235" } },
      left: { style: "thin", color: { argb: "FF2F3235" } },
      bottom: { style: "thin", color: { argb: "FF2F3235" } },
      right: { style: "thin", color: { argb: "FF2F3235" } },
    };
  });

  // ===== Header Row (แถว 5) =====
  ws.getRow(5).height = 22;
  const headerA = ws.getCell("A5");
  const headerB = ws.getCell("B5");
  const headerC = ws.getCell("C5");

  headerA.value = "";
  headerB.value = "การดำเนินการ";
  headerC.value = "วันที่";

  const yellowFill: Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC72C" },
  };

  [headerA, headerB, headerC].forEach((cell) => {
    cell.font = { name: "TH SarabunPSK", size: 14, bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF2F3235" } },
      left: { style: "thin", color: { argb: "FF2F3235" } },
      bottom: { style: "thin", color: { argb: "FF2F3235" } },
      right: { style: "thin", color: { argb: "FF2F3235" } },
    };
  });

  headerB.fill = yellowFill;
  headerC.fill = yellowFill;

  // ===== DATA ROWS =====
  const labelThIndex = headers.indexOf("Label on Web (TH)");
  const startDateIndex = headers.indexOf("Start Date");
  const endDateIndex = headers.indexOf("End Date");

  selectedRows.forEach((row, index) => {
    const labelTh = String(row.data[labelThIndex] || "");
    const startDate = String(row.data[startDateIndex] || "");
    const endDate = String(row.data[endDateIndex] || "");
    const dateRange =
      startDate && endDate
        ? `วันที่ ${startDate} - ${endDate}`
        : startDate || endDate || "";

    const dataRow = ws.addRow([`${index + 1}.`, labelTh, dateRange]);
    dataRow.height = 26;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = { name: "TH SarabunPSK", size: 14 };
      cell.alignment = {
        vertical: "top",
        horizontal: colNumber === 2 ? "left" : "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });
  });

  // ===== Save file =====
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
