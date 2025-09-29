// src/components/survey/SurveyTable.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import SurveyDetailsDialog from "@/components/survey/SurveyDetailsDialog";

import {
  // user: ดึงทั้งหมดแบบไม่มี params
  getForms as getFormsUser,
  // admin: ดึงแบบมี params
  adminListForms,
  // delete
  deleteForm as deleteFormUser,
  adminDeleteForm,
  // params type (ใช้กับ admin และตัวช่วยฝั่ง client)
  FormListParams,
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
  const anyV = v as any;
  return anyV._id || anyV.id || anyV.value || "";
}
function textOf(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.title || v.name || v.label || v._id || v.id || "";
}
function asText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const anyV = v as any;
  return anyV.title || anyV.name || anyV.label || normalizeId(anyV);
}
function formatDateTH(dateString?: string) {
  try {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy", { locale: th });
  } catch {
    return "-";
  }
}

/** map ชื่อคอลัมน์ฝั่ง UI -> หมายเลข sort ของ Backend */
function mapSortKeyFrontToAPINumber(k: keyof SurveyRow): number | undefined {
  switch (k) {
    case "faculty":
      return 1;
    case "department":
      return 2;
    case "program": // ใช้สรุปชื่อสาขาแถวแรก
      return 3;
    case "submitterName":
      return 4;
    case "submitterEmail":
      return 5;
    case "submittedAt":
      return 6; // created_at
    default:
      return undefined;
  }
}

/* ---------- ตัวช่วยฝั่ง client (สำหรับโหมด user) ---------- */
function clientFilter(all: any[], p: FormListParams) {
  let arr = Array.isArray(all) ? all.slice() : [];

  if (p.search && p.search_option) {
    const q = String(p.search).trim().toLowerCase();
    if (p.search_option === "faculty") {
      arr = arr.filter((d) => textOf(d.faculty_id).toLowerCase().includes(q));
    } else if (
      p.search_option === "department_name" ||
      p.search_option === "department"
    ) {
      arr = arr.filter((d) =>
        textOf(d.department_id).toLowerCase().includes(q)
      );
    } else if (p.search_option === "program") {
      arr = arr.filter((d) => {
        const ips = Array.isArray(d.intake_programs) ? d.intake_programs : [];
        return ips.some((ip: any) =>
          textOf(ip.program_id).toLowerCase().includes(q)
        );
      });
    }
  }
  if (p.submitter_name) {
    const q = p.submitter_name.toLowerCase();
    arr = arr.filter((d) =>
      (d.submitter?.name || "").toLowerCase().includes(q)
    );
  }
  if (p.submitter_email) {
    const q = p.submitter_email.toLowerCase();
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

/* ---------------- types ในตาราง ---------------- */
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
};

export type SurveyRow = {
  id: string;
  faculty: string;
  department: string;
  program: string; // "ชื่อสาขาแรก +N"
  programs: ProgramInForm[]; // รายการจริงทั้งหมด
  submitterEmail: string;
  submitterName: string;
  coordinator: string;
  phone: string;
  submittedAt: string;
};

/** แปลงเอกสารจาก API -> แถวในตาราง */
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
        const rounds = ip?.intake_calendar?.rounds || [];
        const monthly = ip?.intake_calendar?.monthly || [];
        return { programId, title, master, doctoral, rounds, monthly };
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
  const phone = doc?.submitter?.phone ?? "-";
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

  // server-side page/sort/filter
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

  // view modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<SurveyRow | null>(null);

  // delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");

  function normTH(s: string) {
    return (s || "").trim().normalize("NFC");
  }

  /** mapping สำหรับ search_option */
  const SEARCH_OPTION_MAP: Record<
    "faculty" | "department" | "program",
    string
  > = {
    faculty: "faculty",
    department: "department_name",
    program: "program",
  };

  function buildSearchParamsFromFilters(
    f: TableFilters
  ): Pick<FormListParams, "search" | "search_option"> {
    const fac = normTH(f.faculty);
    if (fac) return { search_option: SEARCH_OPTION_MAP.faculty, search: fac };

    const dep = normTH(f.department);
    if (dep)
      return { search_option: SEARCH_OPTION_MAP.department, search: dep };

    const prog = normTH(f.program);
    if (prog) return { search_option: SEARCH_OPTION_MAP.program, search: prog };

    return {};
  }

  // ตรวจ role
  const storeUser = useAuthStore((s) => s.user);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const role = storeUser?.role ?? getAuthUser()?.role;
    setIsAdmin(role === "admin");
  }, [storeUser]);

  // โหลดข้อมูล (admin: server-side / user: client-side)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError("");

      try {
        const sortNum = mapSortKeyFrontToAPINumber(sortColumn);
        const { search, search_option } =
          buildSearchParamsFromFilters(debouncedFilters);

        const params: FormListParams = {
          page: currentPage,
          limit: pageSize,
          search,
          search_option,
          submitter_name: normTH(debouncedFilters.submitterName) || undefined,
          submitter_email: normTH(debouncedFilters.submitterEmail) || undefined,
          sort: sortNum,
          sort_option: sortNum ? sortDirection : undefined,
        };

        let items: any[] = [];
        let total = 0;
        let pages = 1;

        if (isAdmin) {
          const res = await adminListForms(params);
          items = res.items;
          total = res.total;
          pages = res.pages;
        } else {
          const raw = await getFormsUser(); // ไม่มี params
          const filtered = clientFilter(raw, params);
          const sorted = clientSort(
            filtered,
            params.sort,
            params.sort_option || "asc"
          );
          const paged = clientPage(
            sorted,
            params.page || 1,
            params.limit || 10
          );
          items = paged.items;
          total = paged.total;
          pages = paged.pages;
        }

        const mapped = items.map(mapFormToSurveyRow);

        if (!cancelled) {
          setRows(mapped);
          setTotal(total);
          setTotalPages(Math.max(1, pages));
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "ไม่สามารถโหลดข้อมูลได้");
          setRows([]); // ยังให้ตารางว่างแสดงอยู่
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
  }, [
    currentPage,
    pageSize,
    sortColumn,
    sortDirection,
    debouncedFilters,
    isAdmin,
  ]);

  const handleSort = useCallback(
    (column: keyof SurveyRow) => {
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
    console.log("Generating PDF for row:", selectedRow);
  }, [selectedRow]);

  const openView = useCallback((row: SurveyRow) => {
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
      setCurrentPage((p) => p); // refresh
    } catch (e: any) {
      setRows(prev);
      toast.error(e?.message || "ลบรายการไม่สำเร็จ");
    } finally {
      setDeletingId("");
    }
  }, [deletingId, rows, selectedRow, isAdmin]);

  /* -------------- render -------------- */
  if (loading) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center text-sm text-gray-600">
        กำลังโหลดข้อมูล…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* error banner (ไม่ปิดตาราง) */}
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

          {/* ปุ่มเฉพาะ admin */}
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
              const n = parseInt(v);
              setPageSize(n);
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
      <div className="border rounded-lg overflow-hidden bg-white">
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
              {rows.length === 0 ? (
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

                    {/* Program cell: เป็นปุ่มเปิด dropdown */}
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
                          className="w-[420px] max-w-[90vw] whitespace-normal">
                          <DropdownMenuLabel>
                            สาขาทั้งหมดในรายการนี้
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {row.programs.map((p) => (
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
                              </div>
                            </DropdownMenuItem>
                          ))}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              openView(row);
                            }}
                            className="cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
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
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(row.id)}
                        className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-1" />
                        ลบ
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            หน้า {currentPage} จาก {totalPages} (รวม {total} รายการ)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{currentPage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Modal: รายละเอียดทุกสาขาในรายการ */}
      <SurveyDetailsDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        row={viewRow}
      />

      {/* Delete Confirm Modal */}
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
              <Trash2 className="h-4 w-4 mr-1" />
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SurveyTable;
