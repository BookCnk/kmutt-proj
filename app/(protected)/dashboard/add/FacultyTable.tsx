"use client";

import React, { useEffect, useState } from "react";
import {
  getFaculties,
  updateFaculty,
  deleteFaculty,
} from "@/api/facultyService";
import {
  getDepartmentsByFaculty,
  updateDepartment,
  deleteDepartment,
} from "@/api/departmentService";
import {
  getProgramsByDepartment,
  deleteProgram,
  updateProgram,
} from "@/api/programService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ========= Types ========= */
type FacultyRow = {
  id: string;
  title: string;
  active: boolean;
  departmentCount?: number;
  created_at?: string;
  updated_at?: string;
};

type Department = {
  _id: string;
  title: string;
  active?: boolean;
};

type DepartmentResponse = {
  status: boolean;
  info: {
    pages: number;
    limit: number;
    currentCount: number;
    totalCount: number;
  };
  data: Department[];
};

type Program = {
  _id: string;
  title: string;
  degree_level: string; // "master" | "doctoral" | ...
  degree_abbr: string; // "วศ.ม." | ...
  active?: boolean;

  teaching_time?: string; // เช่น "จ.-พ. 09:00–12:00 (ห้อง B201)"
};

type ProgramResponse = {
  status: boolean;
  info: {
    pages: number;
    limit: number;
    currentCount: number;
    totalCount: number;
  };
  data: Program[];
};

// ช่วยหน่อย
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function extractDeptCount(payload: any): number | null {
  // กรณีเป็น array ตรงๆ
  if (Array.isArray(payload)) return payload.length;

  // กรณีมี data เป็น array
  if (payload?.data && Array.isArray(payload.data)) return payload.data.length;

  // กรณีมี info.totalCount
  if (payload?.info && Number.isFinite(payload.info.totalCount)) {
    return Number(payload.info.totalCount);
  }

  // ไม่รู้รูปแบบ -> ยังนับไม่ได้
  return null;
}

async function fetchDeptCount(
  fid: string,
  attempt = 0
): Promise<number | null> {
  try {
    const dres: any = await getDepartmentsByFaculty(fid);

    const count = extractDeptCount(dres);
    if (count === null && attempt < 2) {
      await delay(200 * (attempt + 1)); // 200ms, 400ms
      return fetchDeptCount(fid, attempt + 1);
    }
    // อาจเป็น 0 จริง ๆ ก็ได้
    return count ?? 0;
  } catch (err) {
    if (attempt < 2) {
      await delay(200 * (attempt + 1));
      return fetchDeptCount(fid, attempt + 1);
    }
    console.error("fetchDeptCount error:", err);
    return null;
  }
}

export default function FacultyTable() {
  const [rows, setRows] = useState<FacultyRow[]>([]);
  const [loading, setLoading] = useState(false);

  /** ---------- Departments Modal (Level 1) ---------- */
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptRows, setDeptRows] = useState<Department[]>([]);
  const [deptFacultyTitle, setDeptFacultyTitle] = useState("");
  const [deptFacultyId, setDeptFacultyId] = useState("");

  // inline edit department
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptTitle, setEditingDeptTitle] = useState<string>("");
  const [savingDeptId, setSavingDeptId] = useState<string | null>(null);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);

  /** ---------- Programs Modal (Level 2) ---------- */
  const [progModalOpen, setProgModalOpen] = useState(false);
  const [progLoading, setProgLoading] = useState(false);
  const [progRows, setProgRows] = useState<Program[]>([]);
  const [progDeptTitle, setProgDeptTitle] = useState("");
  const [progDeptId, setProgDeptId] = useState("");

  // inline edit program
  const [editingProgId, setEditingProgId] = useState<string | null>(null);
  const [editingProgTitle, setEditingProgTitle] = useState<string>("");
  const [editingProgTeachingTime, setEditingProgTeachingTime] =
    useState<string>("");

  const [savingProgId, setSavingProgId] = useState<string | null>(null);
  const [deletingProgId, setDeletingProgId] = useState<string | null>(null);

  /** ---------- Faculty inline edit (table) ---------- */
  const [editingFacId, setEditingFacId] = useState<string | null>(null);
  const [editingFacTitle, setEditingFacTitle] = useState<string>("");
  const [savingFacId, setSavingFacId] = useState<string | null>(null);
  const [deletingFacId, setDeletingFacId] = useState<string | null>(null);

  /** ---------- Load faculties & reliable department count ---------- */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res: any = await getFaculties();
        const arr = Array.isArray(res) ? res : res?.data ?? [];

        const mapped: FacultyRow[] = [];
        for (const f of arr) {
          if (cancelled) break;

          const fid = String(f._id ?? f.id);
          const deptCount = await fetchDeptCount(fid); // ยิงทีละเส้น

          mapped.push({
            id: fid,
            title: f.title ?? f.nameTH ?? "-",
            active: f.active !== false,
            // ถ้านับไม่ได้ ให้ undefined เพื่อไม่สับสนว่า = 0
            departmentCount: deptCount ?? undefined,
            created_at: f.created_at,
            updated_at: f.updated_at,
          });

          // กัน backend overload นิดหน่อย
          await delay(100);
        }

        if (!cancelled) setRows(mapped);
      } catch (e) {
        console.error("getFaculties error:", e);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /** ---------- Open Departments Modal ---------- */
  const openDeptModal = async (facultyId: string, facultyTitle: string) => {
    setDeptFacultyId(facultyId);
    setDeptFacultyTitle(facultyTitle);
    setDeptRows([]);
    setDeptLoading(true);
    setDeptModalOpen(true);

    setEditingDeptId(null);
    setEditingDeptTitle("");
    setSavingDeptId(null);
    setDeletingDeptId(null);

    // close program modal if any
    setProgModalOpen(false);

    try {
      const res: DepartmentResponse = await getDepartmentsByFaculty(facultyId);
      setDeptRows(res?.data ?? []);
    } catch (e) {
      console.error("getDepartmentsByFaculty error:", e);
      setDeptRows([]);
    } finally {
      setDeptLoading(false);
    }
  };

  /** ---------- Faculty inline edit ---------- */
  const startEditFaculty = (row: FacultyRow) => {
    setEditingFacId(row.id);
    setEditingFacTitle(row.title ?? "");
  };
  const cancelEditFaculty = () => {
    setEditingFacId(null);
    setEditingFacTitle("");
  };
  const saveEditFaculty = async (row: FacultyRow) => {
    if (!editingFacId || editingFacId !== row.id) return;
    const newTitle = editingFacTitle.trim();
    if (!newTitle) {
      alert("กรุณากรอกชื่อคณะ");
      return;
    }
    try {
      setSavingFacId(row.id);
      await updateFaculty(row.id, { title: newTitle });
      setRows((prev) =>
        prev.map((f) => (f.id === row.id ? { ...f, title: newTitle } : f))
      );
      if (deptModalOpen && deptFacultyId === row.id)
        setDeptFacultyTitle(newTitle);
      setEditingFacId(null);
      setEditingFacTitle("");
    } catch (err) {
      console.error("updateFaculty error:", err);
      alert("บันทึกชื่อคณะไม่สำเร็จ");
    } finally {
      setSavingFacId(null);
    }
  };
  const confirmDeleteFaculty = async (row: FacultyRow) => {
    const ok = confirm(`ยืนยันลบคณะ: "${row.title}" ?`);
    if (!ok) return;
    try {
      setDeletingFacId(row.id);
      await deleteFaculty(row.id);
      setRows((prev) => prev.filter((f) => f.id !== row.id));
      if (deptModalOpen && deptFacultyId === row.id) {
        setDeptModalOpen(false);
        setProgModalOpen(false);
      }
    } catch (err) {
      console.error("deleteFaculty error:", err);
      alert("ลบคณะไม่สำเร็จ");
    } finally {
      setDeletingFacId(null);
    }
  };

  /** ---------- Department inline edit ---------- */
  const startEditDept = (dep: Department) => {
    setEditingDeptId(dep._id);
    setEditingDeptTitle(dep.title ?? "");
  };
  const cancelEditDept = () => {
    setEditingDeptId(null);
    setEditingDeptTitle("");
  };
  const saveEditDept = async (dep: Department) => {
    if (!editingDeptId || editingDeptId !== dep._id) return;
    const newTitle = editingDeptTitle.trim();
    if (!newTitle) {
      alert("กรุณากรอกชื่อภาค/สาขา");
      return;
    }
    try {
      setSavingDeptId(dep._id);
      await updateDepartment(dep._id, { title: newTitle });
      setDeptRows((prev) =>
        prev.map((d) => (d._id === dep._id ? { ...d, title: newTitle } : d))
      );
      if (progModalOpen && progDeptId === dep._id) setProgDeptTitle(newTitle);
      setEditingDeptId(null);
      setEditingDeptTitle("");
    } catch (err) {
      console.error("updateDepartment error:", err);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSavingDeptId(null);
    }
  };
  const confirmDeleteDept = async (dep: Department) => {
    const ok = confirm(`ยืนยันลบภาค/สาขา: "${dep.title}" ?`);
    if (!ok) return;
    try {
      setDeletingDeptId(dep._id);
      await deleteDepartment(dep._id);
      setDeptRows((prev) => prev.filter((d) => d._id !== dep._id));
      setRows((prev) =>
        prev.map((f) =>
          f.id === deptFacultyId
            ? {
                ...f,
                departmentCount: Math.max(0, (f.departmentCount ?? 0) - 1),
              }
            : f
        )
      );
      if (progModalOpen && progDeptId === dep._id) {
        setProgModalOpen(false);
        setProgRows([]);
      }
      if (editingDeptId === dep._id) {
        setEditingDeptId(null);
        setEditingDeptTitle("");
      }
    } catch (err) {
      console.error("deleteDepartment error:", err);
      alert("ลบสาขาไม่สำเร็จ");
    } finally {
      setDeletingDeptId(null);
    }
  };

  /** ---------- Open Programs Modal (nested) ---------- */
  const openProgramModal = async (department: Department) => {
    setProgDeptId(department._id);
    setProgDeptTitle(department.title ?? "");
    setProgRows([]);
    setProgLoading(true);
    setProgModalOpen(true);

    // reset program edit states
    setEditingProgId(null);
    setEditingProgTitle("");
    setSavingProgId(null);
    setDeletingProgId(null);

    try {
      const res: ProgramResponse = await getProgramsByDepartment(
        department._id
      );
      setProgRows(res?.data ?? []);
    } catch (e) {
      console.error("getProgramsByDepartment error:", e);
      setProgRows([]);
    } finally {
      setProgLoading(false);
    }
  };

  /** ---------- Program inline edit & delete ---------- */
  const startEditProgram = (p: Program) => {
    setEditingProgId(p._id);
    setEditingProgTitle(p.title ?? "");
    setEditingProgTeachingTime(p.teaching_time ?? ""); // ⬅️ เพิ่มบรรทัดนี้
  };
  const cancelEditProgram = () => {
    setEditingProgId(null);
    setEditingProgTitle("");
    setEditingProgTeachingTime("");
  };
  const saveEditProgram = async (p: Program) => {
    if (!editingProgId || editingProgId !== p._id) return;
    const newTitle = editingProgTitle.trim();
    const newTeachingTime = editingProgTeachingTime.trim();
    if (!newTitle) {
      alert("กรุณากรอกชื่อหลักสูตร/สาขา");
      return;
    }
    try {
      setSavingProgId(p._id);
      await updateProgram(p._id, { title: newTitle });
      setProgRows((prev) =>
        prev.map((x) => (x._id === p._id ? { ...x, title: newTitle } : x))
      );
      setEditingProgId(null);
      setEditingProgTitle("");
      setEditingProgTeachingTime(""); // ⬅️ clear
    } catch (err) {
      console.error("updateProgram error:", err);
      alert("บันทึกชื่อหลักสูตรไม่สำเร็จ");
    } finally {
      setSavingProgId(null);
    }
  };
  const confirmDeleteProgram = async (program: Program) => {
    const ok = confirm(`ยืนยันลบหลักสูตร/สาขา: "${program.title}" ?`);
    if (!ok) return;
    try {
      setDeletingProgId(program._id);
      await deleteProgram(program._id);
      setProgRows((prev) => prev.filter((p) => p._id !== program._id));
    } catch (err) {
      console.error("deleteProgram error:", err);
      alert("ลบหลักสูตร/สาขาไม่สำเร็จ");
    } finally {
      setDeletingProgId(null);
    }
  };

  return (
    <>
      {/* ====== Faculty table ====== */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="border-b px-3 py-2">ชื่อคณะ (ไทย)</th>
              <th className="border-b px-3 py-2">จำนวนสาขาของคณะ</th>
              <th className="border-b px-3 py-2">สถานะ</th>
              <th className="border-b px-3 py-2 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((f) => {
                const isEditing = editingFacId === f.id;
                const isSaving = savingFacId === f.id;
                const isDeleting = deletingFacId === f.id;

                return (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="border-b px-3 py-2">
                      {isEditing ? (
                        <input
                          className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editingFacTitle}
                          onChange={(e) => setEditingFacTitle(e.target.value)}
                          disabled={isSaving || isDeleting}
                          placeholder="ชื่อคณะ"
                        />
                      ) : (
                        f.title
                      )}
                    </td>

                    <td className="border-b px-3 py-2">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline disabled:text-gray-400"
                        onClick={() => openDeptModal(f.id, f.title)}
                        disabled={(f.departmentCount ?? 0) === 0}
                        title={
                          (f.departmentCount ?? 0) > 0
                            ? "ดูรายชื่อสาขา (Department)"
                            : "ไม่มีสาขา"
                        }>
                        {f.departmentCount ?? 0}
                      </button>
                    </td>

                    <td className="border-b px-3 py-2">
                      {f.active ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          active
                        </span>
                      ) : (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                          inactive
                        </span>
                      )}
                    </td>

                    <td className="border-b px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={
                                isSaving ||
                                isDeleting ||
                                !editingFacTitle.trim()
                              }
                              onClick={() => saveEditFaculty(f)}>
                              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isSaving || isDeleting}
                              onClick={cancelEditFaculty}>
                              ยกเลิก
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isDeleting}
                              onClick={() => startEditFaculty(f)}>
                              แก้ไข
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={isSaving || isDeleting}
                              onClick={() => confirmDeleteFaculty(f)}>
                              {isDeleting ? "กำลังลบ..." : "ลบ"}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  ไม่มีข้อมูลคณะ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====== Departments Modal ====== */}
      <Dialog open={deptModalOpen} onOpenChange={setDeptModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>รายชื่อภาค/สาขา (Department)</DialogTitle>
            <DialogDescription>
              คณะ: <span className="font-medium">{deptFacultyTitle}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto">
            {deptLoading ? (
              <div className="py-6 text-center text-gray-500">
                กำลังโหลดรายชื่อภาค/สาขา...
              </div>
            ) : deptRows.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                ไม่พบภาค/สาขาในคณะนี้
              </div>
            ) : (
              <ul className="space-y-2">
                {deptRows.map((d) => {
                  const isEditing = editingDeptId === d._id;
                  const isSaving = savingDeptId === d._id;
                  const isDeleting = deletingDeptId === d._id;

                  return (
                    <li
                      key={d._id}
                      className="rounded-lg border px-3 py-2 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editingDeptTitle}
                            onChange={(e) =>
                              setEditingDeptTitle(e.target.value)
                            }
                            disabled={isSaving || isDeleting}
                            placeholder="ชื่อภาค/สาขา"
                          />
                        ) : (
                          <p className="font-medium truncate">{d.title}</p>
                        )}

                        <div className="mt-1 flex items-center gap-2">
                          {d.active === false ? (
                            <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                              inactive
                            </span>
                          ) : (
                            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                              active
                            </span>
                          )}

                          {/* เปิด Program Modal */}
                          <Button
                            type="button"
                            size="sm"
                            variant="link"
                            className="px-0"
                            onClick={() => openProgramModal(d)}
                            disabled={isEditing || isSaving || isDeleting}>
                            ดูสาขา/หลักสูตร
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={
                                isSaving ||
                                isDeleting ||
                                !editingDeptTitle.trim()
                              }
                              onClick={() => saveEditDept(d)}>
                              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isSaving || isDeleting}
                              onClick={cancelEditDept}>
                              ยกเลิก
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isDeleting}
                              onClick={() => startEditDept(d)}>
                              แก้ไข
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={isSaving || isDeleting}
                              onClick={() => confirmDeleteDept(d)}>
                              {isDeleting ? "กำลังลบ..." : "ลบ"}
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setDeptModalOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Programs Modal (nested) ====== */}
      <Dialog open={progModalOpen} onOpenChange={setProgModalOpen}>
        <DialogContent className="w-fit max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>รายการหลักสูตร/สาขา (Program)</DialogTitle>
            <DialogDescription>
              ภาค/สาขา: <span className="font-medium">{progDeptTitle}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto">
            {progLoading ? (
              <div className="py-6 text-center text-gray-500">
                กำลังโหลดรายการหลักสูตร/สาขา...
              </div>
            ) : progRows.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                ไม่พบหลักสูตร/สาขาในภาคนี้
              </div>
            ) : (
              <ul className="space-y-2">
                {progRows.map((p) => {
                  const isEditing = editingProgId === p._id;
                  const isSaving = savingProgId === p._id;
                  const isDeleting = deletingProgId === p._id;

                  return (
                    <li
                      key={p._id}
                      className="rounded-lg border px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <>
                            {/* ชื่อหลักสูตร */}
                            <input
                              className="mb-2 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editingProgTitle}
                              onChange={(e) =>
                                setEditingProgTitle(e.target.value)
                              }
                              disabled={isSaving || isDeleting}
                              placeholder="ชื่อหลักสูตร/สาขา"
                            />

                            {/* ⬇️ วัน-เวลาในการดำเนินการเรียนการสอน */}
                            <input
                              className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={editingProgTeachingTime}
                              onChange={(e) =>
                                setEditingProgTeachingTime(e.target.value)
                              }
                              disabled={isSaving || isDeleting}
                              placeholder="วัน-เวลาในการดำเนินการเรียนการสอน (เช่น จ.-พ. 09:00–12:00 ห้อง B201)"
                            />
                          </>
                        ) : (
                          <>
                            {/* ชื่อหลักสูตร (คงเดิม) */}
                            <p className="font-medium break-words whitespace-normal">
                              {p.title}
                            </p>

                            {/* ⬇️ แสดงวัน-เวลา ถ้ามี */}
                            {p.teaching_time ? (
                              <p className="text-sm text-gray-600 mt-0.5">
                                วัน-เวลา: {p.teaching_time}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 mt-0.5">
                                วัน-เวลา: —
                              </p>
                            )}
                          </>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span>ระดับ: {p.degree_level || "-"}</span>
                          <span>•</span>
                          <span>วุฒิ: {p.degree_abbr || "-"}</span>
                          <span>•</span>
                          {p.active === false ? (
                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-gray-700">
                              inactive
                            </span>
                          ) : (
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
                              active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ปุ่มแก้ไข/ลบ คงเดิม */}
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={
                                isSaving ||
                                isDeleting ||
                                !editingProgTitle.trim()
                              }
                              onClick={() => saveEditProgram(p)}>
                              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isSaving || isDeleting}
                              onClick={cancelEditProgram}>
                              ยกเลิก
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isDeleting}
                              onClick={() => startEditProgram(p)}>
                              แก้ไข
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={isSaving || isDeleting}
                              onClick={() => confirmDeleteProgram(p)}>
                              {isDeleting ? "กำลังลบ..." : "ลบ"}
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setProgModalOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
