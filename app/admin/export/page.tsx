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
  DataTable,
} from "@/components/export";
import { exportToStyledExcel } from "./exportExcel";
import Link from "next/link";

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

  const currentSheet = sheets.find((s) => s.name === current) || sheets[0];

  const filteredRows = React.useMemo(() => {
    if (!currentSheet) return [] as DataRow[];
    if (!search.trim()) return currentSheet.rows;
    const q = search.toLowerCase();
    return currentSheet.rows.filter((r) =>
      r.data.some((c) => String(c).toLowerCase().includes(q))
    );
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
  const handleExportConfirm = (config: ExportConfig) => {
    if (!currentSheet) return;
    exportToStyledExcel(currentSheet.rows, currentSheet.headers, config);
    setShowExportDialog(false);
  };

  const handlePick = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);

    const parsed: SheetMatrix[] = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const { headers, rows } = parseSheet(ws);

      // Filter to show only 7 required columns
      const wanted = [
        "Sequence",
        "Label on Web (TH)",
        "Label on Web (EN)",
        "Application Form Status",
        "Start Date",
        "End Date",
        "Current Stage",
      ];

      const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

      const idx = wanted.map((col) => {
        const i = headers.findIndex((h) => norm(h) === norm(col));
        return i >= 0
          ? i
          : headers.findIndex((h) => norm(h).includes(norm(col)));
      });

      // Create DataRow objects with unique IDs and selected state
      const filteredRows: DataRow[] = rows.map((r, rowIndex) => ({
        id: `${name}-row-${rowIndex}`,
        data: idx.map((i) => (i >= 0 ? r[i] : "")),
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
    <div className="container mx-auto min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6 md:p-8">
      <header className="mb-6">
        <Link href="/" className="w-full">
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Excel → Preview & Export
          </motion.h1>
        </Link>
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
            className="mx-auto">
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
                  selectedCount={
                    currentSheet?.rows.filter((r) => r.selected).length || 0
                  }
                />
              </div>
            </div>

            <DataTable
              headers={currentSheet.headers}
              rows={filteredRows}
              page={page}
              setPage={setPage}
              perPage={perPage}
              onReorder={handleReorder}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
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
    </div>
  );
}
