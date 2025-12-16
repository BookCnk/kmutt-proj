"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DataRow } from "@/app/admin/export/types";
import { EditableCell } from "./EditableCell";

interface SortableRowProps {
  row: DataRow;
  index: number;
  onToggleSelect: (id: string) => void;
  onUpdateRow: (id: string, updates: Partial<DataRow>) => void;
  onDeleteRow: (id: string) => void;
}

export function SortableRow({
  row,
  index,
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
      // Auto-hide confirm after 3 seconds
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

  const currentStageOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`transition-colors ${index % 2 ? "bg-slate-50/50" : "bg-white"} ${
        isDragging ? "opacity-50 scale-105 shadow-2xl z-50" : "hover:bg-emerald-50"
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

      {/* Sequence - READ ONLY */}
      <td className="px-4 py-4 border-t border-slate-200 align-top" style={{ minWidth: "8ch" }}>
        <div className="px-3 py-2 text-slate-700 font-semibold bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 rounded-lg shadow-sm text-center">
          {row.sequence}
        </div>
      </td>

      {/* Label on Web (TH) with Description */}
      <td className="px-4 py-4 border-t border-slate-200 align-top" style={{ minWidth: "20ch" }}>
        <div className="space-y-2">
          <EditableCell
            value={row.label_on_web_th}
            onChange={(val) => onUpdateRow(row.id, { label_on_web_th: String(val) })}
            required={true}
            className="text-lg"
          />
          <div className="pt-1">
            <EditableCell
              value={row.label_on_web_th_description || ""}
              onChange={(val) => onUpdateRow(row.id, { label_on_web_th_description: String(val) })}
              type="textarea"
              rows={2}
              placeholder="คำอธิบาย Label on Web (TH)..."
              className="text-lg text-slate-600"
            />
          </div>
        </div>
      </td>

      {/* Label on Web (EN) */}
      <td className="px-4 py-4 border-t border-slate-200 align-top" style={{ minWidth: "20ch" }}>
        <EditableCell
          value={row.label_on_web_en}
          onChange={(val) => onUpdateRow(row.id, { label_on_web_en: String(val) })}
          required={true}
          className="text-lg"
        />
      </td>

      {/* Start Date and End Date with Description */}
      <td className="px-4 py-4 border-t border-slate-200 align-top" style={{ minWidth: "20ch" }}>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <label className="w-full text-base text-slate-500 mb-1 block">Start Date</label>
              <EditableCell
                value={row.start_date}
                onChange={(val) => onUpdateRow(row.id, { start_date: String(val) })}
                type="date"
                required={true}
                className="text-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-full text-base text-slate-500 mb-1 block">End Date</label>
              <EditableCell
                value={row.end_date}
                onChange={(val) => onUpdateRow(row.id, { end_date: String(val) })}
                type="date"
                required={true}
                className="text-lg"
              />
            </div>
          </div>
          <div className="pt-1">
            <EditableCell
              value={row.date_description || ""}
              onChange={(val) => onUpdateRow(row.id, { date_description: String(val) })}
              type="textarea"
              rows={2}
              placeholder="คำอธิบายวันที่..."
              className="text-lg text-slate-600"
            />
          </div>
        </div>
      </td>

      {/* Actions Column - Checkbox */}
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
          title={showDeleteConfirm ? "คลิกอีกครั้งเพื่อยืนยันการลบ" : "ลบแถวนี้"}>
          {showDeleteConfirm ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </td>
    </tr>
  );
}
