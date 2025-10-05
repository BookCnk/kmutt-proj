// src/components/survey/SurveyTable.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  ArrowUpDown,
  Printer,
  Trash2,
  Loader2,
} from "lucide-react";
import SurveyDetailsDialog from "@/components/survey/SurveyDetailsDialog";

import {
  getForms as getFormsUser,
  adminListForms,
  deleteForm as deleteFormUser,
  adminDeleteForm,
} from "@/api/formService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useAuthStore } from "@/stores/auth";
import { getAuthUser } from "@/utils/storage";

/* ---------------- helpers ---------------- */
function normalizeId(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const a = v as any;
  return a._id || a.id || a.value || "";
}
function textOf(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.title || v.name || v.label || v._id || v.id || "";
}
function asText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const a = v as any;
  return a.title || a.name || a.label || normalizeId(a);
}
function formatDateTH(d?: string) {
  try {
    if (!d) return "-";
    return format(new Date(d), "dd MMM yyyy", { locale: th });
  } catch {
    return "-";
  }
}

/** ---------------- types + sort mapping ---------------- */
type ProgramInForm = {
  programId: string;
  title: string;
  master?: { amount?: number; bachelor_req?: boolean; master_req?: boolean };
  doctoral?: { amount?: number; bachelor_req?: boolean; master_req?: boolean };
  rounds?: Array<{ no?: number; interview_date?: string; active?: boolean }>;
  monthly?: Array<{
    month?: string | number;
    interview_date?: string;
    active?: boolean;
  }>;
  message?: string;
};

export type SurveyRow = {
  id: string;
  faculty: string;
  department: string;
  program: string;
  programs: ProgramInForm[];
  submitterEmail: string;
  submitterName: string;
  coordinator: string;
  phone: string[];
  submittedAt: string;
};

type SurveyCol = keyof SurveyRow;

function mapSortKeyToClientNumber(k: SurveyCol): number | undefined {
  switch (k) {
    case "faculty":
      return 1;
    case "department":
      return 2;
    case "program":
      return 3;
    case "submitterName":
      return 4;
    case "submitterEmail":
      return 5;
    case "submittedAt":
      return 6;
    default:
      return undefined;
  }
}

function mapSortKeyToApiField(k: SurveyCol): string | undefined {
  switch (k) {
    case "submittedAt":
      return "created_at";
    case "submitterName":
      return "submitter.name";
    case "submitterEmail":
      return "submitter.email";
    case "department":
      return "department_id";
    case "faculty":
      return "faculty";
    default:
      return undefined;
  }
}

/* ---------- client filter/sort/page สำหรับโหมด user ---------- */
function clientFilter(all: any[], p: any) {
  let arr = Array.isArray(all) ? all.slice() : [];

  if (p.faculty) {
    const q = String(p.faculty).trim().toLowerCase();
    arr = arr.filter((d) => textOf(d.faculty_id).toLowerCase().includes(q));
  }
  if (p.department) {
    const q = String(p.department).trim().toLowerCase();
    arr = arr.filter((d) => textOf(d.department_id).toLowerCase().includes(q));
  }
  if (p.program) {
    const q = String(p.program).trim().toLowerCase();
    arr = arr.filter((d) => {
      const ips = Array.isArray(d.intake_programs) ? d.intake_programs : [];
      return ips.some((ip: any) =>
        textOf(ip.program_id).toLowerCase().includes(q)
      );
    });
  }
  if (p.submitter_name) {
    const q = String(p.submitter_name).trim().toLowerCase();
    arr = arr.filter((d) =>
      (d.submitter?.name || "").toLowerCase().includes(q)
    );
  }
  if (p.submitter_email) {
    const q = String(p.submitter_email).trim().toLowerCase();
    arr = arr.filter((d) =>
      (d.submitter?.email || "").toLowerCase().includes(q)
    );
  }
  return arr;
}

function clientSort(all: any[], sortNum?: number, dir: "asc" | "desc" = "asc") {
  const mul = dir === "desc" ? -1 : 1;
  const by = (a: any, b: any) => {
    switch (sortNum) {
      case 1:
        return textOf(a.faculty_id).localeCompare(textOf(b.faculty_id)) * mul;
      case 2:
        return (
          textOf(a.department_id).localeCompare(textOf(b.department_id)) * mul
        );
      case 3: {
        const at = textOf(a.intake_programs?.[0]?.program_id);
        const bt = textOf(b.intake_programs?.[0]?.program_id);
        return at.localeCompare(bt) * mul;
      }
      case 4:
        return (
          (a.submitter?.name || "").localeCompare(b.submitter?.name || "") * mul
        );
      case 5:
        return (
          (a.submitter?.email || "").localeCompare(b.submitter?.email || "") *
          mul
        );
      case 6:
        return (
          (+new Date(a.created_at || a.updated_at) -
            +new Date(b.created_at || b.updated_at)) *
          mul
        );
      default:
        return 0;
    }
  };
  return Array.isArray(all) ? all.slice().sort(by) : [];
}

function clientPage<T>(all: T[], page: number, limit: number) {
  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const start = (Math.max(1, page) - 1) * Math.max(1, limit);
  const end = start + Math.max(1, limit);
  return { items: all.slice(start, end), total, pages };
}

/* ---------------- mapper ---------------- */
function mapFormToSurveyRow(doc: any): SurveyRow {
  const id = normalizeId(doc._id);
  const faculty = asText(doc.faculty_id);
  const department = asText(doc.department_id);

  const intakePrograms: ProgramInForm[] = Array.isArray(doc.intake_programs)
    ? doc.intake_programs.map((ip: any) => {
        const title = asText(ip.program_id);
        const programId = normalizeId(ip.program_id);
        const deg = ip?.intake_degree || {};
        const master = deg.master
          ? {
              amount: deg.master.amount,
              bachelor_req: !!deg.master.bachelor_req,
              master_req: !!deg.master.master_req,
            }
          : undefined;
        const doctoral = deg.doctoral
          ? {
              amount: deg.doctoral.amount,
              bachelor_req: !!deg.doctoral.bachelor_req,
              master_req: !!deg.doctoral.master_req,
            }
          : undefined;

        const cal = ip?.intake_calendar || {};
        const rounds = cal?.rounds || [];
        const monthly = cal?.monthly || [];
        const message = cal?.message || "";

        return { programId, title, master, doctoral, rounds, monthly, message };
      })
    : [];

  const programSummary =
    intakePrograms.length === 0
      ? "-"
      : intakePrograms.length === 1
      ? intakePrograms[0].title
      : `${intakePrograms[0].title} +${intakePrograms.length - 1}`;

  const submitterName = doc?.submitter?.name ?? "-";
  const submitterEmail = doc?.submitter?.email ?? "-";
  const coordinator = submitterName;

  const phone: string[] = Array.isArray(doc?.submitter?.phone)
    ? doc.submitter.phone
    : doc?.submitter?.phone
    ? [String(doc.submitter.phone)]
    : [];

  const submittedAt =
    doc?.created_at ?? doc?.updated_at ?? new Date().toISOString();

  return {
    id,
    faculty,
    department,
    program: programSummary,
    programs: intakePrograms,
    submitterEmail,
    submitterName,
    coordinator,
    phone,
    submittedAt,
  };
}

/* ---------------- component ---------------- */
interface TableFilters {
  faculty: string;
  department: string;
  program: string;
  submitterName: string;
  submitterEmail: string;
}

interface SurveyTableProps {
  onCreateNew?: () => void;
}

export function SurveyTable({ onCreateNew }: SurveyTableProps) {
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<keyof SurveyRow>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedRow, setSelectedRow] = useState<string>("");

  const [filters, setFilters] = useState<TableFilters>({
    faculty: "",
    department: "",
    program: "",
    submitterName: "",
    submitterEmail: "",
  });
  const debouncedFilters = useDebounce(filters, 300);

  // view/delete
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<SurveyRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");

  function normTH(s: string) {
    return (s || "").trim().normalize("NFC");
  }

  // role
  const storeUser = useAuthStore((s) => s.user);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const role = storeUser?.role ?? getAuthUser()?.role;
    setIsAdmin(role === "admin");
  }, [storeUser]);

  // unwrap helper - support many wrapper shapes (axios/res.data/data, direct array, etc.)
  function unwrapList(res: any): any[] {
    if (!res) return [];
    // If res is array itself
    if (Array.isArray(res)) return res;
    // axios-style: res.data could be array or object
    if (Array.isArray(res?.data)) return res.data;
    // nested common shapes:
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.items)) return res.items;
    // sometimes API returns { status, data: { items: [...] } }
    if (Array.isArray(res?.data?.result)) return res.data.result;
    // fallback empty
    return [];
  }

  // admin response extractor (อ่าน info.totalCount ถ้ามี)
  function extractAdminPaging(res: any, fallbackLimit: number) {
    // items could be in res.data or res.data.data etc.

    const items = unwrapList(res);
    const info =
      res?.info ?? res?.data?.info ?? res?.pagination ?? res?.meta ?? {};
    const limit = Number(info.limit ?? fallbackLimit ?? 10) || 10;

    // server may return totalCount, total or pages + currentCount
    const total =
      Number(
        info.totalCount ??
          info.total ??
          res?.total ??
          res?.data?.total ??
          items.length
      ) || 0;

    // prefer server pages (info.pages) if present, otherwise compute
    const pagesServer = Number(info.pages) || undefined;
    const computedPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
    const pages = pagesServer ? Math.max(1, pagesServer) : computedPages;

    const currentCount = Number(info.currentCount ?? items.length);

    return { items, total, pages, currentCount, limit };
  }

  // user response extractor: ถ้ามี info.totalCount ใช้ backend; ถ้าไม่มีก็ fallback client-side
  function extractUserPaging(res: any, fallbackLimit: number) {
    const items = unwrapList(res);
    const info = res?.info ?? res?.data?.info ?? {};
    const hasTotalCount = typeof info?.totalCount !== "undefined";

    if (!hasTotalCount) {
      return {
        items,
        total: items.length,
        pages: Math.max(
          1,
          Math.ceil(items.length / Math.max(1, fallbackLimit || 10))
        ),
        limit: fallbackLimit || 10,
        hasInfo: false,
      };
    }

    const limit = Number(info.limit ?? fallbackLimit ?? 10) || 10;
    const total = Number(info.totalCount ?? info.total ?? 0) || 0;
    const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
    return {
      items,
      total,
      pages,
      limit,
      currentCount: Number(info.currentCount ?? items.length),
      hasInfo: true,
    };
  }

  /* ---- API params memo ---- */
  const apiParams: any = useMemo(() => {
    const sortField = mapSortKeyToApiField(sortColumn);
    const sortSign: 1 | -1 | undefined = sortField
      ? sortDirection === "asc"
        ? 1
        : -1
      : undefined;

    return {
      page: currentPage,
      limit: pageSize,
      faculty: normTH(debouncedFilters.faculty) || undefined,
      department: normTH(debouncedFilters.department) || undefined,
      program: normTH(debouncedFilters.program) || undefined,
      submitter_name: normTH(debouncedFilters.submitterName) || undefined,
      submitter_email: normTH(debouncedFilters.submitterEmail) || undefined,
      sort: sortSign,
      sort_option: sortField,
      clientSortNum: mapSortKeyToClientNumber(sortColumn),
    };
  }, [
    currentPage,
    pageSize,
    sortColumn,
    sortDirection,
    debouncedFilters.faculty,
    debouncedFilters.department,
    debouncedFilters.program,
    debouncedFilters.submitterName,
    debouncedFilters.submitterEmail,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");

      try {
        let items: any[] = [];
        let total = 0;
        let pages = 1;

        // === CONDITION: admin vs user ===
        if (isAdmin) {
          // admin -> call adminListForms (server side paging expected)
          const res = await adminListForms(apiParams);

          const ext = extractAdminPaging(res, apiParams.limit);
          items = ext.items;
          total = ext.total;
          pages = ext.pages;
        } else {
          // user -> call getFormsUser
          // if backend user endpoint sends info.totalCount, use server values
          // otherwise fallback to client-side filter/sort/paging
          const raw = await getFormsUser();
          const ext = extractUserPaging(raw, apiParams.limit);

          if (ext.hasInfo) {
            // server provided totalCount/pages
            // But we still apply server-side paging: the 'items' here may be current page
            items = ext.items;
            total = ext.total;
            pages = ext.pages;
          } else {
            // Client-side fallback
            const list = unwrapList(raw);
            const filtered = clientFilter(list, apiParams);
            const sorted = clientSort(
              filtered,
              apiParams.clientSortNum,
              sortDirection
            );
            const paged = clientPage(
              sorted,
              apiParams.page || 1,
              apiParams.limit || 10
            );
            items = paged.items;
            total = paged.total;
            pages = paged.pages;
          }
        }

        const mapped = (Array.isArray(items) ? items : []).map(
          mapFormToSurveyRow
        );
        if (!cancelled) {
          setRows(mapped);
          setTotal(total);
          setTotalPages(Math.max(1, pages));
          // If current page is out of range (e.g., after changing pageSize), clamp it.
          if (currentPage > Math.max(1, pages)) {
            // setCurrentPage will re-trigger effect - that's intended to fetch the correct page
            setCurrentPage(1);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "ไม่สามารถโหลดข้อมูลได้");
          setRows([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // include currentPage so admin paging respects requested page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiParams, isAdmin, sortDirection, currentPage]);

  const handleSort = useCallback(
    (column: SurveyCol) => {
      setSortDirection((prev) =>
        sortColumn === column ? (prev === "asc" ? "desc" : "asc") : "asc"
      );
      setSortColumn(column);
      setCurrentPage(1);
    },
    [sortColumn]
  );

  const handleFilterChange = useCallback(
    (key: keyof TableFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    []
  );

  const handlePrintPDF = useCallback(() => {
    if (!selectedRow) return;
  }, [selectedRow]);

  const openView = useCallback((row: any) => {
    setViewRow(row);
    setSelectedRow(row.id);
    setViewOpen(true);
  }, []);

  const confirmDelete = useCallback((id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  }, []);

  const doDelete = useCallback(async () => {
    const id = deletingId;
    if (!id) return;
    setDeleteOpen(false);

    const prev = rows;
    setRows((ds) => ds.filter((r) => r.id !== id));

    try {
      const del = isAdmin ? adminDeleteForm : deleteFormUser;
      await del(id);
      toast.success("ลบรายการสำเร็จ");
      if (selectedRow === id) setSelectedRow("");
      setCurrentPage((p) => Math.max(1, Math.min(p, totalPages)));
    } catch (e: any) {
      setRows(prev);
      toast.error(e?.message || "ลบรายการไม่สำเร็จ");
    } finally {
      setDeletingId("");
    }
  }, [deletingId, rows, selectedRow, isAdmin, totalPages]);

  const isInitialLoading = loading && rows.length === 0 && !loadError;

  /* ---------- Pagination numbers ---------- */
  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    const tp = totalPages;
    const cp = currentPage;

    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i);
      return pages;
    }

    const pushUnique = (n: number) => {
      if (!pages.includes(n)) pages.push(n);
    };

    pushUnique(1);
    if (cp > 4) pages.push("…");

    const start = Math.max(2, cp - 2);
    const end = Math.min(tp - 1, cp + 2);
    for (let i = start; i <= end; i++) pushUnique(i);

    if (cp < tp - 3) pages.push("…");
    pushUnique(tp);
    return pages;
  }, [currentPage, totalPages]);

  const gotoPage = useCallback(
    (p: number) => {
      const next = Math.max(1, Math.min(p, totalPages));
      if (next !== currentPage) setCurrentPage(next);
    },
    [currentPage, totalPages]
  );

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-4">
      {loadError && (
        <div className="border rounded-lg bg-red-50 text-red-700 p-3 text-sm">
          โหลดข้อมูลไม่สำเร็จ: {loadError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={!selectedRow}>
                <Printer className="mr-2 h-4 w-4" />
                ปริ้นแบบฟอร์ม PDF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ยืนยันการพิมพ์แบบฟอร์ม</DialogTitle>
                <DialogDescription>
                  คุณต้องการพิมพ์แบบฟอร์มสำหรับรายการที่เลือกหรือไม่?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">ยกเลิก</Button>
                <Button onClick={handlePrintPDF}>ยืนยันการพิมพ์</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={onCreateNew} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            กรอกข้อมูล
          </Button>

          {isAdmin && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/add">
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มข้อมูล Master Data
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <span className="text-sm text-gray-600">ทั้งหมด {total} รายการ</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(parseInt(v));
              setCurrentPage(1);
            }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">แสดง 10</SelectItem>
              <SelectItem value="25">แสดง 25</SelectItem>
              <SelectItem value="50">แสดง 50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white relative">
        {loading && rows.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-white/70 backdrop-blur-sm px-3 py-2 border-b">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">กำลังอัปเดตข้อมูล…</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">#</TableHead>

                <TableHead className="min-w-[150px]">
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("faculty")}
                      className="justify-start p-0 h-auto font-medium">
                      คณะ <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาคณะ..."
                      value={filters.faculty}
                      onChange={(e) =>
                        handleFilterChange("faculty", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>

                <TableHead className="min-w-[180px]">
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("department")}
                      className="justify-start p-0 h-auto font-medium">
                      ภาควิชา <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาภาควิชา..."
                      value={filters.department}
                      onChange={(e) =>
                        handleFilterChange("department", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>

                <TableHead className="min-w-[200px]">
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("program")}
                      className="justify-start p-0 h-auto font-medium">
                      สาขาวิชา <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาสาขาวิชา..."
                      value={filters.program}
                      onChange={(e) =>
                        handleFilterChange("program", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>

                <TableHead className="min-w-[150px]">
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("submitterName")}
                      className="justify-start p-0 h-auto font-medium">
                      ชื่อผู้กรอกฟอร์ม <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาชื่อ..."
                      value={filters.submitterName}
                      onChange={(e) =>
                        handleFilterChange("submitterName", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>

                <TableHead className="min-w-[180px]">
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("submitterEmail")}
                      className="justify-start p-0 h-auto font-medium">
                      อีเมลผู้กรอกฟอร์ม <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาอีเมล..."
                      value={filters.submitterEmail}
                      onChange={(e) =>
                        handleFilterChange("submitterEmail", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>

                <TableHead className="min-w-[140px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("submittedAt")}
                    className="justify-start p-0 h-auto font-medium">
                    กรอกเมื่อวันที่ <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>

                <TableHead className="w-28 text-center">ดู</TableHead>
                <TableHead className="w-28 text-center">ลบ</TableHead>
                <TableHead className="w-16">เลือก</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isInitialLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="p-6 text-center text-sm text-gray-600">
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังโหลดข้อมูล…
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{row.faculty}</TableCell>
                    <TableCell>{row.department}</TableCell>

                    {/* Program cell */}
                    <TableCell className="align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="link"
                            className="p-0 h-auto whitespace-normal text-left break-words"
                            title="คลิกเพื่อดูสาขาทั้งหมด">
                            {row.program}
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="start"
                          className="w-[480px] max-w-[90vw] whitespace-normal">
                          <DropdownMenuLabel>
                            สาขาทั้งหมดในรายการนี้
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {row.programs.map((p) => {
                            const noRound =
                              !Array.isArray(p.rounds) || p.rounds.length === 0;
                            const noMonthly =
                              !Array.isArray(p.monthly) ||
                              p.monthly.length === 0;
                            const hasMsg = !!(
                              p.message && String(p.message).trim()
                            );
                            return (
                              <DropdownMenuItem
                                key={p.programId}
                                className="py-2 whitespace-normal break-words">
                                <div className="space-y-1">
                                  <div className="font-medium">{p.title}</div>

                                  {(p.master || p.doctoral) && (
                                    <div className="text-xs text-muted-foreground">
                                      {p.master
                                        ? `โท: ${p.master.amount ?? 0} คน`
                                        : ""}
                                      {p.master && p.doctoral ? " • " : ""}
                                      {p.doctoral
                                        ? `เอก: ${p.doctoral.amount ?? 0} คน`
                                        : ""}
                                    </div>
                                  )}

                                  {noRound && noMonthly && hasMsg && (
                                    <div className="mt-1">
                                      <Badge
                                        variant="secondary"
                                        className="whitespace-normal">
                                        {p.message}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </DropdownMenuItem>
                            );
                          })}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              openView(row);
                            }}
                            className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />{" "}
                            ดูรายละเอียดทั้งหมด
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                    <TableCell>{row.submitterName}</TableCell>
                    <TableCell>
                      <span className="text-blue-600">
                        {row.submitterEmail}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDateTH(row.submittedAt)}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openView(row)}>
                        <FileText className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(row.id)}
                        className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-1" /> ลบ
                      </Button>
                    </TableCell>

                    <TableCell>
                      <RadioGroup
                        value={selectedRow}
                        onValueChange={setSelectedRow}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={row.id}
                            id={`pick-${row.id}`}
                          />
                          <Label htmlFor={`pick-${row.id}`} className="sr-only">
                            เลือกรายการ {row.submitterName}
                          </Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          หน้า {currentPage} จาก {totalPages} (รวม {total} รายการ)
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => gotoPage(currentPage - 1)}
            disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((p, i) =>
            p === "…" ? (
              <span key={`dots-${i}`} className="px-2 text-gray-500">
                …
              </span>
            ) : (
              <Button
                key={`p-${p}`}
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => gotoPage(p as number)}>
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => gotoPage(currentPage + 1)}
            disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View / Delete */}
      <SurveyDetailsDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        row={viewRow}
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={doDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SurveyTable;
