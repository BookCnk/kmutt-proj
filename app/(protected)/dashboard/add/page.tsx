"use client";

import { createDepartment } from "@/api/departmentService";
import { getFaculties, createFaculty } from "@/api/facultyService";
import { getDepartmentsByFaculty } from "@/api/departmentService";
import { createProgram } from "@/api/programService";
import FacultyTable from "@/app/(protected)/dashboard/add/FacultyTable";
import RoundsEditor from "@/app/(protected)/dashboard/add/RoundsEditor";

import React, { useMemo, useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectContentSimple,
} from "@/components/ui/select";
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">{title}</h2>
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
    <form className="w-full" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">ชื่อคณะ (ไทย) *</label>
        <input
          className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="คณะวิศวกรรมศาสตร์"
          value={nameTH}
          onChange={(e) => setNameTH(e.target.value)}
          aria-required
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      <div className="md:col-span-3 flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={!canSubmit || loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSubmit}>
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
    (faculties ?? []).map(normalizeFaculty)
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
        const arr = Array.isArray(res) ? res : res?.data ?? [];
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
    [facultyId, nameTH]
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
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}>
      {/* Faculty Select */}
      <div className="flex flex-col gap-1 md:col-span-1">
        <label className="text-sm text-gray-600">เลือกคณะ *</label>
        <Select value={facultyId} onValueChange={setFacultyId}>
          <SelectTrigger className="rounded-xl" disabled={facLoading}>
            <SelectValue
              placeholder={facLoading ? "กำลังโหลดคณะ..." : "— เลือกคณะ —"}
            />
          </SelectTrigger>
          <SelectContent>
            {!facLoading && facOptions.length === 0 && (
              <SelectItem value="__none__" disabled>
                ไม่มีข้อมูลคณะ
              </SelectItem>
            )}
            {facOptions.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nameTH}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department Name (TH) */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">ชื่อภาค/สาขา (ไทย) *</label>
        <input
          className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ภาควิชาวิศวกรรมคอมพิวเตอร์"
          value={nameTH}
          onChange={(e) => setNameTH(e.target.value)}
          aria-required="true"
        />
      </div>

      {/* Submit */}
      <div className="md:col-span-3 flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSubmit || loading || facLoading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          title={!canSubmit ? "กรุณาเลือกคณะและกรอกชื่อภาค/สาขา" : undefined}
          aria-disabled={!canSubmit || loading || facLoading}>
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
    "master"
  );
  const [degreeAbbr, setDegreeAbbr] = useState("วศ.ม."); // default for master
  const [degreeReq, setDegreeReq] = useState<"" | "bachelor" | "master">("");
  const degreeReqSelectValue = degreeReq === "" ? "none" : degreeReq;
  const [active, setActive] = useState(true);

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
        const arr = Array.isArray(res) ? res : res?.data ?? [];
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
      } = {
        faculty_id: facultyId,
        title: majorName.trim(),
        time: programTime.trim(), // 👈 map state → field time
        degree_level: degreeLevel,
        degree_abbr: degreeAbbr.trim(),
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
      alert("บันทึกสาขาสำเร็จ");
    } catch (err) {
      console.error("createProgram error:", err);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <p className="font-medium">กำหนดสาขา (เลือกคณะ → ภาควิชา)</p>

      {/* คณะ */}
      <div>
        <label className="mb-1 block text-sm text-gray-600">คณะ *</label>
        <Select
          value={facultyId}
          onValueChange={setFacultyId}
          disabled={facLoading}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue
              placeholder={facLoading ? "กำลังโหลดคณะ..." : "— เลือกคณะ —"}
            />
          </SelectTrigger>
          <SelectContentSimple>
            {!facLoading && faculties.length === 0 && (
              <SelectItem value="__none__" disabled>
                ไม่มีข้อมูลคณะ
              </SelectItem>
            )}
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.title}
              </SelectItem>
            ))}
          </SelectContentSimple>
        </Select>
      </div>

      {/* ภาควิชา (optional) */}
      <div className="grid grid-cols-1 gap-2">
        <label className="mb-1 block text-sm text-gray-600">
          ภาควิชา (ถ้ามี)
        </label>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              disabled={
                noDepartment ||
                !facultyId ||
                deptLoading ||
                departments.length === 0
              }>
              <SelectTrigger className="w-full rounded-xl">
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
              </SelectTrigger>
              <SelectContent>
                {!deptLoading && departments.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    {facultyId ? "ไม่มีข้อมูลภาควิชา" : "โปรดเลือกคณะก่อน"}
                  </SelectItem>
                ) : (
                  departments.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={noDepartment}
              onChange={(e) => {
                setNoDepartment(e.target.checked);
                if (e.target.checked) setDepartmentId("");
              }}
            />
            ไม่มีภาควิชา
          </label>
        </div>
      </div>

      {/* ชื่อสาขา + เวลา */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-gray-600">ชื่อสาขา *</label>
          <input
            type="text"
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={majorName}
            onChange={(e) => setMajorName(e.target.value)}
            placeholder="เช่น สาขาวิศวกรรมคอมพิวเตอร์"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">
            วัน - เวลาในการดำเนินการเรียนการสอน *
          </label>
          <input
            type="text"
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={programTime}
            onChange={(e) => setProgramTime(e.target.value)}
            placeholder='เช่น "sunday", "evening", "เสาร์ - อาทิตย์"'
          />
        </div>
      </div>

      {/* ระดับปริญญา / ตัวย่อ / เงื่อนไขวุฒิ */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* degree_level */}
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            ระดับปริญญา *
          </label>
          <Select
            value={degreeLevel}
            onValueChange={(v: "master" | "doctoral") => setDegreeLevel(v)}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="เลือกระดับปริญญา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="master">ปริญญาโท (master)</SelectItem>
              <SelectItem value="doctoral">ปริญญาเอก (doctoral)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* degree_abbr */}
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            ตัวย่อปริญญา (degree_abbr) *
          </label>
          <input
            type="text"
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={degreeAbbr}
            onChange={(e) => setDegreeAbbr(e.target.value)}
            placeholder={degreeLevel === "master" ? "เช่น วศ.ม." : "เช่น ปร.ด."}
          />
        </div>

        {/* degree_req (optional) */}
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            วุฒิขั้นต่ำที่ต้องจบ (ไม่บังคับ)
          </label>
          <Select
            value={degreeReqSelectValue}
            onValueChange={(v: "none" | "bachelor" | "master") =>
              setDegreeReq(v === "none" ? "" : v)
            }>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="— ไม่ระบุ —" />
            </SelectTrigger>
            <SelectContent>
              {/* ⛔️ ห้ามใช้ value="" */}
              <SelectItem value="none">— ไม่ระบุ —</SelectItem>
              <SelectItem value="bachelor">ปริญญาตรี</SelectItem>
              <SelectItem value="master">ปริญญาโท</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          เปิดใช้งานสาขานี้ (active)
        </label>

        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSave}
          disabled={!canSave || saving || facLoading || deptLoading}>
          {saving ? "กำลังบันทึก..." : "บันทึกสาขา"}
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

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          จัดการคณะ / ภาค / รอบรับสมัคร
        </h1>
        <a href="/" className="text-sm text-blue-600 hover:underline">
          กลับหน้าแรก
        </a>
      </header>

      <Section title="ตั้งค่ารอบสัมภาษณ์">
        <RoundsEditor />
      </Section>

      <Section title="เพิ่มคณะ">
        <FacultyForm />
      </Section>

      <Section title="เพิ่มภาค">
        <DepartmentForm />
      </Section>

      <Section title="เพิ่มสาขา">
        <CapsEditor />
      </Section>

      <Section title="รายการคณะ">
        <FacultyTable />
      </Section>
    </div>
  );
}
