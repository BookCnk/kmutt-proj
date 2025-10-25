"use client";

import React from "react";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminExportPage() {
  const [step, setStep] = React.useState<"upload" | "convert" | "success">(
    "upload"
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState("");
  const [dragActive, setDragActive] = React.useState(false);

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const uploadedFile = files[0];
      if (
        uploadedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        uploadedFile.type === "application/vnd.ms-excel" ||
        uploadedFile.name.endsWith(".xlsx") ||
        uploadedFile.name.endsWith(".xls")
      ) {
        setFile(uploadedFile);
        setFileName(uploadedFile.name);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setLoading(true);
    setStep("convert");

    // TODO: Implement actual conversion logic here
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoading(false);
    setStep("success");
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    console.log("Download PDF");
  };

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-lg shadow-lg">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
              แปลงไฟล์เอกสาร
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              นำเข้าไฟล์ Excel และแปลงเป็น PDF ได้อย่างง่ายดาย
            </p>
          </div>
        </div>
      </div>
      {/* Main Content */}{" "}
      <a
        href="/"
        className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-lg shadow-lg text-white">
        กลับหน้าแรก
      </a>
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Step 1: Upload */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                  step === "upload" || step === "convert" || step === "success"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}>
                1
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">
                อัปโหลด
              </span>
            </div>

            <div
              className={`flex-1 h-1 transition ${
                step === "convert" || step === "success"
                  ? "bg-emerald-500"
                  : "bg-gray-300"
              }`}
            />

            {/* Step 2: Convert */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                  step === "convert" || step === "success"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}>
                2
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">
                แปลง
              </span>
            </div>

            <div
              className={`flex-1 h-1 transition ${
                step === "success" ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />

            {/* Step 3: Download */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition ${
                  step === "success"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}>
                3
              </div>
              <span className="text-xs font-semibold text-gray-700 mt-2">
                ดาวน์โหลด
              </span>
            </div>
          </div>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-300 bg-gray-50 hover:border-emerald-400"
              }`}>
              <FileSpreadsheet
                className={`w-16 h-16 mx-auto mb-4 transition ${
                  dragActive ? "text-emerald-600" : "text-gray-400"
                }`}
              />

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ลาก Excel ที่นี่
              </h3>
              <p className="text-gray-600 mb-6">
                หรือคลิกเพื่อเลือกไฟล์จากเครื่องของคุณ
              </p>

              <label className="inline-block">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition cursor-pointer flex items-center gap-2 mx-auto">
                  <Upload className="w-5 h-5" />
                  เลือกไฟล์
                </button>
              </label>

              <p className="text-xs text-gray-500 mt-4">
                รองรับไฟล์ .xlsx และ .xls เท่านั้น
              </p>
            </div>

            {file && (
              <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">
                    ไฟล์ที่เลือก:
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-200">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleConvert}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition flex items-center justify-center gap-2">
                    <ArrowRight className="w-5 h-5" />
                    แปลงเป็น PDF
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Converting Step */}
        {step === "convert" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center mb-6">
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              กำลังแปลงไฟล์…
            </h3>
            <p className="text-gray-600">
              โปรดรอสักครู่ กำลังประมวลผล {fileName}
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">อ่านข้อมูล Excel</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg animate-pulse">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-gray-700">สร้างไฟล์ PDF</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">เตรียมดาวน์โหลด</span>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                แปลงสำเร็จ!
              </h3>
              <p className="text-gray-600 mb-6">
                ไฟล์ {fileName} ถูกแปลงเป็น PDF แล้ว
              </p>
            </div>

            {/* Download Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Option 1: Download PDF */}
              <button
                onClick={handleDownloadPDF}
                className="p-6 rounded-lg border-2 border-emerald-500 bg-emerald-50 hover:shadow-lg transition">
                <Download className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">
                  ดาวน์โหลด PDF
                </h4>
                <p className="text-xs text-gray-600">บันทึกไฟล์ลงเครื่อง</p>
              </button>

              {/* Option 2: View PDF */}
              <button className="p-6 rounded-lg border-2 border-blue-300 bg-blue-50 hover:shadow-lg transition">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">ดูตัวอย่าง</h4>
                <p className="text-xs text-gray-600">เปิดไฟล์ใน Browser</p>
              </button>

              {/* Option 3: Convert Again */}
              <button
                onClick={handleReset}
                className="p-6 rounded-lg border-2 border-gray-300 bg-gray-50 hover:shadow-lg transition">
                <ArrowRight className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">
                  แปลงอีกครั้ง
                </h4>
                <p className="text-xs text-gray-600">อัปโหลดไฟล์ใหม่</p>
              </button>
            </div>

            {/* File Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">
                ข้อมูลไฟล์ที่แปลง
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">ชื่อไฟล์ต้นฉบับ</p>
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {fileName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">ชื่อไฟล์ PDF</p>
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {fileName.replace(/\.[^/.]+$/, ".pdf")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">เวลาแปลง</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date().toLocaleTimeString("th-TH")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">สถานะ</p>
                  <p className="font-semibold text-emerald-600 text-sm">
                    ✓ สำเร็จ
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">ข้อมูลสำคัญ</h4>
            <p className="text-sm text-blue-800">
              ไฟล์ของคุณจะถูกประมวลผลอย่างปลอดภัยและจะถูกลบทันทีหลังจากการแปลง
              ขนาดไฟล์สูงสุด: 50 MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
