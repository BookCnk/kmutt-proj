"use client";

import React from "react";
import { motion } from "framer-motion";

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string) => void;
  defaultTitle?: string;
  rowCount: number;
  isSaving?: boolean;
}

export function SaveTemplateDialog({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle = "",
  rowCount,
  isSaving = false,
}: SaveTemplateDialogProps) {
  const [title, setTitle] = React.useState(defaultTitle);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
    }
  }, [isOpen, defaultTitle]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("กรุณากรอกชื่อ Template");
      return;
    }
    onConfirm(title.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Save Template</h2>
            <p className="text-sm text-slate-500">บันทึกข้อมูลลงฐานข้อมูล</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                คุณกำลังบันทึก {rowCount} แถว
              </p>
              <p className="text-xs text-blue-600 mt-1">
                กรุณาตั้งชื่อ Template เพื่อใช้ในการค้นหาและจัดการในภายหลัง
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            ชื่อ Template <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="เช่น กำหนดการรับสมัครนักศึกษา รอบที่ 1"
            disabled={isSaving}
            className="truncate w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed transition-all"
            autoFocus
          />
          <p className="text-xs text-slate-500 mt-2">
            ชื่อควรสื่อความหมายชัดเจนเพื่อให้ค้นหาง่าย
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !title.trim()}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-all">
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>บันทึก</span>
              </>
            )}
          </button>
        </div>

        {/* Hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            กด Enter เพื่อบันทึก • Esc เพื่อยกเลิก
          </p>
        </div>
      </motion.div>
    </div>
  );
}
