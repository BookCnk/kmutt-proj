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
  rows: DataRow[];
  page: number;
  setPage: (p: number) => void;
  perPage: number;
  onReorder: (newRows: DataRow[]) => void;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onUpdateRow: (id: string, updates: Partial<DataRow>) => void;
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
  isAdmin: boolean;
}

const HEADERS = [
  "Sequence",
  "Label on Web (TH)",
  "Label on Web (EN)",
  "Dates",
];

export function DataTable({
  rows,
  page,
  setPage,
  perPage,
  onReorder,
  onToggleSelect,
  onToggleAll,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  isAdmin,
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
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Table Header with Add Button */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">ข้อมูลตาราง</h3>
            <p className="text-sm text-slate-600 mt-0.5">จัดการและแก้ไขข้อมูลของคุณ</p>
          </div>
          <button
            onClick={onAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">เพิ่มแถวใหม่</span>
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}>
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10">
              <tr>
                {/* Drag Handle Header */}
                <th className="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-300 sticky left-0 z-20 bg-gradient-to-r from-slate-100 to-slate-50">
                  <div className="w-fit flex items-center gap-1">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </th>
                {/* Row index */}
                <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b-2 border-slate-300 bg-gradient-to-r from-slate-100 to-slate-50">
                  #
                </th>
                {HEADERS.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left font-semibold text-slate-700 border-b-2 border-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{h}</span>
                    </div>
                  </th>
                ))}
                {/* Actions Header with Select All */}
                <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b-2 border-slate-300 whitespace-nowrap">
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
                {/* Delete Action Header */}
                <th className="px-4 py-3 text-center font-semibold text-slate-700 border-b-2 border-slate-300 whitespace-nowrap">
                  Actions
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
                    onToggleSelect={onToggleSelect}
                    onUpdateRow={onUpdateRow}
                    onDeleteRow={onDeleteRow}
                  />
                ))}
                {slice.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-12 text-center text-slate-500"
                      colSpan={HEADERS.length + 5}>
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-16 h-16 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <div>
                          <p className="text-base font-medium text-slate-600">ไม่พบข้อมูลในหน้านี้</p>
                          <p className="text-sm text-slate-500 mt-1">คลิกปุ่ม `เพิ่มแถวใหม่` เพื่อเริ่มต้น</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>
      {/* Enhanced Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-slate-700 font-medium">{rows.length} แถวทั้งหมด</span>
          </div>
          <div className="w-px h-4 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-slate-600">หน้า {page} / {pageCount}</span>
          </div>
          <div className="w-px h-4 bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-600">
              <span className="font-semibold text-emerald-600">{rows.filter((r) => r.selected).length}</span> แถวถูกเลือก
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 font-medium">
            « หน้าแรก
          </button>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 font-medium">
            ‹ ก่อนหน้า
          </button>
          <div className="px-3 py-2 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold">
            {page}
          </div>
          <button
            onClick={() => setPage(Math.min(pageCount, page + 1))}
            disabled={page === pageCount}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 font-medium">
            ถัดไป ›
          </button>
          <button
            onClick={() => setPage(pageCount)}
            disabled={page === pageCount}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 font-medium">
            หน้าสุดท้าย »
          </button>
        </div>
      </div>
    </div>
  );
}
