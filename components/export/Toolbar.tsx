"use client";

interface ToolbarProps {
  search: string;
  setSearch: (v: string) => void;
  perPage: number;
  setPerPage: (n: number) => void;
  onReset: () => void;
  fileName: string | null;
  onExport: () => void;
  onSave?: () => void;
  selectedCount: number;
  isAdmin: boolean;
  isSaving?: boolean;
}

export function Toolbar({
  search,
  setSearch,
  perPage,
  setPerPage,
  onReset,
  fileName,
  onExport,
  onSave,
  selectedCount,
  isAdmin,
  isSaving = false,
}: ToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาในตาราง..."
            className="pl-10 pr-3 py-2 w-72 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-2.5 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="M21 21l-3.5-3.5" strokeWidth="2" />
          </svg>
        </div>
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="px-3 py-2 border rounded-xl bg-white">
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} แถว/หน้า
            </option>
          ))}
        </select>
      </div>
      <div className="text-xs text-slate-500">ไฟล์: {fileName || "—"}</div>
      <div className="flex items-center gap-2">
        {isAdmin && onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            {isSaving ? "กำลังบันทึก..." : "Save to Database"}
          </button>
        )}
        <button
          onClick={onExport}
          disabled={selectedCount === 0}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Excel ({selectedCount})
        </button>
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50">
          เริ่มใหม่
        </button>
      </div>
    </div>
  );
}
