"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DataRow } from "@/app/admin/export/types";

interface SortableRowProps {
  row: DataRow;
  index: number;
  headers: string[];
  colWidths: number[];
  onToggleSelect: (id: string) => void;
}

export function SortableRow({
  row,
  index,
  headers,
  colWidths,
  onToggleSelect,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={index % 2 ? "bg-slate-50" : "bg-white"}>
      {/* Drag Handle */}
      <td className="px-2 py-2 border-t border-slate-200 sticky left-0 bg-inherit z-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      </td>
      {/* Row Number */}
      <td className="px-3 py-2 border-t border-slate-200 bg-inherit z-10 text-slate-500">
        {index + 1}
      </td>
      {/* Data Cells */}
      {headers.map((_, ci) => (
        <td
          key={ci}
          className="px-3 py-2 border-t border-slate-200 text-slate-800 whitespace-pre-wrap"
          style={{ minWidth: colWidths[ci] + "ch" }}>
          {row.data[ci] ?? ""}
        </td>
      ))}
      {/* Actions Column - Checkbox */}
      <td className="px-3 py-2 border-t border-slate-200 text-center">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={() => onToggleSelect(row.id)}
          className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        />
      </td>
    </tr>
  );
}
