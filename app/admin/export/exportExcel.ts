import { DataRow, ExportConfig } from "./types";

/**
 * Export selected rows to a styled Excel file with KMUTT branding
 * Uses ExcelJS for full styling support including logo, fonts, and colors
 */
export async function exportToStyledExcel(
  rows: DataRow[],
  headers: string[],
  config: ExportConfig
) {
  // Filter only selected rows
  const selectedRows = rows.filter((r) => r.selected);

  if (selectedRows.length === 0) {
    alert("กรุณาเลือกอย่างน้อย 1 แถวเพื่อ Export");
    return;
  }

  // Dynamically import ExcelJS and file-saver
  const ExcelJS = (await import("exceljs")).default;
  const fileSaver = await import("file-saver");
  const saveAs = fileSaver.default || fileSaver.saveAs;

  // Create workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "KMUTT";
  wb.created = new Date();

  const ws = wb.addWorksheet("Round " + config.roundNumber, {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
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

  // Set column widths
  ws.columns = [
    { width: 70 },
    { width: 35 },
  ];

  // Add KMUTT logo
  try {
    const response = await fetch("/ICON_White.jpg");
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const logoId = wb.addImage({
      buffer: uint8Array,
      extension: "jpeg",
    });
    ws.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 200, height: 85 },
    });
  } catch (e) {
    console.warn("Could not load logo:", e);
  }

  // Title rows (merged)
  ws.mergeCells("A1:B1");
  ws.mergeCells("A2:B2");
  ws.mergeCells("A3:B3");

  const titleCell1 = ws.getCell("A1");
  titleCell1.value = "กำหนดการรับสมัครนักศึกษา";
  titleCell1.font = {
    name: "TH SarabunPSK",
    size: 18,
    bold: true,
    color: { argb: "FFCC0000" },
  };
  titleCell1.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  ws.getRow(1).height = 32;

  const titleCell2 = ws.getCell("A2");
  titleCell2.value = "โครงการ KMUTT International Admission ปีการศึกษา 2569";
  titleCell2.font = {
    name: "TH SarabunPSK",
    size: 16,
    bold: true,
  };
  titleCell2.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  ws.getRow(2).height = 28;

  const titleCell3 = ws.getCell("A3");
  titleCell3.value = "รอบที่ " + config.roundNumber + " - " + config.roundTitle + " " + config.roundSubtitle;
  titleCell3.font = {
    name: "TH SarabunPSK",
    size: 14,
    bold: true,
  };
  titleCell3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  ws.getRow(3).height = 24;

  // Empty row
  ws.addRow([]);

  // Column headers
  const headerRow = ws.addRow(["การดำเนินการ", "วันที่"]);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
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
      fgColor: { argb: "FFFF4616" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF666666" } },
      left: { style: "thin", color: { argb: "FF666666" } },
      bottom: { style: "thin", color: { argb: "FF666666" } },
      right: { style: "thin", color: { argb: "FF666666" } },
    };
  });

  // Data rows - Map to left column (Label TH) and right column (Date Range)
  const labelThIndex = headers.indexOf("Label on Web (TH)");
  const startDateIndex = headers.indexOf("Start Date");
  const endDateIndex = headers.indexOf("End Date");

  selectedRows.forEach((row, index) => {
    const labelTh = String(row.data[labelThIndex] || "");
    const startDate = String(row.data[startDateIndex] || "");
    const endDate = String(row.data[endDateIndex] || "");
    const dateRange =
      startDate && endDate
        ? "วันที่ " + startDate + " - " + endDate
        : startDate || endDate || "";

    const dataRow = ws.addRow([
      (index + 1) + ". " + labelTh,
      dateRange,
    ]);
    dataRow.height = 28;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = {
        name: "TH SarabunPSK",
        size: 14,
      };
      cell.alignment = {
        vertical: "top",
        horizontal: colNumber === 1 ? "left" : "center",
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

  // Generate filename with safer characters
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = "KMUTT_Admission_Round_" + config.roundNumber + "_" + dateStr + ".xlsx";

  // Export file
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
