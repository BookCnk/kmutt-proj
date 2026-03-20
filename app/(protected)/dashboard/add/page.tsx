"use client";

import { createDepartment } from "@/api/departmentService";
import { getFaculties, createFaculty } from "@/api/facultyService";
import { getDepartmentsByFaculty } from "@/api/departmentService";
import { createProgram } from "@/api/programService";
import FacultyTable from "@/app/(protected)/dashboard/add/FacultyTable";
import RoundsEditor from "@/app/(protected)/dashboard/add/RoundsEditor";
import { isAuthorized, clearToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

import React, { useMemo, useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectContentSimple,
} from "@/components/ui/select";
import {
  Building2,
  Library,
  GraduationCap,
  CalendarClock,
  ListOrdered,
  Settings2,
  PlusCircle,
  Plus,
  Home,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { CreateFacultyDto } from "@/types/faculty";

export type Caps = { maxMasters: number; maxDoctoral: number };

export type FixedRound = {
  id: string;
  name: string;
  date: string;
  isOpen: boolean;
};
export type MonthlyRound = {
  id: string;
  month: number; // 1-12
  year: string; // yyyy
  date: string; // yyyy-mm-dd
  isOpen: boolean;
};

export type MajorOption = { id: string; nameTH: string };
export type MajorQuotaItem = {
  id: string;
  majorId: string;
  masters: number;
  doctoral: number;
  touched?: boolean;
};

export type DepartmentOption = { id: string; nameTH: string };

/* ===========================
 * Constants & Utils
 * =========================== */
const MONTHS_TH = [
  { v: 1, l: "มกราคม" },
  { v: 2, l: "กุมภาพันธ์" },
  { v: 3, l: "มีนาคม" },
  { v: 4, l: "เมษายน" },
  { v: 5, l: "พฤษภาคม" },
  { v: 6, l: "มิถุนายน" },
  { v: 7, l: "กรกฎาคม" },
  { v: 8, l: "สิงหาคม" },
  { v: 9, l: "กันยายน" },
  { v: 10, l: "ตุลาคม" },
  { v: 11, l: "พฤศจิกายน" },
  { v: 12, l: "ธันวาคม" },
] as const;

const uid = (prefix = "id") =>
  (typeof crypto !== "undefined" && (crypto as any)?.randomUUID?.()) ||
  `${prefix}-${Date.now()}`;
const clamp = (n: number) =>
  Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;

/* ===========================
 * Shared Section
 * =========================== */
function Section({
  title,
  icon: Icon,
  children,
  extra,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon size={20} />
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

/* ===========================
 * Faculty Form (UI only)
 * =========================== */
interface FacultyFormProps {
  onCreated?: (fac: CreateFacultyDto) => void;
  ddlValue?: string;
}
function FacultyForm({ onCreated, ddlValue }: FacultyFormProps) {
  const [nameTH, setNameTH] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return nameTH.trim().length > 0 && (!!ddlValue?.trim() || !ddlValue);
  }, [nameTH, ddlValue]);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const payload = { title: nameTH.trim(), active: true };
      const created = await createFaculty(payload);
      setNameTH("");
      onCreated?.(created);
      alert("บันทึกสำเร็จ: เพิ่มคณะเรียบร้อยแล้ว");
    } catch (err) {
      console.error("createFaculty error:", err);
      alert("เกิดข้อผิดพลาด: เพิ่มคณะไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="w-full flex flex-col md:flex-row items-end gap-4"
      onSubmit={(e) => e.preventDefault()}>
      <div className="flex-1 flex flex-col gap-1.5 w-full">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          ชื่อคณะ (ไทย) <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <Building2
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
            size={18}
          />
          <input
            className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 pl-11 pr-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="เช่น คณะวิศวกรรมศาสตร์"
            value={nameTH}
            onChange={(e) => setNameTH(e.target.value)}
            aria-required
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          disabled={!canSubmit || loading}
          className="h-[46px] rounded-2xl bg-blue-600 px-6 py-2 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all flex items-center gap-2 group"
          onClick={handleSubmit}>
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <PlusCircle
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
          )}
          {loading ? "กำลังบันทึก..." : "เพิ่มคณะ"}
        </button>
      </div>
    </form>
  );
}

/* ===========================
 * Department Form (UI only)
 * =========================== */

interface DepartmentFormProps {
  faculties?: CreateFacultyDto[];
  onSubmit?: () => void;
}

type FacOption = { id: string; nameTH: string };

const normalizeFaculty = (f: any): FacOption => ({
  id: String(f.id ?? f._id),
  nameTH: f.nameTH ?? f.title ?? "",
});

function DepartmentForm({ faculties, onSubmit }: DepartmentFormProps) {
  const [facultyId, setFacultyId] = useState("");
  const [nameTH, setNameTH] = useState("");
  const [loading, setLoading] = useState(false);

  // Faculties options (จาก props หรือ API)
  const [facOptions, setFacOptions] = useState<FacOption[]>(
    (faculties ?? []).map(normalizeFaculty),
  );
  const [facLoading, setFacLoading] = useState(false);

  // ถ้า parent ส่ง faculties มา (ช้าหรือเร็ว) ให้ sync เข้า state
  useEffect(() => {
    if (faculties && faculties.length > 0) {
      setFacOptions(faculties.map(normalizeFaculty));
    }
  }, [faculties]);

  // ถ้า parent ไม่ส่ง ให้โหลดจาก API
  useEffect(() => {
    if (faculties && faculties.length > 0) return;

    let cancelled = false;
    const load = async () => {
      setFacLoading(true);
      try {
        const res: any = await getFaculties();
        // รองรับทั้งกรณี API คืน array ตรง ๆ หรือ { data: [...] }
        const arr = Array.isArray(res) ? res : (res?.data ?? []);
        const mapped: FacOption[] = arr
          .map(normalizeFaculty)
          .filter((f: any) => f.id);
        if (!cancelled) setFacOptions(mapped);
      } catch (err) {
        console.error("getFaculties error:", err);
        if (!cancelled) setFacOptions([]);
      } finally {
        if (!cancelled) setFacLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [faculties]);

  const canSubmit = useMemo(
    () => facultyId.trim().length > 0 && nameTH.trim().length > 0,
    [facultyId, nameTH],
  );

  const handleSubmit = async () => {
    // validate แบบแจ้งเตือนตอนคลิก
    if (!facultyId.trim()) {
      alert("ข้อมูลไม่ครบ: กรุณาเลือกคณะ");
      return;
    }
    if (!nameTH.trim()) {
      alert("ข้อมูลไม่ครบ: กรุณากรอกชื่อภาค/สาขา (ไทย)");
      return;
    }

    try {
      setLoading(true);
      await createDepartment({
        faculty_id: facultyId,
        title: nameTH, // ถ้า backend ใช้ titleTH ให้แก้เป็น titleTH
        active: true,
      });

      onSubmit?.(); // แจ้ง parent (เช่นให้รีเฟรชรายการ)
      setFacultyId(""); // reset form
      setNameTH("");

      alert("บันทึกสำเร็จ: เพิ่มภาควิชาเรียบร้อยแล้ว");
    } catch (err) {
      console.error("createDepartment error:", err);
      alert("เกิดข้อผิดพลาด: ไม่สามารถเพิ่มภาควิชาได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="grid gap-6 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}>
      <div className="flex flex-col gap-1.5 md:col-span-1">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          เลือกคณะ <span className="text-red-500">*</span>
        </label>
        <Select value={facultyId} onValueChange={setFacultyId}>
          <SelectTrigger
            className="rounded-2xl border-gray-200 bg-gray-50/30 h-[46px] px-4 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            disabled={facLoading}>
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-gray-400" />
              <SelectValue
                placeholder={facLoading ? "กำลังโหลดคณะ..." : "— เลือกคณะ —"}
              />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-xl ring-1 ring-black/5">
            {!facLoading && facOptions.length === 0 && (
              <SelectItem value="__none__" disabled className="text-xs">
                ไม่มีข้อมูลคณะ
              </SelectItem>
            )}
            {facOptions.map((f) => (
              <SelectItem
                key={f.id}
                value={f.id}
                className="rounded-xl focus:bg-blue-50 focus:text-blue-700 cursor-pointer">
                {f.nameTH}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700 ml-1">
          ชื่อภาค/สาขา (ไทย) <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <Library
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
            size={18}
          />
          <input
            className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 pl-11 pr-4 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            placeholder="เช่น ภาควิชาวิศวกรรมคอมพิวเตอร์"
            value={nameTH}
            onChange={(e) => setNameTH(e.target.value)}
            aria-required="true"
          />
        </div>
      </div>

      <div className="md:col-span-2 flex items-center justify-end">
        <button
          type="submit"
          disabled={!canSubmit || loading || facLoading}
          className="rounded-2xl bg-blue-600 px-8 py-2.5 h-[46px] text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all flex items-center gap-2 group"
          aria-disabled={!canSubmit || loading || facLoading}>
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <PlusCircle
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
          )}
          {loading ? "กำลังบันทึก..." : "เพิ่มภาควิชา"}
        </button>
      </div>
    </form>
  );
}

/* ===========================
 * Rounds Editor (UI only)
 * =========================== */
interface RoundsEditorProps {
  modeOptions?: { id: "fixed" | "monthly"; label: string }[];
}

/* ===========================
 * Caps Editor (with Department DDL)
 * =========================== */

type Faculty = {
  id: string; // ถ้า API คืน _id ให้ map เป็น id ด้านล่าง
  title: string; // ชื่อคณะ (ไทย)
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Department = {
  id: string;
  title: string; // ชื่อภาควิชา (ไทย)
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

// ---------- Caps Editor ----------
function CapsEditor() {
  // internal states
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [noDepartment, setNoDepartment] = useState(false); // ✅ optional department
  const [majorName, setMajorName] = useState("");

  // ✅ state ใหม่สำหรับเก็บเวลา (เช่น "sunday")
  const [programTime, setProgramTime] = useState("");

  // payload fields per CreateProgramDto
  const [degreeLevel, setDegreeLevel] = useState<"master" | "doctoral">(
    "master",
  );
  const [degreeAbbr, setDegreeAbbr] = useState("วศ.ม."); // default for master
  const [degreeReq, setDegreeReq] = useState<"" | "bachelor" | "master">("");
  const degreeReqSelectValue = degreeReq === "" ? "none" : degreeReq;
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState<number>(0);

  // loading flags
  const [facLoading, setFacLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // auto switch abbr when level changes (keep user override if they typed)
  useEffect(() => {
    setDegreeAbbr((prev) => {
      const trimmed = prev.trim();
      const isEmpty = trimmed === "";
      // Only auto-set when it's empty or looks like the other default.
      if (degreeLevel === "master") {
        return isEmpty || trimmed === "ปร.ด." ? "วศ.ม." : prev;
      } else {
        return isEmpty || trimmed === "วศ.ม." ? "ปร.ด." : prev;
      }
    });
  }, [degreeLevel]);

  // load faculties on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFacLoading(true);
      try {
        const res: any = await getFaculties();
        const arr = Array.isArray(res) ? res : (res?.data ?? []);
        const mapped: Faculty[] = arr.map((f: any) => ({
          id: String(f.id ?? f._id),
          title: f.title ?? f.nameTH ?? "",
        }));
        if (!cancelled) setFaculties(mapped);
      } catch (e) {
        console.error("getFaculties error:", e);
        if (!cancelled) setFaculties([]);
      } finally {
        if (!cancelled) setFacLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // load departments when faculty changes
  useEffect(() => {
    let cancelled = false;
    // reset when faculty changes
    setDepartmentId("");
    setDepartments([]);
    setNoDepartment(false);

    if (!facultyId) return;

    const load = async () => {
      setDeptLoading(true);
      try {
        const res: any = await getDepartmentsByFaculty(facultyId);
        const arr = res?.data ?? [];
        const mapped: Department[] = arr.map((d: any) => ({
          id: String(d._id ?? d.id),
          title: d.title ?? d.nameTH ?? "",
        }));
        if (!cancelled) setDepartments(mapped);
      } catch (e) {
        console.error("getDepartmentsByFaculty error:", e);
        if (!cancelled) setDepartments([]);
      } finally {
        if (!cancelled) setDeptLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [facultyId]);

  const canSave = useMemo(() => {
    // department เป็น optional: บังคับเฉพาะเมื่อผู้ใช้ไม่ได้เลือก "ไม่มีภาควิชา"
    const deptOk =
      noDepartment || !!departmentId.trim() || departments.length === 0;
    return (
      !!facultyId.trim() &&
      deptOk &&
      !!majorName.trim() &&
      !!programTime.trim() && // ✅ ต้องมีเวลา
      !!degreeLevel &&
      !!degreeAbbr.trim()
    );
  }, [
    facultyId,
    departmentId,
    noDepartment,
    departments.length,
    majorName,
    programTime,
    degreeLevel,
    degreeAbbr,
  ]);

  const handleSave = async () => {
    // validate
    if (!facultyId) {
      alert("กรุณาเลือกคณะ");
      return;
    }
    if (!noDepartment && departments.length > 0 && !departmentId) {
      alert("กรุณาเลือกภาควิชา หรือเลือกตัวเลือก 'ไม่มีภาควิชา'");
      return;
    }
    if (!majorName.trim()) {
      alert("กรุณากรอกชื่อสาขา");
      return;
    }
    if (!programTime.trim()) {
      alert("กรุณากรอกเวลา (time)");
      return;
    }
    if (!degreeAbbr.trim()) {
      alert("กรอกตัวย่อปริญญา (degree_abbr)");
      return;
    }

    try {
      setSaving(true);

      // ✅ สร้าง payload ตาม CreateProgramDto + time
      const payload: {
        faculty_id: string;
        department_id?: string;
        title: string;
        time: string; // 👈 เพิ่มใน type ด้วย
        degree_level: "master" | "doctoral";
        degree_abbr: string;
        active?: boolean;
        degree_req?: "bachelor" | "master";
        order?: number;
      } = {
        faculty_id: facultyId,
        title: majorName.trim(),
        time: programTime.trim(), // 👈 map state → field time
        degree_level: degreeLevel,
        degree_abbr: degreeAbbr.trim(),
        order: order,
      };

      if (!noDepartment && departmentId) {
        payload.department_id = departmentId;
      }
      // optional fields
      payload.active = !!active;
      if (degreeReq === "bachelor" || degreeReq === "master") {
        payload.degree_req = degreeReq;
      }

      await createProgram(payload);

      // reset name & time (หรือจะรีเซ็ตทั้งหมดก็ได้)
      setMajorName("");
      setProgramTime("");
      setOrder(0);
      alert("บันทึกสาขาสำเร็จ");
    } catch (err) {
      console.error("createProgram error:", err);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 space-y-6">
      <div className="flex items-center gap-2.5 text-blue-600 font-bold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
          <Settings2 size={16} />
        </div>
        <p>กำหนดรายละเอียดสาขา (Program Mapping)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* คณะ */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700 ml-1">
            คณะ <span className="text-red-500">*</span>
          </label>
          <Select
            value={facultyId}
            onValueChange={setFacultyId}
            disabled={facLoading}>
            <SelectTrigger className="w-full rounded-2xl border-gray-200 bg-white h-[46px] px-4 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
              <div className="flex items-center gap-2 text-sm">
                <Building2 size={16} className="text-gray-400" />
                <SelectValue
                  placeholder={facLoading ? "กำลังโหลดคณะ..." : "— เลือกคณะ —"}
                />
              </div>
            </SelectTrigger>
            <SelectContentSimple className="rounded-2xl border-gray-100 shadow-xl">
              {!facLoading && faculties.length === 0 && (
                <SelectItem value="__none__" disabled className="text-xs">
                  ไม่มีข้อมูลคณะ
                </SelectItem>
              )}
              {faculties.map((f) => (
                <SelectItem
                  key={f.id}
                  value={f.id}
                  className="rounded-xl focus:bg-blue-50 focus:text-blue-700">
                  {f.title}
                </SelectItem>
              ))}
            </SelectContentSimple>
          </Select>
        </div>

        {/* ภาควิชา (optional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="block text-sm font-semibold text-gray-700">
              ภาควิชา (ถ้ามี)
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                checked={noDepartment}
                onChange={(e) => {
                  setNoDepartment(e.target.checked);
                  if (e.target.checked) setDepartmentId("");
                }}
              />
              ไม่มีภาควิชา
            </label>
          </div>
          <Select
            value={departmentId}
            onValueChange={setDepartmentId}
            disabled={
              noDepartment ||
              !facultyId ||
              deptLoading ||
              departments.length === 0
            }>
            <SelectTrigger className="w-full rounded-2xl border-gray-200 bg-white h-[46px] px-4 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Library size={16} className="text-gray-400" />
                <SelectValue
                  placeholder={
                    !facultyId
                      ? "— โปรดเลือกคณะก่อน —"
                      : deptLoading
                        ? "กำลังโหลดภาควิชา..."
                        : departments.length === 0
                          ? "ไม่มีข้อมูลภาควิชา"
                          : "— เลือกภาควิชา —"
                  }
                />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
              {!deptLoading && departments.length === 0 ? (
                <SelectItem value="__none__" disabled className="text-xs">
                  {facultyId ? "ไม่มีข้อมูลภาควิชา" : "โปรดเลือกคณะก่อน"}
                </SelectItem>
              ) : (
                departments.map((d: any) => (
                  <SelectItem
                    key={d.id}
                    value={d.id}
                    className="rounded-xl focus:bg-blue-50 focus:text-blue-700">
                    {d.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700 ml-1">
            ชื่อสาขา <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <GraduationCap
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-sm font-medium"
              value={majorName}
              onChange={(e) => setMajorName(e.target.value)}
              placeholder="เช่น สาขาวิศวกรรมคอมพิวเตอร์"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700 ml-1">
            วัน-เวลาการเรียนการสอน <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <CalendarClock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-sm font-medium"
              value={programTime}
              onChange={(e) => setProgramTime(e.target.value)}
              placeholder='เช่น "sunday", "evening"'
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700 ml-1">
            ลำดับแสดงผล (Order)
          </label>
          <div className="relative group">
            <ListOrdered
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
              size={18}
            />
            <input
              type="number"
              className="w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-sm font-medium"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700 ml-1">
            ระดับปริญญา <span className="text-red-500">*</span>
          </label>
          <Select
            value={degreeLevel}
            onValueChange={(v: "master" | "doctoral") => setDegreeLevel(v)}>
            <SelectTrigger className="w-full rounded-2xl border-gray-200 bg-white h-[46px] px-4 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm">
              <SelectValue placeholder="เลือกระดับปริญญา" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
              <SelectItem
                value="master"
                className="rounded-xl focus:bg-blue-50 focus:text-blue-700">
                ปริญญาโท (Master)
              </SelectItem>
              <SelectItem
                value="doctoral"
                className="rounded-xl focus:bg-blue-50 focus:text-blue-700">
                ปริญญาเอก (Doctoral)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700 ml-1">
            ตัวย่อปริญญา (Abbr.) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-sm font-medium"
            value={degreeAbbr}
            onChange={(e) => setDegreeAbbr(e.target.value)}
            placeholder={degreeLevel === "master" ? "เช่น วศ.ม." : "เช่น ปร.ด."}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700 ml-1">
            วุฒิขั้นต่ำ (ไม่บังคับ)
          </label>
          <Select
            value={degreeReqSelectValue}
            onValueChange={(v: "none" | "bachelor" | "master") =>
              setDegreeReq(v === "none" ? "" : v)
            }>
            <SelectTrigger className="w-full rounded-2xl border-gray-200 bg-white h-[46px] px-4 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-sm">
              <SelectValue placeholder="— ไม่ระบุ —" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
              <SelectItem
                value="none"
                className="rounded-xl focus:bg-blue-50 focus:text-blue-700 text-gray-500">
                — ไม่ระบุ —
              </SelectItem>
              <SelectItem
                value="bachelor"
                className="rounded-xl focus:bg-blue-50 focus:text-blue-700">
                ปริญญาตรี (Bachelor)
              </SelectItem>
              <SelectItem
                value="master"
                className="rounded-xl focus:bg-blue-50 focus:text-blue-700">
                ปริญญาโท (Master)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100 mt-2">
        <label className="relative inline-flex items-center gap-3 text-sm font-bold text-gray-700 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-emerald-500"></div>
            <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
          </div>
          <span className="group-hover:text-blue-600 transition-colors">
            เปิดใช้งานสาขานี้ (Active)
          </span>
        </label>

        <button
          type="button"
          className="w-full md:w-auto rounded-2xl bg-blue-600 px-8 py-3 text-white font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!canSave || saving || facLoading || deptLoading}>
          {saving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <CheckCircle2
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
          )}
          {saving ? "กำลังบันทึก..." : "ยืนยันบันทึกสาขา"}
        </button>
      </div>
    </div>
  );
}

/* ===========================
 * Page Composition (UI only)
 * =========================== */
export default function FacultyAdminPage() {
  const departments: DepartmentOption[] = [
    { id: "cpe", nameTH: "ภาควิชาวิศวกรรมคอมพิวเตอร์" },
    { id: "eee", nameTH: "ภาควิชาวิศวกรรมไฟฟ้า" },
    { id: "che", nameTH: "ภาควิศวกรรมเคมี" },
  ];

  const [deptId, setDeptId] = useState("");
  const [majorName, setMajorName] = useState("");
  const [caps, setCaps] = useState<Caps>({ maxMasters: 0, maxDoctoral: 0 });
  const router = useRouter();

  useEffect(() => {
    // ต้องเป็น admin เท่านั้น
    const ok = isAuthorized(["admin"]);
    if (!ok) {
      // optional: ถ้า token หมดอายุ/ผิดพลาด ล้างทิ้ง
      clearToken();
      router.replace("/403"); // หรือ "/login"
    }
  }, [router]);

  // (optional) กัน flash UI ตอน redirect
  if (!isAuthorized(["admin"])) return null;

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      <div className="mx-auto max-w-6xl px-6 pt-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-3">
            <Section
              title="ตั้งค่ารอบสัมภาษณ์"
              icon={CalendarClock}
              extra={
                <button
                  onClick={() => router.push("/")}
                  className="flex h-11 px-5 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm font-bold text-sm group">
                  <Home
                    size={18}
                    className="group-hover:scale-110 transition-transform"
                  />
                  กลับหน้าหลัก
                </button>
              }>
              <RoundsEditor />
            </Section>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Section title="เพิ่มคณะ" icon={Plus}>
              <FacultyForm />
            </Section>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Section title="เพิ่มภาค" icon={Plus}>
              <DepartmentForm faculties={[]} />
            </Section>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Section title="เพิ่มสาขา (Mapping)" icon={Plus}>
              <CapsEditor />
            </Section>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Section title="รายการคณะและสาขาที่มีอยู่" icon={Library}>
              <FacultyTable />
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}
