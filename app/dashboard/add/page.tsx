"use client";

import React, { useMemo, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export type Faculty = {
  id: string;
  nameTH: string;
  nameEN?: string;
  slug: string;
  active?: boolean;
};

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
  crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}`;
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
  onSubmit?: () => void;
}
function FacultyForm({ onSubmit }: FacultyFormProps) {
  const [nameTH, setNameTH] = useState("");
  const [nameEN, setNameEN] = useState("");
  const [slug, setSlug] = useState("");

  const canSubmit = useMemo(
    () => nameTH.trim().length > 0 && slug.trim().length > 0,
    [nameTH, slug]
  );

  return (
    <form
      className="grid gap-4 md:grid-cols-3"
      onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">ชื่อคณะ (ไทย) *</label>
        <input
          className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="คณะวิศวกรรมศาสตร์"
          value={nameTH}
          onChange={(e) => setNameTH(e.target.value)}
          aria-required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">ชื่อคณะ (อังกฤษ)</label>
        <input
          className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Faculty of Engineering"
          value={nameEN}
          onChange={(e) => setNameEN(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">Slug *</label>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">/</span>
          <input
            className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="engineering"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())
            }
            aria-required
          />
        </div>
        <p className="text-xs text-gray-500">
          ใช้ตัวอักษร a–z, ตัวเลข, และขีดกลาง
        </p>
      </div>

      <div className="md:col-span-3 flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSubmit}>
          เพิ่มคณะ
        </button>
      </div>
    </form>
  );
}

/* ===========================
 * Department Form (UI only)
 * =========================== */
interface DepartmentFormProps {
  faculties?: Faculty[];
  onSubmit?: () => void;
}
function DepartmentForm({ faculties, onSubmit }: DepartmentFormProps) {
  const [facultyId, setFacultyId] = useState("");
  const [nameTH, setNameTH] = useState("");
  const [nameEN, setNameEN] = useState("");

  const canSubmit = useMemo(
    () => facultyId.trim().length > 0 && nameTH.trim().length > 0,
    [facultyId, nameTH]
  );

  return (
    <form
      className="grid gap-4 md:grid-cols-3"
      onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1 md:col-span-1">
        <label className="text-sm text-gray-600">เลือกคณะ *</label>
        <Select value={facultyId} onValueChange={(v) => setFacultyId(v)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="— เลือกคณะ —" />
          </SelectTrigger>
          <SelectContent>
            {(faculties ?? []).map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nameTH}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">ชื่อภาค/สาขา (ไทย) *</label>
        <input
          className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ภาควิชาวิศวกรรมคอมพิวเตอร์"
          value={nameTH}
          onChange={(e) => setNameTH(e.target.value)}
          aria-required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">ชื่อภาค/สาขา (อังกฤษ)</label>
        <input
          className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Department of Computer Engineering"
          value={nameEN}
          onChange={(e) => setNameEN(e.target.value)}
        />
      </div>

      <div className="md:col-span-3 flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSubmit}>
          เพิ่มภาค/สาขา
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
function RoundsEditor({ modeOptions }: RoundsEditorProps) {
  const modes = modeOptions ?? [
    { id: "fixed", label: "สัมภาษณ์เป็นรอบ" },
    { id: "monthly", label: "สัมภาษณ์ทุกเดือน" },
  ];

  const [active, setActive] = useState<"fixed" | "monthly">("fixed");

  // draft
  const [fixedDraft, setFixedDraft] = useState({
    name: "",
    date: "",
    isOpen: true,
  });
  const [monthlyDraft, setMonthlyDraft] = useState({
    month: "",
    year: String(new Date().getFullYear()),
    date: "",
    isOpen: true,
  });

  // lists
  const [fixedRounds, setFixedRounds] = useState<FixedRound[]>([]);
  const [monthlyRounds, setMonthlyRounds] = useState<MonthlyRound[]>([]);

  const canAddFixed =
    fixedDraft.name.trim() !== "" && fixedDraft.date.trim() !== "";
  const canAddMonthly =
    monthlyDraft.month !== "" &&
    monthlyDraft.year.trim() !== "" &&
    monthlyDraft.date.trim() !== "";

  const addFixed = () => {
    if (!canAddFixed) return;
    setFixedRounds((prev) => [
      ...prev,
      {
        id: uid("fx"),
        name: fixedDraft.name.trim(),
        date: fixedDraft.date,
        isOpen: fixedDraft.isOpen,
      },
    ]);
    setFixedDraft({ name: "", date: "", isOpen: true });
  };

  const addMonthly = () => {
    if (!canAddMonthly) return;
    setMonthlyRounds((prev) => [
      ...prev,
      {
        id: uid("mo"),
        month: Number(monthlyDraft.month),
        year: monthlyDraft.year.trim(),
        date: monthlyDraft.date,
        isOpen: monthlyDraft.isOpen,
      },
    ]);
    setMonthlyDraft({
      month: "",
      year: String(new Date().getFullYear()),
      date: "",
      isOpen: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">รูปแบบการรับสมัคร:</span>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => {
            const isActive = active === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(m.id)}
                className={
                  "rounded-full px-3 py-1.5 text-sm border transition " +
                  (isActive
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:bg-gray-50")
                }
                aria-pressed={isActive}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed */}
      <div
        className={
          "rounded-xl border p-4 " +
          (active === "fixed" ? "" : "pointer-events-none opacity-50")
        }>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">รอบสัมภาษณ์ (Fixed)</h3>
          <button
            type="button"
            disabled={!canAddFixed}
            onClick={addFixed}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
            + เพิ่มรอบ
          </button>
        </div>

        {/* Draft row */}
        <div className="mb-3 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="ชื่อรอบ เช่น รอบที่ 1"
            value={fixedDraft.name}
            onChange={(e) =>
              setFixedDraft((s) => ({ ...s, name: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && addFixed()}
          />
          <input
            className="rounded-xl border px-3 py-2"
            type="date"
            value={fixedDraft.date}
            onChange={(e) =>
              setFixedDraft((s) => ({ ...s, date: e.target.value }))
            }
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={fixedDraft.isOpen}
              onChange={(e) =>
                setFixedDraft((s) => ({ ...s, isOpen: e.target.checked }))
              }
            />
            เปิดรับ
          </label>
          <div className="text-right">
            <button
              type="button"
              disabled
              className="rounded-lg border px-3 py-1.5 text-sm text-red-400">
              ลบ
            </button>
          </div>
        </div>

        {/* Added rows */}
        <div className="space-y-3">
          {fixedRounds.map((r) => (
            <div key={r.id} className="grid gap-3 md:grid-cols-4">
              <input
                className="rounded-xl border px-3 py-2"
                value={r.name}
                onChange={(e) =>
                  setFixedRounds((arr) =>
                    arr.map((it) =>
                      it.id === r.id ? { ...it, name: e.target.value } : it
                    )
                  )
                }
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="date"
                value={r.date}
                onChange={(e) =>
                  setFixedRounds((arr) =>
                    arr.map((it) =>
                      it.id === r.id ? { ...it, date: e.target.value } : it
                    )
                  )
                }
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={r.isOpen}
                  onChange={(e) =>
                    setFixedRounds((arr) =>
                      arr.map((it) =>
                        it.id === r.id
                          ? { ...it, isOpen: e.target.checked }
                          : it
                      )
                    )
                  }
                />
                เปิดรับ
              </label>
              <div className="text-right">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() =>
                    setFixedRounds((arr) => arr.filter((it) => it.id !== r.id))
                  }>
                  ลบ
                </button>
              </div>
            </div>
          ))}
          {fixedRounds.length === 0 && (
            <div className="rounded border border-dashed p-4 text-center text-sm text-gray-500">
              ยังไม่มีรอบ — กรอกข้อมูล แล้วกด “เพิ่มรอบ”
            </div>
          )}
        </div>
      </div>

      {/* Monthly */}
      <div
        className={
          "rounded-xl border p-4 " +
          (active === "monthly" ? "" : "pointer-events-none opacity-50")
        }>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">รอบรายเดือน (Monthly)</h3>
          <button
            type="button"
            disabled={!canAddMonthly}
            onClick={addMonthly}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60">
            + เพิ่มเดือน
          </button>
        </div>

        {/* Draft row */}
        <div className="mb-3 grid gap-3 md:grid-cols-5">
          <select
            className="rounded-xl border px-3 py-2"
            value={monthlyDraft.month}
            onChange={(e) =>
              setMonthlyDraft((s) => ({ ...s, month: e.target.value }))
            }>
            <option value="">เลือกเดือน</option>
            {MONTHS_TH.map((m) => (
              <option key={m.v} value={m.v}>
                {m.l}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border px-3 py-2"
            type="number"
            placeholder="ปี (ค.ศ.)"
            value={monthlyDraft.year}
            onChange={(e) =>
              setMonthlyDraft((s) => ({ ...s, year: e.target.value }))
            }
          />
          <input
            className="rounded-xl border px-3 py-2"
            type="date"
            value={monthlyDraft.date}
            onChange={(e) =>
              setMonthlyDraft((s) => ({ ...s, date: e.target.value }))
            }
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={monthlyDraft.isOpen}
              onChange={(e) =>
                setMonthlyDraft((s) => ({ ...s, isOpen: e.target.checked }))
              }
            />
            เปิดรับ
          </label>
          <div className="text-right">
            <button
              type="button"
              disabled
              className="rounded-lg border px-3 py-1.5 text-sm text-red-400">
              ลบ
            </button>
          </div>
        </div>

        {/* Added rows */}
        <div className="space-y-3">
          {monthlyRounds.map((r) => (
            <div key={r.id} className="grid gap-3 md:grid-cols-5">
              <select
                className="rounded-xl border px-3 py-2"
                value={r.month}
                onChange={(e) =>
                  setMonthlyRounds((arr) =>
                    arr.map((it) =>
                      it.id === r.id
                        ? { ...it, month: Number(e.target.value) }
                        : it
                    )
                  )
                }>
                {MONTHS_TH.map((m) => (
                  <option key={m.v} value={m.v}>
                    {m.l}
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                value={r.year}
                onChange={(e) =>
                  setMonthlyRounds((arr) =>
                    arr.map((it) =>
                      it.id === r.id ? { ...it, year: e.target.value } : it
                    )
                  )
                }
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="date"
                value={r.date}
                onChange={(e) =>
                  setMonthlyRounds((arr) =>
                    arr.map((it) =>
                      it.id === r.id ? { ...it, date: e.target.value } : it
                    )
                  )
                }
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={r.isOpen}
                  onChange={(e) =>
                    setMonthlyRounds((arr) =>
                      arr.map((it) =>
                        it.id === r.id
                          ? { ...it, isOpen: e.target.checked }
                          : it
                      )
                    )
                  }
                />
                เปิดรับ
              </label>
              <div className="text-right">
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() =>
                    setMonthlyRounds((arr) =>
                      arr.filter((it) => it.id !== r.id)
                    )
                  }>
                  ลบ
                </button>
              </div>
            </div>
          ))}
          {monthlyRounds.length === 0 && (
            <div className="rounded border border-dashed p-4 text-center text-sm text-gray-500">
              ยังไม่มีเดือน — กรอกข้อมูล แล้วกด “เพิ่มเดือน”
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================
 * Caps Editor (with Department DDL)
 * =========================== */
interface CapsEditorProps {
  departments: DepartmentOption[];
  departmentId: string;
  onDepartmentChange?: (id: string) => void;
  majorName: string;
  onMajorChange?: (name: string) => void;
  value: Caps;
  onChange?: (caps: Caps) => void;
  usedMasters?: number;
  usedDoctoral?: number;
}
function CapsEditor({
  departments,
  departmentId,
  onDepartmentChange,
  majorName,
  onMajorChange,
  value,
  onChange,
  usedMasters = 0,
  usedDoctoral = 0,
}: CapsEditorProps) {
  const remainMasters = Math.max(0, value.maxMasters - usedMasters);
  const remainDoctoral = Math.max(0, value.maxDoctoral - usedDoctoral);

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <p className="font-medium">
        กำหนดเพดานจำนวนรับสูงสุดของสาขา (ตามภาควิชา)
      </p>

      {/* DDL ภาควิชา */}
      <div>
        <label className="mb-1 block text-sm text-gray-600">ภาควิชา *</label>
        <Select
          value={departmentId}
          onValueChange={(v) => onDepartmentChange?.(v)}
          disabled={departments.length === 0}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue placeholder="— เลือกภาควิชา —" />
          </SelectTrigger>

          <SelectContent>
            {departments.length > 0 ? (
              departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nameTH}
                </SelectItem>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                ไม่มีข้อมูลภาควิชา
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* ชื่อสาขา */}
      <div>
        <label className="mb-1 block text-sm text-gray-600">ชื่อสาขา *</label>
        <input
          type="text"
          className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={majorName}
          onChange={(e) => onMajorChange?.(e.target.value)}
          placeholder="เช่น สาขาวิศวกรรมคอมพิวเตอร์"
          aria-required
        />
      </div>

      {/* โควตา โท/เอก */}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            โท (สูงสุด)
          </label>
          <input
            type="number"
            min={0}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value.maxMasters}
            onChange={(e) =>
              onChange?.({
                ...value,
                maxMasters: clamp(Number(e.target.value)),
              })
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            ใช้ไป {usedMasters} คน • คงเหลือ {remainMasters} คน
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">
            เอก (สูงสุด)
          </label>
          <input
            type="number"
            min={0}
            className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value.maxDoctoral}
            onChange={(e) =>
              onChange?.({
                ...value,
                maxDoctoral: clamp(Number(e.target.value)),
              })
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            ใช้ไป {usedDoctoral} คน • คงเหลือ {remainDoctoral} คน
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===========================
 * Faculty Table (UI only)
 * =========================== */
function FacultyTable({ items }: { items?: Faculty[] }) {
  const rows = items ?? [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="border-b px-3 py-2">ชื่อคณะ (ไทย)</th>
            <th className="border-b px-3 py-2">ชื่อคณะ (อังกฤษ)</th>
            <th className="border-b px-3 py-2">Slug</th>
            <th className="border-b px-3 py-2">สถานะ</th>
            <th className="border-b px-3 py-2 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="hover:bg-gray-50">
              <td className="border-b px-3 py-2">{f.nameTH}</td>
              <td className="border-b px-3 py-2">{f.nameEN ?? "-"}</td>
              <td className="border-b px-3 py-2 text-gray-600">{f.slug}</td>
              <td className="border-b px-3 py-2">
                {f.active === false ? (
                  <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                    inactive
                  </span>
                ) : (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    active
                  </span>
                )}
              </td>
              <td className="border-b px-3 py-2 text-right">
                <div className="inline-flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border px-3 py-1.5 hover:bg-gray-50">
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-red-600 hover:bg-red-50">
                    ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                ไม่มีข้อมูลคณะ
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===========================
 * Page Composition (UI only)
 * =========================== */
export default function FacultyAdminPage() {
  const mockFaculties: Faculty[] = [
    {
      id: "eng",
      nameTH: "คณะวิศวกรรมศาสตร์",
      nameEN: "Faculty of Engineering",
      slug: "engineering",
      active: true,
    },
    {
      id: "sci",
      nameTH: "คณะวิทยาศาสตร์",
      nameEN: "Faculty of Science",
      slug: "science",
      active: true,
    },
  ];

  const departments: DepartmentOption[] = [
    { id: "cpe", nameTH: "ภาควิชาวิศวกรรมคอมพิวเตอร์" },
    { id: "eee", nameTH: "ภาควิชาวิศวกรรมไฟฟ้า" },
    { id: "che", nameTH: "ภาควิชาวิศวกรรมเคมี" },
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

      <Section title="เพิ่มคณะ">
        <FacultyForm />
      </Section>

      <Section title="เพิ่มภาค/สาขา">
        <DepartmentForm faculties={mockFaculties} />
      </Section>

      <Section title="กำหนดสาขาและโควตารับ (Master Data)">
        <CapsEditor
          departments={departments}
          departmentId={deptId}
          onDepartmentChange={setDeptId}
          majorName={majorName}
          onMajorChange={setMajorName}
          value={caps}
          onChange={setCaps}
        />
      </Section>

      <Section title="ตั้งค่ารอบสัมภาษณ์">
        <RoundsEditor />
      </Section>

      <Section title="รายการคณะ">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">ตัวอย่างข้อมูล</span>
          <div className="flex gap-2">
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="ค้นหาคณะ..."
            />
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
              ค้นหา
            </button>
          </div>
        </div>
        <FacultyTable items={mockFaculties} />
      </Section>
    </div>
  );
}
