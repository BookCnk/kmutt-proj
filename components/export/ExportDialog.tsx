"use client";

import React from "react";
import { motion } from "framer-motion";
import { ExportConfig } from "@/app/admin/export/types";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ExportConfig) => void;
  selectedCount: number;
}

export function ExportDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
}: ExportDialogProps) {
  const [roundNumber, setRoundNumber] = React.useState("1");
  const [sheetTitle, setSheetTitle] = React.useState("กำหนดการรับสมัครนักศึกษา\nโครงการคัดเลือกตรงความสามารถพิเศษและทุนเพชรพระจอมเกล้่า ปีการศึกษา 2569");
  const [roundTitle, setRoundTitle] = React.useState("สำนักงานคัดเลือก\nและสรรหานักศึกษา");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm({
      roundNumber,
      sheetTitle,
      roundTitle,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Export Excel
        </h2>
        <p className="text-slate-600 mb-6">
          กำหนดค่าข้อมูลในส่วนหัวของไฟล์ Excel ({selectedCount} แถว)
        </p>

        <div className="space-y-4">
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
