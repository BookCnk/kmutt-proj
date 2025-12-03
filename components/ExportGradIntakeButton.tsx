"use client";

import React from "react";
import { adminListForms } from "@/api/formService";
import { getAdmissionById } from "@/api/admissionService";
import { exportExcelFancy } from "@/lib/exportFancy"; // ⬅️ exporter รองรับ meta ตัวที่สอง
import { Loader2 } from "lucide-react";

type Props = {
  className?: string;
  label?: string;
  admissionId?: string; // _id ของรอบรับ หรือ "ทั้งหมด"
};

export default function ExportGradIntakeButton({
  className,
  label = "Export Excel จำนวนรับนักศึกษา",
  admissionId,
}: Props) {
  const [loading, setLoading] = React.useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1) ดึงรายการฟอร์มทั้งหมด (หรือกรองตาม admission ที่เลือก)
      const params: any = { page: 1, limit: 99999 };
      if (admissionId && admissionId !== "ทั้งหมด") {
        params.admission_id = admissionId;
      }

      // 2) โหลด data พร้อมกัน (forms + admission meta [ถ้ามี id จริง])
      const [list, admissionResp] = await Promise.all([
        adminListForms(params),
        admissionId && admissionId !== "ทั้งหมด"
          ? getAdmissionById(admissionId)
          : Promise.resolve(undefined),
      ]);

      // 3) แกะรายการฟอร์มให้เป็น array
      const items =
        (list as any)?.items ??
        (list as any)?.data ??
        (Array.isArray(list) ? list : []) ??
        [];

      // 4) แกะ admission object ให้เป็นก้อนเดียว (รองรับหลายรูปแบบ response)
      const admission =
        (admissionResp as any)?.data?.[0] ??
        (admissionResp as any)?.data ??
        admissionResp;

      // 5) ส่งเข้าฟังก์ชัน export พร้อม meta
      await exportExcelFancy(items, { admission });
    } catch (err) {
      console.error("Export failed:", err);
      alert("ไม่สามารถ export ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#FF4612] text-white hover:opacity-90 disabled:opacity-60"
      }
      title="Export จำนวนนักศึกษารับ (ปริญญาโท)">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}
