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
import { saveTemplate as saveTemplateApi } from "@/api/templateService";
import { useAuthStore } from "@/stores/auth";
import { CreateTemplateDto } from "@/types/template";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ToastHub } from "@/components/ui/toast-hub";

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

export default function AdminExportPage() {
  // Auth state
  const { user, accessToken } = useAuthStore();
  const isAdmin = user?.role === "admin";

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
        String(field || "").toLowerCase().includes(q)
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
              rows: sheet.rows.map((row) => ({ ...row, selected: !allSelected })),
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
    const today = new Date().toISOString().split('T')[0];

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
              rows: sheet.rows.filter((row) => row.id !== id).map((row, idx) => ({
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
      toast.error(`เกิดข้อผิดพลาดในการบันทึก: ${error instanceof Error ? error.message : "Unknown error"}`);
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
          const partialMatch = headers.findIndex((h) => norm(h).includes(norm(col)));
          if (partialMatch >= 0) idx[col] = partialMatch;
        }
      });

      // Helper function to parse date and convert to YYYY-MM-DD format
      const parseDate = (dateStr: string): string => {
        if (!dateStr || dateStr.trim() === "") {
          // Return today's date as default
          const today = new Date();
          return today.toISOString().split('T')[0];
        }

        // Try to parse the date
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }

        // If parsing fails, return today's date
        const today = new Date();
        return today.toISOString().split('T')[0];
      };

      // Create DataRow objects with proper structure
      const filteredRows: DataRow[] = rows.map((r, rowIndex) => ({
        id: `${name}-row-${rowIndex}`,
        no: rowIndex + 1,
        sequence: Number(idx["Sequence"] >= 0 ? r[idx["Sequence"]] : rowIndex + 1) || rowIndex + 1,
        label_on_web_th: String(idx["Label on Web (TH)"] >= 0 ? r[idx["Label on Web (TH)"]] : ""),
        label_on_web_th_description: idx["Label on Web (TH) Description"] >= 0 ? String(r[idx["Label on Web (TH) Description"]] || "") : undefined,
        label_on_web_en: String(idx["Label on Web (EN)"] >= 0 ? r[idx["Label on Web (EN)"]] : ""),
        application_form_status: String(idx["Application Form Status"] >= 0 ? r[idx["Application Form Status"]] : ""),
        start_date: parseDate(String(idx["Start Date"] >= 0 ? r[idx["Start Date"]] : "")),
        end_date: parseDate(String(idx["End Date"] >= 0 ? r[idx["End Date"]] : "")),
        date_description: idx["Date Description"] >= 0 ? String(r[idx["Date Description"]] || "") : undefined,
        current_stage: (idx["Current Stage"] >= 0 && String(r[idx["Current Stage"]]).toLowerCase() === "yes") ? "Yes" : "No",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6 md:p-8">
      <header className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Excel → Preview & Export
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-600 mt-1">
          อัปโหลด Excel แล้วพรีวิวเฉพาะ 7 คอลัมน์สำคัญ พร้อมค้นหาและแบ่งหน้า
          — Export เป็น Excel ที่ Format สวยงาม
        </motion.p>
      </header>

      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="max-w-4xl mx-auto">
            <Dropzone onPick={handlePick} />
            <div className="mt-4 text-xs text-slate-500">
              เคล็ดลับ: แนะนำให้มีแถวหัวคอลัมน์ชัดเจน ระบบจะจับเป็น header
              อัตโนมัติ
            </div>
          </motion.div>
        )}

        {step === "loaded" && currentSheet && (
          <motion.div
            key="loaded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4">
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 justify-between">
                <SheetTabs
                  sheets={sheets.map((s) => s.name)}
                  current={current}
                  onChange={(n) => setCurrent(n)}
                />
              </div>
              <div className="mt-4">
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
    </div>
  );
}
