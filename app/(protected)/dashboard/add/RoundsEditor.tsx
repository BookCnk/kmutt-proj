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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

import {
  createAdmission,
  deleteAdmission,
  getAdmissions,
  updateAdmission,
} from "@/api/admissionService";
import { toast } from "sonner";

/* ---------- Types ---------- */
type IntakeMode = "none" | "rounds" | "monthly";
type TermInfo = {
  semester: number;
  academic_year_th: number;
  label: string;
  sort_key: number;
};
type RoundRow = { no: number; interview_date: string; open?: boolean };
type MonthlyRow = {
  month?: number;
  label?: string;
  interview_date: string;
  open?: boolean;
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

const intakeModeLabel = (m: IntakeMode) =>
  m === "none"
    ? "ไม่กำหนด"
    : m === "rounds"
    ? "สัมภาษณ์เป็นรอบ"
    : "สัมภาษณ์รายเดือน";

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

// Convert full ISO UTC -> local Date (keep calendar day)
const parseUTCDateToLocalDate = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// Extract "HH:MM" from ISO
const getTimeFromISO = (iso: string) => {
  try {
    const d = new Date(iso);
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "00:00";
  }
};

// Combine local date "YYYY-MM-DD" + "HH:MM" -> ISO(UTC)
const localDateAndTimeToISOUTC = (dateISO: string, timeHHMM: string) => {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map((v) => Number(v || 0));
  const local = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0);
  return local.toISOString();
};

const fillMonthly = (rows: MonthlyRow[]) =>
  rows.map((m) => {
    const d = parseISODateLocal(m.interview_date);
    const month = m.month ?? d.getMonth() + 1;
    const label = m.label ?? MONTHS_TH[month - 1];
    return { ...m, month, label };
  });

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
  const date = valueISO ? parseISODateLocal(valueISO) : undefined;
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
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d: Date | undefined) => {
            if (!d) return;
            onChangeISO(toISODateLocal(d));
            setOpen(false);
          }}
          initialFocus
          disabled={
            disabledBefore
              ? { before: parseISODateLocal(disabledBefore) }
              : undefined
          }
        />
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

  // initial fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAdmissions();
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray((res as any)?.items)) items = (res as any).items;
        else if (Array.isArray((res as any)?.data)) items = (res as any).data;
        const adapt = (a: any): IntakeData => ({
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
            open: true,
          })),
          meta: a.meta ?? { program_id: a?.meta?.program_id ?? null },
        });
        const adapted = items.map(adapt);
        adapted.sort(
          (a: IntakeData, b: IntakeData) =>
            (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0)
        );
        if (!mounted) return;
        setTerms(adapted);
        setSelectedId(adapted[0]?._id ?? null);
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
  const [tab, setTab] = useState<"fixed" | "monthly">("fixed");
  const [roundsDraft, setRoundsDraft] = useState<RoundRow[]>([]);
  const [monthlyDraft, setMonthlyDraft] = useState<MonthlyRow[]>([]);

  const openEditModal = () => {
    if (!selected) return;
    setRoundsDraft(
      selected.rounds.map((r) => ({ ...r, open: r.open ?? true }))
    );
    setMonthlyDraft(
      selected.monthly.map((m) => ({ ...m, open: m.open ?? true }))
    );
    setEditModalOpen(true);
  };

  // ✅ ส่ง payload ตาม UpdateAdmissionDto เท่านั้น
  const saveEditModal = async () => {
    if (!selected) return;

    // อัปเดต state (optimistic UI)
    const roundsSaved = roundsDraft.map((r) => ({
      ...r,
      open: r.open ?? true,
    }));
    const monthlySaved = fillMonthly(
      monthlyDraft.map((m) => ({ ...m, open: m.open ?? true }))
    );
    setTerms((prev) =>
      [...prev]
        .map((t) =>
          t._id === selected._id
            ? { ...t, rounds: roundsSaved, monthly: monthlySaved }
            : t
        )
        .sort((a, b) => b.term.sort_key - a.term.sort_key)
    );
    setEditModalOpen(false);

    // --- Build UpdateAdmissionDto payload ---
    const payload: {
      application_window?: {
        open_at: string;
        close_at: string;
        notice?: string;
        calendar_url?: string;
      };
      rounds?: Array<{ no: number; interview_date: string }>;
      monthly?: Array<{ month: string; interview_date: string }>;
    } = {
      application_window: {
        open_at: selected.application_window.open_at,
        close_at: selected.application_window.close_at,
        notice: selected.application_window.notice ?? "",
        calendar_url: selected.application_window.calendar_url ?? "",
      },
      rounds: roundsSaved
        .filter((r) => r.interview_date)
        .map((r) => ({
          no: r.no,
          interview_date: ensureFullISO(r.interview_date),
        })),
      monthly: monthlySaved
        .filter((m) => m.interview_date)
        .map((m) => ({
          month: m.label ?? monthLabelFromDateLike(m.interview_date),
          interview_date: ensureFullISO(m.interview_date),
        })),
    };

    try {
      await updateAdmission(selected._id, payload as any);
      toast.success("อัปเดตข้อมูลรอบสัมภาษณ์เรียบร้อยแล้ว");

      // (optional) refetch
      try {
        const res = await getAdmissions();
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray((res as any)?.items)) items = (res as any).items;
        else if (Array.isArray((res as any)?.data)) items = (res as any).data;
        const adapt = (a: any): IntakeData => ({
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
            open: true,
          })),
          meta: a.meta ?? { program_id: a?.meta?.program_id ?? null },
        });
        const adapted = items.map(adapt);
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

  /* ======== Add (เหมือนเดิม) ======== */
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
      // CreateAdmissionDto payload (เหมือนเดิม)
      const payload = {
        term: normalized.term,
        active: normalized.active,
        intake_mode: normalized.intake_mode,
        application_window: normalized.application_window,
        rounds: normalized.rounds,
        monthly: (normalized.monthly ?? []).map((m) => ({
          month:
            m.label ??
            (typeof m.month === "number"
              ? MONTHS_TH[(m.month || 1) - 1]
              : undefined),
          interview_date: m.interview_date,
        })),
        meta: normalized.meta,
      };

      const created = await createAdmission(payload as any);

      try {
        const res = await getAdmissions();
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray((res as any)?.items)) items = (res as any).items;
        else if (Array.isArray((res as any)?.data)) items = (res as any).data;

        const adapt = (a: any): IntakeData => ({
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
            open: true,
          })),
          meta: a.meta ?? { program_id: a?.meta?.program_id ?? null },
        });

        const adapted = items.map(adapt);
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
        const fallback: IntakeData = {
          _id: created._id ?? "",
          term: created.term ?? {
            semester: 1,
            academic_year_th: new Date().getFullYear() + 543,
            label: "-",
            sort_key: 0,
          },
          active: created.active ?? true,
          intake_mode: (created.intake_mode as IntakeMode) ?? "monthly",
          application_window: created.application_window ?? {
            open_at: toISOStartOfDayUTC(new Date()),
            close_at: toISOEndOfDayUTC(new Date()),
            notice: "",
            calendar_url: "",
          },
          rounds: created.rounds ?? [],
          monthly: (created.monthly ?? []).map((m: any) => ({
            month: undefined,
            label: m.month,
            interview_date: m.interview_date,
            open: true,
          })),
          meta: {
            program_id: created?.meta?.program_id ?? null,
            created_at: created?.meta?.created_at,
            updated_at: created?.meta?.updated_at,
            created_by: created?.meta?.created_by,
          },
        };
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

  /* ======== Display ======== */
  const formatRange = selected
    ? `${formatDateTH(selected.application_window.open_at)} — ${formatDateTH(
        selected.application_window.close_at
      )}`
    : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          เลือกภาคการศึกษา:
        </label>

        {terms.length ? (
          <select
            className="rounded-lg border px-3 py-2"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.term.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-gray-500">ยังไม่มีข้อมูล</span>
        )}

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
            โหมดรับสมัคร:{" "}
            <span className="font-medium">
              {intakeModeLabel(selected.intake_mode)}
            </span>
          </p>
          <p className="text-sm text-gray-600">ช่วงสมัคร: {formatRange}</p>
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
                <th className="px-4 py-2 border-b">วันสัมภาษณ์</th>
                <th className="px-4 py-2 border-b">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {selected.rounds.length ? (
                selected.rounds.map((r) => {
                  const isOpen = r.open ?? true;
                  return (
                    <tr key={r.no} className="text-sm">
                      <td className="px-4 py-2 border-b">{r.no}</td>
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
                    colSpan={3}
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
                <th className="px-4 py-2 border-b">วันสัมภาษณ์</th>
                <th className="px-4 py-2 border-b">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {fillMonthly(selected.monthly).length ? (
                fillMonthly(selected.monthly).map((m) => {
                  const isOpen = m.open ?? true;
                  return (
                    <tr key={m.interview_date} className="text-sm">
                      <td className="px-4 py-2 border-b">{m.label}</td>
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
                    colSpan={3}
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle>จัดการรอบสัมภาษณ์</DialogTitle>
            <DialogDescription>
              ภาคการศึกษา:{" "}
              <span className="font-medium">{selected?.term.label ?? "-"}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex items-center gap-2">
            {(["fixed", "monthly"] as const).map((k) => {
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
                  {k === "fixed" ? "Rounds (เป็นรอบ)" : "Monthly (รายเดือน)"}
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
                        { no: nextNo, interview_date: "", open: true },
                      ]);
                    }}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                    + เพิ่มรอบ
                  </button>
                </div>

                {roundsDraft.length ? (
                  roundsDraft.map((r, idx) => (
                    <div key={idx} className="grid gap-3 md:grid-cols-4">
                      <input
                        className="rounded-xl border px-3 py-2"
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
                      <div className="text-right">
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
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      setMonthlyDraft((s) => [
                        ...s,
                        { interview_date: "", open: true },
                      ])
                    }
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                    + เพิ่มเดือน
                  </button>
                </div>

                {monthlyDraft.length ? (
                  monthlyDraft.map((m, idx) => {
                    const d = m.interview_date
                      ? parseISODateLocal(m.interview_date)
                      : undefined;
                    const mm = d ? d.getMonth() + 1 : undefined;
                    const label = mm ? MONTHS_TH[mm - 1] : m.label;
                    return (
                      <div key={idx} className="grid gap-3 md:grid-cols-4">
                        <DatePickerField
                          valueISO={m.interview_date}
                          onChangeISO={(iso) =>
                            setMonthlyDraft((arr) =>
                              arr.map((it, i) =>
                                i === idx ? { ...it, interview_date: iso } : it
                              )
                            )
                          }
                          ariaLabel="เลือกวันสัมภาษณ์รายเดือน"
                        />
                        <div className="rounded-xl border px-3 py-2 text-sm text-gray-700">
                          {label ? `${label}${mm ? ` (${mm})` : ""}` : "—"}
                        </div>
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
                        <div className="text-right">
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

      {/* ---------- Add New Term From Example (เต็มเหมือนเดิม) ---------- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle>เพิ่มภาคจากตัวอย่าง</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลให้ถูกต้อง แล้วกดบันทึก
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto space-y-6 pt-4">
            {/* ================= Basic Info ================= */}
            <section className="rounded-xl border bg-white/60 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  ข้อมูลหลัก
                </h3>
                <span className="text-xs text-slate-500">
                  กำหนดภาคเรียนและปีการศึกษา
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-4"></div>

              {/* Semester & Year -> auto label/sort_key */}
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-600">
                    ภาคเรียน (semester)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border px-3 py-2"
                    value={addDraft.term.semester}
                    onChange={(e) =>
                      setAddDraft((s) => ({
                        ...s,
                        term: {
                          ...s.term,
                          semester: Number(e.target.value || 0),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">
                    ปีการศึกษา (พ.ศ.)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-lg border px-3 py-2"
                    value={addDraft.term.academic_year_th}
                    onChange={(e) =>
                      setAddDraft((s) => ({
                        ...s,
                        term: {
                          ...s.term,
                          academic_year_th: Number(e.target.value || 0),
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Label (คำนวณ)</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                    value={addDraft.term.label}
                    disabled
                    aria-disabled
                    title="คำนวณอัตโนมัติจาก ภาคเรียน/ปีการศึกษา"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600">
                    Sort Key (คำนวณ)
                  </label>
                  <input
                    className="w-full rounded-lg border px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                    value={addDraft.term.sort_key}
                    disabled
                    aria-disabled
                    title="คำนวณอัตโนมัติจาก ภาคเรียน/ปีการศึกษา"
                  />
                </div>
              </div>
            </section>

            {/* ================= Application Window + PREVIEW ================= */}
            <section className="rounded-xl border bg-white/60 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  ช่วงรับสมัคร (application_window)
                </h3>
                <span className="text-xs text-slate-500">
                  กำหนดวันเปิด/ปิดรับ + ข้อความประกาศ
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-600">open_at</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <DatePickerField
                        valueISO={toISODateLocal(
                          parseUTCDateToLocalDate(
                            addDraft.application_window.open_at
                          )
                        )}
                        onChangeISO={(iso) => {
                          const currentTime = getTimeFromISO(
                            addDraft.application_window.open_at
                          );
                          const isoUTC = localDateAndTimeToISOUTC(
                            iso,
                            currentTime
                          );
                          setAddDraft((s) => ({
                            ...s,
                            application_window: {
                              ...s.application_window,
                              open_at: isoUTC,
                            },
                          }));
                        }}
                      />
                    </div>
                    <input
                      type="time"
                      value={getTimeFromISO(
                        addDraft.application_window.open_at
                      )}
                      onChange={(e) => {
                        const dateISO = toISODateLocal(
                          parseUTCDateToLocalDate(
                            addDraft.application_window.open_at
                          )
                        );
                        const isoUTC = localDateAndTimeToISOUTC(
                          dateISO,
                          e.target.value
                        );
                        setAddDraft((s) => ({
                          ...s,
                          application_window: {
                            ...s.application_window,
                            open_at: isoUTC,
                          },
                        }));
                      }}
                      className="w-28 rounded-md border px-2 py-1"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    เวลาเริ่มบังคับเป็นเวลาที่เลือก (แสดงเป็น local time);
                    ค่าจะถูกบันทึกเป็น ISO (UTC)
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-600">close_at</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <DatePickerField
                        valueISO={toISODateLocal(
                          parseUTCDateToLocalDate(
                            addDraft.application_window.close_at
                          )
                        )}
                        disabledBefore={toISODateLocal(
                          parseUTCDateToLocalDate(
                            addDraft.application_window.open_at
                          )
                        )}
                        onChangeISO={(iso) => {
                          const currentTime = getTimeFromISO(
                            addDraft.application_window.close_at
                          );
                          const isoUTC = localDateAndTimeToISOUTC(
                            iso,
                            currentTime
                          );
                          setAddDraft((s) => ({
                            ...s,
                            application_window: {
                              ...s.application_window,
                              close_at: isoUTC,
                            },
                          }));
                        }}
                      />
                    </div>
                    <input
                      type="time"
                      value={getTimeFromISO(
                        addDraft.application_window.close_at
                      )}
                      onChange={(e) => {
                        const dateISO = toISODateLocal(
                          parseUTCDateToLocalDate(
                            addDraft.application_window.close_at
                          )
                        );
                        const isoUTC = localDateAndTimeToISOUTC(
                          dateISO,
                          e.target.value
                        );
                        setAddDraft((s) => ({
                          ...s,
                          application_window: {
                            ...s.application_window,
                            close_at: isoUTC,
                          },
                        }));
                      }}
                      className="w-28 rounded-md border px-2 py-1"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    เวลาปิดบังคับเป็นเวลาที่เลือก (แสดงเป็น local time);
                    ค่าจะถูกบันทึกเป็น ISO (UTC)
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-600">notice</label>
                  <textarea
                    className="w-full rounded-lg border px-3 py-2 min-h-[108px] resize-y"
                    value={addDraft.application_window.notice ?? ""}
                    onChange={(e) =>
                      setAddDraft((s) => ({
                        ...s,
                        application_window: {
                          ...s.application_window,
                          notice: e.target.value,
                        },
                      }))
                    }
                    rows={4}
                    placeholder="พิมพ์ข้อความประกาศ…"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    แสดงใต้หัวข้อประกาศ ใช้บรรทัดเดียวหรือหลายบรรทัดก็ได้
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-600">calendar_url</label>
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    value={addDraft.application_window.calendar_url ?? ""}
                    onChange={(e) =>
                      setAddDraft((s) => ({
                        ...s,
                        application_window: {
                          ...s.application_window,
                          calendar_url: e.target.value,
                        },
                      }))
                    }
                    placeholder="เช่น https://kmutt.me/Calendar-Postgraduate"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ลิงก์ไปยังปฏิทินภายนอก/หน้าเพจรายละเอียด
                  </p>
                </div>
              </div>

              {/* LIVE PREVIEW */}
              <Alert className="mt-1">
                <AlertDescription className="flex items-center justify-between">
                  <div className="leading-relaxed">
                    <strong>
                      ประกาศการรับสมัคร ภาคการศึกษาที่{" "}
                      {`${addDraft.term.semester}/${addDraft.term.academic_year_th}`}
                    </strong>
                    <br />
                    {addDraft.application_window.notice ||
                      "ยังไม่ได้กรอกข้อความประกาศ"}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={addDraft.application_window.calendar_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      <span className="ml-1">ปฏิทิน</span>
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
            </section>

            {/* ================= Rounds ================= */}
            <section className="rounded-xl border bg-white/60 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Rounds</h3>
                <button
                  type="button"
                  onClick={() =>
                    setAddDraft((s) => ({
                      ...s,
                      rounds: [
                        ...(s.rounds ?? []),
                        {
                          no: (s.rounds?.at(-1)?.no ?? 0) + 1,
                          interview_date: "",
                          open: true,
                        },
                      ],
                    }))
                  }
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                  + เพิ่มรอบ
                </button>
              </div>

              {(addDraft.rounds ?? []).length ? (
                addDraft.rounds.map((r, idx) => (
                  <div
                    key={idx}
                    className="grid gap-3 md:grid-cols-12 rounded-lg border bg-slate-50/50 p-3">
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-600">รอบที่</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-lg border px-3 py-2"
                        value={r.no}
                        onChange={(e) =>
                          setAddDraft((s) => ({
                            ...s,
                            rounds: s.rounds.map((it, i) =>
                              i === idx
                                ? { ...it, no: Number(e.target.value || 0) }
                                : it
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="text-xs text-gray-600">
                        วันสัมภาษณ์
                      </label>
                      <DatePickerField
                        valueISO={r.interview_date || ""}
                        onChangeISO={(iso) =>
                          setAddDraft((s) => ({
                            ...s,
                            rounds: s.rounds.map((it, i) =>
                              i === idx ? { ...it, interview_date: iso } : it
                            ),
                          }))
                        }
                        ariaLabel="เลือกวันสัมภาษณ์"
                      />
                    </div>
                    <div className="md:col-span-3 flex items-end">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={r.open ?? true}
                          onChange={(e) =>
                            setAddDraft((s) => ({
                              ...s,
                              rounds: s.rounds.map((it, i) =>
                                i === idx
                                  ? { ...it, open: e.target.checked }
                                  : it
                              ),
                            }))
                          }
                        />
                        เปิดรับ
                      </label>
                    </div>
                    <div className="md:col-span-2 flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setAddDraft((s) => ({
                            ...s,
                            rounds: s.rounds.filter((_, i) => i !== idx),
                          }))
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
            </section>

            {/* ================= Monthly ================= */}
            <section className="rounded-xl border bg-white/60 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Monthly
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setAddDraft((s) => ({
                      ...s,
                      monthly: [
                        ...(s.monthly ?? []),
                        { interview_date: "", open: true },
                      ],
                    }))
                  }
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                  + เพิ่มเดือน
                </button>
              </div>

              {(addDraft.monthly ?? []).length ? (
                addDraft.monthly.map((m, idx) => {
                  const d = m.interview_date
                    ? parseISODateLocal(m.interview_date)
                    : undefined;
                  const mm = d ? d.getMonth() + 1 : undefined;
                  const label = m.label ?? (mm ? MONTHS_TH[mm - 1] : undefined);
                  return (
                    <div
                      key={idx}
                      className="grid gap-3 md:grid-cols-12 rounded-lg border bg-slate-50/50 p-3">
                      <div className="md:col-span-5">
                        <label className="text-xs text-gray-600">
                          วันสัมภาษณ์
                        </label>
                        <DatePickerField
                          valueISO={m.interview_date || ""}
                          onChangeISO={(iso) =>
                            setAddDraft((s) => ({
                              ...s,
                              monthly: s.monthly.map((it, i) =>
                                i === idx ? { ...it, interview_date: iso } : it
                              ),
                            }))
                          }
                          ariaLabel="เลือกวันสัมภาษณ์รายเดือน"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-xs text-gray-600">เดือน</label>
                        <div className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-700">
                          {label ? `${label}${mm ? ` (${mm})` : ""}` : "—"}
                        </div>
                      </div>
                      <div className="md:col-span-2 flex items-end">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={m.open ?? true}
                            onChange={(e) =>
                              setAddDraft((s) => ({
                                ...s,
                                monthly: s.monthly.map((it, i) =>
                                  i === idx
                                    ? { ...it, open: e.target.checked }
                                    : it
                                ),
                              }))
                            }
                          />
                          เปิดรับ
                        </label>
                      </div>
                      <div className="md:col-span-2 flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setAddDraft((s) => ({
                              ...s,
                              monthly: s.monthly.filter((_, i) => i !== idx),
                            }))
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
            </section>
          </div>

          <DialogFooter className="border-t pt-3">
            <button
              onClick={() => setAddOpen(false)}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              type="button">
              ยกเลิก
            </button>
            <button
              onClick={onAddSave}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              type="button">
              บันทึก
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
