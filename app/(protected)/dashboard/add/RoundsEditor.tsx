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
import DatePickerField from "@/components/ui/DatePickerField";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import AddDepartmentDialog from "@/components/survey/AddDepartmentDialog";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Settings2,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Clock,
  Info,
  CalendarDays,
  FileText,
  Layout,
  List,
  ExternalLink,
  Save,
  X,
  BookOpen,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  "กันยายยน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const formatDateTH = (iso: string) => {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch (e) {
    return iso;
  }
};

const computeLabel = (semester: number, yearTH: number) =>
  `${semester}/${yearTH}`;
const computeSortKey = (semester: number, yearTH: number) =>
  Number((yearTH + semester / 10).toFixed(1));

const toISOStartOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
  ).toISOString();
const toISOEndOfDayUTC = (d: Date) =>
  new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
  ).toISOString();

const parseISODateLocal = (iso: string) => {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/* ✅ helpers สำหรับ update payload */
const toUTCStartISOFromLocalDate = (dateISO: string) => {
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

const fillMonthly = (rows: MonthlyRow[]) =>
  rows.map((m) => {
    const d = m.interview_date.includes("T")
      ? new Date(m.interview_date)
      : parseISODateLocal(m.interview_date);
    const month = m.month ?? d.getMonth() + 1;
    const label = m.label ?? MONTHS_TH[month - 1];
    return { ...m, month, label };
  });

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

/* ---------- helper แปลงข้อมูลจาก backend (FIX notice) ---------- */
const adaptAdmission = (a: any): IntakeData => {
  const appWin = a.application_window ?? {};
  const open_at = appWin.open_at ?? toISOStartOfDayUTC(new Date());
  const close_at = appWin.close_at ?? toISOEndOfDayUTC(new Date());

  const notice =
    (typeof appWin.notice === "string" ? appWin.notice : undefined) ??
    (typeof a.notice === "string" ? a.notice : "") ??
    "";

  return {
    _id: a._id ?? "",
    term: a.term ?? {
      semester: 1,
      academic_year_th: new Date().getFullYear() + 543,
      label: "-",
      sort_key: 0,
    },
    active: a.active ?? true,
    intake_mode: (a.intake_mode as IntakeMode) ?? "monthly",
    application_window: {
      open_at,
      close_at,
      notice,
      calendar_url:
        typeof appWin.calendar_url === "string" ? appWin.calendar_url : "",
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
  };
};

/* =========================================================
   Main Component
   ========================================================= */
export default function IntakeViewerWithAddModal() {
  const [terms, setTerms] = useState<IntakeData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () =>
      selectedId ? (terms.find((t) => t._id === selectedId) ?? null) : null,
    [terms, selectedId],
  );

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
            (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0),
        );

        if (!mounted) return;
        setTerms(adapted);

        const activeTerm = adapted.find((t) => t.active);
        setSelectedId((activeTerm ?? adapted[0])?._id ?? null);
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
  const [openAtDraft, setOpenAtDraft] = useState<string>("");
  const [closeAtDraft, setCloseAtDraft] = useState<string>("");
  const [calendarUrlDraft, setCalendarUrlDraft] = useState<string>("");

  const openEditModal = () => {
    if (!selected) return;
    setRoundsDraft(
      selected.rounds.map((r: any) => ({
        ...r,
        open: r.open ?? true,
        title: r.title ?? (r.no ? `รอบที่ ${r.no}` : ""),
      })),
    );
    setMonthlyDraft(
      selected.monthly.map((m: any) => ({
        ...m,
        open: m.open ?? true,
        title: m.title ?? "",
      })),
    );
    setNoticeDraft(selected.application_window.notice ?? "");
    setOpenAtDraft(selected.application_window.open_at ?? "");
    setCloseAtDraft(selected.application_window.close_at ?? "");
    setCalendarUrlDraft(selected.application_window.calendar_url ?? "");
    setEditModalOpen(true);
  };

  const toUTCStartISO = (v: string) =>
    v && !v.includes("T") ? toISOStartOfDayUTC(parseISODateLocal(v)) : v;

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
      })),
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
                  open_at: openAtDraft || t.application_window.open_at,
                  close_at: closeAtDraft || t.application_window.close_at,
                  calendar_url:
                    calendarUrlDraft ?? t.application_window.calendar_url,
                },
              }
            : t,
        )
        .sort((a, b) => b.term.sort_key - a.term.sort_key),
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
        open_at: toUTCStartISO(
          openAtDraft || selected.application_window.open_at,
        ),
        close_at: toUTCStartISO(
          closeAtDraft || selected.application_window.close_at,
        ),
        notice: noticeDraft,
        calendar_url:
          calendarUrlDraft ?? selected.application_window.calendar_url ?? "",
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

      try {
        const res = await getAdmissions();
        let items: any[] = [];
        if (Array.isArray(res)) items = res;
        else if (Array.isArray((res as any)?.items)) items = (res as any).items;
        else if (Array.isArray((res as any)?.data)) items = (res as any).data;

        const adapted = items.map(adaptAdmission);
        adapted.sort(
          (a: IntakeData, b: IntakeData) =>
            (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0),
        );
        setTerms(adapted);
        setSelectedId(selected._id);
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error(err);
      setTerms((prev) =>
        prev.map((t) =>
          t._id === selected._id
            ? {
                ...t,
                application_window: {
                  ...t.application_window,
                  notice: selected.application_window.notice,
                },
              }
            : t,
        ),
      );
      toast.error("อัปเดตไม่สำเร็จ");
    }
  };

  /* ======== Add ======== */
  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<IntakeData>(makeBlankIntake());

  const onDeleteSelected = async () => {
    if (!selected) return;
    const ok = window.confirm(
      `ลบภาคการศึกษา ${selected.term.label} (ID: ${selected._id}) ?`,
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

  const onToggleActive = async () => {
    if (!selected) return;
    const currentId = selected._id;
    const currentActive = selected.active;

    setTerms((prev) =>
      prev.map((t) =>
        t._id === currentId ? { ...t, active: !currentActive } : t,
      ),
    );

    try {
      await toggleAdmissionActive(currentId);
      toast.success(
        !currentActive
          ? "เปิดใช้งานภาคการศึกษานี้แล้ว"
          : "ปิดการใช้งานภาคการศึกษานี้แล้ว",
      );
    } catch (err) {
      console.error(err);
      setTerms((prev) =>
        prev.map((t) =>
          t._id === currentId ? { ...t, active: currentActive } : t,
        ),
      );
      toast.error("ไม่สามารถสลับสถานะภาคการศึกษาได้");
    }
  };

  const openAddModal = () => {
    const base = makeBlankIntake();
    setAddDraft(base);
    setAddOpen(true);
  };

  useEffect(() => {
    setAddDraft((s) => {
      const newLabel = computeLabel(s.term.semester, s.term.academic_year_th);
      const newKey = computeSortKey(s.term.semester, s.term.academic_year_th);
      if (s.term.label === newLabel && s.term.sort_key === newKey) return s;
      return { ...s, term: { ...s.term, label: newLabel, sort_key: newKey } };
    });
  }, [addDraft.term.semester, addDraft.term.academic_year_th]);

  const onAddSave = async () => {
    const normalized: IntakeData = {
      ...addDraft,
      rounds: (addDraft.rounds ?? []).map((r) => ({
        ...r,
        open: r.open ?? true,
      })),
      monthly: fillMonthly(
        (addDraft.monthly ?? []).map((m) => ({ ...m, open: m.open ?? true })),
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
          notice: normalized.application_window.notice ?? "",
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
            (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0),
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
            (a, b) => (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0),
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

  const formatRange = selected
    ? `${formatDateTH(selected.application_window.open_at)} — ${formatDateTH(
        selected.application_window.close_at,
      )}`
    : "";

  const [years, setYears] = useState<Array<{ _id: string; label: string }>>([]);
  const [selectedYear, setSelectedYear] = useState<string>("ทั้งหมด");

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res: any = await getAdmissionYears();
        let raw: any[] = [];
        if (Array.isArray(res)) raw = res;
        else if (Array.isArray(res?.data)) raw = res.data;
        else if (Array.isArray(res?.items)) raw = res.items;
        else if (res?.status && Array.isArray(res?.data)) raw = res.data;

        const normalized = raw
          .map((x: any) => {
            const id = x._id ?? x.id ?? x.value ?? x?.term?._id;
            const label =
              x.label ??
              x?.term?.label ??
              (x?.term
                ? `${x.term.semester}/${x.term.academic_year_th}`
                : (x?.name ?? ""));
            return { _id: String(id), label };
          })
          .filter((x: any) => x._id && x.label);
        setYears(normalized);
      } catch (error) {
        setYears([]);
      }
    };
    fetchYears();
  }, []);

  const handleYearChange = async (value: string) => {
    setSelectedYear(value);
    if (value === "ทั้งหมด") {
      setSelectedId(() => {
        if (!terms.length) return null;
        const activeTerm = terms.find((t) => t.active);
        return (activeTerm ?? terms[0])._id;
      });
      return;
    }
    try {
      const res: any = await getAdmissionById(value);
      const obj = res?.data ?? res;
      if (!obj || (!obj._id && !obj?.data?._id))
        throw new Error("Invalid object");
      const adapted = adaptAdmission(obj);
      setTerms((prev) => {
        const others = prev.filter((t) => t._id !== adapted._id);
        const next = [...others, adapted].sort(
          (a, b) => (b.term?.sort_key ?? 0) - (a.term?.sort_key ?? 0),
        );
        return next;
      });
      setSelectedId(adapted._id);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลภาคการศึกษาที่เลือกได้");
    }
  };

  return (
    <div className="space-y-8 animate-none">
      {/* Premium Header Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-400 p-4 shadow-sm flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
              ปีการศึกษา
            </label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-44 rounded-xl border-slate-400 bg-slate-50/50 h-10 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10">
                <SelectValue placeholder="เลือกปี" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="ทั้งหมด" className="font-medium">
                  ล่าสุด (Current)
                </SelectItem>
                {years.map((y) => (
                  <SelectItem
                    key={y._id}
                    value={String(y._id)}
                    className="font-medium">
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="mt-4">
              <span
                className={
                  "inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider " +
                  (selected.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-slate-100 text-slate-600 border border-slate-400")
                }>
                <span
                  className={
                    "h-2 w-2 rounded-full " +
                    (selected.active
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : "bg-slate-400")
                  }
                />
                {selected.active ? "กำลังใช้งาน (Active)" : "ปิดการใช้งาน"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={openAddModal}
            variant="outline"
            className="rounded-xl border-slate-400 bg-white px-4 h-10 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มภาคใหม่
          </Button>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          <Button
            onClick={openEditModal}
            disabled={!selected}
            className="rounded-xl bg-blue-600 px-5 h-10 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-40">
            <Settings2 className="w-4 h-4 mr-2" />
            จัดการรอบสัมภาษณ์
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={!selected}
                className="rounded-xl border-slate-400 bg-white w-10 h-10 p-0 text-slate-500 hover:text-slate-900">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-2 rounded-2xl border-slate-100 shadow-2xl"
              align="end">
              <button
                onClick={onToggleActive}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                type="button">
                {selected?.active ? (
                  <X className="w-4 h-4 text-slate-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                {selected?.active ? "ปิดภาคการศึกษา" : "เปิดใช้งานภาคการศึกษา"}
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={onDeleteSelected}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                type="button">
                <Trash2 className="w-4 h-4" />
                ลบภาคการศึกษา
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Meta Info Card */}
      {selected && (
        <div className="bg-white rounded-3xl border border-slate-400 overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                ภาคการศึกษา {selected.term.label}
              </h2>
            </div>
            {selected.application_window.notice && (
              <p className="text-slate-600 text-[15px] font-medium leading-relaxed bg-white border border-slate-100 rounded-2xl p-4 mt-4 whitespace-pre-line shadow-sm">
                <Info className="w-4 h-4 text-blue-500 inline mr-2 -mt-1" />
                {selected.application_window.notice}
              </p>
            )}
          </div>

          <div className="px-8 py-5 flex flex-wrap items-center gap-8 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <CalendarClock className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  ระยะเวลากรอกข้อมูล
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {formatRange}
                </p>
              </div>
            </div>

            {selected.application_window.calendar_url && (
              <a
                href={selected.application_window.calendar_url}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                target="_blank"
                rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                ดูปฏิทินการรับสมัคร
              </a>
            )}
          </div>
        </div>
      )}

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fixed table */}
        {selected && (
          <div className="bg-white rounded-3xl border border-slate-400 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-blue-600" />
                <div className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  รอบสัมภาษณ์ (Fixed)
                </div>
              </div>
              <div className="bg-white px-3 py-1 rounded-full border border-slate-400 text-[11px] font-bold text-slate-500 uppercase">
                {selected.rounds.length} รอบ
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white text-left">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      รอบ
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      ชื่อรอบ
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      วันสัมภาษณ์
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-center">
                      สถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selected.rounds.length ? (
                    selected.rounds.map((r, i) => {
                      const isOpen = r.open ?? true;
                      return (
                        <tr
                          key={`${r.no}-${i}`}
                          className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                              {r.no}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700">
                            {(r as any).title ?? `รอบที่ ${r.no}`}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {formatDateTH(r.interview_date)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold " +
                                (isOpen
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-400")
                              }>
                              <span
                                className={
                                  "h-1.5 w-1.5 rounded-full " +
                                  (isOpen ? "bg-emerald-500" : "bg-slate-300")
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
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <AlertCircle className="w-8 h-8" />
                          <p className="text-sm font-medium">
                            ไม่มีข้อมูลรอบสัมภาษณ์
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly table */}
        {selected && (
          <div className="bg-white rounded-3xl border border-slate-400 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <div className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  รอบรายเดือน (Monthly)
                </div>
              </div>
              <div className="bg-white px-3 py-1 rounded-full border border-slate-400 text-[11px] font-bold text-slate-500 uppercase">
                {selected.monthly.length} เดือน
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white text-left">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      เดือน
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      ชื่อรอบ
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                      วันสัมภาษณ์
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 text-center">
                      สถานะ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fillMonthly(selected.monthly).length ? (
                    fillMonthly(selected.monthly).map((m, i) => {
                      const isOpen = m.open ?? true;
                      return (
                        <tr
                          key={`${m.interview_date}-${i}`}
                          className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-800">
                              {m.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            {m.title || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {formatDateTH(m.interview_date)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={
                                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold " +
                                (isOpen
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-400")
                              }>
                              <span
                                className={
                                  "h-1.5 w-1.5 rounded-full " +
                                  (isOpen ? "bg-emerald-500" : "bg-slate-300")
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
                        className="px-6 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <AlertCircle className="w-8 h-8" />
                          <p className="text-sm font-medium">
                            ไม่มีข้อมูลรายเดือน
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Edit Modal ---------- */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl animate-none">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white text-left">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-white">
                    จัดการข้อมูลโครงการ
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1 font-bold">
                    ภาคการศึกษา: {selected?.term.label ?? "-"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-8 pt-4 pb-0 bg-slate-50/50">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-400 shadow-sm w-fit">
              {(["fixed", "monthly", "details"] as const).map((k) => {
                const is = tab === k;
                return (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={
                      "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-colors " +
                      (is
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-slate-500 hover:bg-slate-50")
                    }>
                    {k === "fixed"
                      ? "Rounds"
                      : k === "monthly"
                        ? "Monthly"
                        : "Details"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto px-8 py-8 bg-slate-50/50 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
            {tab === "fixed" ? (
              <section className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      รอบการสัมภาษณ์แบบ Rounds
                    </h3>
                  </div>
                  <Button
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
                    variant="outline"
                    className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl h-9 font-bold px-4 transition-all">
                    <Plus className="w-4 h-4 mr-1.5" />
                    เพิ่มรอบสัมภาษณ์
                  </Button>
                </div>

                <div className="p-6 space-y-4">
                  {roundsDraft.length ? (
                    roundsDraft.map((r, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-blue-200 p-5 rounded-2xl transition-colors group">
                        <div className="grid gap-5 md:grid-cols-12">
                          <div className="md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                              รอบที่
                            </label>
                            <input
                              className="w-full rounded-xl border-slate-400 bg-white px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                              type="number"
                              min={1}
                              value={r.no}
                              onChange={(e) =>
                                setRoundsDraft((arr) =>
                                  arr.map((it, i) =>
                                    i === idx
                                      ? {
                                          ...it,
                                          no: Number(e.target.value || 0),
                                        }
                                      : it,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                              ชื่อเรียก
                            </label>
                            <input
                              className="w-full rounded-xl border-slate-400 bg-white px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                              type="text"
                              value={r.title ?? ""}
                              placeholder={`รอบที่ ${r.no || idx + 1}`}
                              onChange={(e) =>
                                setRoundsDraft((arr) =>
                                  arr.map((it, i) =>
                                    i === idx
                                      ? { ...it, title: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                              วันสัมภาษณ์
                            </label>
                            <DatePickerField
                              valueISO={r.interview_date}
                              onChangeISO={(iso) =>
                                setRoundsDraft((arr) =>
                                  arr.map((it, i) =>
                                    i === idx
                                      ? { ...it, interview_date: iso }
                                      : it,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-col items-center justify-end pb-1 gap-2">
                            <label className="inline-flex items-center gap-2 cursor-pointer group/label">
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={r.open ?? true}
                                onChange={(e) =>
                                  setRoundsDraft((arr) =>
                                    arr.map((it, i) =>
                                      i === idx
                                        ? { ...it, open: e.target.checked }
                                        : it,
                                    ),
                                  )
                                }
                              />
                              <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-emerald-500 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
                              <span className="text-[11px] font-bold text-slate-500 uppercase peer-checked:text-emerald-600 transition-colors">
                                เปิดรับ
                              </span>
                            </label>
                            <button
                              onClick={() =>
                                setRoundsDraft((arr) =>
                                  arr.filter((_, i) => i !== idx),
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-400">
                      <p className="text-sm font-bold text-slate-400">
                        ยังไม่มีข้อมูลรอบสัมภาษณ์
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ) : tab === "monthly" ? (
              <section className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      รอบการสัมภาษณ์แบบ Monthly
                    </h3>
                  </div>
                  <Button
                    onClick={() =>
                      setMonthlyDraft((s) => [
                        ...s,
                        { interview_date: "", open: true, title: "" },
                      ])
                    }
                    variant="outline"
                    className="bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl h-9 font-bold px-4 transition-all">
                    <Plus className="w-4 h-4 mr-1.5" />
                    เพิ่มเดือนเปิดรับ
                  </Button>
                </div>

                <div className="p-6 space-y-4">
                  {monthlyDraft.length ? (
                    monthlyDraft.map((m, idx) => {
                      const d = m.interview_date
                        ? m.interview_date.includes("T")
                          ? new Date(m.interview_date)
                          : parseISODateLocal(m.interview_date)
                        : undefined;
                      const mm: any = d ? d.getMonth() + 1 : undefined;
                      const label =
                        m.label ?? (mm ? MONTHS_TH[mm - 1] : undefined);

                      return (
                        <div
                          key={idx}
                          className="bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-indigo-200 p-5 rounded-2xl transition-colors">
                          <div className="grid gap-5 md:grid-cols-12">
                            <div className="md:col-span-4">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                                วันสัมภาษณ์
                              </label>
                              <DatePickerField
                                valueISO={m.interview_date}
                                onChangeISO={(iso) =>
                                  setMonthlyDraft((arr) =>
                                    arr.map((it, i) =>
                                      i === idx
                                        ? { ...it, interview_date: iso }
                                        : it,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                                เดือน (คำนวณอัตโนมัติ)
                              </label>
                              <div className="w-full h-[38px] flex items-center rounded-xl border border-dashed border-slate-400 bg-slate-100/30 px-4 text-sm font-bold text-slate-700">
                                {label ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg text-[11px] font-black leading-none">
                                      {mm < 10 ? `0${mm}` : mm}
                                    </span>
                                    {label}
                                  </div>
                                ) : (
                                  "—"
                                )}
                              </div>
                            </div>
                            <div className="md:col-span-3">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                                ชื่อรอบ (Optional)
                              </label>
                              <input
                                className="w-full rounded-xl border-slate-400 bg-white px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                type="text"
                                value={m.title ?? ""}
                                placeholder="เช่น รอบมกราคม"
                                onChange={(e) =>
                                  setMonthlyDraft((arr) =>
                                    arr.map((it, i) =>
                                      i === idx
                                        ? { ...it, title: e.target.value }
                                        : it,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <div className="md:col-span-2 flex flex-col items-center justify-end pb-1 gap-2">
                              <label className="inline-flex items-center gap-2 cursor-pointer group/label">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={m.open ?? true}
                                  onChange={(e) =>
                                    setMonthlyDraft((arr) =>
                                      arr.map((it, i) =>
                                        i === idx
                                          ? { ...it, open: e.target.checked }
                                          : it,
                                      ),
                                    )
                                  }
                                />
                                <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-indigo-500 relative transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-5" />
                                <span className="text-[11px] font-bold text-slate-500 uppercase peer-checked:text-indigo-600 transition-colors">
                                  เปิดรับ
                                </span>
                              </label>
                              <button
                                onClick={() =>
                                  setMonthlyDraft((arr) =>
                                    arr.filter((_, i) => i !== idx),
                                  )
                                }
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-400">
                      <p className="text-sm font-bold text-slate-400">
                        ยังไม่มีข้อมูลรายเดือน
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    รายละเอียดโครงการ
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1 uppercase tracking-tight">
                        <Clock className="w-4 h-4 text-slate-400" />
                        วันที่เริ่มต้นรับสมัคร
                      </label>
                      <DatePickerField
                        valueISO={openAtDraft}
                        onChangeISO={(iso) => setOpenAtDraft(iso)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1 uppercase tracking-tight">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        วันที่สิ้นสุดรับสมัคร
                      </label>
                      <DatePickerField
                        valueISO={closeAtDraft}
                        onChangeISO={(iso) => setCloseAtDraft(iso)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1 uppercase tracking-tight">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                      ลิงก์ปฏิทินโครงการ (calendar_url)
                    </label>
                    <input
                      className="w-full rounded-xl border-slate-400 bg-white px-4 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      type="url"
                      value={calendarUrlDraft}
                      onChange={(e) => setCalendarUrlDraft(e.target.value)}
                      placeholder="https://example.com/calendar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1 uppercase tracking-tight">
                      <StickyNoteIcon className="w-4 h-4 text-slate-400" />
                      ข้อความรายละเอียด (Notice)
                    </label>
                    <textarea
                      className="w-full min-h-[160px] rounded-2xl border-slate-400 bg-white px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none"
                      value={noticeDraft}
                      onChange={(e) => setNoticeDraft(e.target.value)}
                      placeholder="ระบุรายละเอียดเพิ่มเติม หรือเงื่อนไขของภาคการศึกษานี้..."
                    />
                    <div className="flex items-center gap-2 px-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <Info className="w-3.5 h-3.5" />
                      ข้อความหลักที่จะแสดงในหน้า Dashboard
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <DialogFooter className="bg-white px-8 py-5 border-t border-slate-100 flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <Button
              onClick={() => setEditModalOpen(false)}
              variant="ghost"
              className="px-6 h-11 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
              type="button">
              <X className="w-4 h-4 mr-2" />
              ยกเลิก
            </Button>
            <Button
              onClick={saveEditModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              type="button">
              <Save className="w-4 h-4 mr-2" />
              บันทึกการตั้งค่า
            </Button>
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

// Internal icon proxy because I used StickyNoteIcon by mistake in one place
const StickyNoteIcon = ({ className }: { className?: string }) => (
  <FileText className={className} />
);
