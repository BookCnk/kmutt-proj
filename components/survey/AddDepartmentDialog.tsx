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
import { ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// ✅ ใช้ util ตามที่ให้มา
import {
  MONTHS_TH,
  toISODateLocal,
  parseUTCDateToLocalDate,
  getTimeFromISO,
  localDateAndTimeToISOUTC,
  parseISODateLocal,
} from "@/lib/date-utils";

// ---------- Date Picker Field ----------
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

/* ================= Types ================= */
export type RoundDraft = {
  no: number;
  interview_date: string; // ISO หรือ "YYYY-MM-DD"
  title?: string;
};

export type MonthlyDraft = {
  interview_date: string; // ISO หรือ "YYYY-MM-DD"
  label?: string;
  month?: number; // เก็บเป็นเลขภายใน; export ตอน build payload เป็นชื่อเดือนให้
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

// ---- IntakeData มาจากพ่อ ----
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

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="text-xs text-gray-600">
                  ภาคเรียน (semester)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border px-3 py-2"
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
              <div>
                <label className="text-xs text-gray-600">
                  ปีการศึกษา (พ.ศ.)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border px-3 py-2"
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
              <div>
                <label className="text-xs text-gray-600">Label</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  value={draft.term.label}
                  disabled
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Sort Key</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  value={draft.term.sort_key}
                  disabled
                />
              </div>
            </div>
          </section>

          {/* ================= Application Window + PREVIEW ================= */}
          <section className="rounded-xl border bg-white/60 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                ช่วงรับสมัคร
              </h3>
              <span className="text-xs text-slate-500">
                กำหนดวันเปิด/ปิดรับ + ข้อความประกาศ
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {/* open_at */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600">open_at</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <DatePickerField
                      valueISO={toISODateLocal(
                        parseUTCDateToLocalDate(
                          draft.application_window.open_at
                        )
                      )}
                      onChangeISO={(iso) => {
                        const currentTime = getTimeFromISO(
                          draft.application_window.open_at
                        );
                        const isoUTC = localDateAndTimeToISOUTC(
                          iso,
                          currentTime
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
                  <input
                    type="time"
                    value={getTimeFromISO(draft.application_window.open_at)}
                    onChange={(e) => {
                      const dateISO = toISODateLocal(
                        parseUTCDateToLocalDate(
                          draft.application_window.open_at
                        )
                      );
                      const isoUTC = localDateAndTimeToISOUTC(
                        dateISO,
                        e.target.value
                      );
                      setDraft((s) => ({
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
              </div>

              {/* close_at */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600">close_at</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <DatePickerField
                      valueISO={toISODateLocal(
                        parseUTCDateToLocalDate(
                          draft.application_window.close_at
                        )
                      )}
                      disabledBefore={toISODateLocal(
                        parseUTCDateToLocalDate(
                          draft.application_window.open_at
                        )
                      )}
                      onChangeISO={(iso) => {
                        const currentTime = getTimeFromISO(
                          draft.application_window.close_at
                        );
                        const isoUTC = localDateAndTimeToISOUTC(
                          iso,
                          currentTime
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
                  <input
                    type="time"
                    value={getTimeFromISO(draft.application_window.close_at)}
                    onChange={(e) => {
                      const dateISO = toISODateLocal(
                        parseUTCDateToLocalDate(
                          draft.application_window.close_at
                        )
                      );
                      const isoUTC = localDateAndTimeToISOUTC(
                        dateISO,
                        e.target.value
                      );
                      setDraft((s) => ({
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
              </div>
            </div>

            {/* notice & calendar_url */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-gray-600">notice</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 min-h-[108px] resize-y"
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
                  placeholder="พิมพ์ข้อความประกาศ…"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">calendar_url</label>
                <input
                  className="w-full rounded-lg border px-3 py-2"
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
              </div>
            </div>

            {/* LIVE PREVIEW */}
            <Alert className="mt-1">
              <AlertDescription className="flex items-center justify-between">
                <div className="leading-relaxed">
                  <strong>
                    ภาค {draft.term.semester}/{draft.term.academic_year_th}
                  </strong>
                  <br />
                  {draft.application_window.notice ||
                    "ยังไม่ได้กรอกข้อความประกาศ"}
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={draft.application_window.calendar_url || "#"}
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
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                + เพิ่มรอบ
              </button>
            </div>

            {(draft.rounds ?? []).length ? (
              draft.rounds.map((r, idx) => (
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
                        setDraft((s) => ({
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
                    <label className="text-xs text-gray-600">Title</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border px-3 py-2"
                      value={r.title ?? ""}
                      onChange={(e) =>
                        setDraft((s) => ({
                          ...s,
                          rounds: s.rounds.map((it, i) =>
                            i === idx ? { ...it, title: e.target.value } : it
                          ),
                        }))
                      }
                      placeholder="เช่น รอบที่ 1"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="text-xs text-gray-600">วันสัมภาษณ์</label>
                    <DatePickerField
                      valueISO={r.interview_date || ""}
                      onChangeISO={(iso) =>
                        setDraft((s) => ({
                          ...s,
                          rounds: s.rounds.map((it, i) =>
                            i === idx ? { ...it, interview_date: iso } : it
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((s) => ({
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
              <h3 className="text-sm font-semibold text-slate-700">Monthly</h3>
              <button
                type="button"
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
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                + เพิ่มเดือน
              </button>
            </div>

            {(draft.monthly ?? []).length ? (
              draft.monthly.map((m, idx) => {
                const d = m.interview_date
                  ? parseISODateLocal(m.interview_date)
                  : undefined;
                const mm = d ? d.getMonth() + 1 : undefined;
                const label = m.label ?? (mm ? MONTHS_TH[mm - 1] : undefined);
                return (
                  <div
                    key={idx}
                    className="grid gap-3 md:grid-cols-12 rounded-lg border bg-slate-50/50 p-3">
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-600">Title</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border px-3 py-2"
                        value={m.title ?? ""}
                        onChange={(e) =>
                          setDraft((s) => ({
                            ...s,
                            monthly: s.monthly.map((it, i) =>
                              i === idx ? { ...it, title: e.target.value } : it
                            ),
                          }))
                        }
                        placeholder="เช่น รอบที่ 1"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="text-xs text-gray-600">
                        วันสัมภาษณ์
                      </label>
                      <DatePickerField
                        valueISO={m.interview_date || ""}
                        onChangeISO={(iso) =>
                          setDraft((s) => ({
                            ...s,
                            monthly: s.monthly.map((it, i) =>
                              i === idx ? { ...it, interview_date: iso } : it
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="text-xs text-gray-600">เดือน</label>
                      <div className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-700">
                        {label ? `${label}${mm ? ` (${mm})` : ""}` : "—"}
                      </div>
                    </div>
                    <div className="md:col-span-12 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((s) => ({
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
            onClick={() => onOpenChange(false)}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            type="button">
            ยกเลิก
          </button>
          <button
            onClick={onSave}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            type="button">
            บันทึก
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
