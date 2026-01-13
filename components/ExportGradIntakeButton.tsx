"use client";

import React from "react";
import { adminListForms } from "@/api/formService";
import { getAdmissionById } from "@/api/admissionService";
import { exportExcelFancy, buildExcelFancyBuffer } from "@/lib/exportFancy";
import { convertExcelToPdf } from "@/api/conversionService"; // ❗ห้ามแก้ไฟล์นี้
import { saveAs } from "file-saver";
import { Loader2, FileSpreadsheet, FileText, X } from "lucide-react";

type Props = {
  className?: string;
  label?: string;
  admissionId?: string; // _id ของรอบรับ หรือ "ทั้งหมด" (คุณใช้ selectedYear ก็ได้)
  roundNumber?: string | number; // optional
};

type ExportFormat = "xlsx" | "pdf" | "both";

export default function ExportGradIntakeButton({
  className,
  label = "Export จำนวนรับนักศึกษา",
  admissionId,
  roundNumber,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState<ExportFormat | null>(null);

  const close = () => {
    if (loading) return;
    setOpen(false);
  };

  const fetchData = async () => {
    const params: any = { page: 1, limit: 99999 };
    if (admissionId && admissionId !== "ทั้งหมด")
      params.admission_id = admissionId;

    const [list, admissionResp] = await Promise.all([
      adminListForms(params),
      admissionId && admissionId !== "ทั้งหมด"
        ? getAdmissionById(admissionId)
        : Promise.resolve(undefined),
    ]);

    const items =
      (list as any)?.items ??
      (list as any)?.data ??
      (Array.isArray(list) ? list : []) ??
      [];

    const admission =
      (admissionResp as any)?.data?.[0] ??
      (admissionResp as any)?.data ??
      admissionResp;

    return { items, admission };
  };

  const exportPdf = async (items: any[], admission: any) => {
    const excelBuf = await buildExcelFancyBuffer(items, { admission });
    if (!excelBuf) throw new Error("ไม่มีข้อมูลสำหรับ export");

    const pdfBlob = await convertExcelToPdf(excelBuf);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `KMUTT_Admission_${
      roundNumber ?? admissionId ?? "ALL"
    }_${dateStr}.pdf`;
    saveAs(pdfBlob, filename);
  };

  const exportXlsx = async (items: any[], admission: any) => {
    await exportExcelFancy(items, { admission }); // ✅ เดิม: ดาวน์โหลด xlsx
  };

  const onChoose = async (format: ExportFormat) => {
    if (loading) return;
    setLoading(format);

    try {
      const { items, admission } = await fetchData();
      if (!items?.length) {
        alert("ไม่มีข้อมูลสำหรับ export");
        return;
      }

      if (format === "xlsx") {
        await exportXlsx(items, admission);
      } else if (format === "pdf") {
        await exportPdf(items, admission);
      } else {
        // both
        await exportXlsx(items, admission);
        await exportPdf(items, admission);
      }

      setOpen(false);
    } catch (err) {
      console.error("Export failed:", err);
      alert("ไม่สามารถ export ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* ปุ่มเดิม (กดแล้วเปิด modal) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!!loading}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#FF4612] text-white hover:opacity-90 disabled:opacity-60"
        }
        title="Export">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div>
                  <div className="text-lg font-semibold">
                    เลือก Format ที่ต้องการ Export
                  </div>
                  <div className="text-sm text-gray-500">
                    Excel, PDF หรือทั้งคู่
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  disabled={!!loading}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <button
                  type="button"
                  onClick={() => onChoose("xlsx")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50 disabled:opacity-60">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Excel (.xlsx)</div>
                      <div className="text-xs text-gray-500">
                        ดาวน์โหลดไฟล์ Excel
                      </div>
                    </div>
                  </div>
                  {loading === "xlsx" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </button>

                {/* <button
                  type="button"
                  onClick={() => onChoose("pdf")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50 disabled:opacity-60">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">PDF (.pdf)</div>
                      <div className="text-xs text-gray-500">
                        แปลงจาก Excel แล้วดาวน์โหลด PDF
                      </div>
                    </div>
                  </div>
                  {loading === "pdf" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </button> */}

                <button
                  type="button"
                  onClick={() => onChoose("both")}
                  disabled={!!loading}
                  className="w-full flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50 disabled:opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded bg-black text-white flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div className="text-left">
                      <div className="font-medium">ทั้ง Excel + PDF</div>
                      <div className="text-xs text-gray-500">
                        ดาวน์โหลดทั้ง 2 ไฟล์
                      </div>
                    </div>
                  </div>
                  {loading === "both" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </button>
              </div>

              <div className="px-5 py-4 border-t flex justify-end">
                <button
                  type="button"
                  onClick={close}
                  disabled={!!loading}
                  className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-60">
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
