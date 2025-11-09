"use client";

import { clsx } from "@/app/admin/export/utils";

interface SheetTabsProps {
  sheets: string[];
  current: string;
  onChange: (name: string) => void;
}

export function SheetTabs({ sheets, current, onChange }: SheetTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sheets.map((name) => (
        <button
          key={name}
          onClick={() => onChange(name)}
          className={clsx(
            "px-3 py-1.5 rounded-xl border text-sm font-medium transition",
            current === name
              ? "bg-emerald-600 border-emerald-600 text-white shadow"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          )}>
          {name}
        </button>
      ))}
    </div>
  );
}
