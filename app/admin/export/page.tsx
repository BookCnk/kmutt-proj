"use client";

import React from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { DataRow, SheetMatrix, Step, ExportConfig } from "./types";
import {
  Dropzone,
  SheetTabs,
  Toolbar,
  ExportDialog,
  SaveTemplateDialog,
  DataTable,
  ExportFormat,
} from "@/components/export";
import { exportToStyledExcel, exportToStyledPdf } from "./exportExcel";
import {
  saveTemplate as saveTemplateApi,
  getTemplates,
} from "@/api/templateService";
import { useAuthStore } from "@/stores/auth";
import { CreateTemplateDto } from "@/types/template";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ToastHub } from "@/components/ui/toast-hub";
import { TemplateTable } from "./TemplateTable";
import { ArrowLeft, FileSpreadsheet, Sparkles } from "lucide-react";

/**
 * Excel → Web Preview with Export Feature
 *
 * Features:
 * - Upload Excel files (.xlsx/.xls)
 * - Auto-detect header row
 * - Filter to show only 7 required columns
 * - Drag-and-drop row reordering
 * - Select/deselect rows for export
 * - Export to styled Excel with KMUTT branding
 *
 * @see /lib/exportFancy.ts - Original export implementation reference
 */

// Utilities for Excel parsing
function toMatrix(ws: XLSX.WorkSheet): string[][] {
  const A = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown as string[][];

  const merges: XLSX.Range[] = (ws["!merges"] || []) as XLSX.Range[];
  merges.forEach((m) => {
    const v = A[m.s.r]?.[m.s.c] ?? "";
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (!A[r]) A[r] = [] as any;
        A[r][c] = v;
      }
    }
  });

  return A || [];
}

function firstNonEmptyRowIndex(A: string[][]): number {
  return Math.max(
    0,
    A.findIndex((r) => r.some((c) => String(c).trim() !== ""))
  );
}

function parseSheet(ws: XLSX.WorkSheet): {
  headers: string[];
  rows: (string | number)[][];
} {
  const A = toMatrix(ws);
  if (!A.length) return { headers: [], rows: [] };

  const headerIdx = firstNonEmptyRowIndex(A);
  const headers = (A[headerIdx] || []).map(String);

  const body = A.slice(headerIdx + 1).filter((r) =>
    r.some((c) => String(c).trim() !== "")
  );
  return { headers, rows: body };
}
type UploadFormat = "v1" | "v2";

export default function AdminExportPage() {
  // Auth state
  const { user, accessToken } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [uploadFormat, setUploadFormat] = React.useState<UploadFormat>("v1");

  const [templates, setTemplates] = React.useState<any[]>([]);

  // File state
  const [step, setStep] = React.useState<Step>("idle");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [sheets, setSheets] = React.useState<SheetMatrix[]>([]);
  const [current, setCurrent] = React.useState<string>("");

  // UI state
  const [search, setSearch] = React.useState("");
  const [perPage, setPerPage] = React.useState(20);
  const [page, setPage] = React.useState(1);
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const currentSheet = sheets.find((s) => s.name === current) || sheets[0];

  const filteredRows = React.useMemo(() => {
    if (!currentSheet) return [] as DataRow[];
    if (!search.trim()) return currentSheet.rows;
    const q = search.toLowerCase();
    return currentSheet.rows.filter((r) => {
      const searchableFields = [
        r.label_on_web_th,
        r.label_on_web_th_description,
        r.label_on_web_en,
        r.application_form_status,
        r.start_date,
        r.end_date,
        r.date_description,
        r.current_stage,
        r.sequence.toString(),
      ];
      return searchableFields.some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [search, currentSheet]);

  React.useEffect(() => setPage(1), [search, current]);

  // Handler to reorder rows
  const handleReorder = (newRows: DataRow[]) => {
    setSheets((prevSheets) =>
      prevSheets.map((sheet) =>
        sheet.name === current ? { ...sheet, rows: newRows } : sheet
      )
    );
  };

  const loadTemplates = React.useCallback(async () => {
    try {
      const res = await getTemplates();

      const items = (res as any)?.data;
      setTemplates(items);
      console.log("Loaded templates:", items);
    } catch (error) {
      console.error("Failed to load templates", error);
      toast.error("โหลด Template ไม่สำเร็จ");
    }
  }, []);

  React.useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Handler to toggle individual row selection
  const handleToggleSelect = (id: string) => {
    setSheets((prevSheets) =>
      prevSheets.map((sheet) =>
        sheet.name === current
          ? {
              ...sheet,
              rows: sheet.rows.map((row) =>
                row.id === id ? { ...row, selected: !row.selected } : row
              ),
            }
          : sheet
      )
    );
  };

  // Handler to toggle all rows selection
  const handleToggleAll = () => {
    if (!currentSheet) return;
    const allSelected = currentSheet.rows.every((r) => r.selected);
    setSheets((prevSheets) =>
      prevSheets.map((sheet) =>
        sheet.name === current
          ? {
              ...sheet,
              rows: sheet.rows.map((row) => ({
                ...row,
                selected: !allSelected,
              })),
            }
          : sheet
      )
    );
  };

  // Handler to update row data
  const handleUpdateRow = (id: string, updates: Partial<DataRow>) => {
    setSheets((prevSheets) =>
      prevSheets.map((sheet) =>
        sheet.name === current
          ? {
              ...sheet,
              rows: sheet.rows.map((row) =>
                row.id === id ? { ...row, ...updates } : row
              ),
            }
          : sheet
      )
    );
  };

  // Handler to add new row
  const handleAddRow = () => {
    if (!currentSheet) return;

    const newRowNumber = currentSheet.rows.length + 1;
    const today = new Date().toISOString().split("T")[0];

    const newRow: DataRow = {
      id: `${current}-row-${Date.now()}`,
      no: newRowNumber,
      sequence: newRowNumber,
      label_on_web_th: "",
      label_on_web_th_description: undefined,
      label_on_web_en: "",
      application_form_status: "",
      start_date: today,
      end_date: today,
      date_description: undefined,
      current_stage: "No",
      selected: true,
    };

    setSheets((prevSheets) =>
      prevSheets.map((sheet) =>
        sheet.name === current
          ? { ...sheet, rows: [...sheet.rows, newRow] }
          : sheet
      )
    );
  };

  // Handler to delete row
  const handleDeleteRow = (id: string) => {
    setSheets((prevSheets) =>
      prevSheets.map((sheet) =>
        sheet.name === current
          ? {
              ...sheet,
              rows: sheet.rows
                .filter((row) => row.id !== id)
                .map((row, idx) => ({
                  ...row,
                  no: idx + 1,
                  // Optionally update sequence numbers
                  sequence: idx + 1,
                })),
            }
          : sheet
      )
    );
  };

  // Handler to open save dialog
  const handleSaveClick = () => {
    if (!isAdmin || !currentSheet) {
      alert("คุณไม่มีสิทธิ์ในการบันทึกข้อมูล");
      return;
    }
    setShowSaveDialog(true);
  };

  // Handler to confirm save to database (admin only)
  const handleSaveConfirm = async (title: string) => {
    if (!currentSheet) return;

    setIsSaving(true);
    try {
      const payload: CreateTemplateDto = {
        title,
        contents: currentSheet.rows.map((row) => ({
          no: row.no,
          sequence: row.sequence,
          label_on_web_th: {
            label: row.label_on_web_th,
            description: row.label_on_web_th_description,
          },
          label_on_web_en: row.label_on_web_en,
          application_form_status: row.application_form_status,
          date: {
            start_date: row.start_date,
            end_date: row.end_date,
            description: row.date_description,
          },
          current_stage: row.current_stage,
          export: row.selected,
        })),
      };

      await saveTemplateApi(payload);
      toast.success("บันทึกข้อมูลสำเร็จ!");
    } catch (error) {
      toast.error(
        `เกิดข้อผิดพลาดในการบันทึก: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setShowSaveDialog(false);
      setIsSaving(false);
    }
  };

  // Handler to open export dialog
  const handleExportClick = () => {
    if (!currentSheet) return;
    const selectedCount = currentSheet.rows.filter((r) => r.selected).length;
    if (selectedCount === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 แถวเพื่อ Export");
      return;
    }
    setShowExportDialog(true);
  };

  // Handler to confirm export
  const handleExportConfirm = (config: ExportConfig, format: ExportFormat) => {
    if (!currentSheet) return;
    // Pass empty array for headers as they're not used in the new structure
    if (format === "excel") {
      exportToStyledExcel(currentSheet.rows, [], config);
    } else if (format === "pdf") {
      exportToStyledPdf(currentSheet.rows, [], config);
    }
    setShowExportDialog(false);
  };

  const handlePick = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);

    const parsed: SheetMatrix[] = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const { headers, rows } = parseSheet(ws);

      // Map column names to indices
      const wanted = [
        "Sequence",
        "Label on Web (TH)",
        "Label on Web (TH) Description",
        "Label on Web (EN)",
        "Application Form Status",
        "Start Date",
        "End Date",
        "Date Description",
        "Current Stage",
      ];

      const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

      const idx: Record<string, number> = {};
      wanted.forEach((col) => {
        const i = headers.findIndex((h) => norm(h) === norm(col));
        if (i >= 0) {
          idx[col] = i;
        } else {
          const partialMatch = headers.findIndex((h) =>
            norm(h).includes(norm(col))
          );
          if (partialMatch >= 0) idx[col] = partialMatch;
        }
      });

      // Helper function to parse date and convert to YYYY-MM-DD format
      const parseDate = (dateStr: string): string => {
        if (!dateStr || dateStr.trim() === "") {
          // Return today's date as default
          const today = new Date();
          return today.toISOString().split("T")[0];
        }

        // Try to parse the date
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split("T")[0];
        }

        // If parsing fails, return today's date
        const today = new Date();
        return today.toISOString().split("T")[0];
      };

      // Create DataRow objects with proper structure
      const filteredRows: DataRow[] = rows.map((r, rowIndex) => ({
        id: `${name}-row-${rowIndex}`,
        no: rowIndex + 1,
        sequence:
          Number(idx["Sequence"] >= 0 ? r[idx["Sequence"]] : rowIndex + 1) ||
          rowIndex + 1,
        label_on_web_th: String(
          idx["Label on Web (TH)"] >= 0 ? r[idx["Label on Web (TH)"]] : ""
        ),
        label_on_web_th_description:
          idx["Label on Web (TH) Description"] >= 0
            ? String(r[idx["Label on Web (TH) Description"]] || "")
            : undefined,
        label_on_web_en: String(
          idx["Label on Web (EN)"] >= 0 ? r[idx["Label on Web (EN)"]] : ""
        ),
        application_form_status: String(
          idx["Application Form Status"] >= 0
            ? r[idx["Application Form Status"]]
            : ""
        ),
        start_date: parseDate(
          String(idx["Start Date"] >= 0 ? r[idx["Start Date"]] : "")
        ),
        end_date: parseDate(
          String(idx["End Date"] >= 0 ? r[idx["End Date"]] : "")
        ),
        date_description:
          idx["Date Description"] >= 0
            ? String(r[idx["Date Description"]] || "")
            : undefined,
        current_stage:
          idx["Current Stage"] >= 0 &&
          String(r[idx["Current Stage"]]).toLowerCase() === "yes"
            ? "Yes"
            : "No",
        selected: true, // Default: all rows selected for export
      }));

      return { name, headers: wanted, rows: filteredRows };
    });

    setSheets(parsed);
    setCurrent(parsed[0]?.name || "");
    setStep("loaded");
  };

  const onReset = () => {
    setStep("idle");
    setFileName(null);
    setSheets([]);
    setCurrent("");
    setSearch("");
    setPerPage(20);
    setPage(1);
  };

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 py-6 md:py-10">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <button
            onClick={handleBackToHome}
            className="group flex items-center gap-2 text-emerald-700 hover:text-emerald-900 transition-colors mb-6 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">กลับหน้าหลัก</span>
          </button>

          <div className="flex items-center gap-4 mb-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Excel Manager
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-700 font-medium">
                  จัดการและส่งออกข้อมูล Excel แบบมืออาชีพ
                </p>
              </div>
            </div>
          </div>
          <p className="text-slate-600 text-sm max-w-2xl">
            อัปโหลด Excel ไฟล์ของคุณ พรีวิวข้อมูลที่สำคัญ ค้นหา แก้ไข
            และส่งออกเป็นเอกสารที่สวยงามพร้อมใช้งาน
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-emerald-100">
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Upload Format
                  </label>

                  <select
                    value={uploadFormat}
                    onChange={(e) =>
                      setUploadFormat(e.target.value as UploadFormat)
                    }
                    className="w-full sm:w-64 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                    <option value="v1">Template V1 (เดิม)</option>
                    <option value="v2">Template V2 (ใหม่)</option>
                  </select>

                  <span className="text-xs text-slate-500 sm:ml-2">
                    เลือกฟอร์แมตก่อนอัปโหลดไฟล์
                  </span>
                </div>

                <Dropzone onPick={handlePick} />
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    เคล็ดลับ: แนะนำให้ไฟล์ Excel มีแถวหัวคอลัมน์ที่ชัดเจน
                    ระบบจะตรวจจับและแสดงผลอัตโนมัติ
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === "loaded" && currentSheet && (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6">
              <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
                  <SheetTabs
                    sheets={sheets.map((s) => s.name)}
                    current={current}
                    onChange={(n) => setCurrent(n)}
                  />
                </div>
                <div className="p-6">
                  <Toolbar
                    search={search}
                    setSearch={setSearch}
                    perPage={perPage}
                    setPerPage={setPerPage}
                    onReset={onReset}
                    fileName={fileName}
                    onExport={handleExportClick}
                    onSave={handleSaveClick}
                    selectedCount={
                      currentSheet?.rows.filter((r) => r.selected).length || 0
                    }
                    isAdmin={isAdmin}
                    isSaving={isSaving}
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl overflow-hidden">
                <DataTable
                  rows={filteredRows}
                  page={page}
                  setPage={setPage}
                  perPage={perPage}
                  onReorder={handleReorder}
                  onToggleSelect={handleToggleSelect}
                  onToggleAll={handleToggleAll}
                  onUpdateRow={handleUpdateRow}
                  onAddRow={handleAddRow}
                  onDeleteRow={handleDeleteRow}
                  isAdmin={isAdmin}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Dialog */}
        <AnimatePresence>
          {showExportDialog && (
            <ExportDialog
              isOpen={showExportDialog}
              onClose={() => setShowExportDialog(false)}
              onConfirm={handleExportConfirm}
              selectedCount={
                currentSheet?.rows.filter((r) => r.selected).length || 0
              }
            />
          )}
        </AnimatePresence>

        {/* Save Template Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <SaveTemplateDialog
              isOpen={showSaveDialog}
              onClose={() => setShowSaveDialog(false)}
              onConfirm={handleSaveConfirm}
              defaultTitle={current || ""}
              rowCount={currentSheet?.rows.length || 0}
              isSaving={isSaving}
            />
          )}
        </AnimatePresence>

        {/* Template Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-2.5 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
              Templates ที่บันทึกไว้
            </h2>
          </div>
          <TemplateTable />
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
