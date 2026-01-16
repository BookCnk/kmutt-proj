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
  duplicateTemplate,
} from "@/api/templateService";
import { useAuthStore } from "@/stores/auth";
import { CreateTemplateDto } from "@/types/template";
import { toast } from "sonner";
import { TemplateTable } from "./TemplateTable";
import {
  ArrowLeft,
  FileSpreadsheet,
  Sparkles,
  Copy,
  Loader2,
} from "lucide-react";

import type { ColumnDef } from "@/components/export/DataTable";
import { EditableCell } from "@/components/export/EditableCell";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * Excel → Web Preview with Export Feature
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
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [uploadFormat, setUploadFormat] = React.useState<UploadFormat>("v1");
  const [templates, setTemplates] = React.useState<any[]>([]);

  const [step, setStep] = React.useState<Step>("idle");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [sheets, setSheets] = React.useState<SheetMatrix[]>([]);
  const [current, setCurrent] = React.useState<string>("");

  const [search, setSearch] = React.useState("");
  const [perPage, setPerPage] = React.useState(20);
  const [page, setPage] = React.useState(1);
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // ✅ Copy modal at Parent
  const [copyTarget, setCopyTarget] = React.useState<{
    _id: string;
    title: string;
  } | null>(null);
  const [copyLoading, setCopyLoading] = React.useState(false);
  const [templateRefreshSignal, setTemplateRefreshSignal] = React.useState(0);

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
        r.sequence?.toString(),
      ];
      return searchableFields.some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [search, currentSheet]);

  React.useEffect(() => setPage(1), [search, current]);

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
      // ✅ text field
      date_description: "",
      current_stage: "No",
      selected: true,
      // ✅ checkbox only
      show_date_range: true,
    };

    setSheets((prevSheets) =>
      prevSheets.map((sheet) =>
        sheet.name === current
          ? { ...sheet, rows: [...sheet.rows, newRow] }
          : sheet
      )
    );
  };

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
                  sequence: idx + 1,
                })),
            }
          : sheet
      )
    );
  };

  // ✅ V1 columns (ไม่ยุ่ง)
  const columnsV1: ColumnDef<DataRow>[] = [
    {
      key: "sequence",
      header: "Sequence",
      className: "min-w-[8ch]",
      render: (row) => (
        <div className="px-3 py-2 text-slate-700 font-semibold bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-lg shadow-sm text-center">
          {row.sequence}
        </div>
      ),
    },
    {
      key: "label_th",
      header: "Label on Web (TH)",
      className: "min-w-[20ch]",
      render: (row) => (
        <div className="space-y-2">
          <EditableCell
            value={row.label_on_web_th}
            onChange={(val) =>
              handleUpdateRow(row.id, { label_on_web_th: String(val) })
            }
            required
            className="text-lg"
          />
          <div className="pt-1">
            <EditableCell
              value={row.label_on_web_th_description || ""}
              onChange={(val) =>
                handleUpdateRow(row.id, {
                  label_on_web_th_description: String(val),
                })
              }
              type="textarea"
              rows={2}
              placeholder="คำอธิบาย Label on Web (TH)..."
              className="text-lg text-slate-600"
            />
          </div>
        </div>
      ),
    },
    {
      key: "label_en",
      header: "Label on Web (EN)",
      className: "min-w-[20ch]",
      render: (row) => (
        <EditableCell
          value={row.label_on_web_en}
          onChange={(val) =>
            handleUpdateRow(row.id, { label_on_web_en: String(val) })
          }
          required
          className="text-lg"
        />
      ),
    },
    {
      key: "app_status",
      header: "Application Form Status",
      className: "min-w-[22ch]",
      render: (row) => (
        <EditableCell
          value={row.application_form_status || ""}
          onChange={(val) =>
            handleUpdateRow(row.id, {
              application_form_status: String(val),
            })
          }
          placeholder="เช่น Open / Close / Pending..."
          className="text-lg"
        />
      ),
    },
    {
      key: "dates",
      header: "Dates",
      className: "min-w-[20ch]",
      render: (row) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <label className="w-full text-base text-slate-500 mb-1 block">
                Start Date
              </label>
              <EditableCell
                value={row.start_date}
                onChange={(val) =>
                  handleUpdateRow(row.id, { start_date: String(val) })
                }
                type="date"
                required
                className="text-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-full text-base text-slate-500 mb-1 block">
                End Date
              </label>
              <EditableCell
                value={row.end_date}
                onChange={(val) =>
                  handleUpdateRow(row.id, { end_date: String(val) })
                }
                type="date"
                required
                className="text-lg"
              />
            </div>
          </div>

          {/* ✅ date_description = text input */}
          <div className="pt-1">
            <EditableCell
              value={row.date_description || ""}
              onChange={(val) =>
                handleUpdateRow(row.id, { date_description: String(val) })
              }
              type="textarea"
              rows={2}
              placeholder="คำอธิบายวันที่..."
              className="text-lg text-slate-600"
            />
          </div>
        </div>
      ),
    },
  ];

  // ✅ V2 columns: แก้ให้ date_description เป็น text + show_date_range เป็น checkbox เท่านั้น
  const columnsV2: ColumnDef<DataRow>[] = [
    {
      key: "sequence",
      header: "Sequence",
      className: "min-w-[8ch]",
      render: (row) => (
        <div className="px-3 py-2 text-slate-700 font-semibold bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-lg shadow-sm text-center">
          {row.sequence}
        </div>
      ),
    },
    {
      key: "label_th",
      header: "Label on Web (TH)",
      className: "min-w-[26ch]",
      render: (row) => (
        <div className="space-y-2">
          <EditableCell
            value={row.label_on_web_th}
            onChange={(val) =>
              handleUpdateRow(row.id, { label_on_web_th: String(val) })
            }
            required
            className="text-lg"
          />

          <EditableCell
            value={row.label_on_web_th_description || ""}
            onChange={(val) =>
              handleUpdateRow(row.id, {
                label_on_web_th_description: String(val),
              })
            }
            type="textarea"
            rows={2}
            placeholder="Description..."
            className="text-lg text-slate-600"
          />
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      className: "min-w-[32ch]",
      render: (row) => (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-slate-500">Start Date</label>
              <EditableCell
                value={row.start_date}
                onChange={(val) =>
                  handleUpdateRow(row.id, { start_date: String(val) })
                }
                type="date"
                className="text-lg"
              />
            </div>

            <div>
              <label className="text-sm text-slate-500">End Date</label>
              <EditableCell
                value={row.end_date}
                onChange={(val) =>
                  handleUpdateRow(row.id, { end_date: String(val) })
                }
                type="date"
                className="text-lg"
              />
            </div>
          </div>

          {/* ✅ show_date_range = checkbox only */}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={row.show_date_range ?? false}
              onChange={(e) =>
                handleUpdateRow(row.id, { show_date_range: e.target.checked })
              }
            />
            Show range
          </label>

          {/* ✅ date_description = text input (แยกจาก checkbox) */}
          <EditableCell
            value={row.date_description || ""}
            onChange={(val) =>
              handleUpdateRow(row.id, { date_description: String(val) })
            }
            type="textarea"
            rows={2}
            placeholder="Date description..."
            className="text-lg text-slate-600"
          />
        </div>
      ),
    },
  ];

  const columns = uploadFormat === "v2" ? columnsV2 : columnsV1;

  const handleSaveClick = () => {
    if (!isAdmin || !currentSheet) {
      alert("คุณไม่มีสิทธิ์ในการบันทึกข้อมูล");
      return;
    }
    setShowSaveDialog(true);
  };

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
            // ✅ ส่ง text ที่พิมพ์เอง
            description: row.date_description,
            // ✅ checkbox boolean เท่านั้น
            show_range: !!row.show_date_range,
          },
          current_stage: row.current_stage,
          export: row.selected,
        })),
      };

      await saveTemplateApi(payload);
      toast.success("บันทึกข้อมูลสำเร็จ!");
      setTemplateRefreshSignal((x) => x + 1); // ✅ ให้ table reload
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

  const handleExportClick = () => {
    if (!currentSheet) return;
    const selectedCount = currentSheet.rows.filter((r) => r.selected).length;
    if (selectedCount === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 แถวเพื่อ Export");
      return;
    }
    setShowExportDialog(true);
  };

  const handleExportConfirm = (config: ExportConfig, format: ExportFormat) => {
    if (!currentSheet) return;

    const selectedRows = currentSheet.rows.filter((r) => r.selected);
    if (selectedRows.length === 0) return;

    if (format === "excel") exportToStyledExcel(selectedRows, [], config);
    if (format === "pdf") exportToStyledPdf(selectedRows, [], config);

    setShowExportDialog(false);
  };

  const handlePick = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);

    const defaultDateDescBySequence: Record<number, string> = {
      4: "(หากพ้นกำหนดจะถือว่าสละสิทธิในการเข้าสอบ)",
      6: "(กำหนดการอาจมีการเปลี่ยนแปลง)",
      9: "(กรณีผ่านการคัดเลือกมากกว่า 1 สาขาวิชา/โครงการ ต้องสละสิทธิการเข้าศึกษาในสาขาวิชา/โครงการที่ไม่ประสงค์จะเข้าศึกษา ทั้งนี้ เพื่อสำรองที่นั่งให้กับผู้ผ่านการคัดเลือกอันดับสำรอง)",
      10: "(ถ้าไม่ยืนยันสิทธิ จะถือว่าไม่ต้องการใช้สิทธิเข้าศึกษา จะขอสิทธิเข้าศึกษาในภายหลังไม่ได้)",
      12: "(หากพ้นกำหนดจะถือว่าไม่มีสิทธิในการเข้าศึกษา)",
    };

    const parsed: SheetMatrix[] = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const { headers, rows } = parseSheet(ws);

      const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

      const findIdx = (col: string) =>
        headers.findIndex((h) => norm(h) === norm(col));

      const findIdxStartsWith = (prefix: string) =>
        headers.findIndex((h) => norm(h).startsWith(norm(prefix)));

      const idx = {
        sequence: findIdx("Sequence"),
        nameHeader: findIdxStartsWith("Name (TH)"),
        labelTh: findIdx("Label on Web (TH)"),
        labelThDescV1: findIdx("Label on Web (TH) Description"),
        descV2: findIdx("Description"),
        labelEn: findIdx("Label on Web (EN)"),
        appStatus: findIdx("Application Form Status"),
        start: findIdx("Start Date"),
        end: findIdx("End Date"),
        // ✅ support date_description from file (optional)
        dateDesc: findIdx("Date Description"),
      };

      const parseDate = (v: string) => {
        if (!v) return "";
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      };

      const filteredRows: DataRow[] = rows.map((r, i) => {
        const seq = Number(r[idx.sequence]) || i + 1;

        const fromFile =
          idx.dateDesc >= 0 ? String(r[idx.dateDesc] || "").trim() : "";

        const hardcoded = defaultDateDescBySequence[seq] ?? "";

        return {
          id: `${name}-row-${i}`,

          nameHeader:
            idx.nameHeader >= 0 ? String(r[idx.nameHeader] || "") : "",

          no: i + 1,
          sequence: seq,

          label_on_web_th: String(r[idx.labelTh] || ""),

          label_on_web_th_description:
            uploadFormat === "v2"
              ? String(r[idx.descV2] || "")
              : String(r[idx.labelThDescV1] || ""),

          label_on_web_en: idx.labelEn >= 0 ? String(r[idx.labelEn] || "") : "",

          application_form_status:
            idx.appStatus >= 0 ? String(r[idx.appStatus] || "") : "",

          start_date: parseDate(String(r[idx.start] || "")),
          end_date: parseDate(String(r[idx.end] || "")),

          show_date_range: true,

          date_description: fromFile || hardcoded,

          current_stage: "No",
          selected: true,
        };
      });

      return { name, headers, rows: filteredRows };
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

  const firstRowForExport = React.useMemo(() => {
    if (!currentSheet) return null;
    return (
      currentSheet.rows.find((r) => r.selected) ??
      currentSheet.rows?.[0] ??
      null
    );
  }, [currentSheet]);

  // ✅ parent รับ event จาก TemplateTable
  const handleOpenCopyModal = (tpl: { _id: string; title: string }) => {
    setCopyTarget({ _id: tpl._id, title: tpl.title });
  };

  const confirmCopyTemplate = async () => {
    if (!copyTarget) return;
    try {
      setCopyLoading(true);
      await duplicateTemplate(copyTarget._id);
      toast.success(`คัดลอก Template "${copyTarget.title}" สำเร็จ`);
      setCopyTarget(null);
      setTemplateRefreshSignal((x) => x + 1); // ✅ ให้ table reload
    } catch (err: any) {
      console.error("Failed to copy template", err);
      toast.error(
        err?.message || `คัดลอก Template "${copyTarget.title}" ไม่สำเร็จ`
      );
    } finally {
      setCopyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 py-6 md:py-10">
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

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      Upload Format
                    </span>

                    <select
                      value={uploadFormat}
                      onChange={(e) =>
                        setUploadFormat(e.target.value as UploadFormat)
                      }
                      className="w-full sm:w-64 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                      <option value="v1">Template V1 (เดิม)</option>
                      <option value="v2">Template V2 (ใหม่)</option>
                    </select>

                    <span className="text-xs text-slate-500">
                      เปลี่ยนแล้วหัวตาราง/ช่องข้อมูลจะเปลี่ยนตาม
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl overflow-hidden">
                <DataTable
                  rows={filteredRows}
                  page={page}
                  setPage={setPage}
                  perPage={perPage}
                  columns={columns}
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

        <AnimatePresence>
          {showExportDialog && (
            <ExportDialog
              isOpen={showExportDialog}
              onClose={() => setShowExportDialog(false)}
              onConfirm={handleExportConfirm}
              selectedCount={
                currentSheet?.rows.filter((r) => r.selected).length || 0
              }
              firstRow={firstRowForExport}
            />
          )}
        </AnimatePresence>

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

          {/* ✅ ส่ง onCopy + refreshSignal */}
          <TemplateTable
            onCopy={handleOpenCopyModal}
            refreshSignal={templateRefreshSignal}
          />
        </motion.div>
      </div>

      {/* ✅ Copy modal controlled by Parent */}
      <Dialog
        open={!!copyTarget}
        onOpenChange={(open) => {
          if (!open && !copyLoading) setCopyTarget(null);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการคัดลอก Template</DialogTitle>
            <DialogDescription className="space-y-1">
              <p>
                ต้องการคัดลอก Template{" "}
                <span className="font-semibold text-slate-900">
                  {copyTarget?.title}
                </span>{" "}
                ใช่หรือไม่?
              </p>
              <p className="text-xs text-slate-500">
                ระบบจะสร้างชื่อใหม่อัตโนมัติ (เช่น Copy, Copy 2)
                เพื่อไม่ให้ชื่อซ้ำ
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={copyLoading}
              onClick={() => !copyLoading && setCopyTarget(null)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={confirmCopyTemplate}
              disabled={copyLoading}>
              {copyLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  กำลังคัดลอก...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  คัดลอก
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
