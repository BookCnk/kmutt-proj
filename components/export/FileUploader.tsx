"use client";

import React from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

type Props = {
  onSelect: (file: File) => void;
  maxSizeMB?: number; // default 50MB
};

export default function FileUploader({ onSelect, maxSizeMB = 50 }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const acceptTypes = ".xlsx,.xls";
  const maxBytes = maxSizeMB * 1024 * 1024;

  const validate = (file: File) => {
    const okType =
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");
    if (!okType) {
      setError("รองรับเฉพาะไฟล์ .xlsx และ .xls เท่านั้น");
      return false;
    }
    if (file.size > maxBytes) {
      setError(`ไฟล์มีขนาดใหญ่เกิน ${maxSizeMB} MB`);
      return false;
    }
    setError("");
    return true;
  };

  const handleFile = (file?: File) => {
    if (file && validate(file)) {
      onSelect(file);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  };

  return (
    <div
      onDragEnter={onDrag}
      onDragOver={onDrag}
      onDragLeave={onDrag}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-12 text-center transition
        ${
          dragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 bg-gray-50 hover:border-emerald-400"
        }`}>
      <FileSpreadsheet
        className={`w-14 h-14 mx-auto mb-4 transition ${
          dragActive ? "text-emerald-600" : "text-gray-400"
        }`}
      />
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        ลากไฟล์ Excel มาวางที่นี่
      </h3>
      <p className="text-gray-600 mb-6">
        หรือคลิกปุ่มด้านล่างเพื่อเลือกไฟล์จากเครื่องของคุณ
      </p>

      <button
        onClick={() => inputRef.current?.click()}
        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition flex items-center gap-2 mx-auto"
        type="button">
        <Upload className="w-5 h-5" />
        เลือกไฟล์
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={onChange}
        className="hidden"
      />

      <p className="text-xs text-gray-500 mt-4">
        รองรับไฟล์ {acceptTypes} | ขนาดสูงสุด {maxSizeMB} MB
      </p>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
