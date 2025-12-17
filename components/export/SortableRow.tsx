"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DataRow } from "@/app/admin/export/types";
import { ColumnDef } from "./DataTable";

interface SortableRowProps {
  row: DataRow;
  index: number;
  columns: ColumnDef<DataRow>[]; // ✅ NEW
  onToggleSelect: (id: string) => void;
  onUpdateRow: (id: string, updates: Partial<DataRow>) => void;
  onDeleteRow: (id: string) => void;
}

export function SortableRow({
  row,
  index,
  columns,
  onToggleSelect,
  onUpdateRow,
  onDeleteRow,
}: SortableRowProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDeleteRow(row.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

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
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors ${
        index % 2 ? "bg-slate-50/50" : "bg-white"
      } ${
        isDragging
          ? "opacity-50 scale-105 shadow-2xl z-50"
          : "hover:bg-emerald-50"
      }`}>
      {/* Drag Handle */}
      <td className="w-fit flex px-3 py-4 border-t border-slate-200 align-top">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1">
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
      <td className="px-4 py-4 border-t border-slate-200 align-top text-slate-500 font-medium">
        {index + 1}
      </td>

      {/* ✅ Dynamic cells (ตาม columns ที่ parent ส่งมา) */}
      {columns.map((c) => (
        <td
          key={c.key}
          className={`px-4 py-4 border-t border-slate-200 align-top ${
            c.className || ""
          }`}>
          {c.render(row)}
        </td>
      ))}

      {/* Export Checkbox */}
      <td className="px-4 py-4 border-t border-slate-200 align-top text-center">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={() => onToggleSelect(row.id)}
          className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        />
      </td>

      {/* Delete Action */}
      <td className="px-4 py-4 border-t border-slate-200 align-top text-center">
        <button
          onClick={handleDelete}
          className={`p-2 rounded-lg transition-all ${
            showDeleteConfirm
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "text-slate-400 hover:text-red-600 hover:bg-red-50"
          }`}
          title={
            showDeleteConfirm ? "คลิกอีกครั้งเพื่อยืนยันการลบ" : "ลบแถวนี้"
          }>
          {showDeleteConfirm ? (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </td>
    </tr>
  );
}
