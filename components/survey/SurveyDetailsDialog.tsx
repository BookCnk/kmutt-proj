"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { SurveyRow } from "@/types/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: SurveyRow | null;
};

function formatDateTH(dateString?: string) {
  try {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy", { locale: th });
  } catch {
    return "-";
  }
}

export default function SurveyDetailsDialog({
  open,
  onOpenChange,
  row,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 -z-10" />

        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            รายละเอียดแบบสำรวจ
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            แสดงข้อมูลสาขาวิชาทั้งหมดในรายการนี้
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
          {row && (
            <div className="space-y-6 py-4">
              {/* Header Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      คณะ
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.faculty}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                      ภาควิชา
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.department}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                      ผู้ประสานงาน
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.coordinator}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                      อีเมล
                    </p>
                  </div>
                  <p className="font-bold text-blue-600">
                    {row.submitterEmail}
                  </p>
                </div>

                <div className="sm:col-span-2 group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-100/50 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      กรอกเมื่อ
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">
                    {formatDateTH(row.submittedAt)}
                  </p>
                </div>
              </div>

              {/* Programs Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                  <h3 className="text-lg font-semibold text-gray-700 bg-white px-4 rounded-full border border-gray-200">
                    รายการสาขาวิชา
                  </h3>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                </div>

                {row.programs.map((p, i) => {
                  const hasMaster = !!p.master;
                  const hasDoctoral = !!p.doctoral;
                  const hasRounds = (p.rounds?.length || 0) > 0;
                  const hasMonthly = (p.monthly?.length || 0) > 0;

                  return (
                    <div
                      key={`${p.programId}-${i}`}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative p-6 space-y-5">
                        {/* Program Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                              {p.title}
                            </h4>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {hasMaster && (
                              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md transition-all">
                                ปริญญาโท
                              </Badge>
                            )}
                            {hasDoctoral && (
                              <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm hover:shadow-md transition-all">
                                ปริญญาเอก
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Degree Information */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          {hasMaster && (
                            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200/50 p-4 hover:shadow-sm transition-all duration-200">
                              <div className="text-sm font-bold text-blue-700 mb-2">
                                ปริญญาโท
                              </div>
                              <div className="text-sm">
                                จำนวนรับ: {p.master?.amount ?? 0} คน
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                เงื่อนไข:
                                <span className="ml-2">
                                  {p.master?.bachelor_req ? "✔ ต้องจบตรี" : "—"}
                                  {p.master?.master_req ? " / ✔ ต้องจบโท" : ""}
                                </span>
                              </div>
                            </div>
                          )}
                          {hasDoctoral && (
                            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-200/50 p-4 hover:shadow-sm transition-all duration-200">
                              <div className="text-sm font-bold text-purple-700 mb-2">
                                ปริญญาเอก
                              </div>
                              <div className="text-sm">
                                จำนวนรับ: {p.doctoral?.amount ?? 0} คน
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                เงื่อนไข:
                                <span className="ml-2">
                                  {p.doctoral?.bachelor_req
                                    ? "✔ ต้องจบตรี"
                                    : "—"}
                                  {p.doctoral?.master_req
                                    ? " / ✔ ต้องจบโท"
                                    : ""}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {(hasRounds || hasMonthly) && (
                          <div className="grid sm:grid-cols-2 gap-4 pt-2">
                            {hasRounds && (
                              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-200/50 p-4">
                                <div className="text-sm font-bold text-emerald-700 mb-2">
                                  รอบสัมภาษณ์
                                </div>
                                <ul className="space-y-2">
                                  {(p.rounds || []).map((r, idx) => (
                                    <li key={`r-${idx}`} className="text-sm">
                                      {r.no ? `รอบ ${r.no} — ` : ""}
                                      {formatDateTH(r.interview_date)}
                                      {r.active === false && (
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                                          ปิด
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {hasMonthly && (
                              <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/30 border border-orange-200/50 p-4">
                                <div className="text-sm font-bold text-orange-700 mb-2">
                                  รายเดือน
                                </div>
                                <ul className="space-y-2">
                                  {(p.monthly || []).map((m, idx) => (
                                    <li key={`m-${idx}`} className="text-sm">
                                      {m.month ? `เดือน ${m.month} — ` : ""}
                                      {formatDateTH(m.interview_date)}
                                      {m.active === false && (
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                                          ปิด
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
