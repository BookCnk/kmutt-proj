"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, FileSpreadsheet, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getTemplateById, updateTemplate } from "@/api/templateService";
import { useAuthStore } from "@/stores/auth";
import { DataRow, ExportConfig } from "@/app/admin/export/types";

import { DataTable } from "@/components/export/DataTable";
import { Toolbar } from "@/components/export/Toolbar";
import {
  SaveTemplateDialog,
  ExportDialog,
  ExportFormat,
} from "@/components/export";
import { EditableCell } from "@/components/export/EditableCell";
import type { ColumnDef } from "@/components/export/DataTable";

import { CreateTemplateDto } from "@/types/template";
import { exportToStyledExcel, exportToStyledPdf } from "../exportExcel";

type UploadFormat = "v1" | "v2";

type TemplateContent = {
  no?: number;
  sequence?: number;
  label_on_web_th?: {
    label?: string;
    description?: string;
  };
  label_on_web_en?: string;
  application_form_status?: string;
  date?: {
    start_date?: string;
    end_date?: string;
    description?: string;
  };
  current_stage?: string;
  export?: boolean;
};

type TemplateDoc = {
  _id: string;
  title: string;
  contents?: TemplateContent[];
};

function mapTemplateToRows(template: TemplateDoc): DataRow[] {
  const contents: any[] = Array.isArray(template.contents)
    ? template.contents
    : [];
  const today = new Date().toISOString().split("T")[0];

  return contents.map((c, idx) => ({
    id: `${template._id}-row-${idx}`,
    no: c.no ?? idx + 1,
    sequence: c.sequence ?? idx + 1,
    label_on_web_th: c.label_on_web_th?.label ?? "",
    label_on_web_th_description: c.label_on_web_th?.description || undefined,
    label_on_web_en: c.label_on_web_en ?? "",
    application_form_status: c.application_form_status ?? "",
    start_date: c.date?.start_date ?? today,
    end_date: c.date?.end_date ?? today,
    date_description: c.date?.description || undefined,
    current_stage: c.current_stage ?? "No",
    selected: typeof c.export === "boolean" ? c.export : true,
  }));
}

function buildTemplatePayloadFromRows(
  title: string,
  rows: DataRow[]
): CreateTemplateDto {
  return {
    title,
    contents: rows.map((row) => ({
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
}

export default function EditTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [uploadFormat, setUploadFormat] = useState<UploadFormat>("v1");

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState<string>("");
  const [rows, setRows] = useState<DataRow[]>([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const [showExportDialog, setShowExportDialog] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setLoadError("");

    try {
      const res = await getTemplateById(templateId);
      const data: TemplateDoc = (res as any)?.data ?? (res as any);

      setTitle(data.title || "");
      const mapped = mapTemplateToRows(data);
      setRows(mapped);

      // ✅ Auto detect format (best-effort):
      // ถ้าเจอ description แบบ V2 ใช้ v2 (คุณปรับเงื่อนไขได้)
      // ตอนนี้ใช้ heuristic เบา ๆ: ถ้า label_on_web_th_description มีค่าแต่ label_th_desc ชื่อหัวใน V2 ไม่รู้
      // เลยปล่อย default v1
    } catch (err: any) {
      console.error("Failed to load template", err);
      setLoadError(err?.message || "ไม่สามารถโหลด Template นี้ได้");
      toast.error("ไม่สามารถโหลด Template นี้ได้");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (!templateId) return;
    loadTemplate();
  }, [templateId, loadTemplate]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();

    return rows.filter((r) => {
      const fields = [
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
      return fields.some((f) =>
        String(f || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [rows, search]);

  useEffect(() => setPage(1), [search]);

  const selectedCount = useMemo(
    () => rows.filter((r) => r.selected).length,
    [rows]
  );

  // === handlers ===
  const handleReorder = (newRows: DataRow[]) => {
    // เหมือนหน้าใหญ่: reorder เฉพาะลำดับ
    setRows(newRows);
  };

  const handleToggleSelect = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleToggleAll = () => {
    setRows((prev) => {
      const allSelected = prev.length > 0 && prev.every((r) => r.selected);
      return prev.map((r) => ({ ...r, selected: !allSelected }));
    });
  };

  const handleUpdateRow = (id: string, updates: Partial<DataRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleAddRow = () => {
    const today = new Date().toISOString().split("T")[0];
    const newRowNumber = rows.length + 1;

    const newRow: DataRow = {
      id: `local-row-${Date.now()}`,
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

    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) =>
      prev
        .filter((r) => r.id !== id)
        .map((r, idx) => ({
          ...r,
          no: idx + 1,
          sequence: idx + 1,
        }))
    );
  };

  const handleReset = () => {
    setSearch("");
    setPage(1);
    loadTemplate();
  };

  const handleExport = () => {
    if (selectedCount === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 แถวเพื่อ Export");
      return;
    }
    setShowExportDialog(true);
  };

  const handleExportConfirm = (config: ExportConfig, format: ExportFormat) => {
    const selectedRows = rows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 แถวเพื่อ Export");
      return;
    }

    try {
      if (format === "excel") exportToStyledExcel(selectedRows, [], config);
      if (format === "pdf") exportToStyledPdf(selectedRows, [], config);
      setShowExportDialog(false);
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Export ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleSaveClick = () => {
    if (!isAdmin) {
      toast.error("คุณไม่มีสิทธิ์บันทึก Template");
      return;
    }
    if (!templateId) {
      toast.error("ไม่พบรหัส Template");
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async (newTitle: string) => {
    if (!isAdmin) {
      toast.error("คุณไม่มีสิทธิ์บันทึก Template");
      return;
    }
    if (!templateId) {
      toast.error("ไม่พบรหัส Template");
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildTemplatePayloadFromRows(newTitle, rows);
      await updateTemplate(templateId, payload);

      setTitle(newTitle);
      toast.success("บันทึก Template สำเร็จ");
      setShowSaveDialog(false);
    } catch (err: any) {
      console.error("Failed to update template", err);
      toast.error(
        err?.message ||
          "เกิดข้อผิดพลาดในการบันทึก Template กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ columns เหมือนหน้า AdminExportPage (V1/V2)
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
            handleUpdateRow(row.id, { application_form_status: String(val) })
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

  const columnsV2: ColumnDef<DataRow>[] = [
    {
      key: "name_th",
      header: "Name (TH)",
      className: "min-w-[20ch]",
      render: (row) => (
        <EditableCell
          value={row.label_on_web_th}
          onChange={(val) =>
            handleUpdateRow(row.id, { label_on_web_th: String(val) })
          }
          required
          className="text-lg"
        />
      ),
    },
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
        <EditableCell
          value={row.label_on_web_th}
          onChange={(val) =>
            handleUpdateRow(row.id, { label_on_web_th: String(val) })
          }
          required
          className="text-lg"
        />
      ),
    },
    {
      key: "desc",
      header: "Description",
      className: "min-w-[20ch]",
      render: (row) => (
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
      ),
    },
    {
      key: "start",
      header: "Start Date",
      className: "min-w-[14ch]",
      render: (row) => (
        <EditableCell
          value={row.start_date}
          onChange={(val) =>
            handleUpdateRow(row.id, { start_date: String(val) })
          }
          type="date"
          required
          className="text-lg"
        />
      ),
    },
    {
      key: "end",
      header: "End Date",
      className: "min-w-[14ch]",
      render: (row) => (
        <EditableCell
          value={row.end_date}
          onChange={(val) => handleUpdateRow(row.id, { end_date: String(val) })}
          type="date"
          required
          className="text-lg"
        />
      ),
    },
  ];

  const columns = uploadFormat === "v2" ? columnsV2 : columnsV1;

  if (!templateId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            ไม่พบ Template ที่ต้องการแก้ไข
          </h1>
          <p className="text-slate-600 text-sm">
            กรุณากลับไปหน้า Export แล้วเลือก Template จากตารางด้านล่าง (ปุ่ม
            Edit)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10 py-6 md:py-10">
        {/* Header same vibe as main page */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-emerald-700 hover:text-emerald-900 transition-colors mb-6 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">กลับหน้าก่อนหน้า</span>
          </button>

          <div className="flex items-center gap-4 mb-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Edit Template
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <p className="text-emerald-700 font-medium">
                  แก้ไข Template:{" "}
                  <span className="font-semibold">{title || "..."}</span>
                </p>
              </div>
            </div>
          </div>

          {loadError && (
            <p className="text-xs text-red-600 mt-1">
              โหลดข้อมูลไม่สำเร็จ: {loadError}
            </p>
          )}
        </motion.div>

        <div className="bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6">
            <Toolbar
              search={search}
              setSearch={setSearch}
              perPage={perPage}
              setPerPage={setPerPage}
              onReset={handleReset}
              fileName={title || null}
              onExport={handleExport}
              onSave={handleSaveClick}
              selectedCount={selectedCount}
              isAdmin={!!isAdmin}
              isSaving={isSaving}
            />

            {/* ✅ DDL same as main page (switch columns live) */}
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

        <div className="mt-6 bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-2xl overflow-hidden">
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
            isAdmin={!!isAdmin}
          />
        </div>

        {/* Export Dialog */}
        <AnimatePresence>
          {showExportDialog && (
            <ExportDialog
              isOpen={showExportDialog}
              onClose={() => setShowExportDialog(false)}
              onConfirm={handleExportConfirm}
              selectedCount={selectedCount}
            />
          )}
        </AnimatePresence>

        {/* Save Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <SaveTemplateDialog
              isOpen={showSaveDialog}
              onClose={() => !isSaving && setShowSaveDialog(false)}
              onConfirm={handleSaveConfirm}
              defaultTitle={title}
              rowCount={rows.length}
              isSaving={isSaving}
            />
          )}
        </AnimatePresence>
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
