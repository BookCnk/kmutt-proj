"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "@/app/admin/export/utils";

interface DropzoneProps {
  onPick: (file: File) => void;
}

export function Dropzone({ onPick }: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onPick(file);
      }}
      className={clsx(
        "border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer",
        dragOver
          ? "border-emerald-500 bg-emerald-50/50"
          : "border-slate-300 bg-white hover:bg-slate-50"
      )}
      onClick={() => inputRef.current?.click()}>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-emerald-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <path
              strokeWidth="2"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v11"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-800">
            อัปโหลด/วางไฟล์ Excel
          </h3>
          <p className="text-slate-500 text-sm">
            รองรับ .xlsx / .xls — ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
          </p>
        </div>
      </motion.div>
    </div>
  );
}
