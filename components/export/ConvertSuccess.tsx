"use client";

import React from "react";
import { CheckCircle2, Download, FileText, ArrowRight } from "lucide-react";

type Props = {
  originalName: string;
  pdfName: string;
  convertedAt?: Date;
  onDownload: () => void;
  onPreview: () => void;
  onReset: () => void;
};

export default function ConvertSuccess({
  originalName,
  pdfName,
  convertedAt = new Date(),
  onDownload,
  onPreview,
  onReset,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">แปลงสำเร็จ!</h3>
        <p className="text-gray-600 mb-6">
          ไฟล์ <span className="font-semibold">{originalName}</span> ถูกแปลงเป็น{" "}
          <span className="font-semibold">{pdfName}</span> แล้ว
        </p>
      </div>

      {/* Download Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Download PDF */}
        <button
          onClick={onDownload}
          className="p-6 rounded-lg border-2 border-emerald-500 bg-emerald-50 hover:shadow-lg transition"
          type="button">
          <Download className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-1">ดาวน์โหลด PDF</h4>
          <p className="text-xs text-gray-600">บันทึกไฟล์ลงเครื่อง</p>
        </button>

        {/* View PDF */}
        <button
          onClick={onPreview}
          className="p-6 rounded-lg border-2 border-blue-300 bg-blue-50 hover:shadow-lg transition"
          type="button">
          <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-1">ดูตัวอย่าง</h4>
          <p className="text-xs text-gray-600">เปิดไฟล์ใน Browser</p>
        </button>

        {/* Convert Again */}
        <button
          onClick={onReset}
          className="p-6 rounded-lg border-2 border-gray-300 bg-gray-50 hover:shadow-lg transition"
          type="button">
          <ArrowRight className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-1">แปลงอีกครั้ง</h4>
          <p className="text-xs text-gray-600">อัปโหลดไฟล์ใหม่</p>
        </button>
      </div>

      {/* File Info */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">ข้อมูลไฟล์ที่แปลง</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">ชื่อไฟล์ต้นฉบับ</p>
            <p className="font-semibold text-gray-900 text-sm truncate">
              {originalName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">ชื่อไฟล์ PDF</p>
            <p className="font-semibold text-gray-900 text-sm truncate">
              {pdfName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">เวลาแปลง</p>
            <p className="font-semibold text-gray-900 text-sm">
              {convertedAt.toLocaleTimeString("th-TH")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">สถานะ</p>
            <p className="font-semibold text-emerald-600 text-sm">✓ สำเร็จ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
