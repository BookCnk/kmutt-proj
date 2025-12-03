"use client";

import React from "react";
import { adminListForms } from "@/api/formService";
import { Loader2 } from "lucide-react";
import { exportExcel } from "@/lib/exportExcel"; // <- ชี้ไปยังไฟล์ exporter ของคุณ

type Props = {
  className?: string;
  label?: string;
};

export default function ExportAdmissionsExcelButton({
  className,
  label = "Export Excel ข้อมูลการรับสมัคร",
}: Props) {
  const [loading, setLoading] = React.useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // ✅ ดึงข้อมูลทั้งหมดจาก API
      const list = await adminListForms({ page: 1, limit: 99999 });
      const items = (list as any)?.items ?? (list as any)?.data ?? list ?? [];
      console.log("Exporting items:", items);

      // ✅ เรียกฟังก์ชัน exportExcel แบบธรรมดา
      await exportExcel(items);
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
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#31e000] text-white hover:opacity-90 disabled:opacity-60"
      }
      title="Export ข้อมูลการรับสมัคร (บัณฑิตศึกษา)">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}
