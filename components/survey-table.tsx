"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

import { getForms, deleteForm } from "@/api/formService";

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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  ArrowUpDown,
  Printer,
  Trash2,
} from "lucide-react";

import { useDebounce } from "@/lib/hooks/useDebounce";
import { SurveyRow, TableFilters } from "@/types/types";
import { mockSurveyData } from "@/lib/mock-data";

/* ---------------- helpers ---------------- */
function normalizeId(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const anyV = v as any;
  return anyV._id || anyV.id || anyV.value || "";
}
function asText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const anyV = v as any;
  return anyV.title || anyV.name || anyV.label || normalizeId(anyV);
}
function formatDateTH(dateString: string) {
  try {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: th });
  } catch {
    return "-";
  }
}
function mapFormToSurveyRow(doc: any): SurveyRow {
  const id = normalizeId(doc._id);
  const faculty = asText(doc.faculty_id);
  const department = asText(doc.department_id);
  const program = asText(doc.program_id);
  const submitterName = doc?.submitter?.name ?? "-";
  const submitterEmail = doc?.submitter?.email ?? "-";
  const hasRounds = !!doc?.intake_calendar?.rounds?.length;
  const hasMonthly = !!doc?.intake_calendar?.monthly?.length;
  const intakeMode =
    hasRounds && hasMonthly
      ? "รอบ + รายเดือน"
      : hasRounds
      ? "รอบ"
      : hasMonthly
      ? "รายเดือน"
      : "ไม่เปิดรับ";
  const coordinator = submitterName;
  const phone = doc?.submitter?.phone ?? "-";
  const submittedAt =
    doc?.created_at ?? doc?.updated_at ?? new Date().toISOString();
  return {
    id,
    faculty,
    department,
    program,
    intakeMode,
    coordinator,
    phone,
    submitterEmail,
    submitterName,
    submittedAt,
  };
}

/* ---------------- component ---------------- */
interface SurveyTableProps {
  onCreateNew?: () => void;
}

export function SurveyTable({ onCreateNew }: SurveyTableProps) {
  const [data, setData] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRow, setSelectedRow] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<keyof SurveyRow>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<TableFilters>({
    faculty: "",
    department: "",
    program: "",
    submitterName: "",
    submitterEmail: "",
  });

  // view modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<SurveyRow | null>(null);

  // delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await getForms();
        const rawList: any[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.data)
          ? (res as any).data
          : [];
        const mapped = rawList.map(mapFormToSurveyRow);
        if (!cancelled) setData(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || "ไม่สามารถโหลดข้อมูลได้");
          setData(mockSurveyData); // fallback demo
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const debouncedFilters = useDebounce(filters, 300);

  const filteredAndSortedData = useMemo(() => {
    const f = debouncedFilters;
    const result = data
      .filter(
        (row) =>
          (!f.faculty ||
            row.faculty.toLowerCase().includes(f.faculty.toLowerCase())) &&
          (!f.department ||
            row.department
              .toLowerCase()
              .includes(f.department.toLowerCase())) &&
          (!f.program ||
            row.program.toLowerCase().includes(f.program.toLowerCase())) &&
          (!f.submitterName ||
            row.submitterName
              .toLowerCase()
              .includes(f.submitterName.toLowerCase())) &&
          (!f.submitterEmail ||
            row.submitterEmail
              .toLowerCase()
              .includes(f.submitterEmail.toLowerCase()))
      )
      .sort((a, b) => {
        const isDate = sortColumn === "submittedAt";
        const aRaw = a[sortColumn];
        const bRaw = b[sortColumn];
        const aComp: number | string = isDate
          ? new Date(String(aRaw)).getTime()
          : String(aRaw ?? "");
        const bComp: number | string = isDate
          ? new Date(String(bRaw)).getTime()
          : String(bRaw ?? "");
        const cmp =
          typeof aComp === "number" && typeof bComp === "number"
            ? aComp - bComp
            : String(aComp)
                .toLowerCase()
                .localeCompare(String(bComp).toLowerCase());
        return sortDirection === "asc" ? cmp : -cmp;
      });
    return result;
  }, [data, debouncedFilters, sortColumn, sortDirection]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredAndSortedData.slice(
    startIndex,
    startIndex + pageSize
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedData.length / pageSize)
  );

  const handleSort = useCallback(
    (column: keyof SurveyRow) => {
      setSortDirection((prev) =>
        sortColumn === column ? (prev === "asc" ? "desc" : "asc") : "asc"
      );
      setSortColumn(column);
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

    // optimistic
    const prev = data;
    setData((ds) => ds.filter((r) => r.id !== id));

    try {
      await deleteForm(id);
      toast.success("ลบรายการสำเร็จ");
      if (selectedRow === id) setSelectedRow("");
    } catch (e: any) {
      // rollback
      setData(prev);
      toast.error(e?.message || "ลบรายการไม่สำเร็จ");
    } finally {
      setDeletingId("");
    }
  }, [deletingId, data, selectedRow]);

  /* -------------- render states -------------- */
  if (loading) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center text-sm text-gray-600">
        กำลังโหลดข้อมูล…
      </div>
    );
  }
  if (loadError && data.length === 0) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center">
        <div className="text-red-600 font-medium mb-2">โหลดข้อมูลไม่สำเร็จ</div>
        <div className="text-sm text-gray-600">{loadError}</div>
        <div className="mt-4">
          <Button onClick={() => location.reload()}>ลองใหม่</Button>
        </div>
      </div>
    );
  }

  /* -------------- main UI -------------- */
  return (
    <div className="space-y-4">
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

          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/add">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มข้อมูล Master Data
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <span className="text-sm text-gray-600">
            แสดง {filteredAndSortedData.length} รายการ
          </span>
          <Select
            value={pageSize.toString()}
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
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{row.faculty}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.program}</TableCell>
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
            หน้า {currentPage} จาก {totalPages} (รวม{" "}
            {filteredAndSortedData.length} รายการ)
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

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดแบบสำรวจ</DialogTitle>
            <DialogDescription>
              ข้อมูลจากรายการที่เลือกจะแสดงด้านล่าง
            </DialogDescription>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">คณะ</p>
                  <p className="font-medium">{viewRow.faculty}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ภาควิชา</p>
                  <p className="font-medium">{viewRow.department}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">สาขาวิชา</p>
                  <p className="font-medium">{viewRow.program}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">รูปแบบรับสมัคร</p>
                  <Badge variant="secondary">{viewRow.intakeMode}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ผู้ประสานงาน</p>
                  <p className="font-medium">{viewRow.coordinator}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">โทรศัพท์</p>
                  <p className="font-medium">{viewRow.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">อีเมล</p>
                  <p className="font-medium text-blue-600">
                    {viewRow.submitterEmail}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500">กรอกเมื่อ</p>
                  <p className="font-medium">
                    {formatDateTH(viewRow.submittedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setViewOpen(false)}>
              ปิด
            </Button>
            <DialogTrigger asChild>
              <Button onClick={() => setViewOpen(false)}>ตกลง</Button>
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบรายการนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
