"use client";

import React from "react";
import { Loader, FileSpreadsheet, FileText } from "lucide-react";

type Props = {
  fileName?: string;
  noteSteps?: string[]; // optional override steps text
};

const defaultSteps = ["อ่านข้อมูล Excel", "สร้างไฟล์ PDF", "เตรียมดาวน์โหลด"];

export default function ConvertProgress({ fileName, noteSteps }: Props) {
  const steps = noteSteps && noteSteps.length ? noteSteps : defaultSteps;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-10 text-center">
      <div className="flex justify-center mb-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2">กำลังแปลงไฟล์…</h3>
      <p className="text-gray-600">
        โปรดรอสักครู่
        {fileName ? (
          <>
            {" "}
            กำลังประมวลผล <span className="font-semibold">{fileName}</span>
          </>
        ) : null}
      </p>

      <div className="mt-8 space-y-3 max-w-md mx-auto">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span className="text-gray-700">{steps[0]}</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg animate-pulse">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-gray-700">{steps[1]}</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-70">
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="text-gray-600">{steps[2]}</span>
        </div>
      </div>
    </div>
  );
}
