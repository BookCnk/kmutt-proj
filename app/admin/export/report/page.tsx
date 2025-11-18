"use client";

import { useState, useEffect } from "react";
import XlsxUploader from "@/components/export/XlsxUploader";
import DataEditor from "@/components/admin/export/DataEditor";
import ReportPreview from "@/components/admin/export/ReportPreview";
import {
  transformCsvData,
  validateCsvData,
} from "@/lib/services/csvTransformService";
import { Major } from "@/lib/types/report.types";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Link from "next/link";

export default function ReportPage() {
  const [xlsxData, setXlsxData] = useState<any[] | null>(null);
  const [structuredData, setStructuredData] = useState<Major[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Function to generate and save PDF
  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const reportElement = document.getElementById("report-preview");
      if (!reportElement) {
        alert("Report preview not found");
        return;
      }

      // Create PDF instance
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Define margins (just for spacing, no headers)
      const margin = 15;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);

      // Get all major sections
      const sections = reportElement.querySelectorAll(".report-major-section");

      if (sections.length === 0) {
        alert("No report sections found");
        return;
      }

      // Process each section separately
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;

        // Capture each section as canvas
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate scaling to fit within content area with margins
        const ratio = contentWidth / (imgWidth / 96 * 25.4); // Convert px to mm
        const scaledHeight = (imgHeight / 96 * 25.4) * ratio;

        // Add new page for subsequent sections
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF with margins
        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          margin,
          contentWidth,
          scaledHeight,
        );
      }

      // Save the PDF
      const fileName = `admissions-report-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Automatically transform Excel data when it's uploaded
  useEffect(() => {
    if (xlsxData) {
      try {
        // Validate the Excel data first
        const validation = validateCsvData(xlsxData);

        if (!validation.valid) {
          setError(`Excel validation failed: ${validation.errors.join(", ")}`);
          setStructuredData(null);
          return;
        }

        // Transform the Excel data into structured format
        const transformed = transformCsvData(xlsxData);

        console.log("Transformed data:", transformed);
        setStructuredData(transformed);
        setError(null);
      } catch (err) {
        console.error("Error transforming Excel data:", err);
        setError(
          "Failed to transform Excel data. Please check the file format.",
        );
        setStructuredData(null);
      }
    }
  }, [xlsxData]);

  return (
    <div className="container mx-auto p-6">
      <Link href="/" className="w-full">
        <h1 className="text-3xl font-bold mb-6">Admissions Report Generator</h1>
      </Link>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {!xlsxData && (
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow">
            <h2 className="text-xl font-semibold mb-4">
              Step 1: Upload Excel File
            </h2>
            <p className="text-gray-600 mb-4">
              Upload your &ldquo;Qualification Subject Group Mappings&ldquo;
              Excel file (.xlsx) to begin.
            </p>
            <XlsxUploader onXlsxLoaded={setXlsxData} />
          </div>
        )}

        {xlsxData && !error && (
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow">
            <h2 className="text-xl font-semibold mb-4">
              Step 2: Review & Edit Data
            </h2>
            {structuredData ? (
              <>
                <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded">
                  <p className="text-green-800">
                    ✓ Excel data transformed successfully! Found{" "}
                    {structuredData.length} major(s).
                  </p>
                </div>
                <p className="text-gray-600 mb-4">
                  The data has been structured and is ready for editing.
                </p>
                <DataEditor
                  structuredData={structuredData}
                  setStructuredData={setStructuredData}
                />
              </>
            ) : (
              <p className="text-gray-600">Processing Excel data...</p>
            )}
          </div>
        )}

        {structuredData && (
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow">
            <h2 className="text-xl font-semibold mb-4">
              Step 3: Preview & Generate PDF
            </h2>
            <p className="text-gray-600 mb-4">
              Review the report preview below and click &ldquo;Generate
              PDF&ldquo; when ready.
            </p>

            <div className="mb-4">
              <ReportPreview structuredData={structuredData} />
            </div>

            <button
              onClick={generatePdf}
              disabled={isGeneratingPdf}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? "Generating PDF..." : "Generate PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
