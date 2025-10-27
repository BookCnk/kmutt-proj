// app/admin/export/page.tsx
"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import FileUploader from "@/components/export/FileUploader";
import ConvertProgress from "@/components/export/ConvertProgress";
import ConvertSuccess from "@/components/export/ConvertSuccess";
import { convertExcelToHtmlPdf } from "@/lib/export/excelToHtmlPdf";

type Step = "upload" | "convert" | "success";

export default function AdminExportPage() {
  const [step, setStep] = React.useState<Step>("upload");

  // single file (Excel only)
  const [excelFile, setExcelFile] = React.useState<File | null>(null);

  // output
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [pdfName, setPdfName] = React.useState<string>("");
  const [excelName, setExcelName] = React.useState<string>("ต้นฉบับ.xlsx");

  // ----- Actions -----
  const handleConvert = async () => {
    if (!excelFile) {
      alert("กรุณาอัปโหลดไฟล์ Excel");
      return;
    }

    setStep("convert");
    try {
      setExcelName(excelFile.name);
      setPdfName(excelFile.name.replace(/\.[^/.]+$/, ".pdf"));

      // ✅ แปลงแบบฝั่ง client ล้วน: html2canvas + jsPDF
      const outBlob = await convertExcelToHtmlPdf(excelFile, {
        orientation: "l", // "p" แนวตั้ง, "l" แนวนอน (ตารางกว้างใช้ l)
        scale: 2, // 1–3 ยิ่งมากยิ่งคม
        // sheetName: "Sheet1",
        title: `พรีวิว: ${excelFile.name}`, // หัวเรื่องบนหน้า
        preview: true, // 👈 แสดง HTML เป็น overlay ให้เห็นก่อนแคป
        keepDomAfter: true, // 👈 ให้ DOM พรีวิวค้างไว้หลังแปลง (จะได้เช็กต่อ)
        maxWidthPx: 1200, // 👈 ความกว้าง DOM ตอนพรีวิว/แคป (แนวนอนใช้สัก ~1200)
      });

      const url = URL.createObjectURL(outBlob);
      setPdfUrl(url);
      setStep("success");
    } catch (err) {
      console.error(err);
      alert("แปลงไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์ Excel");
      setStep("upload");
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = pdfName || "output.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePreview = () => {
    if (pdfUrl) window.open(pdfUrl, "_blank");
  };

  const handleReset = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfName("");
    setExcelFile(null);
    setStep("upload");
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
              แปลง Excel → PDF
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              อัปโหลดไฟล์ Excel แล้วแปลงเป็น PDF ในเบราว์เซอร์โดยตรง
            </p>
          </div>
        </div>
      </div>

      <a
        href="/"
        className="inline-block mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-lg shadow-lg text-white">
        กลับหน้าแรก
      </a>

      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* 1 */}
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

            {/* 2 */}
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

            {/* 3 */}
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

        {/* Steps */}
        {step === "upload" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                อัปโหลดไฟล์ Excel
              </h3>
              <FileUploader
                onSelect={(f) => {
                  setExcelFile(f);
                  setExcelName(f.name);
                  setPdfName(f.name.replace(/\.[^/.]+$/, ".pdf"));
                }}
              />
              {excelFile && (
                <p className="mt-2 text-sm text-emerald-700">
                  ✓ เลือกแล้ว:{" "}
                  <span className="font-semibold">{excelFile.name}</span>
                </p>
              )}
            </div>

            {excelFile && (
              <div className="flex items-center gap-3">
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
            )}
          </div>
        )}

        {step === "convert" && (
          <div className="mb-6">
            <ConvertProgress fileName={excelFile?.name} />
          </div>
        )}

        {step === "success" && (
          <div className="mb-6">
            <ConvertSuccess
              originalName={excelName}
              pdfName={pdfName || "output.pdf"}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M12 18.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">คำแนะนำ</h4>
            <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
              <li>
                ผลลัพธ์อาจไม่เหมือน Excel 100%
                โดยเฉพาะไฟล์ที่มีสูตร/กราฟ/รูปจำนวนมาก
              </li>
              <li>
                ถ้าข้อมูลเป็นภาษาไทยมาก แนะนำใช้ฟอนต์เว็บ (@font-face)
                บนหน้าเพื่อให้ html2canvas แคปได้ถูกต้อง
              </li>
              <li>
                ถ้าตารางกว้าง ให้ลดฟอนต์ใน Excel/จัดหน้า หรือเพิ่ม{" "}
                <code>orientation: </code> ตอนแปลง
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
