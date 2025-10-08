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
  console.log("Rendering SurveyDetailsDialog with row:", row);
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
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      คณะ
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.faculty}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                      ภาควิชา
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.department}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                      ผู้ประสานงาน
                    </p>
                  </div>
                  <p className="font-bold text-gray-800">{row.coordinator}</p>
                </div>

                <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                      อีเมล
                    </p>
                  </div>
                  <p className="font-bold text-blue-600">
                    {row.submitterEmail}
                  </p>
                </div>

                {row.phone && row.phone.length > 0 && (
                  <div className="sm:col-span-2 group p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-orange-600 uppercase tracking-wide">
                        เบอร์โทรศัพท์
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {row.phone.map((phoneNumber: any, idx: number) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border-2 border-orange-300 hover:border-orange-400 hover:shadow-md transition-all duration-200 group/phone">
                          <div className="w-2 h-2 rounded-full bg-orange-500 group-hover/phone:animate-pulse" />
                          <span className="font-bold text-orange-600 text-base">
                            {phoneNumber}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2 group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-100/50 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
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
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1" />
                  <h3 className="text-lg font-semibold text-gray-700 bg-white px-4 rounded-full border border-gray-200 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    รายการสาขาวิชา
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
                      className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:border-gray-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative p-6 space-y-5">
                        {/* Program Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
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
                            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200/50 p-4 hover:shadow-sm transition-all duration-200">
                              <div className="flex items-center gap-2 mb-2">
                                <svg
                                  className="w-4 h-4 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                  />
                                </svg>
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
                            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-200/50 p-4 hover:shadow-sm transition-all duration-200">
                              <div className="flex items-center gap-2 mb-2">
                                <svg
                                  className="w-4 h-4 text-purple-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                                  />
                                </svg>
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

                        {/* ถ้ามีรอบ/รายเดือน ให้แสดงตามปกติ */}
                        {(hasRounds || hasMonthly) && (
                          <div className="grid sm:grid-cols-2 gap-4 pt-2">
                            {hasRounds && (
                              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-200/50 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg
                                    className="w-4 h-4 text-emerald-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <div className="text-sm font-bold text-emerald-700">
                                    รอบสัมภาษณ์
                                  </div>
                                </div>
                                <ul className="space-y-2">
                                  {(p.rounds || []).map((r, idx) => (
                                    <li
                                      key={`r-${idx}`}
                                      className="text-sm flex items-center gap-2">
                                      <svg
                                        className="w-3 h-3 text-emerald-500 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
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
                                  <svg
                                    className="w-4 h-4 text-orange-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <div className="text-sm font-bold text-orange-700">
                                    รายเดือน
                                  </div>
                                </div>
                                <ul className="space-y-2">
                                  {(p.monthly || []).map((m, idx) => (
                                    <li
                                      key={`m-${idx}`}
                                      className="text-sm flex items-center gap-2">
                                      <svg
                                        className="w-3 h-3 text-orange-500 flex-shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
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
                              <svg
                                className="w-4 h-4 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 19c3.866 0 7-3.134 7-7S15.866 5 12 5 5 8.134 5 12s3.134 7 7 7z"
                                />
                              </svg>
                              <span className="text-sm font-semibold text-amber-700">
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
