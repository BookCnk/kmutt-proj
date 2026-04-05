"use client";

import type { FacultyTOCData } from "@/types/infographic";
import { PageFooter } from "./PageFooter";

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
  bannerText: "โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT (Admission Major Mapping)",
  sectionTitle: "คณะ/สถาบัน",
  officeName: "สำนักงานคัดเลือกและสรรหานักศึกษา มจธ.",
  warningText: "ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม",
  fontSizeLeftTitle: 18,
  fontSizeBanner: 18,
  fontSizeSectionTitle: 18,
  fontSizeFacultyName: 18,
  fontSizePageNumber: 18,
  fontSizeFooter: 18,
};

interface Props {
  data: FacultyTOCData;
  content?: Partial<FacultyTOCContent>;
  logoUrl?: string;
  footerLogoUrl?: string;
}

export function FacultyTOC({ data, content, logoUrl = '/ICON.png', footerLogoUrl = '/ICON.png' }: Props) {
  const tocContent = { ...DEFAULT_FACULTY_TOC_CONTENT, ...content };

  return (
    <div
      className="w-full h-full flex flex-col bg-white font-sans"
      style={{
        fontFamily: "THSarabun, sans-serif",
        padding: "20px 30px 10px",
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="KMUTT logo" width={80} height={52} style={{ objectFit: 'contain' }} />
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

      <PageFooter pageNumber={1} footerLogoUrl={footerLogoUrl} officeName={tocContent.officeName} warningText={tocContent.warningText} />
    </div>
  );
}
