"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DataRow } from "@/app/admin/export/types";
import { SortableRow } from "./SortableRow";

interface DataTableProps {
  headers: string[];
  rows: DataRow[];
  page: number;
  setPage: (p: number) => void;
  perPage: number;
  onReorder: (newRows: DataRow[]) => void;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
}

export function DataTable({
  headers,
  rows,
  page,
  setPage,
  perPage,
  onReorder,
  onToggleSelect,
  onToggleAll,
}: DataTableProps) {
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const start = (page - 1) * perPage;
  const slice = rows.slice(start, start + perPage);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Estimate min-width per column from samples (for nicer layout)
  const colWidths = React.useMemo(() => {
    const widths = headers.map((h) => Math.max(10, h?.length || 0));
    const sample = rows.slice(0, 200);
    sample.forEach((r) =>
      r.data.forEach(
        (v, i) => (widths[i] = Math.max(widths[i], String(v ?? "").length))
      )
    );
    return widths.map((ch) => Math.min(36, Math.max(8, Math.round(ch * 0.75))));
  }, [headers, rows]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      const newRows = arrayMove(rows, oldIndex, newIndex);
      onReorder(newRows);
    }
  };

  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const someSelected = rows.some((r) => r.selected) && !allSelected;

  return (
    <div className="rounded-2xl border overflow-hidden bg-white">
      <div className="max-w-full overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}>
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                {/* Drag Handle Header */}
                <th className="px-2 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 sticky left-0 z-20 bg-slate-100">
                  <svg
                    className="w-5 h-5 text-slate-400"
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
                </th>
                {/* Row index sticky left */}
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 bg-slate-100">
                  #
                </th>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200"
                    style={{ minWidth: colWidths[i] + "ch" }}>
                    {h || `(คอลัมน์ ${i + 1})`}
                  </th>
                ))}
                {/* Actions Header with Select All */}
                <th className="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">
                  <div className="flex items-center justify-center gap-2">
                    <span>Export</span>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={onToggleAll}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      title="Select/Deselect All"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <SortableContext
              items={slice.map((r) => r.id)}
              strategy={verticalListSortingStrategy}>
              <tbody>
                {slice.map((row, ri) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    index={start + ri}
                    headers={headers}
                    colWidths={colWidths}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
                {slice.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-8 text-center text-slate-500 border-t border-slate-200"
                      colSpan={headers.length + 3}>
                      ไม่พบข้อมูลในหน้านี้
                    </td>
                  </tr>
                )}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border-t text-sm">
        <div className="text-slate-600">
          รวม {rows.length} แถว • หน้า {page} / {pageCount} •{" "}
          {rows.filter((r) => r.selected).length} แถวถูกเลือกสำหรับ Export
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-1 rounded-lg border bg-white disabled:opacity-50">
            « หน้าแรก
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-lg border bg-white disabled:opacity-50">
            ‹ ก่อนหน้า
          </button>
          <button
            onClick={() => setPage(Math.min(pageCount, page + 1))}
            disabled={page === pageCount}
            className="px-3 py-1 rounded-lg border bg-white disabled:opacity-50">
            ถัดไป ›
          </button>
          <button
            onClick={() => setPage(pageCount)}
            disabled={page === pageCount}
            className="px-3 py-1 rounded-lg border bg-white disabled:opacity-50">
            หน้าสุดท้าย »
          </button>
        </div>
      </div>
    </div>
  );
}
