// components/survey/fields/IntakeModeRadios.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { Control } from "react-hook-form";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

/* ---------- Types ---------- */
export type AdmissionRound = {
  no: number;
  interview_date: string; // ISO
  open?: boolean;
  _id?: string;
};

export type AdmissionMonthly = {
  month?: string | number; // อาจเป็นชื่อเดือนภาษาไทย หรือเลขลำดับ
  interview_date: string; // ISO
  open?: boolean;
  _id?: string;
};

export type Admission = {
  _id: string;
  term: {
    semester: number;
    academic_year_th: number;
    label: string;
    sort_key: number;
  };
  application_window: {
    open_at: string;
    close_at: string;
    notice?: string;
    calendar_url?: string;
  };
  active: boolean;
  rounds: AdmissionRound[];
  monthly: AdmissionMonthly[];
};

export type FormValuesWithIntakeModes = {
  /** เลือกได้หลายอัน */
  intakeModes: Array<"none" | "rounds" | "monthly">;
  /** หมายเหตุเมื่อไม่เปิดรับสมัคร */
  closeNote?: string;
};

type IntakeCalendarForm = {
  intake_calendar?: {
    rounds?: Array<{ no: number; interview_date: string }>;
    monthly?: Array<{
      no: number;
      month: string | number;
      interview_date: string;
    }>;
  };
};

type FormValues = FormValuesWithIntakeModes & IntakeCalendarForm;

type Props = {
  name: "intakeModes";
  admissions?: Admission[];
};

/* ---------- Utils ---------- */
const dayStart = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
const dayEnd = (d: Date) =>
  new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

/** วันนี้อยู่ในช่วงประกาศ (นับทั้งวันตามเวลาท้องถิ่น) */
const isTodayInWindow = (
  openISO: string,
  closeISO: string,
  now = Date.now()
) => {
  const o = new Date(openISO),
    c = new Date(closeISO);
  const start = dayStart(o),
    end = dayEnd(c);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return now >= start && now <= end;
};

const formatTH = (iso: string) =>
  new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
    new Date(iso)
  );

const byDateAsc = <T extends { interview_date: string }>(a: T, b: T) =>
  new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime();

/* ---------- Small UI helpers ---------- */
function OptionBlock({
  checked,
  label,
  onToggle,
  children,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={onToggle} />
        {label}
      </label>
      {checked && <div className="pl-6">{children}</div>}
    </div>
  );
}

function OpenCloseRadios({
  groupName,
  value,
  onChange,
}: {
  groupName: string; // กลุ่มเดียวกันต่อ 1 รายการ
  value: "" | "open" | "closed";
  onChange: (v: "open" | "closed") => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="radio"
          name={groupName}
          checked={value === "closed"}
          onChange={() => onChange("closed")}
        />
        ไม่เปิดรับสมัคร
      </label>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="radio"
          name={groupName}
          checked={value === "open"}
          onChange={() => onChange("open")}
        />
        เปิดรับสมัคร
      </label>
    </div>
  );
}

/* ---------- Main ---------- */
export default function IntakeModeRadios({ name, admissions }: Props) {
  const { control, setValue, getValues } = useFormContext<FormValues>();

  // ใช้ประกาศที่เปิดวันนี้ ถ้าไม่มีใช้ตัวแรก
  const active = useMemo(() => {
    if (!admissions?.length) return undefined;
    return (
      admissions.find((a) =>
        isTodayInWindow(
          a.application_window.open_at,
          a.application_window.close_at
        )
      ) ?? admissions[0]
    );
  }, [admissions]);

  // เตรียมลิสต์ตามประกาศ (เรียงวันที่)
  const monthlyList = useMemo(
    () => (active?.monthly ?? []).slice().sort(byDateAsc),
    [active]
  );


  const roundsList = useMemo(
    () => (active?.rounds ?? []).slice().sort(byDateAsc),
    [active]
  );

  // สถานะเปิด/ปิด (ต่อรายการ) ที่ผู้ใช้เลือก
  const [monthlyStatus, setMonthlyStatus] = useState<
    Record<string, "open" | "closed" | "">
  >({});
  const [roundsStatus, setRoundsStatus] = useState<
    Record<string, "open" | "closed" | "">
  >({});

  // ✅ ตั้งค่า default เป็น "closed" สำหรับทุกรายการ (ครั้งแรก/เมื่อรายการเปลี่ยน)
  useEffect(() => {
    if (!roundsList.length) return;
    setRoundsStatus((prev) => {
      const next = { ...prev };
      roundsList.forEach((r) => {
        const key = r._id ?? `${r.no}-${r.interview_date}`;
        if (!next[key]) next[key] = "open";
      });
      return next;
    });
  }, [roundsList]);

  useEffect(() => {
    if (!monthlyList.length) return;
    setMonthlyStatus((prev) => {
      const next = { ...prev };
      monthlyList.forEach((m, idx) => {
        const fallback = `${m.month ?? ""}-${m.interview_date ?? ""}`;
        const key = m._id ?? (fallback ? fallback : String(idx));
        if (!next[key]) next[key] = "open";
      });
      return next;
    });
  }, [monthlyList]);

  // ให้ RHF มีคีย์ array เปล่าไว้ก่อน จะได้ไม่ undefined
  useEffect(() => {
    if (!Array.isArray(getValues("intake_calendar.rounds"))) {
      setValue("intake_calendar.rounds", [], { shouldDirty: false });
    }
    if (!Array.isArray(getValues("intake_calendar.monthly"))) {
      setValue("intake_calendar.monthly", [], { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เขียนค่าลง RHF ทุกครั้งที่ mode/สถานะเปิดปิด เปลี่ยน
  useEffect(() => {
    const selected: Array<"none" | "rounds" | "monthly"> =
      getValues(name) ?? [];
    const picked = new Set(selected);

    // none -> เคลียร์ทั้งสอง array
    if (picked.has("none")) {
      setValue("intake_calendar.rounds", [], { shouldDirty: true });
      setValue("intake_calendar.monthly", [], { shouldDirty: true });
      return;
    }

    // ROUNDS: เอาเฉพาะที่ติ๊ก open → map เหลือ { no, interview_date }
    const selectedRounds = picked.has("rounds")
      ? roundsList
          .filter(
            (r) =>
              (roundsStatus[r._id ?? `${r.no}-${r.interview_date}`] ??
                "closed") === "open"
          )
          .map((r) => ({
            no: Number(r.no),
            interview_date: r.interview_date,
          }))
      : [];

    // MONTHLY: เอาเฉพาะที่ติ๊ก open → map เหลือ { no, month, interview_date }
    const selectedMonthly = picked.has("monthly")
      ? (monthlyList
          .map((m, idx) => {
            const key = m._id ?? `${m.month ?? ""}-${m.interview_date}`;
            const status = (monthlyStatus[key] ?? "closed") as
              | "open"
              | "closed";
            if (status !== "open") return null;

            const ordinal = typeof m.month === "number" ? m.month : idx + 1;
            return {
              no: Number(ordinal),
              month: m.month ?? ordinal,
              interview_date: m.interview_date,
            };
          })
          .filter(Boolean) as Array<{
          no: number;
          month: string | number;
          interview_date: string;
        }>)
      : [];

    setValue("intake_calendar.rounds", selectedRounds, { shouldDirty: true });
    setValue("intake_calendar.monthly", selectedMonthly, { shouldDirty: true });
  }, [
    name,
    getValues,
    setValue,
    roundsList,
    monthlyList,
    roundsStatus,
    monthlyStatus,
  ]);

  if (!active) {
    return (
      <FormItem>
        <FormLabel className="text-base font-medium">
          รูปแบบการรับสมัคร
        </FormLabel>
        <div className="text-sm text-muted-foreground">
          ไม่มีข้อมูลประกาศรับสมัคร
        </div>
      </FormItem>
    );
  }

  return (
    <Controller
      control={control as unknown as Control<FormValues>}
      name={name}
      // ✅ ค่าเริ่มต้นให้ติ๊ก "ไม่เปิดรับสมัคร" ไว้ก่อน
      defaultValue={["none"]}
      render={({ field }) => {
        const selected = new Set(field.value ?? []);
        const toggle = (key: "none" | "rounds" | "monthly") => {
          const next = new Set(selected);
          if (key === "none") {
            // ถ้าเลือก none ให้ล้างตัวอื่นออก
            next.clear();
            next.add("none");
            setValue("intake_calendar.rounds", [], { shouldDirty: true });
            setValue("intake_calendar.monthly", [], { shouldDirty: true });
          } else {
            // ถ้าเลือกอย่างอื่น ให้เอา none ออก
            next.delete("none");
            next.has(key) ? next.delete(key) : next.add(key);
          }
          field.onChange(Array.from(next));
        };

        const showRounds = selected.has("rounds");
        const showMonthly = selected.has("monthly");

        return (
          <FormItem className="space-y-4">
            <FormLabel className="text-base font-medium">
              รูปแบบการรับสมัคร <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <div className="flex flex-col gap-4">
                {/* 1) ไม่เปิดรับสมัคร */}
                <OptionBlock
                  checked={selected.has("none")}
                  label="ไม่เปิดรับสมัคร"
                  onToggle={() => toggle("none")}>
                  {selected.has("none") && (
                    <div className="pl-6">
                      <Controller
                        control={control as unknown as Control<FormValues>}
                        name="closeNote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">หมายเหตุ</FormLabel>
                            <FormControl>
                              <textarea
                                className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="ระบุเหตุผลที่ไม่เปิดรับสมัคร..."
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </OptionBlock>

                {/* 2) สัมภาษณ์เป็นรอบ */}
                <OptionBlock
                  checked={selected.has("rounds")}
                  label="สัมภาษณ์เป็นรอบ"
                  onToggle={() => toggle("rounds")}>
                  {showRounds && (
                    <div className="rounded-lg border bg-white divide-y">
                      <div className="px-4 py-3 font-medium text-gray-900">
                        สัมภาษณ์เป็นรอบ
                      </div>
                      {roundsList.map((r) => {
                        const key = r._id ?? `${r.no}-${r.interview_date}`;
                        const status = (roundsStatus[key] ?? "closed") as
                          | "open"
                          | "closed";
                        return (
                          <div key={key} className="px-6 py-4">
                            <div className="font-medium text-primary">
                              รอบที่ {r.no}
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({formatTH(r.interview_date)})
                              </span>
                            </div>
                            <OpenCloseRadios
                              groupName={`openclose-round-${key}`}
                              value={status}
                              onChange={(v) =>
                                setRoundsStatus((s) => ({ ...s, [key]: v }))
                              }
                            />
                          </div>
                        );
                      })}
                      {!roundsList.length && (
                        <div className="px-6 py-4 text-sm text-muted-foreground">
                          ไม่มีข้อมูลรอบสัมภาษณ์
                        </div>
                      )}
                    </div>
                  )}
                </OptionBlock>

                {/* 3) สัมภาษณ์ทุกเดือน */}

                <OptionBlock
                  checked={selected.has("monthly")}
                  label="สัมภาษณ์ทุกเดือน"
                  onToggle={() => toggle("monthly")}>
                  {showMonthly && (
                    <div className="rounded-lg border bg-white divide-y">
                      <div className="px-4 py-3 font-medium text-gray-900">
                        สัมภาษณ์ทุกเดือน
                      </div>

                      {monthlyList.map((m: any, idx) => {
                        const fallback = `${m.month ?? ""}-${
                          m.interview_date ?? ""
                        }`;
                        const key =
                          m._id ?? (fallback ? fallback : String(idx));
                        const status = (monthlyStatus[key] ?? "closed") as
                          | "open"
                          | "closed";
                        const monthLabel =
                          typeof m.month === "string"
                            ? m.title
                            : `เดือนที่ ${m.month}`;
                        return (
                          <div key={key} className="px-6 py-4">
                            <div className="font-medium text-primary">
                              {monthLabel}
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({formatTH(m.interview_date)})
                              </span>
                            </div>
                            <OpenCloseRadios
                              groupName={`openclose-month-${key}`}
                              value={status}
                              onChange={(v) =>
                                setMonthlyStatus((s) => ({ ...s, [key]: v }))
                              }
                            />
                          </div>
                        );
                      })}
                      {!monthlyList.length && (
                        <div className="px-6 py-4 text-sm text-muted-foreground">
                          ไม่มีข้อมูลรอบรายเดือน
                        </div>
                      )}
                    </div>
                  )}
                </OptionBlock>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
