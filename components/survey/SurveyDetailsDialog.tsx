// src/components/survey/SurveyDetailsDialog.tsx
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
import {
  Building,
  Building2,
  UserCircle,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: SurveyRow | null;
};

function formatDateTH(d?: string) {
  try {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return format(dt, "dd MMM yyyy HH:mm:ss", { locale: th });
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
              <FileText className="w-4 h-4 text-white" />
            </div>
            รายละเอียดแบบสำรวจ
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2 font-medium">
            ข้อมูลอ้างอิงและสาขาวิชาทั้งหมดในรายการคัดเลือกนี้
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
          {row && (
            <div className="space-y-6 py-4">
              {/* Header Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 hover:shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                      คณะ (Faculty)
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.faculty}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 hover:shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                      ภาควิชา (Department)
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.department}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 hover:shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                      ผู้ประสานงาน (Coordinator)
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.coordinator}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 hover:shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                      อีเมล (Email)
                    </p>
                  </div>
                  <p className="font-bold text-blue-600">
                    {row.submitterEmail}
                  </p>
                </div>

                {row.phone && row.phone.length > 0 && (
                  <div className="sm:col-span-2 group p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50 hover:shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-bold text-orange-600 uppercase tracking-wide">
                        เบอร์โทรศัพท์ (Phone)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {row.phone.map((phoneNumber: any, idx: number) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-orange-200 hover:border-orange-400">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="font-bold text-orange-600 text-base">
                            {phoneNumber}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2 group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-100/50 border border-gray-200/50 hover:shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                      กรอกข้อมูลเมื่อ (Submitted At)
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
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1" />
                  <h3 className="text-lg font-bold text-gray-700 bg-white px-4 rounded-full border border-gray-200 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-600" />
                    รายการสาขาวิชา (Programs)
                  </h3>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1" />
                </div>

                {row.programs.map((p, i) => {
                  const hasMaster = !!p.master;
                  const hasDoctoral = !!p.doctoral;
                  const hasRounds = (p.rounds?.length || 0) > 0;
                  const hasMonthly = (p.monthly?.length || 0) > 0;
                  const message =
                    (p as any)?.message && String((p as any).message).trim();

                  return (
                    <div
                      key={`${p.programId}-${i}`}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:border-gray-300">

                      <div className="relative p-6 space-y-5">
                        {/* Program Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800">
                              {p.title}
                            </h4>
                            {/* ถ้าไม่มีรอบและรายเดือน แสดงสถานะปิดและ/หรือข้อความ */}
                            {!hasRounds && !hasMonthly && message && (
                              <div className="mt-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-900 border-amber-200">
                                  ไม่เปิดรับ / มีประกาศ
                                </Badge>
                              </div>
                            )}
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
                            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200/50 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                <div className="text-sm font-bold text-blue-700">
                                  ปริญญาโท
                                </div>
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
                            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-200/50 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                <div className="text-sm font-bold text-purple-700">
                                  ปริญญาเอก
                                </div>
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
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="w-4 h-4 text-emerald-600" />
                                  <div className="text-sm font-bold text-emerald-700">
                                    รอบสัมภาษณ์
                                  </div>
                                </div>
                                <ul className="space-y-2">
                                  {(p.rounds || []).map((r, idx) => (
                                    <li
                                      key={`r-${idx}`}
                                      className="text-sm flex items-center gap-2 font-medium">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                      <span>
                                        {r.no ? `รอบ ${r.no} — ` : ""}
                                        {formatDateTH(r.interview_date)}
                                      </span>
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
                                <div className="flex items-center gap-2 mb-2">
                                  <CalendarDays className="w-4 h-4 text-orange-600" />
                                  <div className="text-sm font-bold text-orange-700">
                                    สัมภาษณ์รายเดือน
                                  </div>
                                </div>
                                <ul className="space-y-2">
                                  {(p.monthly || []).map((m, idx) => (
                                    <li
                                      key={`m-${idx}`}
                                      className="text-sm flex items-center gap-2 font-medium">
                                      <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                      <span>
                                        {m.month ? `เดือน ${m.month} — ` : ""}
                                        {formatDateTH(m.interview_date)}
                                      </span>
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

                        {/* ✅ ถ้าไม่เปิดทั้ง monthly และ rounds ให้แสดง message */}
                        {!hasRounds && !hasMonthly && message && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-bold text-amber-700">
                                หมายเหตุ (ไม่เปิดรับ)
                              </span>
                            </div>
                            <p className="text-sm text-amber-900 whitespace-pre-line">
                              {message}
                            </p>
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
