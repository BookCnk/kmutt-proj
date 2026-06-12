"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { AdmissionMajorGroup, AdmissionCriteriaRow } from "@/types/infographic";
import { InfographicTopHeaderV2 } from "./InfographicTopHeaderV2";
import { PageFooter } from "./PageFooter";
import { engineerReqData } from "@/lib/engineerReqData";

interface Props {
  faculty: string;
  subjectGroupMap: string;
  majors: AdmissionMajorGroup[];
  pageNumber: number;
  logoUrl?: string;
  footerLogoUrl?: string;
}

const PEACH_BG = "#F4B082";
const GRAY_BG = "#bfbfbf";
const RED_COLOR = "red";

// Helper to check if a row represents a GPA criterion (not test scores)
function isGpaSubject(name: string): boolean {
  const n = name.trim();
  return (
    ['คณิต', 'วิทยา', 'วิทย์', 'ภาษา', 'อังกฤษ'].some((k) => n.includes(k)) &&
    !n.includes('TGAT') &&
    !n.includes('TPAT') &&
    !n.includes('GPAX')
  );
}

export function FacultyCriteriaTablePageV2({
  faculty,
  subjectGroupMap,
  majors,
  pageNumber,
  logoUrl,
  footerLogoUrl,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const wrapper = wrapperRef.current;
    if (!content || !wrapper) return;
    const availableH = wrapper.offsetHeight;
    const contentH = content.scrollHeight;
    // Cap scale at a minimum of 1.0 to prevent the timing/hydration shrink bug
    if (contentH > availableH) {
      const calculatedScale = availableH / contentH;
      setScale(Math.max(1.0, calculatedScale));
    } else {
      setScale(1.0);
    }
  }, []);

  // Filter majors that have criteria rows belonging to this subjectGroupMap
  const activeMajorsData = majors
    .map((m) => {
      const matchedCriteria = m.criteria.filter(
        (c) => c.subjectGroupMap.trim() === subjectGroupMap.trim()
      );
      return {
        ...m,
        matchedCriteria,
      };
    })
    .filter((m) => m.matchedCriteria.length > 0);

  // Helper to extract specific criteria values
  function getScoreLabel(criteria: AdmissionCriteriaRow[], type: 'gpax' | 'math' | 'sci' | 'lang' | 'tgat' | 'tpat3' | 'others') {
    let matched: AdmissionCriteriaRow | undefined;
    let othersList: AdmissionCriteriaRow[] = [];

    for (const r of criteria) {
      const name = r.subjectName?.trim() ?? '';
      if (type === 'gpax' && name.includes('GPAX')) {
        matched = r;
      } else if (type === 'math' && isGpaSubject(name) && name.includes('คณิต')) {
        matched = r;
      } else if (type === 'sci' && isGpaSubject(name) && (name.includes('วิทยา') || name.includes('วิทย์'))) {
        matched = r;
      } else if (type === 'lang' && isGpaSubject(name) && (name.includes('ภาษา') || name.includes('อังกฤษ'))) {
        matched = r;
      } else if (type === 'tgat' && name.includes('TGAT')) {
        matched = r;
      } else if (type === 'tpat3' && (name.includes('TPAT3') || name.includes('TPAT 3') || name.includes('TPAT-3'))) {
        matched = r;
      } else if (type === 'others') {
        // Collect custom items
        const isMain = name.includes('GPAX') || isGpaSubject(name) || name.includes('TGAT') || name.includes('TPAT');
        if (!isMain && name) {
          othersList.push(r);
        }
      }
    }

    if (type === 'others') {
      if (othersList.length === 0) return "";
      return othersList.map(r => {
        const name = r.subjectName;
        if (r.gpaMin && r.gpaMin !== 1) {
          return `${name} >= ${r.gpaMin}`;
        }
        if (r.lngScore) {
          return `${name} >= ${r.lngScore}`;
        }
        return name;
      }).join(", ");
    }

    if (!matched) return "";

    const score = matched.gpaMin ?? matched.lngScore;
    if (score === null || score === undefined || score === 1) {
      return "ไม่กำหนดขั้นต่ำ";
    }
    
    // Format to 2 decimal places if it's a GPA value
    if (['gpax', 'math', 'sci', 'lang'].includes(type) && typeof score === 'number' && score <= 4.0) {
      return score.toFixed(2);
    }
    return String(score);
  }

  const isEngineering = faculty.includes('วิศวกรรม');

  return (
    <div
      className="text-black bg-white"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'THSarabun, sans-serif',
        fontSize: 18,
        padding: '20px 30px 10px',
      }}>

      {/* Inject local style to force solid black table borders overriding Tailwind base preflight */}
      <style>{`
        table.infographic-table, table.infographic-table th, table.infographic-table td {
          border: 1px solid #000 !important;
          border-color: #000 !important;
        }
      `}</style>

      {/* Header */}
      <InfographicTopHeaderV2 className="mb-4" logoUrl={logoUrl} />

      {/* Scalable content area */}
      <div ref={wrapperRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}>

          {/* Section title */}
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 4,
            }}>
            {faculty} (ต่อ)
          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 8,
              borderBottom: "1.5px solid #000",
              paddingBottom: 2,
            }}>
            กลุ่มผู้สมัคร: {subjectGroupMap}
          </div>

          {/* Criteria wide table */}
          <table
            className="infographic-table border border-black"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 18, // Significant increase for high readability
              border: "1.5px solid #000",
              borderColor: "#000",
            }}>
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="border border-black"
                  style={{
                    border: "1.5px solid #000",
                    borderColor: "#000",
                    padding: "10px 8px", // Substantial padding to stretch rows vertically
                    textAlign: "center",
                    width: "35%",
                    fontWeight: 700,
                    backgroundColor: PEACH_BG,
                  }}>
                  สาขาวิชา
                </th>
                <th
                  rowSpan={2}
                  className="border border-black"
                  style={{
                    border: "1.5px solid #000",
                    borderColor: "#000",
                    padding: "10px 4px",
                    textAlign: "center",
                    width: "7%",
                    fontWeight: 700,
                    backgroundColor: PEACH_BG,
                  }}>
                  จำนวน<br />รับ<br />(คน)
                </th>
                <th
                  colSpan={7}
                  className="border border-black"
                  style={{
                    border: "1.5px solid #000",
                    borderColor: "#000",
                    padding: "8px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_BG,
                  }}>
                  เกณฑ์การรับสมัคร/เกณฑ์การเรียกสอบคัดเลือก (คะแนนขั้นต่ำ)
                </th>
                <th
                  rowSpan={2}
                  className="border border-black"
                  style={{
                    border: "1.5px solid #000",
                    borderColor: "#000",
                    padding: "10px 8px",
                    textAlign: "center",
                    width: "20%",
                    fontWeight: 700,
                    backgroundColor: GRAY_BG,
                  }}>
                  คุณสมบัติ<br />เพิ่มเติม
                </th>
              </tr>
              <tr style={{ backgroundColor: GRAY_BG }}>
                <th className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "6px 3px", textAlign: "center", fontWeight: 700, width: "5%" }}>GPAX</th>
                <th className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "6px 3px", textAlign: "center", fontWeight: 700, width: "6%" }}>GPA<br />คณิตศาสตร์</th>
                <th className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "6px 3px", textAlign: "center", fontWeight: 700, width: "6%" }}>GPA<br />วิทยาศาสตร์</th>
                <th className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "6px 3px", textAlign: "center", fontWeight: 700, width: "6%" }}>GPA<br />ภาษาต่าง<br />ประเทศ</th>
                <th className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "6px 3px", textAlign: "center", fontWeight: 700, width: "7%" }}>TGAT<br />ความ<br />ถนัด<br />ทั่วไป</th>
                <th className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "6px 3px", textAlign: "center", fontWeight: 700, width: "8%" }}>TPAT 3<br />ความถนัดด้าน<br />วิทยาศาสตร์<br />เทคโนโลยี และ<br />วิศวกรรมศาสตร์</th>
                <th className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "6px 3px", textAlign: "center", fontWeight: 700, width: "3%" }}>อื่นๆ</th>
              </tr>
            </thead>
            <tbody>
              {activeMajorsData.map((m, i) => {
                const criteria = m.matchedCriteria;
                const reqNum = engineerReqData.find((item) => m.admissionMajor.includes(item.department))?.req;

                const gpax = getScoreLabel(criteria, 'gpax');
                const math = getScoreLabel(criteria, 'math');
                const sci = getScoreLabel(criteria, 'sci');
                const lang = getScoreLabel(criteria, 'lang');

                const displayGpax = gpax === "ไม่กำหนดขั้นต่ำ" ? "" : gpax;
                const displayMath = math === "ไม่กำหนดขั้นต่ำ" ? "" : math;
                const displaySci = sci === "ไม่กำหนดขั้นต่ำ" ? "" : sci;
                const displayLang = lang === "ไม่กำหนดขั้นต่ำ" ? "" : lang;

                // limitApplicant is specific to the subjectGroupMap row
                const limitVal = criteria[0]?.limitApplicant ?? 0;

                const isComp = m.admissionMajor.includes("คอมพิวเตอร์");
                const capColor = (reqNum === 1 || reqNum === 2) && !isComp ? RED_COLOR : "black";

                // In the official PDF screenshot, the "อื่นๆ" and "คุณสมบัติเพิ่มเติม" columns are completely blank in the table for all engineering majors
                const displayOthers = "";
                const displayAddQual = "";

                return (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                    <td
                      className="border border-black font-semibold"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "8px 12px",
                        textAlign: "left",
                        lineHeight: 1.3,
                        fontSize: 16,
                      }}>
                      {m.admissionMajor}
                      {reqNum && (
                        <sup style={{
                          fontSize: 11,
                          fontWeight: "bold",
                          color: reqNum === 3 ? "black" : RED_COLOR,
                          marginLeft: 2,
                        }}>
                          {reqNum}
                        </sup>
                      )}
                    </td>
                    <td 
                      className="border border-black font-bold"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "8px 4px",
                        textAlign: "center",
                        fontSize: 17,
                        color: capColor,
                      }}>
                      {limitVal === 0 ? "-" : limitVal}
                    </td>
                    <td className="border border-black font-semibold" style={{ border: "1px solid #000", borderColor: "#000", padding: "8px 4px", textAlign: "center", fontSize: 17 }}>
                      {displayGpax}
                    </td>
                    <td className="border border-black font-semibold" style={{ border: "1px solid #000", borderColor: "#000", padding: "8px 4px", textAlign: "center", fontSize: 17 }}>
                      {displayMath}
                    </td>
                    <td className="border border-black font-semibold" style={{ border: "1px solid #000", borderColor: "#000", padding: "8px 4px", textAlign: "center", fontSize: 17 }}>
                      {displaySci}
                    </td>
                    <td className="border border-black font-semibold" style={{ border: "1px solid #000", borderColor: "#000", padding: "8px 4px", textAlign: "center", fontSize: 17 }}>
                      {displayLang}
                    </td>

                    {/* Merged TGAT Column */}
                    {isEngineering ? (
                      i === 0 && (
                        <td
                          rowSpan={activeMajorsData.length}
                          className="border border-black font-semibold"
                          style={{
                            border: "1px solid #000",
                            borderColor: "#000",
                            padding: "8px 4px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontSize: 16,
                            lineHeight: 1.3,
                          }}>
                          ไม่<br />กำหนด<br />ขั้นต่ำ
                        </td>
                      )
                    ) : (
                      <td className="border border-black font-semibold" style={{ border: "1px solid #000", borderColor: "#000", padding: "8px 4px", textAlign: "center", fontSize: 17 }}>
                        {getScoreLabel(criteria, 'tgat')}
                      </td>
                    )}

                    {/* Merged TPAT 3 Column */}
                    {isEngineering ? (
                      i === 0 && (
                        <td
                          rowSpan={activeMajorsData.length}
                          className="border border-black font-semibold"
                          style={{
                            border: "1px solid #000",
                            borderColor: "#000",
                            padding: "8px 4px",
                            textAlign: "center",
                            verticalAlign: "middle",
                            fontSize: 16,
                            lineHeight: 1.3,
                          }}>
                          ไม่<br />กำหนด<br />ขั้นต่ำ
                        </td>
                      )
                    ) : (
                      <td className="border border-black font-semibold" style={{ border: "1px solid #000", borderColor: "#000", padding: "8px 4px", textAlign: "center", fontSize: 17 }}>
                        {getScoreLabel(criteria, 'tpat3')}
                      </td>
                    )}

                    <td className="border border-black" style={{ border: "1px solid #000", borderColor: "#000", padding: "8px 4px", textAlign: "center", fontSize: 15 }}>
                      {displayOthers}
                    </td>
                    <td 
                      className="border border-black font-semibold text-slate-800"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: 15,
                        lineHeight: 1.25,
                      }}>
                      {displayAddQual}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
      </div>

      {/* Footer */}
      <PageFooter pageNumber={pageNumber} footerLogoUrl={footerLogoUrl} />
    </div>
  );
}
