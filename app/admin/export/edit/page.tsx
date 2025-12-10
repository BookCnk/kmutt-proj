"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { getTemplateById, updateTemplate } from "@/api/templateService";
import { useAuthStore } from "@/stores/auth";
import { DataRow } from "@/app/admin/export/types";
import { DataTable } from "@/components/export/DataTable";
import { Toolbar } from "@/components/export/Toolbar";
import { SaveTemplateDialog } from "@/components/export";
import { CreateTemplateDto } from "@/types/template";

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

// สร้าง payload รูปแบบเดียวกับหน้า create
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
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState<string>("");
  const [rows, setRows] = useState<DataRow[]>([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Toolbar state
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setLoadError("");

    try {
      const res = await getTemplateById(templateId);
      const data: TemplateDoc = (res as any)?.data ?? (res as any);

      setTitle(data.title);
      setRows(mapTemplateToRows(data));
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

  // Filter rows ตาม search
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
        r.sequence.toString(),
      ];
      return fields.some((f) =>
        String(f || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [rows, search]);

  const selectedCount = useMemo(
    () => rows.filter((r) => r.selected).length,
    [rows]
  );

  // === handlers สำหรับ DataTable ===

  const handleReorder = (newRows: DataRow[]) => {
    const updated = newRows.map((r, idx) => ({
      ...r,
      no: idx + 1,
      sequence: idx + 1,
    }));
    setRows(updated);
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
    const newIndex = rows.length;
    const today = new Date().toISOString().split("T")[0];

    const newRow: DataRow = {
      id: `local-row-${Date.now()}`,
      no: newIndex + 1,
      sequence: newIndex + 1,
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

  // Toolbar: Reset = เคลียร์ search + รีโหลด template
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
    toast.info("TODO: ยังไม่ได้ต่อฟังก์ชัน Export สำหรับหน้าแก้ไข");
  };

  // กดปุ่ม Save ใน Toolbar -> แค่เปิด dialog
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

  // กดยืนยันใน SaveTemplateDialog
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

      setTitle(newTitle); // sync title ที่ header
      toast.success("บันทึก Template สำเร็จ");
      setShowSaveDialog(false);
      // ถ้าอยากดึงจาก backend มาย้ำอีกที:
      // await loadTemplate();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          แก้ไข Template
        </h1>
        <p className="text-slate-600 mt-1 text-sm md:text-base">
          Template:{" "}
          <span className="font-semibold text-emerald-700">
            {title || "..."}
          </span>
        </p>
        {loadError && (
          <p className="text-xs text-red-600 mt-1">
            โหลดข้อมูลไม่สำเร็จ: {loadError}
          </p>
        )}
      </header>

      <div className="mb-4 bg-white border rounded-2xl p-4 shadow-sm">
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
        isAdmin={!!isAdmin}
      />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={showSaveDialog}
        onClose={() => !isSaving && setShowSaveDialog(false)}
        onConfirm={handleSaveConfirm}
        defaultTitle={title}
        rowCount={rows.length}
        isSaving={isSaving}
      />
    </div>
  );
}
