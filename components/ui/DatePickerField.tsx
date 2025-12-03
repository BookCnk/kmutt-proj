"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/** ---------- helpers ---------- */
const parseISODateLocal = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const toISODateLocal = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(
    2,
    "0"
  )}-${`${d.getDate()}`.padStart(2, "0")}`;
const toLocalDateOnly = (v?: string) => {
  if (!v) return undefined;
  if (v.includes("T")) {
    const d = new Date(v);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return parseISODateLocal(v);
};

const THAI_MONTHS = [
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

export default function DatePickerField({
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
  /** ===== Debug logger ===== */
  const debug = true;
  const log = (...args: any[]) => debug && console.log("[DatePicker]", ...args);

  const [open, setOpen] = React.useState(false);
  const date = toLocalDateOnly(valueISO);
  const minDate = disabledBefore ? toLocalDateOnly(disabledBefore) : undefined;

  const [viewDate, setViewDate] = React.useState<Date>(date || new Date());

  React.useEffect(() => {
    if (open) {
      setViewDate(date || new Date());
      log("effect: open changed -> reset viewDate =", date || new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valueISO]); // ใช้ valueISO ตรงๆ จะเห็นทุกครั้งที่ parent อัปเดต

  React.useEffect(() => {
    log("state: viewDate =", viewDate.toISOString(), " open =", open);
  }, [viewDate, open]);

  const label = date
    ? `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${
        date.getFullYear() + 543
      }`
    : "เลือกวันที่";

  // ปีช่วง +-3 (คัดตาม minDate)
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    const s = currentYear - 3;
    const e = currentYear + 3;
    const out: number[] = [];
    for (let y = s; y <= e; y++) {
      if (minDate && y < minDate.getFullYear()) continue;
      out.push(y);
    }
    log("memo years =", out);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, minDate?.getTime?.()]);

  const monthValue = String(viewDate.getMonth());
  const yearValue = String(viewDate.getFullYear());

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.currentTarget.value, 10);
    const next = new Date(viewDate.getFullYear(), newMonth, 1);
    log("onMonthChange ->", {
      from: viewDate.toISOString(),
      to: next.toISOString(),
    });
    setViewDate(next);
  };
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.currentTarget.value, 10);
    const next = new Date(newYear, viewDate.getMonth(), 1);
    log("onYearChange ->", {
      from: viewDate.toISOString(),
      to: next.toISOString(),
    });
    setViewDate(next);
  };

  const monthKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        log("popover onOpenChange", v);
        setOpen(v);
      }}
      modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full rounded-xl border px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between",
            !date && "text-muted-foreground"
          )}
          aria-label={ariaLabel ?? "เลือกวันที่"}>
          <span>{label}</span>
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0"
        onOpenAutoFocus={(e) => {
          log("popover onOpenAutoFocus");
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          log("popover onCloseAutoFocus");
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          log(
            "popover onPointerDownOutside target=",
            (e.target as HTMLElement)?.tagName
          );
          const t = e.target as HTMLElement | null;
          if (t?.closest?.("[data-dp-controls]") || t?.tagName === "SELECT") {
            log("prevent close: pointerDown on controls/select");
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          log(
            "popover onFocusOutside target=",
            (e.target as HTMLElement)?.tagName
          );
          const t = e.target as HTMLElement | null;
          if (t?.closest?.("[data-dp-controls]") || t?.tagName === "SELECT") {
            log("prevent close: focusOutside on controls/select");
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const t = e.target as HTMLElement | null;
          log(
            "popover onInteractOutside target=",
            t?.tagName,
            " class=",
            t?.className
          );
          if (t?.closest?.("[data-dp-controls]") || t?.tagName === "SELECT") {
            log("prevent close: interactOutside on controls/select");
            e.preventDefault();
          }
        }}>
        {/* Header controls */}
        <div className="flex gap-2 p-3 border-b" data-dp-controls>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none cursor-pointer"
            value={monthValue}
            onChange={handleMonthChange}
            onClick={() => log("select month click")}
            onMouseDown={() => log("select month mousedown")}>
            {THAI_MONTHS.map((month, index) => (
              <option key={month} value={String(index)}>
                {month}
              </option>
            ))}
          </select>

          <select
            className="flex h-9 w-32 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none cursor-pointer"
            value={yearValue}
            onChange={handleYearChange}
            onClick={() => log("select year click")}
            onMouseDown={() => log("select year mousedown")}>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year + 543}
              </option>
            ))}
          </select>
        </div>

        <Calendar
          key={monthKey}
          mode="single"
          selected={date}
          onSelect={(d) => {
            log("calendar onSelect", d);
            if (!d) return;
            onChangeISO(toISODateLocal(d));
            setOpen(false);
          }}
          initialFocus
          disabled={minDate ? { before: minDate } : undefined}
          month={new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)}
          onMonthChange={(m) => {
            log("calendar onMonthChange ->", m?.toISOString?.());
            setViewDate(m);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
