"use client";

import { useState, useMemo } from "react";
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
  Filter,
  Printer
} from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { SurveyRow, TableFilters } from "@/lib/types";
import { mockSurveyData } from "@/lib/mock-data";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface SurveyTableProps {
  onCreateNew?: () => void;
}

export function SurveyTable({ onCreateNew }: SurveyTableProps) {
  const [data] = useState<SurveyRow[]>(mockSurveyData);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRow, setSelectedRow] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<keyof SurveyRow>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<TableFilters>({
    faculty: "",
    department: "",
    program: "",
    submitterName: "",
    submitterEmail: ""
  });

  // Debounce filters for better performance
  const debouncedFilters = useDebounce(filters, 300);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = data.filter((row) => {
      return (
        (!debouncedFilters.faculty || row.faculty.toLowerCase().includes(debouncedFilters.faculty.toLowerCase())) &&
        (!debouncedFilters.department || row.department.toLowerCase().includes(debouncedFilters.department.toLowerCase())) &&
        (!debouncedFilters.program || row.program.toLowerCase().includes(debouncedFilters.program.toLowerCase())) &&
        (!debouncedFilters.submitterName || row.submitterName.toLowerCase().includes(debouncedFilters.submitterName.toLowerCase())) &&
        (!debouncedFilters.submitterEmail || row.submitterEmail.toLowerCase().includes(debouncedFilters.submitterEmail.toLowerCase()))
      );
    });

    // Sort data
    result.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (sortColumn === 'submittedAt') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, debouncedFilters, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const handleSort = (column: keyof SurveyRow) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof TableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePrintPDF = () => {
    // Mock PDF generation
    console.log('Generating PDF for row:', selectedRow);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: th });
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                disabled={!selectedRow}
              >
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
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <span className="text-sm text-gray-600">
            แสดง {filteredAndSortedData.length} รายการ
          </span>
          <Select value={pageSize.toString()} onValueChange={(v) => {
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
                      onClick={() => handleSort('faculty')}
                      className="justify-start p-0 h-auto font-medium"
                    >
                      คณะ <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาคณะ..."
                      value={filters.faculty}
                      onChange={(e) => handleFilterChange('faculty', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="min-w-[180px]">
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('department')}
                      className="justify-start p-0 h-auto font-medium"
                    >
                      ภาควิชา <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาภาควิชา..."
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('program')}
                      className="justify-start p-0 h-auto font-medium"
                    >
                      สาขาวิชา <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาสาขาวิชา..."
                      value={filters.program}
                      onChange={(e) => handleFilterChange('program', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="min-w-[150px]">
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('submitterName')}
                      className="justify-start p-0 h-auto font-medium"
                    >
                      ชื่อผู้กรอกฟอร์ม <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาชื่อ..."
                      value={filters.submitterName}
                      onChange={(e) => handleFilterChange('submitterName', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="min-w-[180px]">
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('submitterEmail')}
                      className="justify-start p-0 h-auto font-medium"
                    >
                      อีเมลผู้กรอกฟอร์ม <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="ค้นหาอีเมล..."
                      value={filters.submitterEmail}
                      onChange={(e) => handleFilterChange('submitterEmail', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </TableHead>
                <TableHead className="min-w-[120px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('submittedAt')}
                    className="justify-start p-0 h-auto font-medium"
                  >
                    กรอกเมื่อวันที่ <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-16">เลือก</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{row.faculty}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.program}</TableCell>
                    <TableCell>{row.submitterName}</TableCell>
                    <TableCell>
                      <span className="text-blue-600">{row.submitterEmail}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(row.submittedAt)}
                    </TableCell>
                    <TableCell>
                      <RadioGroup value={selectedRow} onValueChange={setSelectedRow}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={row.id} id={row.id} />
                          <Label htmlFor={row.id} className="sr-only">
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
            หน้า {currentPage} จาก {totalPages} (รวม {filteredAndSortedData.length} รายการ)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}