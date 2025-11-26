// src/components/intake/IntakeViewerWithAddModal.tsx
"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAdmissionYears,
  toggleAdmissionActive,
  createAdmission,
  deleteAdmission,
  getAdmissions,
  updateAdmission,
  getAdmissionById,
} from "@/api/admissionService";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import AddDepartmentDialog from "@/components/survey/AddDepartmentDialog";
import { toast } from "sonner";

/* ---------- Types ---------- */
type IntakeMode = "none" | "rounds" | "monthly";
type TermInfo = {
  semester: number;
  academic_year_th: number;
  label: string;
  sort_key: number;
};
type RoundRow = {
  no: number;
  interview_date: string;
  open?: boolean;
  title?: string;
};
type MonthlyRow = {
  month?: number;
  label?: string; // ชื่อเดือน (ไทย)
  interview_date: string;
  open?: boolean;
  title?: string;
};
type IntakeData = {
  _id: string;
  term: TermInfo;
  active: boolean;
  intake_mode: IntakeMode;
  application_window: {
    open_at: string; // full ISO
    close_at: string; // full ISO
    notice?: string;
    calendar_url?: string;
  };
  rounds: RoundRow[];
  monthly: MonthlyRow[];
  meta?: {
    program_id: string | null;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  };
};

/* ---------- Utils ---------- */
const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const formatDateTH = (iso: string) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
    new Date(iso)
  );

const computeLabel = (semester: number, yearTH: number) =>
  `${semester}/${yearTH}`;
const computeSortKey = (semester: number, yearTH: number) =>
  Number((yearTH + semester / 10).toFixed(1));

const toISOStartOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  ).toISOString();
const toISOEndOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  ).toISOString();

const parseISODateLocal = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const toISODateLocal = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(
    2,
    "0"
  )}-${`${d.getDate()}`.padStart(2, "0")}`;

/* ✅ helpers สำหรับ update payload */
const toUTCStartISOFromLocalDate = (dateISO: string) => {
  // "YYYY-MM-DD" -> ISO(UTC) 00:00
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return new Date(dateISO).toISOString();
  const local = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0);
  return local.toISOString();
};
const ensureFullISO = (v: string) =>
  v.includes("T") ? v : toUTCStartISOFromLocalDate(v);
const monthLabelFromDateLike = (v: string) => {
  const dd = v.includes("T") ? new Date(v) : parseISODateLocal(v);
  return MONTHS_TH[dd.getMonth()];
};

// 🔧 FIX: รองรับทั้ง "YYYY-MM-DD" และ ISO เต็ม "YYYY-MM-DDTHH:mm:ss.sssZ"
const fillMonthly = (rows: MonthlyRow[]) =>
  rows.map((m) => {
    const d = m.interview_date.includes("T")
      ? new Date(m.interview_date)
      : parseISODateLocal(m.interview_date);
    const month = m.month ?? d.getMonth() + 1;
    const label = m.label ?? MONTHS_TH[month - 1];
    return { ...m, month, label };
  });

/* ---------- DatePicker ---------- */
function DatePickerField({
  valueISO,
  onChangeISO,
  ariaLabel,
  disabledBefore,
}: {
  valueISO: string;
  onChangeISO: (nextISO: string) => void;
  ariaLabel?: string;
  disabledBefore?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const toLocalDateOnly = (v?: string) => {
    if (!v) return undefined;
    if (v.includes("T")) {
      const d = new Date(v);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return parseISODateLocal(v);
  };

  const date = toLocalDateOnly(valueISO);
  const label = date
    ? `${`${date.getMonth() + 1}`.padStart(
        2,
        "0"
      )} / ${`${date.getDate()}`.padStart(2, "0")} / ${date.getFullYear()}`
    : "เลือกวันที่";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full rounded-xl border px-3 py-2 text-left hover:bg-gray-50"
          aria-label={ariaLabel ?? "เลือกวันที่"}>
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        {(() => {
          const minDate = disabledBefore
            ? toLocalDateOnly(disabledBefore)
            : undefined;

          return (
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d: Date | undefined) => {
                if (!d) return;
                onChangeISO(toISODateLocal(d)); // ส่ง "YYYY-MM-DD"
                setOpen(false);
              }}
              initialFocus
              disabled={minDate ? { before: minDate } : undefined}
            />
          );
        })()}
      </PopoverContent>
    </Popover>
  );
}

/* ---------- สร้างโครงว่าง ---------- */
const thaiYear = () => new Date().getFullYear() + 543;
const makeBlankIntake = (): IntakeData => {
  const today = new Date();
  const sem = 1;
  const yearTH = thaiYear();
  return {
    _id: "",
    term: {
      semester: sem,
      academic_year_th: yearTH,
      label: computeLabel(sem, yearTH),
      sort_key: computeSortKey(sem, yearTH),
    },
    active: true,
    intake_mode: "monthly",
    application_window: {
      open_at: toISOStartOfDayUTC(today),
      close_at: toISOEndOfDayUTC(today),
      notice: "",
      calendar_url: "",
    },
    rounds: [],
    monthly: [],
    meta: { program_id: null },
  };
};

/* ---------- helper แปลงข้อมูลจาก backend ---------- */
const adaptAdmission = (a: any): IntakeData => ({
  _id: a._id ?? "",
  term: a.term ?? {
    semester: 1,
    academic_year_th: new Date().getFullYear() + 543,
    label: "-",
    sort_key: 0,
  },
  active: a.active ?? true,
  intake_mode: (a.intake_mode as IntakeMode) ?? "monthly",
  application_window: a.application_window ?? {
    open_at: toISOStartOfDayUTC(new Date()),
    close_at: toISOEndOfDayUTC(new Date()),
    notice: "",
    calendar_url: "",
  },
  rounds: a.rounds ?? [],
  monthly: (a.monthly ?? []).map((m: any) => ({
    month: undefined,
    label: m.month,
    interview_date: m.interview_date,
    open: m.open ?? true,
    title: m.title,
  })),
  meta: a.meta ?? { program_id: a?.meta?.program_id ?? null },
});

/* =========================================================
   Main Component
   ========================================================= */
export default function IntakeViewerWithAddModal() {
  const [terms, setTerms] = useState<IntakeData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? terms.find((t) => t._id === selectedId) ?? null : null),
    [terms, selectedId]
  );

  // initial fetch (โหลดทั้งหมด + เลือกล่าสุดเป็น default)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAdmissions();
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray((res as any)?.items)) items = (res as any).items;
        else if (Array.isArray((res as any)?.data)) items = (res as any).data;

        const adapted = items.map(adaptAdmission);
        adapted.sort(
          (a: IntakeData, b: IntakeData) =>
            (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0)
        );

        if (!mounted) return;
        setTerms(adapted);
        setSelectedId(adapted[0]?._id ?? null); // default ใช้ล่าสุด
      } catch (err) {
        console.error("Failed to load admissions", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ======== Edit rounds/monthly ======== */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tab, setTab] = useState<"fixed" | "monthly" | "details">("fixed");
  const [roundsDraft, setRoundsDraft] = useState<RoundRow[]>([]);
  const [monthlyDraft, setMonthlyDraft] = useState<MonthlyRow[]>([]);
  const [noticeDraft, setNoticeDraft] = useState<string>("");

  const openEditModal = () => {
    if (!selected) return;
    setRoundsDraft(
      selected.rounds.map((r: any) => ({
        ...r,
        open: r.open ?? true,
        title: r.title ?? (r.no ? `รอบที่ ${r.no}` : ""),
      }))
    );
    setMonthlyDraft(
      selected.monthly.map((m: any) => ({
        ...m,
        open: m.open ?? true,
        title: m.title ?? "",
      }))
    );
    setNoticeDraft(selected.application_window.notice ?? "");
    setEditModalOpen(true);
  };

  const saveEditModal = async () => {
    if (!selected) return;

    const roundsSaved = roundsDraft.map((r) => ({
      ...r,
      open: r.open ?? true,
      title: (r.title ?? "").trim() || (r.no ? `รอบที่ ${r.no}` : ""),
    }));
    const monthlySaved = fillMonthly(
      monthlyDraft.map((m) => ({
        ...m,
        open: m.open ?? true,
        title: (m.title ?? "").trim(),
      }))
    );

    setTerms((prev) =>
      [...prev]
        .map((t) =>
          t._id === selected._id
            ? {
                ...t,
                rounds: roundsSaved,
                monthly: monthlySaved,
                application_window: {
                  ...t.application_window,
                  notice: noticeDraft,
                },
              }
            : t
        )
        .sort((a, b) => b.term.sort_key - a.term.sort_key)
    );
    setEditModalOpen(false);

    const payload: {
      application_window?: {
        open_at: string;
        close_at: string;
        notice?: string;
        calendar_url?: string;
      };
      rounds?: Array<{ no: number; title: string; interview_date: string }>;
      monthly?: Array<{ month: string; title: string; interview_date: string }>;
    } = {
      application_window: {
        open_at: selected.application_window.open_at,
        close_at: selected.application_window.close_at,
        notice: noticeDraft,
        calendar_url: selected.application_window.calendar_url ?? "",
      },
      rounds: roundsSaved
        .filter((r) => r.interview_date)
        .map((r) => ({
          no: r.no,
          title: (r.title ?? "").trim() || (r.no ? `รอบที่ ${r.no}` : ""),
          interview_date: ensureFullISO(r.interview_date),
        })),
      monthly: monthlySaved
        .filter((m) => m.interview_date)
        .map((m) => ({
          month: m.label ?? monthLabelFromDateLike(m.interview_date),
          title: (m.title ?? "").trim(),
          interview_date: ensureFullISO(m.interview_date),
        })),
    };

    try {
      await updateAdmission(selected._id, payload as any);
      toast.success("อัปเดตข้อมูลรอบสัมภาษณ์เรียบร้อยแล้ว");

      // optional refetch
      try {
        const res = await getAdmissions();
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray((res as any)?.items)) items = (res as any).items;
        else if (Array.isArray((res as any)?.data)) items = (res as any).data;

        const adapted = items.map(adaptAdmission);
        adapted.sort(
          (a: IntakeData, b: IntakeData) =>
            (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0)
        );
        setTerms(adapted);
        setSelectedId(selected._id);
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error(err);
      toast.error("อัปเดตไม่สำเร็จ");
    }
  };

  /* ======== Add ======== */
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<IntakeData>(makeBlankIntake());

  const onDeleteSelected = async () => {
    if (!selected) return;
    const ok = window.confirm(
      `ลบภาคการศึกษา ${selected.term.label} (ID: ${selected._id}) ?`
    );
    if (!ok) return;
    try {
      await deleteAdmission(selected._id);
      setTerms((prev) => prev.filter((t) => t._id !== selected._id));
      setSelectedId((prev) => {
        const next = terms.find((t) => t._id !== selected._id)?._id ?? null;
        return next;
      });
      toast.success("ลบภาคการศึกษาเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถลบภาคการศึกษาได้");
    }
  };

  // ✅ ใช้ toggleAdmissionActive เพื่อเปิด/ปิด ภาคการศึกษา
  const onToggleActive = async () => {
    if (!selected) return;
    const currentId = selected._id;
    const currentActive = selected.active;

    // optimistic update
    setTerms((prev) =>
      prev.map((t) =>
        t._id === currentId ? { ...t, active: !currentActive } : t
      )
    );

    try {
      await toggleAdmissionActive(currentId);
      toast.success(
        !currentActive
          ? "เปิดใช้งานภาคการศึกษานี้แล้ว"
          : "ปิดการใช้งานภาคการศึกษานี้แล้ว"
      );
    } catch (err) {
      console.error(err);
      // revert
      setTerms((prev) =>
        prev.map((t) =>
          t._id === currentId ? { ...t, active: currentActive } : t
        )
      );
      toast.error("ไม่สามารถสลับสถานะภาคการศึกษาได้");
    }
  };

  const openAddModal = () => {
    const base = makeBlankIntake();
    setAddDraft(base);
    setAddOpen(true);
  };

  // คำนวณ label/sort_key อัตโนมัติ
  useEffect(() => {
    setAddDraft((s) => {
      const newLabel = computeLabel(s.term.semester, s.term.academic_year_th);
      const newKey = computeSortKey(s.term.semester, s.term.academic_year_th);
      if (s.term.label === newLabel && s.term.sort_key === newKey) return s;
      return { ...s, term: { ...s.term, label: newLabel, sort_key: newKey } };
    });
  }, [addDraft.term.semester, addDraft.term.academic_year_th]);

  const termPreview = useMemo(
    () =>
      `${addDraft.term.semester || ""}/${addDraft.term.academic_year_th || ""}`,
    [addDraft.term.semester, addDraft.term.academic_year_th]
  );
  const toUTCStartISO = (v: string) =>
    v && !v.includes("T") ? toISOStartOfDayUTC(parseISODateLocal(v)) : v;

  const onAddSave = async () => {
    const normalized: IntakeData = {
      ...addDraft,
      rounds: (addDraft.rounds ?? []).map((r) => ({
        ...r,
        open: r.open ?? true,
      })),
      monthly: fillMonthly(
        (addDraft.monthly ?? []).map((m) => ({ ...m, open: m.open ?? true }))
      ),
      meta: {
        program_id: addDraft.meta?.program_id ?? null,
        created_at: addDraft.meta?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: addDraft.meta?.created_by ?? "admin@example.com",
      },
    };

    try {
      const payload = {
        term: normalized.term,
        application_window: {
          open_at: toUTCStartISO(normalized.application_window.open_at),
          close_at: toUTCStartISO(normalized.application_window.close_at),
          notice: noticeDraft,
          calendar_url: normalized.application_window.calendar_url,
        },
        rounds: (normalized.rounds ?? []).map((r: any) => ({
          no: r.no,
          title: r.title,
          interview_date: toUTCStartISO(r.interview_date),
        })),
        monthly: (normalized.monthly ?? []).map((m: any) => {
          let monthName: string | undefined;
          if (typeof (m as any).label === "string" && (m as any).label.trim()) {
            monthName = (m as any).label.trim();
          } else if (typeof (m as any).month === "number") {
            const num = (m as any).month;
            monthName = num >= 1 && num <= 12 ? MONTHS_TH[num - 1] : undefined;
          } else if (m.interview_date) {
            const d = new Date(toUTCStartISO(m.interview_date));
            monthName = MONTHS_TH[d.getMonth()];
          }
          return {
            month: monthName ?? "",
            title: m.title,
            interview_date: toUTCStartISO(m.interview_date),
          };
        }),
      };

      const created = await createAdmission(payload as any);

      try {
        const res = await getAdmissions();
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray((res as any)?.items)) items = (res as any).items;
        else if (Array.isArray((res as any)?.data)) items = (res as any).data;

        const adapted = items.map(adaptAdmission);
        adapted.sort(
          (a: IntakeData, b: IntakeData) =>
            (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0)
        );
        setTerms(adapted);
        setSelectedId(created._id ?? adapted[0]?._id ?? null);
        setAddOpen(false);
        toast.success("สร้างภาคการศึกษาเรียบร้อยแล้ว");
      } catch (err) {
        console.error("Refetch after create failed", err);
        const fallback = adaptAdmission(created);
        setTerms((prev) => {
          const exists = prev.some((t) => t._id === fallback._id);
          const next = exists
            ? prev.map((t) => (t._id === fallback._id ? fallback : t))
            : [...prev, fallback];
          next.sort(
            (a, b) => (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0)
          );
          return next;
        });
        setSelectedId(fallback._id);
        setAddOpen(false);
        toast.success("สร้างภาคการศึกษาเรียบร้อยแล้ว (local)");
      }
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดขณะสร้างภาคการศึกษา");
    }
  };

  /* ======== Display & DDL ปี ======== */
  const formatRange = selected
    ? `${formatDateTH(selected.application_window.open_at)} — ${formatDateTH(
        selected.application_window.close_at
      )}`
    : "";

  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("ทั้งหมด");

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const data: any = await getAdmissionYears();
        setYears(data);
      } catch (error) {
        console.error("Failed to getAdmissionYears", error);
      }
    };
    fetchYears();
  }, []);

  // ✅ เวลาเปลี่ยนปี: "ทั้งหมด" = ใช้ terms เดิม (ล่าสุด), ถ้าเลือกปี → call getAdmissionById(id)
  const handleYearChange = async (value: string) => {
    setSelectedYear(value);

    if (value === "ทั้งหมด") {
      // ถ้ามีภาคที่ active = true → ใช้อันนั้นเป็น "ล่าสุด"
      // ถ้าไม่มี → fallback ไปตัว sort_key สูงสุด (ตัวแรกใน terms)
      setSelectedId(() => {
        if (!terms.length) return null;

        const activeTerm = terms.find((t) => t.active);
        if (activeTerm) return activeTerm._id;

        return terms[0]._id;
      });
      return;
    }

    try {
      const data = await getAdmissionById(value); // value = _id จาก DDL
      console.log("Fetched admission by id:", data);
      const adapted = adaptAdmission(data);

      setTerms((prev) => {
        const others = prev.filter((t) => t._id !== adapted._id);
        const next = [...others, adapted];
        next.sort((a, b) => (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0));
        return next;
      });

      setSelectedId(adapted._id);
    } catch (error) {
      console.error("Failed to load admission by id", error);
      toast.error("ไม่สามารถโหลดข้อมูลภาคการศึกษาที่เลือกได้");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          เลือกภาคการศึกษา:
        </label>
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="เลือกปี" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ทั้งหมด">ล่าสุด</SelectItem>
            {years.map((y) => (
              <SelectItem key={y._id} value={y._id}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium " +
              (selected.active
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                : "bg-gray-100 text-gray-600 ring-1 ring-gray-200")
            }>
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (selected.active ? "bg-blue-500" : "bg-gray-400")
              }
            />
            {selected.active ? "กำลังใช้งาน (master)" : "ไม่ใช้งาน"}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            type="button">
            + เพิ่มภาคจากตัวอย่าง
          </button>
          <button
            onClick={onDeleteSelected}
            disabled={!selected}
            className="rounded-lg border px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button">
            ลบ
          </button>
          <button
            onClick={onToggleActive}
            disabled={!selected}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button">
            {selected?.active ? "ปิดภาคนี้" : "เปิดใช้งานภาคนี้"}
          </button>
          <button
            onClick={openEditModal}
            disabled={!selected}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button">
            จัดการรอบสัมภาษณ์
          </button>
        </div>
      </div>

      {/* Meta */}
      {selected && (
        <div className="rounded-xl border p-4 space-y-2">
          <h2 className="text-lg font-semibold">
            ภาคการศึกษา {selected.term.label}
          </h2>
          {selected.application_window.notice && (
            <p className="text-sm text-gray-700">
              {selected.application_window.notice}
            </p>
          )}

          <p className="text-sm text-gray-600">
            ระยะเวลากรอกข้อมูล: {formatRange}
          </p>
          {selected.application_window.calendar_url && (
            <a
              href={selected.application_window.calendar_url}
              className="text-sm text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer">
              ปฏิทินการรับสมัคร
            </a>
          )}
        </div>
      )}

      {/* Fixed table */}
      {selected && (
        <div className="rounded-xl border">
          <div className="flex items-center justify-between border-b p-4">
            <div className="font-medium">รอบสัมภาษณ์ (Fixed)</div>
            <div className="text-sm text-gray-500">
              รวม {selected.rounds.length} รอบ
            </div>
          </div>
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-2 border-b">รอบที่</th>
                <th className="px-4 py-2 border-b">หัวข้อ</th>
                <th className="px-4 py-2 border-b">วันสัมภาษณ์</th>
                <th className="px-4 py-2 border-b">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {selected.rounds.length ? (
                selected.rounds.map((r, i) => {
                  const isOpen = r.open ?? true;
                  return (
                    <tr key={`${r.no}-${i}`} className="text-sm">
                      <td className="px-4 py-2 border-b">{r.no}</td>
                      <td className="px-4 py-2 border-b">
                        {(r as any).title ?? `รอบที่ ${r.no}`}
                      </td>
                      <td className="px-4 py-2 border-b">
                        {formatDateTH(r.interview_date)}
                      </td>
                      <td className="px-4 py-2 border-b">
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium " +
                            (isOpen
                              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                              : "bg-gray-100 text-gray-600 ring-1 ring-gray-200")
                          }>
                          <span
                            className={
                              "h-1.5 w-1.5 rounded-full " +
                              (isOpen ? "bg-green-500" : "bg-gray-400")
                            }
                          />
                          {isOpen ? "เปิดรับ" : "ปิดรับ"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-gray-500">
                    ไม่มีข้อมูลรอบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly table */}
      {selected && (
        <div className="rounded-xl border">
          <div className="flex items-center justify-between border-b p-4">
            <div className="font-medium">รอบรายเดือน (Monthly)</div>
            <div className="text-sm text-gray-500">
              รวม {selected.monthly.length} เดือน
            </div>
          </div>
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-2 border-b">เดือน</th>
                <th className="px-4 py-2 border-b">หัวข้อ</th>
                <th className="px-4 py-2 border-b">วันสัมภาษณ์</th>
                <th className="px-4 py-2 border-b">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {fillMonthly(selected.monthly).length ? (
                fillMonthly(selected.monthly).map((m, i) => {
                  const isOpen = m.open ?? true;
                  return (
                    <tr key={`${m.interview_date}-${i}`} className="text-sm">
                      <td className="px-4 py-2 border-b">{m.label}</td>
                      <td className="px-4 py-2 border-b">{m.title ?? ""}</td>
                      <td className="px-4 py-2 border-b">
                        {formatDateTH(m.interview_date)}
                      </td>
                      <td className="px-4 py-2 border-b">
                        <span
                          className={
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium " +
                            (isOpen
                              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                              : "bg-gray-100 text-gray-600 ring-1 ring-gray-200")
                          }>
                          <span
                            className={
                              "h-1.5 w-1.5 rounded-full " +
                              (isOpen ? "bg-green-500" : "bg-gray-400")
                            }
                          />
                          {isOpen ? "เปิดรับ" : "ปิดรับ"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-center text-gray-500">
                    ไม่มีข้อมูลรายเดือน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- Edit Modal ---------- */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle>จัดการรอบสัมภาษณ์</DialogTitle>
            <DialogDescription>
              ภาคการศึกษา:{" "}
              <span className="font-medium">{selected?.term.label ?? "-"}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex items-center gap-2">
            {(["fixed", "monthly", "details"] as const).map((k) => {
              const is = tab === k;
              return (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={
                    "rounded-full border px-3 py-1.5 text-sm " +
                    (is
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:bg-gray-50")
                  }>
                  {k === "fixed"
                    ? "Rounds (เป็นรอบ)"
                    : k === "monthly"
                    ? "Monthly (รายเดือน)"
                    : "รายละเอียด"}
                </button>
              );
            })}
          </div>

          <div className="max-h-[60vh] overflow-y-auto pt-3 space-y-3">
            {tab === "fixed" ? (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const nextNo = roundsDraft.length
                        ? Math.max(...roundsDraft.map((r) => r.no)) + 1
                        : 1;
                      setRoundsDraft((s) => [
                        ...s,
                        {
                          no: nextNo,
                          interview_date: "",
                          open: true,
                          title: `รอบที่ ${nextNo}`,
                        },
                      ]);
                    }}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                    + เพิ่มรอบ
                  </button>
                </div>

                {roundsDraft.length ? (
                  roundsDraft.map((r, idx) => (
                    <div
                      key={idx}
                      className="grid gap-3 md:grid-cols-12 rounded-lg border bg-slate-50/40 p-3">
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">รอบที่</label>
                        <input
                          className="w-full rounded-xl border px-3 py-2"
                          type="number"
                          min={1}
                          value={r.no}
                          onChange={(e) =>
                            setRoundsDraft((arr) =>
                              arr.map((it, i) =>
                                i === idx
                                  ? { ...it, no: Number(e.target.value || 0) }
                                  : it
                              )
                            )
                          }
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-xs text-gray-600">หัวข้อ</label>
                        <input
                          className="w-full rounded-xl border px-3 py-2"
                          type="text"
                          value={r.title ?? ""}
                          placeholder={`รอบที่ ${r.no || idx + 1}`}
                          onChange={(e) =>
                            setRoundsDraft((arr) =>
                              arr.map((it, i) =>
                                i === idx
                                  ? { ...it, title: e.target.value }
                                  : it
                              )
                            )
                          }
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-xs text-gray-600">
                          วันสัมภาษณ์ {r.interview_date}
                        </label>
                        <DatePickerField
                          valueISO={r.interview_date}
                          onChangeISO={(iso) =>
                            setRoundsDraft((arr) =>
                              arr.map((it, i) =>
                                i === idx ? { ...it, interview_date: iso } : it
                              )
                            )
                          }
                          ariaLabel="เลือกวันสัมภาษณ์"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={r.open ?? true}
                            onChange={(e) =>
                              setRoundsDraft((arr) =>
                                arr.map((it, i) =>
                                  i === idx
                                    ? { ...it, open: e.target.checked }
                                    : it
                                )
                              )
                            }
                          />
                          เปิดรับ
                        </label>
                      </div>
                      <div className="md:col-span-12 text-right">
                        <button
                          onClick={() =>
                            setRoundsDraft((arr) =>
                              arr.filter((_, i) => i !== idx)
                            )
                          }
                          className="rounded-lg border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded border border-dashed p-4 text-center text-sm text-gray-500">
                    ยังไม่มีรอบ — กด “เพิ่มรอบ”
                  </div>
                )}
              </>
            ) : tab === "monthly" ? (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      setMonthlyDraft((s) => [
                        ...s,
                        { interview_date: "", open: true, title: "" },
                      ])
                    }
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                    + เพิ่มเดือน
                  </button>
                </div>

                {monthlyDraft.length ? (
                  monthlyDraft.map((m, idx) => {
                    const d = m.interview_date
                      ? m.interview_date.includes("T")
                        ? new Date(m.interview_date)
                        : parseISODateLocal(m.interview_date)
                      : undefined;
                    const mm = d ? d.getMonth() + 1 : undefined;
                    const label =
                      m.label ?? (mm ? MONTHS_TH[mm - 1] : undefined);

                    return (
                      <div
                        key={idx}
                        className="grid gap-3 md:grid-cols-12 rounded-lg border bg-slate-50/40 p-3">
                        <div className="md:col-span-5">
                          <label className="text-xs text-gray-600">
                            วันสัมภาษณ์
                          </label>
                          <DatePickerField
                            valueISO={m.interview_date}
                            onChangeISO={(iso) =>
                              setMonthlyDraft((arr) =>
                                arr.map((it, i) =>
                                  i === idx
                                    ? { ...it, interview_date: iso }
                                    : it
                                )
                              )
                            }
                            ariaLabel="เลือกวันสัมภาษณ์รายเดือน"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-xs text-gray-600">เดือน</label>
                          <div className="w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700">
                            {label ? `${label}${mm ? ` (${mm})` : ""}` : "—"}
                          </div>
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-xs text-gray-600">
                            หัวข้อ
                          </label>
                          <input
                            className="w-full rounded-xl border px-3 py-2"
                            type="text"
                            value={m.title ?? ""}
                            placeholder="เช่น รอบมกราคม"
                            onChange={(e) =>
                              setMonthlyDraft((arr) =>
                                arr.map((it, i) =>
                                  i === idx
                                    ? { ...it, title: e.target.value }
                                    : it
                                )
                              )
                            }
                          />
                        </div>
                        <div className="md:col-span-12 flex items-center justify-between">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              checked={m.open ?? true}
                              onChange={(e) =>
                                setMonthlyDraft((arr) =>
                                  arr.map((it, i) =>
                                    i === idx
                                      ? { ...it, open: e.target.checked }
                                      : it
                                  )
                                )
                              }
                            />
                            เปิดรับ
                          </label>
                          <button
                            onClick={() =>
                              setMonthlyDraft((arr) =>
                                arr.filter((_, i) => i !== idx)
                              )
                            }
                            className="rounded-lg border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                            ลบ
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded border border-dashed p-4 text-center text-sm text-gray-500">
                    ยังไม่มีเดือน — กด “เพิ่มเดือน”
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm text-gray-700">รายละเอียด</label>
                <textarea
                  className="w-full min-h-[140px] rounded-xl border px-3 py-2 text-sm"
                  value={noticeDraft}
                  onChange={(e) => setNoticeDraft(e.target.value)}
                  placeholder="เช่น ข้อกำหนดเพิ่มเติมสำหรับรอบสัมภาษณ์ หรือคำอธิบายภาคการศึกษา"
                />
                <p className="text-xs text-gray-500">
                  ข้อความนี้จะถูกบันทึกเป็นรายละเอียด (notice) ของภาคการศึกษานี้
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3">
            <button
              onClick={() => setEditModalOpen(false)}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              type="button">
              ยกเลิก
            </button>
            <button
              onClick={saveEditModal}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              type="button">
              บันทึก
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Add New Term From Example ---------- */}
      <AddDepartmentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        draft={addDraft}
        setDraft={setAddDraft}
        onSave={onAddSave}
      />
    </div>
  );
}
