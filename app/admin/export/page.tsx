"use client";

import React from "react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Excel → Web Preview (Single File)
 * - Upload/drag Excel
 * - Pick sheet
 * - Auto-detect header row (first non-empty row)
 * - Pretty table with sticky headers, row index, search & pagination
 * - Handle merged cells by expanding values across the merge range
 * - Filter columns to ONLY the 7 required headers
 *
 * Install:
 *   npm i xlsx framer-motion
 */

type SheetMatrix = {
  name: string;
  headers: string[];
  rows: (string | number)[][];
};

type Step = "idle" | "loaded";

// ---------- Utilities ----------
function clsx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/** Convert sheet to 2D matrix (strings), expanding merged ranges. */
function toMatrix(ws: XLSX.WorkSheet): string[][] {
  // ✅ ถูกต้อง: ส่ง ws เป็นพารามิเตอร์ตัวแรกของ sheet_to_json
  const A = XLSX.utils.sheet_to_json<string[]>(ws, {
    header: 1,
    raw: false, // ให้ฟอร์แมตวันที่/ตัวเลขเป็นสตริงให้อ่านง่าย
    defval: "", // ช่องว่างให้เป็น "" ไม่ใช่ undefined
  }) as unknown as string[][];

  // ✅ ขยายค่าในช่วง merge ให้เห็นครบทุกช่อง (พรีวิวจะเป็น “ตารางจริง”)
  const merges: XLSX.Range[] = (ws["!merges"] || []) as XLSX.Range[];
  merges.forEach((m) => {
    const v = A[m.s.r]?.[m.s.c] ?? "";
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        if (!A[r]) A[r] = [] as any;
        A[r][c] = v;
      }
    }
  });

  return A || [];
}

function firstNonEmptyRowIndex(A: string[][]): number {
  return Math.max(
    0,
    A.findIndex((r) => r.some((c) => String(c).trim() !== ""))
  );
}

function parseSheet(ws: XLSX.WorkSheet): {
  headers: string[];
  rows: (string | number)[][];
} {
  const A = toMatrix(ws);
  if (!A.length) return { headers: [], rows: [] };

  // หาแถว header แรกที่มีข้อมูลจริง
  const headerIdx = firstNonEmptyRowIndex(A);
  const headers = (A[headerIdx] || []).map(String);

  // ข้ามแถวว่าง และคงลำดับคอลัมน์ตาม headers
  const body = A.slice(headerIdx + 1).filter((r) =>
    r.some((c) => String(c).trim() !== "")
  );
  return { headers, rows: body };
}

// ---------- UI Pieces ----------
function Dropzone({ onPick }: { onPick: (f: File) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onPick(file);
      }}
      className={clsx(
        "border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer",
        dragOver
          ? "border-emerald-500 bg-emerald-50/50"
          : "border-slate-300 bg-white hover:bg-slate-50"
      )}
      onClick={() => inputRef.current?.click()}>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-emerald-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor">
            <path
              strokeWidth="2"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v11"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-800">
            อัปโหลด/วางไฟล์ Excel
          </h3>
          <p className="text-slate-500 text-sm">
            รองรับ .xlsx / .xls — ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function SheetTabs({
  sheets,
  current,
  onChange,
}: {
  sheets: string[];
  current: string;
  onChange: (name: string) => void;
}) {
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

function Toolbar({
  search,
  setSearch,
  perPage,
  setPerPage,
  onReset,
  fileName,
}: {
  search: string;
  setSearch: (v: string) => void;
  perPage: number;
  setPerPage: (n: number) => void;
  onReset: () => void;
  fileName: string | null;
}) {
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
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50">
          เริ่มใหม่
        </button>
      </div>
    </div>
  );
}

function DataTable({
  headers,
  rows,
  page,
  setPage,
  perPage,
}: {
  headers: string[];
  rows: (string | number)[][];
  page: number;
  setPage: (p: number) => void;
  perPage: number;
}) {
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const start = (page - 1) * perPage;
  const slice = rows.slice(start, start + perPage);

  // Estimate min-width per column from samples (for nicer layout)
  const colWidths = React.useMemo(() => {
    const widths = headers.map((h) => Math.max(10, h?.length || 0));
    const sample = rows.slice(0, 200);
    sample.forEach((r) =>
      r.forEach(
        (v, i) => (widths[i] = Math.max(widths[i], String(v ?? "").length))
      )
    );
    return widths.map((ch) => Math.min(36, Math.max(8, Math.round(ch * 0.75))));
  }, [headers, rows]);

  return (
    <div className="rounded-2xl border overflow-hidden bg-white">
      <div className="max-w-full overflow-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              {/* Row index sticky left */}
              <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200 sticky left-0 z-20 bg-slate-100">
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
            </tr>
          </thead>
          <AnimatePresence initial={false}>
            <tbody>
              {slice.map((r, ri) => (
                <motion.tr
                  key={start + ri}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className={ri % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-3 py-2 border-t border-slate-200 sticky left-0 bg-inherit z-10 text-slate-500">
                    {start + ri + 1}
                  </td>
                  {headers.map((_, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-2 border-t border-slate-200 text-slate-800 whitespace-pre-wrap"
                      style={{ minWidth: colWidths[ci] + "ch" }}>
                      {r[ci] ?? ""}
                    </td>
                  ))}
                </motion.tr>
              ))}
              {slice.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-slate-500 border-t border-slate-200"
                    colSpan={headers.length + 1}>
                    ไม่พบข้อมูลในหน้านี้
                  </td>
                </tr>
              )}
            </tbody>
          </AnimatePresence>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border-t text-sm">
        <div className="text-slate-600">
          รวม {rows.length} แถว • หน้า {page} / {pageCount}
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

export default function AdminExportPage() {
  const [step, setStep] = React.useState<Step>("idle");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [sheets, setSheets] = React.useState<SheetMatrix[]>([]);
  const [current, setCurrent] = React.useState<string>("");

  // UI state
  const [search, setSearch] = React.useState("");
  const [perPage, setPerPage] = React.useState(20);
  const [page, setPage] = React.useState(1);

  const currentSheet = sheets.find((s) => s.name === current) || sheets[0];

  const filteredRows = React.useMemo(() => {
    if (!currentSheet) return [] as (string | number)[][];
    if (!search.trim()) return currentSheet.rows;
    const q = search.toLowerCase();
    return currentSheet.rows.filter((r) =>
      r.some((c) => String(c).toLowerCase().includes(q))
    );
  }, [search, currentSheet]);

  React.useEffect(() => setPage(1), [search, current]);

  const handlePick = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);

    const parsed: SheetMatrix[] = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const { headers, rows } = parseSheet(ws);

      // ✅ ดึงเฉพาะ 7 คอลัมน์ตามชื่อที่ต้องการ
      const wanted = [
        "Sequence",
        "Label on Web (TH)",
        "Label on Web (EN)",
        "Application Form Status",
        "Start Date",
        "End Date",
        "Current Stage",
      ];

      // เผื่อ header สะกดต่าง/มีช่องว่างเกิน
      const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

      const idx = wanted.map((col) => {
        const i = headers.findIndex((h) => norm(h) === norm(col));
        return i >= 0
          ? i
          : headers.findIndex((h) => norm(h).includes(norm(col))); // fallback contains
      });

      const filteredRows = rows.map((r) =>
        idx.map((i) => (i >= 0 ? r[i] : ""))
      );

      return { name, headers: wanted, rows: filteredRows };
    });

    setSheets(parsed);
    setCurrent(parsed[0]?.name || "");
    setStep("loaded");
  };

  const onReset = () => {
    setStep("idle");
    setFileName(null);
    setSheets([]);
    setCurrent("");
    setSearch("");
    setPerPage(20);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6 md:p-8">
      <header className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Excel → Preview
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-600 mt-1">
          อัปโหลด Excel แล้วพรีวิวเฉพาะ 7 คอลัมน์สำคัญ พร้อมค้นหาและแบ่งหน้า —
          ไม่มีขั้นตอนสร้าง PDF
        </motion.p>
      </header>

      <AnimatePresence mode="wait">
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="max-w-4xl mx-auto">
            <Dropzone onPick={handlePick} />
            <div className="mt-4 text-xs text-slate-500">
              เคล็ดลับ: แนะนำให้มีแถวหัวคอลัมน์ชัดเจน ระบบจะจับเป็น header
              อัตโนมัติ
            </div>
          </motion.div>
        )}

        {step === "loaded" && currentSheet && (
          <motion.div
            key="loaded"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4">
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 justify-between">
                <SheetTabs
                  sheets={sheets.map((s) => s.name)}
                  current={current}
                  onChange={(n) => setCurrent(n)}
                />
              </div>
              <div className="mt-4">
                <Toolbar
                  search={search}
                  setSearch={setSearch}
                  perPage={perPage}
                  setPerPage={setPerPage}
                  onReset={onReset}
                  fileName={fileName}
                />
              </div>
            </div>

            <DataTable
              headers={currentSheet.headers}
              rows={filteredRows}
              page={page}
              setPage={setPage}
              perPage={perPage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
