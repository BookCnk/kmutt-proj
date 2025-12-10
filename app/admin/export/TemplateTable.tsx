"use client";

import React, { useEffect, useCallback, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Edit3, Trash2, RefreshCcw } from "lucide-react";

import { getTemplates, deleteTemplate } from "@/api/templateService";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export type TemplateContent = {
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

export type TemplateDoc = {
  _id: string;
  title: string;
  contents?: TemplateContent[];
  created_at?: string;
  updated_at?: string;
};

function formatDateTH(d?: string) {
  try {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return format(dt, "dd MMM yyyy HH:mm:ss", { locale: th });
  } catch {
    return "-";
  }
}

export function TemplateTable() {
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TemplateDoc | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const router = useRouter();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getTemplates();
      const items = (res as any)?.data ?? res;
      setTemplates(Array.isArray(items) ? items : []);
    } catch (err: any) {
      console.error("Failed to load templates", err);
      setLoadError(err?.message || "โหลด Template ไม่สำเร็จ");
      toast.error("โหลด Template ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleEdit = (tpl: TemplateDoc) => {
    // 👉 ไปหน้า /admin/export/edit?id=...
    router.push(`/admin/export/edit?id=${tpl._id}`);
  };

  // เปิด modal เลือก template ที่จะลบ
  const handleDelete = (tpl: TemplateDoc) => {
    setDeleteTarget(tpl);
  };

  // กดยืนยันลบใน modal
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteTemplate(deleteTarget._id);
      toast.success(`ลบ Template "${deleteTarget.title}" สำเร็จ`);
      setDeleteTarget(null);
      await loadTemplates();
    } catch (err: any) {
      console.error("Failed to delete template", err);
      toast.error(
        err?.message || `ลบ Template "${deleteTarget.title}" ไม่สำเร็จ`
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const total = templates.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Template ที่บันทึกไว้
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            เลือก Template ที่ต้องการ แล้วคลิก Edit เพื่อไปหน้าแก้ไขรายละเอียด
          </p>
          {loadError && (
            <p className="text-xs text-red-600 mt-1">
              โหลดข้อมูลไม่สำเร็จ: {loadError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            ทั้งหมด{" "}
            <span className="font-semibold text-emerald-600">{total}</span>{" "}
            Template
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTemplates}
            disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังโหลด...
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                โหลดใหม่
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="min-w-[220px]">ชื่อ Template</TableHead>
                <TableHead className="w-[110px] text-center">
                  จำนวน Step
                </TableHead>
                <TableHead className="min-w-[180px]">สร้างเมื่อ</TableHead>
                <TableHead className="min-w-[180px]">แก้ไขล่าสุด</TableHead>
                <TableHead className="w-[160px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-600 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังโหลด Template…
                    </div>
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <div className="text-sm text-slate-500">
                      ยังไม่มี Template ที่บันทึกไว้
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl, idx) => (
                  <TableRow key={tpl._id} className="hover:bg-slate-50">
                    <TableCell className="text-center text-sm text-slate-600">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {tpl.title}
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-700">
                      {tpl.contents?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDateTH(tpl.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDateTH(tpl.updated_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleEdit(tpl)}>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(tpl)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Del
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) {
            setDeleteTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ Template</DialogTitle>
            <DialogDescription className="space-y-1">
              <p>
                คุณต้องการลบ Template{" "}
                <span className="font-semibold text-slate-900">
                  {deleteTarget?.title}
                </span>{" "}
                ใช่หรือไม่?
              </p>
              <p className="text-xs text-slate-500">
                การลบนี้ไม่สามารถย้อนกลับได้ ข้อมูล Step ทั้งหมดใน Template
                นี้จะถูกลบออกจากระบบ
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteLoading}
              onClick={() => !deleteLoading && setDeleteTarget(null)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={confirmDelete}
              disabled={deleteLoading}>
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  ลบ Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateTable;
