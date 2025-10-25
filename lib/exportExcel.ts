import ExcelJS from "exceljs";
// @ts-ignore
import { saveAs } from "file-saver";

// Helper สำหรับวันที่ไทย
function thaiDateNow() {
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
  return `${d.getDate()} ${thMonths[d.getMonth()]} ${thYear}`;
}

// ✅ ฟังก์ชันหลัก
export async function exportExcel(rawData: any[]) {
  if (!rawData || rawData.length === 0) {
    console.warn("ไม่มีข้อมูลสำหรับ export");
    return;
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("การรับสมัคร");

  // ===== Header =====
  const headers = [
    "ลำดับ",
    "ภาคการศึกษา",
    "คณะ",
    "ภาควิชา",
    "ชื่อหลักสูตร",
    "ชื่อปริญญา",
    "วัน-เวลาเรียน",
    "จำนวนรับ (คน)",
    "รูปแบบการรับสมัคร",
    "รายละเอียดการเปิดรับ",
    "ชื่อผู้ยื่น",
    "อีเมล",
    "เบอร์โทร",
  ];
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true, name: "TH SarabunPSK", size: 14 };

  // ===== ใส่ข้อมูล =====
  let index = 1;

  for (const doc of rawData) {
    const faculty = doc?.faculty_id?.title ?? "-";
    const department = doc?.department_id?.title ?? "-";
    const term = doc?.admission_id?.term?.label ?? "-";
    const submitter = doc?.submitter?.name ?? "-";
    const email = doc?.submitter?.email ?? "-";
    const phone = Array.isArray(doc?.submitter?.phone)
      ? doc.submitter.phone.join(" / ")
      : doc?.submitter?.phone ?? "-";

    if (Array.isArray(doc?.intake_programs)) {
      for (const ip of doc.intake_programs) {
        const prog = ip?.program_id ?? {};
        const title = prog?.title ?? "-";
        const degree = prog?.degree_abbr ?? "-";

        // ดึง “วัน - เวลาเรียน” จากชื่อหลักสูตร (ถ้ามีในวงเล็บท้ายชื่อ)
        const match = title.match(/\(([^)]+)\)$/);
        const schedule = match ? match[1] : "";

        // จำนวนรับ
        const amt =
          ip?.intake_degree?.master?.amount ??
          ip?.intake_degree?.doctoral?.amount ??
          "";

        // แยกรูปแบบการรับสมัคร
        const rounds = ip?.intake_calendar?.rounds ?? [];
        const monthly = ip?.intake_calendar?.monthly ?? [];

        let formatType = "-";
        let formatDetail = "-";

        if (rounds.length > 0) {
          formatType = "รอบ (Round)";
          formatDetail = rounds
            .map(
              (r: any) =>
                `${r.title || ""} (${r.interview_date?.slice(0, 10) || ""})`
            )
            .join(", ");
        } else if (monthly.length > 0) {
          formatType = "รายเดือน (Monthly)";
          formatDetail = monthly
            .map((m: any) => `${m.month || ""} (${m.title || ""})`)
            .join(", ");
        }

        ws.addRow([
          index++,
          term,
          faculty,
          department,
          title,
          degree,
          schedule,
          amt,
          formatType,
          formatDetail,
          submitter,
          email,
          phone,
        ]);
      }
    }
  }

  // ===== สไตล์ตาราง =====
  ws.columns.forEach((col: any) => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, (cell: any) => {
      const len = cell.value ? cell.value.toString().length : 0;
      maxLength = Math.max(maxLength, len);
    });
    col.width = Math.min(maxLength + 2, 40);
  });

  ws.eachRow((row, rowNum) => {
    row.height = 22;
    row.eachCell((cell) => {
      cell.font = { name: "TH SarabunPSK", size: 14 };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
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

  // ===== ตั้งชื่อไฟล์ =====
  const fileName = `ข้อมูลการรับสมัคร_${thaiDateNow()}.xlsx`;

  // ===== ดาวน์โหลด (Browser) หรือบันทึก (Node.js) =====
  const buf = await wb.xlsx.writeBuffer();

  // @ts-ignore
  if (typeof window !== "undefined") {
    saveAs(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );
  } else {
    const fs = require("fs");
    fs.writeFileSync(fileName, Buffer.from(buf));
    console.log(`✅ สร้างไฟล์ ${fileName} สำเร็จ`);
  }
}
