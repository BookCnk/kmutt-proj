"use client";

import React from "react";
import { motion } from "framer-motion";
import { ExportConfig, DataRow } from "@/app/admin/export/types";

export type ExportFormat = "excel" | "pdf";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ExportConfig, format: ExportFormat) => void;
  selectedCount: number;

  // ✅ NEW: รับแถวแรกมา 1 แถว
  firstRow?: DataRow | null;
}

export function ExportDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  firstRow,
}: ExportDialogProps) {
  const [roundNumber, setRoundNumber] = React.useState("1");
  const [sheetTitle, setSheetTitle] = React.useState(
    "กำหนดการรับสมัครนักศึกษา\nโครงการคัดเลือกตรงความสามารถพิเศษและทุนเพชรพระจอมเกล้่า ปีการศึกษา 2569"
  );
  const [roundTitle, setRoundTitle] = React.useState(
    "สำนักงานคัดเลือก\nและสรรหานักศึกษา"
  );
  const [format, setFormat] = React.useState<ExportFormat>("excel");

  console.log("First row in ExportDialog:", firstRow);

  // ✅ NEW: ตอน dialog เปิด ให้ดึงค่าจากแถวแรกมาเติม (เอาแค่แถวเดียว)
  React.useEffect(() => {
    if (!isOpen) return;
    if (!firstRow) return;

    // 1) nameHeader อาจมีรูปแบบ: "รอบที่ 1 โครงการ... ปีการศึกษา 2569"
    const nameHeader = String((firstRow as any)?.nameHeader ?? "").trim();
    const m = nameHeader.match(/รอบที่\s*(\d+)/);

    // ✅ รอบที่: เอาจาก sequence ก่อน ถ้าไม่มีค่อยดูจาก nameHeader
    const inferredRound = String((firstRow as any)?.sequence ?? m?.[1] ?? "1");

    // ✅ หัวข้อโครงการ: เอา nameHeader ก่อนเสมอ
    const inferredSheetTitle =
      nameHeader ||
      String((firstRow as any)?.label_on_web_th ?? "").trim() ||
      sheetTitle;

    // ✅ สำนักงาน: ถ้ามี field เฉพาะให้ใช้ก่อน (เช่น officeName) ไม่งั้น fallback เดิม
    const inferredRoundTitle =
      String((firstRow as any)?.officeName ?? "").trim() ||
      String((firstRow as any)?.label_on_web_en ?? "").trim() ||
      roundTitle;

    setRoundNumber(inferredRound);
    setSheetTitle(inferredSheetTitle);
    setRoundTitle(inferredRoundTitle);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, firstRow]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(
      {
        roundNumber,
        sheetTitle,
        roundTitle,
      },
      format
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Export ไฟล์</h2>

        <p className="text-slate-600 mb-6">
          กำหนดค่าข้อมูลในส่วนหัวของไฟล์ ({selectedCount} แถว)
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              รูปแบบไฟล์
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === "excel"}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm">Excel (.xlsx)</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="mr-2 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm">PDF (.pdf)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              รอบที่
            </label>
            <input
              type="text"
              value={roundNumber}
              onChange={(e) => setRoundNumber(e.target.value)}
              placeholder="1"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              หัวข้อโครงการ
            </label>
            <textarea
              value={sheetTitle}
              onChange={(e) => setSheetTitle(e.target.value)}
              placeholder="หัวข้อโครงการ"
              className="w-full h-28 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              สำนักงาน
            </label>
            <textarea
              value={roundTitle}
              onChange={(e) => setRoundTitle(e.target.value)}
              placeholder="สำนักงาน"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">
            ยกเลิก
          </button>

          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Export
          </button>
        </div>
      </motion.div>
    </div>
  );
}
