"use client";

import React from "react";
import { adminListForms } from "@/api/formService";
import { exportExcelFancy } from "@/lib/exportFancy"; // <- ชี้ไปยังไฟล์ exporter ของคุณ
import { Loader2 } from "lucide-react";

type Props = {
  className?: string;
  label?: string;
};

export default function ExportGradIntakeButton({
  className,
  label = "Export Excel (บัณฑิตศึกษา)",
}: Props) {
  const [loading, setLoading] = React.useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // ดึงทั้งหมด (limit 99999 ถูกตั้ง default ใน service แล้ว)
      const list = await adminListForms({ page: 1, limit: 99999 });

      // ปรับให้ตรงกับ structure ที่ normalizeListResponse คืน (เดาว่า .items)
      const items = (list as any)?.items ?? (list as any)?.data ?? list ?? [];

      // เรียก exporter ของคุณ
      await exportExcelFancy(items);
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
