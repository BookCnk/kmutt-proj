// src/components/intake/AddDepartmentDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  Plus,
  Info,
  BookOpen,
  Layout,
  Settings2,
  AlertCircle,
  Save,
  X,
  FileText,
  CalendarDays,
  StickyNote,
  Link2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import DatePickerField from "@/components/ui/DatePickerField";

// ✅ ใช้ util ตามที่ให้มา
import {
  MONTHS_TH,
  toISODateLocal,
  parseUTCDateToLocalDate,
  getTimeFromISO,
  localDateAndTimeToISOUTC,
  parseISODateLocal,
} from "@/lib/date-utils";

/* ================= Types ================= */
export type RoundDraft = {
  no: number;
  interview_date: string; // ISO หรือ "YYYY-MM-DD"
  title?: string;
};

export type MonthlyDraft = {
  interview_date: string; // ISO หรือ "YYYY-MM-DD"
  label?: string;
  month?: number;
  title?: string;
};

export type TermInfo = {
  semester: number;
  academic_year_th: number;
  label: string;
  sort_key: number;
};

export type AddDraft = {
  term: TermInfo;
  active: boolean;
  intake_mode: "none" | "rounds" | "monthly";
  application_window: {
    open_at: string;
    close_at: string;
    notice?: string;
    calendar_url?: string;
  };
  rounds: RoundDraft[];
  monthly: MonthlyDraft[];
  meta?: {
    program_id: string | null;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
  };
};

export type IntakeData = AddDraft & { _id: string };

type Props<T extends AddDraft | IntakeData> = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
  onSave: () => void;
};

/* ================= Component ================= */
export default function AddDepartmentDialog<T extends AddDraft | IntakeData>({
  open,
  onOpenChange,
  draft,
  setDraft,
  onSave,
}: Props<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                  แก้ไขข้อมูลโครงการ
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-1 font-medium">
                  ตรวจสอบและปรับปรุงข้อมูลให้ถูกต้องก่อนบันทึกระบบ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-8 py-8 bg-slate-50/50 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* ================= Basic Info ================= */}
          <section className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                ข้อมูลหลัก (Basic Info)
              </h3>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                  ภาคเรียน (Semester)
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border-slate-400 bg-white px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  value={draft.term.semester}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      term: {
                        ...s.term,
                        semester: Number(e.target.value || 0),
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                  ปีการศึกษา (พ.ศ.)
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border-slate-400 bg-white px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  value={draft.term.academic_year_th}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      term: {
                        ...s.term,
                        academic_year_th: Number(e.target.value || 0),
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                  Label
                </label>
                <input
                  className="w-full rounded-xl border-slate-400 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                  value={draft.term.label}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                  Sort Key
                </label>
                <input
                  className="w-full rounded-xl border-slate-400 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                  value={draft.term.sort_key}
                  disabled
                />
              </div>
            </div>
          </section>

          {/* ================= Application Window ================= */}
          <section className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                ช่วงเวลาการรับสมัคร
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* open_at */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    วันเปิดรับสมัคร (Open at)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <DatePickerField
                        valueISO={toISODateLocal(
                          parseUTCDateToLocalDate(
                            draft.application_window.open_at,
                          ),
                        )}
                        onChangeISO={(iso) => {
                          const currentTime = getTimeFromISO(
                            draft.application_window.open_at,
                          );
                          const isoUTC = localDateAndTimeToISOUTC(
                            iso,
                            currentTime,
                          );
                          setDraft((s) => ({
                            ...s,
                            application_window: {
                              ...s.application_window,
                              open_at: isoUTC,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="relative group">
                      <input
                        type="time"
                        value={getTimeFromISO(draft.application_window.open_at)}
                        onChange={(e) => {
                          const dateISO = toISODateLocal(
                            parseUTCDateToLocalDate(
                              draft.application_window.open_at,
                            ),
                          );
                          const isoUTC = localDateAndTimeToISOUTC(
                            dateISO,
                            e.target.value,
                          );
                          setDraft((s) => ({
                            ...s,
                            application_window: {
                              ...s.application_window,
                              open_at: isoUTC,
                            },
                          }));
                        }}
                        className="w-32 rounded-xl border border-slate-400 bg-white px-3 py-2 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* close_at */}
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    วันปิดรับสมัคร (Close at)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <DatePickerField
                        valueISO={toISODateLocal(
                          parseUTCDateToLocalDate(
                            draft.application_window.close_at,
                          ),
                        )}
                        disabledBefore={toISODateLocal(
                          parseUTCDateToLocalDate(
                            draft.application_window.open_at,
                          ),
                        )}
                        onChangeISO={(iso) => {
                          const currentTime = getTimeFromISO(
                            draft.application_window.close_at,
                          );
                          const isoUTC = localDateAndTimeToISOUTC(
                            iso,
                            currentTime,
                          );
                          setDraft((s) => ({
                            ...s,
                            application_window: {
                              ...s.application_window,
                              close_at: isoUTC,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="relative group">
                      <input
                        type="time"
                        value={getTimeFromISO(
                          draft.application_window.close_at,
                        )}
                        onChange={(e) => {
                          const dateISO = toISODateLocal(
                            parseUTCDateToLocalDate(
                              draft.application_window.close_at,
                            ),
                          );
                          const isoUTC = localDateAndTimeToISOUTC(
                            dateISO,
                            e.target.value,
                          );
                          setDraft((s) => ({
                            ...s,
                            application_window: {
                              ...s.application_window,
                              close_at: isoUTC,
                            },
                          }));
                        }}
                        className="w-32 rounded-xl border border-slate-400 bg-white px-3 py-2 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                    <StickyNote className="w-3.5 h-3.5 text-slate-400" />
                    ข้อความประกาศ (Notice)
                  </label>
                  <textarea
                    className="w-full rounded-2xl border-slate-400 bg-white px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[120px] resize-none"
                    value={draft.application_window.notice ?? ""}
                    onChange={(e) =>
                      setDraft((s) => ({
                        ...s,
                        application_window: {
                          ...s.application_window,
                          notice: e.target.value,
                        },
                      }))
                    }
                    placeholder="พิมพ์ข้อความที่ต้องการให้ผู้สมัครเห็น..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    ลิงก์ปฏิทิน (Calendar URL)
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-xl border-slate-400 bg-white pl-10 pr-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      value={draft.application_window.calendar_url ?? ""}
                      onChange={(e) =>
                        setDraft((s) => ({
                          ...s,
                          application_window: {
                            ...s.application_window,
                            calendar_url: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://example.com/calendar"
                    />
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>

                  {/* PREVIEW BOX */}
                  <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-100/50 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Info className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">
                          Preview
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          ภาค {draft.term.semester}/
                          {draft.term.academic_year_th}
                        </p>
                        <p className="text-[13px] text-slate-600 whitespace-pre-line mt-0.5 leading-relaxed">
                          {draft.application_window.notice ||
                            "— ยังไม่มีข้อความประกาศ —"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full bg-white border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl">
                      <a
                        href={draft.application_window.calendar_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>ดูปฏิทินตัวอย่าง</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= Rounds ================= */}
          <section className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  รอบการสัมภาษณ์ (Rounds)
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraft((s) => ({
                    ...s,
                    rounds: [
                      ...(s.rounds ?? []),
                      {
                        no: (s.rounds?.at(-1)?.no ?? 0) + 1,
                        interview_date: "",
                        title: `รอบที่ ${(s.rounds?.at(-1)?.no ?? 0) + 1}`,
                      },
                    ],
                  }))
                }
                className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl h-9 px-4 font-bold transition-all">
                <Plus className="w-4 h-4 mr-1.5" />
                เพิ่มรอบใหม่
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {(draft.rounds ?? []).length > 0 ? (
                draft.rounds.map((r, idx) => (
                  <div
                    key={idx}
                    className="relative group bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-blue-200 p-5 rounded-2xl transition-colors">
                    <div className="grid gap-5 md:grid-cols-12">
                      <div className="md:col-span-2">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                          รอบที่
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="w-full rounded-xl border-slate-400 bg-white px-3 py-2 text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                          value={r.no}
                          onChange={(e) =>
                            setDraft((s) => ({
                              ...s,
                              rounds: s.rounds.map((it, i) =>
                                i === idx
                                  ? { ...it, no: Number(e.target.value || 0) }
                                  : it,
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-5">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                          ชื่อเรียก (Title)
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-xl border-slate-400 bg-white px-3 py-2 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                          value={r.title ?? ""}
                          onChange={(e) =>
                            setDraft((s) => ({
                              ...s,
                              rounds: s.rounds.map((it, i) =>
                                i === idx
                                  ? { ...it, title: e.target.value }
                                  : it,
                              ),
                            }))
                          }
                          placeholder="เช่น รอบที่ 1 / สัมภาษณ์พิเศษ"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                          วันสัมภาษณ์
                        </label>
                        <DatePickerField
                          valueISO={r.interview_date || ""}
                          onChangeISO={(iso) =>
                            setDraft((s) => ({
                              ...s,
                              rounds: s.rounds.map((it, i) =>
                                i === idx ? { ...it, interview_date: iso } : it,
                              ),
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((s) => ({
                              ...s,
                              rounds: s.rounds.filter((_, i) => i !== idx),
                            }))
                          }
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="ลบรอบนี้">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-400">
                  <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                    <Calendar className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    ยังไม่มีข้อมูลรอบการสัมภาษณ์
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    กดที่ปุ่มด้านบนเพื่อเริ่มการตั้งค่า
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ================= Monthly ================= */}
          <section className="bg-white rounded-2xl border border-slate-400 shadow-sm overflow-hidden pb-4">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  การรับสมัครรายเดือน (Monthly)
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDraft((s) => ({
                    ...s,
                    monthly: [
                      ...(s.monthly ?? []),
                      {
                        interview_date: "",
                        title: `รอบที่ ${(s.monthly?.length ?? 0) + 1}`,
                      },
                    ],
                  }))
                }
                className="bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl h-9 px-4 font-bold transition-all">
                <Plus className="w-4 h-4 mr-1.5" />
                เพิ่มเดือนการรับ
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {(draft.monthly ?? []).length > 0 ? (
                draft.monthly.map((m, idx) => {
                  const d = m.interview_date
                    ? parseISODateLocal(m.interview_date)
                    : undefined;
                  const mm: any = d ? d.getMonth() + 1 : undefined;
                  const label = m.label ?? (mm ? MONTHS_TH[mm - 1] : undefined);
                  return (
                    <div
                      key={idx}
                      className="relative group bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-indigo-200 p-5 rounded-2xl transition-colors">
                      <div className="grid gap-5 md:grid-cols-12">
                        <div className="md:col-span-3">
                          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                            ชื่อรอบ (Title)
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-xl border-slate-400 bg-white px-3 py-2 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={m.title ?? ""}
                            onChange={(e) =>
                              setDraft((s) => ({
                                ...s,
                                monthly: s.monthly.map((it, i) =>
                                  i === idx
                                    ? { ...it, title: e.target.value }
                                    : it,
                                ),
                              }))
                            }
                            placeholder="เช่น รอบที่ 1"
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                            วันสัมภาษณ์
                          </label>
                          <DatePickerField
                            valueISO={m.interview_date || ""}
                            onChangeISO={(iso) =>
                              setDraft((s) => ({
                                ...s,
                                monthly: s.monthly.map((it, i) =>
                                  i === idx
                                    ? { ...it, interview_date: iso }
                                    : it,
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight mb-1.5 block ml-1">
                            คำนวณจากวันที่ (เดือน)
                          </label>
                          <div className="w-full h-[38px] flex items-center rounded-xl border border-dashed border-slate-300 bg-slate-100/30 px-4 text-sm font-bold text-slate-700">
                            {label ? (
                              <div className="flex items-center gap-2">
                                <span className="text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg text-xs leading-none">
                                  {mm < 10 ? `0${mm}` : mm}
                                </span>
                                {label}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal italic">
                                เลือกวันที่เพื่อระบุเดือน
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((s) => ({
                                ...s,
                                monthly: s.monthly.filter((_, i) => i !== idx),
                              }))
                            }
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="ลบเดือนนี้">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-400">
                  <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                    <Settings2 className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    ยังไม่มีข้อมูลประกาศรายเดือน
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    กดที่ปุ่มด้านบนเพื่อเริ่มการตั้งค่า
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <DialogFooter className="bg-white px-8 py-5 border-t border-slate-100 flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="text-slate-500 font-bold hover:bg-slate-100 px-6 h-11 rounded-xl"
            type="button">
            <X className="w-4 h-4 mr-2" />
            ยกเลิกการแก้ไข
          </Button>
          <Button
            onClick={onSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            type="button">
            <Save className="w-4 h-4 mr-2" />
            บันทึกข้อมูลทั้งหมด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
