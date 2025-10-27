// lib/export/excelToHtmlPdf.ts
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export type HtmlPdfOptions = {
  orientation?: "p" | "l";
  scale?: number;
  sheetName?: string;
  title?: string;
  maxWidthPx?: number;
  preview?: boolean; // 👈 เพิ่ม
  keepDomAfter?: boolean; // 👈 ไม่ลบ DOM หลังทำเสร็จ (ไว้ดูต่อ)
};

export async function convertExcelToHtmlPdf(
  file: File,
  opts: HtmlPdfOptions = {}
): Promise<Blob> {
  const {
    orientation = "p",
    scale = 2,
    sheetName,
    title,
    maxWidthPx = orientation === "l" ? 1200 : 794,
    preview = false,
    keepDomAfter = false,
  } = opts;

  // 1) Excel → rows
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const targetSheet =
    sheetName && wb.SheetNames.includes(sheetName)
      ? sheetName
      : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(
    wb.Sheets[targetSheet],
    { defval: "", raw: false }
  );

  // 2) host
  const host = document.createElement("div");
  host.style.background = "#fff";
  host.style.color = "#000";
  host.style.fontFamily = "Arial, sans-serif";
  host.style.padding = "16px";
  host.style.boxSizing = "border-box";
  host.style.width = `${maxWidthPx}px`;

  if (preview) {
    // ✅ โชว์เป็น overlay ให้เห็นก่อน
    host.style.position = "fixed";
    host.style.left = "50%";
    host.style.top = "50%";
    host.style.transform = "translate(-50%,-50%)";
    host.style.maxHeight = "80vh";
    host.style.overflow = "auto";
    host.style.zIndex = "99999";
    host.style.boxShadow = "0 10px 30px rgba(0,0,0,.2)";
    host.style.border = "1px solid #e5e7eb";

    // ปุ่มปิดพรีวิว
    const close = document.createElement("button");
    close.textContent = "ปิดพรีวิว";
    close.style.position = "absolute";
    close.style.right = "8px";
    close.style.top = "8px";
    close.style.padding = "6px 10px";
    close.style.fontSize = "12px";
    close.onclick = () => host.remove();
    host.appendChild(close);
  } else {
    // เดิม: ซ่อนไว้นอกจอ
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
  }

  document.body.appendChild(host);

  // 3) เติม HTML
  if (title) {
    const h = document.createElement("h2");
    h.textContent = title;
    h.style.margin = "0 0 12px";
    host.appendChild(h);
  }

  if (rows.length) {
    const headers = Object.keys(rows[0]);
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.tableLayout = "fixed";
    table.style.width = "100%";
    table.style.fontSize = "12px";

    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.style.border = "1px solid #999";
      th.style.padding = "6px";
      th.style.background = "#f5f5f5";
      th.style.wordBreak = "break-word";
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      headers.forEach((h) => {
        const td = document.createElement("td");
        td.textContent = String(r[h] ?? "");
        td.style.border = "1px solid #ccc";
        td.style.padding = "6px";
        td.style.wordBreak = "break-word";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    host.appendChild(table);
  } else {
    const p = document.createElement("p");
    p.textContent = "(ไม่มีข้อมูลในชีตนี้)";
    host.appendChild(p);
  }

  // รอ layout
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  // 4) แปลงเป็น PDF
  const pdf = new jsPDF(orientation, "pt", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;

  const canvas = await html2canvas(host, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: host.scrollWidth,
    windowHeight: host.scrollHeight,
    logging: false,
  });

  const usableW = pageW - margin * 2;
  const ratio = usableW / canvas.width;
  const pageCanvasHeight = Math.floor((pageH - margin * 2) / ratio);

  let rendered = 0;
  let pageIndex = 0;
  while (rendered < canvas.height) {
    const partH = Math.min(pageCanvasHeight, canvas.height - rendered);
    const part = document.createElement("canvas");
    part.width = canvas.width;
    part.height = partH;
    part
      .getContext("2d")!
      .drawImage(
        canvas,
        0,
        rendered,
        canvas.width,
        partH,
        0,
        0,
        part.width,
        part.height
      );

    const dataUrl = part.toDataURL("image/png");
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      dataUrl,
      "PNG",
      margin,
      margin,
      usableW,
      partH * ratio,
      undefined,
      "FAST"
    );

    rendered += partH;
    pageIndex++;
  }

  // 5) ล้างหรือคงไว้
  if (!keepDomAfter && !preview) {
    document.body.removeChild(host);
  }
  const buf = pdf.output("arraybuffer");
  return new Blob([buf], { type: "application/pdf" });
}
