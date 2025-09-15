// components/survey/fields/IntakeModeRadios.tsx
"use client";

import { useMemo, useState } from "react";
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
  month?: string | number; // API อาจส่งชื่อเดือนภาษาไทยมาแล้ว
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
};

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
  /** ชื่อกลุ่มเดียวกันต่อ 1 รายการ */
  groupName: string;
  /** "" | "open" | "closed" */
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
  const { control } = useFormContext<FormValuesWithIntakeModes>();

  // ใช้ประกาศที่เปิดอยู่วันนี้ (ถ้าไม่มี ใช้อันแรกเป็น fallback)
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

  // เตรียมลิสต์ (เรียงวันที่)
  const monthlyList = useMemo(
    () => (active?.monthly ?? []).slice().sort(byDateAsc),
    [active]
  );
  const roundsList = useMemo(
    () => (active?.rounds ?? []).slice().sort(byDateAsc),
    [active]
  );

  // state เปิด/ปิดที่ผู้ใช้เลือกต่อรายการ (ไม่อิง API)
  const [monthlyStatus, setMonthlyStatus] = useState<
    Record<string, "open" | "closed" | "">
  >({});
  const [roundsStatus, setRoundsStatus] = useState<
    Record<string, "open" | "closed" | "">
  >({});

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
      control={control as unknown as Control<FormValuesWithIntakeModes>}
      name={name}
      defaultValue={[]}
      render={({ field }) => {
        const selected = new Set(field.value ?? []);
        const toggle = (key: "none" | "rounds" | "monthly") => {
          const next = new Set(selected);
          next.has(key) ? next.delete(key) : next.add(key);
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
                {/* 1) ไม่เปิดรับสมัคร (ไม่มี panel) */}
                <OptionBlock
                  checked={selected.has("none")}
                  label="ไม่เปิดรับสมัคร"
                  onToggle={() => toggle("none")}
                />

                {/* 2) สัมภาษณ์เป็นรอบ — panel อยู่ใต้ checkbox นี้ทันที */}
                <OptionBlock
                  checked={selected.has("rounds")}
                  label="สัมภาษณ์เป็นรอบ"
                  onToggle={() => toggle("rounds")}>
                  {showRounds && (
                    <div className="rounded-lg border bg-white divide-y">
                      <div className="px-4 py-3 font-medium text-gray-900">
                        สัมภาษณ์เป็นรอบ
                      </div>
                      {roundsList.map((r, idx) => {
                        const key =
                          r._id ?? `${r.no}-${r.interview_date}`;
                        const status = roundsStatus[key] ?? "";
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

                {/* 3) สัมภาษณ์ทุกเดือน — panel อยู่ใต้ checkbox นี้ทันที */}
                <OptionBlock
                  checked={selected.has("monthly")}
                  label="สัมภาษณ์ทุกเดือน"
                  onToggle={() => toggle("monthly")}>
                  {showMonthly && (
                    <div className="rounded-lg border bg-white divide-y">
                      <div className="px-4 py-3 font-medium text-gray-900">
                        สัมภาษณ์ทุกเดือน
                      </div>
                      {monthlyList.map((m, idx) => {
                        const key =
                          (m._id ??
                          `${m.month ?? ""}-${m.interview_date}`) ||
                          String(idx);
                        const status = monthlyStatus[key] ?? "";
                        const monthLabel =
                          typeof m.month === "string"
                            ? m.month
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
