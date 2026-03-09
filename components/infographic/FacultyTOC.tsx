"use client";

import Image from "next/image";
import type { FacultyTOCData } from "@/types/infographic";

export interface FacultyTOCContent {
  leftTitleLine1: string;
  leftTitleLine2: string;
  bannerText: string;
  sectionTitle: string;
  officeName: string;
  warningText: string;
  fontSizeLeftTitle?: number;
  fontSizeBanner?: number;
  fontSizeSectionTitle?: number;
  fontSizeFacultyName?: number;
  fontSizePageNumber?: number;
  fontSizeFooter?: number;
}

export const DEFAULT_FACULTY_TOC_CONTENT: FacultyTOCContent = {
  leftTitleLine1: "เกณฑ์การรับสมัครนักศึกษา",
  leftTitleLine2: "รอบที่ 2 (ปีการศึกษา 2569)",
  bannerText: "โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT",
  sectionTitle: "คณะ/สถาบัน",
  officeName: "สำนักงานคัดเลือกและสรรหานักศึกษา มจธ.",
  warningText: "ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม",
  fontSizeLeftTitle: 18,
  fontSizeBanner: 18,
  fontSizeSectionTitle: 18,
  fontSizeFacultyName: 18,
  fontSizePageNumber: 18,
  fontSizeFooter: 10,
};

interface Props {
  data: FacultyTOCData;
  content?: Partial<FacultyTOCContent>;
}

export function FacultyTOC({ data, content }: Props) {
  const today = new Date();
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const dateStr = `ข้อมูล ณ วันที่ ${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;
  const tocContent = { ...DEFAULT_FACULTY_TOC_CONTENT, ...content };

  return (
    <div
      className="w-full h-full flex flex-col bg-white font-sans"
      style={{
        fontFamily: "THSarabun, sans-serif",
        padding: "30px 40px",
        fontSize: 16,
      }}>
      <div
        className="flex items-stretch rounded-sm overflow-hidden"
        style={{
          minHeight: 70,
          border: "1.5px solid #fa4616",
        }}>
        <div
          className="flex items-center gap-4 px-4 py-2 bg-white"
          style={{ flex: "0 0 45%" }}>
          <div className="flex items-center pr-3 border-r border-slate-200">
            <Image
              src="/ICON.png"
              alt="KMUTT 65"
              width={80}
              height={52}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-slate-800 flex flex-col justify-center">
            <div
              className="font-bold leading-tight"
              style={{ fontSize: tocContent.fontSizeLeftTitle }}>
              {tocContent.leftTitleLine1}
            </div>
            <div
              className="font-bold leading-tight"
              style={{ fontSize: tocContent.fontSizeLeftTitle }}>
              {tocContent.leftTitleLine2}
            </div>
          </div>
        </div>

        <div
          className="flex-1 flex items-center justify-center text-white font-bold px-6"
          style={{
            backgroundColor: "#fa4616",
            borderLeft: "1.5px solid #fa4616",
            fontSize: tocContent.fontSizeBanner,
          }}>
          {tocContent.bannerText}
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-16">
        <h2
          className="text-center font-bold mb-14"
          style={{ fontSize: tocContent.fontSizeSectionTitle, color: "#1e293b" }}>
          {tocContent.sectionTitle}
        </h2>

        <div className="flex flex-col gap-5 px-6">
          {data.entries.map((entry, i) => (
            <div
              key={i}
              className="relative flex items-end w-full"
              style={{ fontSize: tocContent.fontSizeFacultyName }}>
              <div className="pr-2 bg-white relative z-10 shrink-0">
                <span className="font-bold text-slate-800">
                  {entry.faculty}
                </span>
              </div>

              <div
                className="absolute left-0 right-0 bottom-1.5 z-0"
                style={{
                  borderBottom: "1.5px dotted #94a3b8",
                  height: "1px",
                }}
              />

              <div className="flex-1" />

              <div className="pl-2 bg-white relative z-10 shrink-0">
                <span
                  className="font-bold text-slate-800 tabular-nums"
                  style={{ fontSize: tocContent.fontSizePageNumber }}>
                  {entry.startPage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 items-end pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div
              className="w-3.5 h-3.5"
              style={{ backgroundColor: "#fa4616" }}
            />
            <div
              className="w-3.5 h-3.5"
              style={{ backgroundColor: "#fa4616" }}
            />
            <div className="w-3.5 h-3.5 bg-slate-200" />
          </div>
          <span
            className="font-bold text-slate-700"
            style={{ fontSize: tocContent.fontSizeFooter }}>
            {tocContent.officeName}
          </span>
        </div>

        <div
          className="text-center text-slate-700 font-bold"
          style={{ fontSize: 11 }}>
          1 | P a g e
        </div>

        <div className="text-right flex flex-col items-end">
          <div
            className="text-red-600 font-bold leading-tight"
            style={{ fontSize: tocContent.fontSizeFooter }}>
            {tocContent.warningText}
          </div>
          <div
            className="text-red-600 font-bold leading-tight"
            style={{ fontSize: tocContent.fontSizeFooter }}>
            {dateStr}
          </div>
        </div>
      </div>
    </div>
  );
}
