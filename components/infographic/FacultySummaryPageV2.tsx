"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { AdmissionMajorGroup } from "@/types/infographic";
import { useEditorStore } from "@/stores/useEditorStore";
import { InfographicTopHeaderV2 } from "./InfographicTopHeaderV2";
import { PageFooter } from "./PageFooter";
import { engineerReqData } from "@/lib/engineerReqData";

interface Props {
  faculty: string;
  majors: AdmissionMajorGroup[];
  pageNumber: number;
  logoUrl?: string;
  footerLogoUrl?: string;
}

const PEACH_HEADER = "#f7c6ac";
const GRAY_HEADER = "#bfbfbf";
const PEACH_CELL = "#fbe5d6";

export function FacultySummaryPageV2({ faculty, majors, pageNumber, logoUrl, footerLogoUrl }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { oldAdmissionCounts, setOldAdmissionCount } = useEditorStore();

  useLayoutEffect(() => {
    const content = contentRef.current;
    const wrapper = wrapperRef.current;
    if (!content || !wrapper) return;
    const availableH = wrapper.offsetHeight;
    const contentH = content.scrollHeight;
    if (contentH > availableH) {
      setScale(Math.max(1.0, availableH / contentH));
    } else {
      setScale(1.0);
    }
  }, []);

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
            width: scale < 1 ? `${100 / scale}%` : '100%',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}>

          {/* Centered Faculty Name */}
          <div
            style={{
              width: "100%",
              textAlign: "center",
              fontWeight: 700,
              fontSize: 26,
              color: "#000",
              marginBottom: 8,
            }}>
            {faculty}
          </div>

          {/* Majors table */}
          <table
            className="infographic-table border border-black"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 8,
              fontSize: 18,
              border: "1.5px solid #000",
              borderColor: "#000",
            }}>
            <thead>
              <tr>
                <th
                  rowSpan={3}
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "4px 8px",
                    textAlign: "center",
                    width: "48%",
                    fontWeight: 700,
                    backgroundColor: PEACH_HEADER,
                    color: "#000",
                  }}>
                  สาขาวิชา
                </th>
                <th
                  colSpan={4}
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_HEADER,
                    color: "#000",
                  }}>
                  จำนวนรับเข้าศึกษา (คน)
                </th>
              </tr>
              <tr>
                <th
                  colSpan={2}
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "2px 4px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_HEADER,
                    color: "#000",
                    width: "26%",
                  }}>
                  เดิม
                </th>
                <th
                  colSpan={2}
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "2px 4px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_HEADER,
                    color: "#000",
                    width: "26%",
                  }}>
                  ใหม่
                </th>
              </tr>
              <tr>
                <th
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "2px 4px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_HEADER,
                    color: "#000",
                    fontSize: 14,
                    width: "13%",
                  }}>
                  ม.6 หรือเทียบเท่า*
                </th>
                <th
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "2px 4px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_HEADER,
                    color: "#000",
                    fontSize: 14,
                    width: "13%",
                  }}>
                  หลักสูตรตามอัธยาศัย หรือโรงเรียนพระปริยัติธรรม**
                </th>
                <th
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "2px 4px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_HEADER,
                    color: "#000",
                    fontSize: 14,
                    width: "13%",
                  }}>
                  ม.6 หรือเทียบเท่า*
                </th>
                <th
                  className="border border-black"
                  style={{
                    border: "1px solid #000",
                    borderColor: "#000",
                    padding: "2px 4px",
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: GRAY_HEADER,
                    color: "#000",
                    fontSize: 14,
                    width: "13%",
                  }}>
                  หลักสูตรตามอัธยาศัย หรือโรงเรียนพระปริยัติธรรม**
                </th>
              </tr>
            </thead>
            <tbody>
              {majors.map((g, i) => {
                const key = `${faculty}__${g.admissionMajor}`;
                const oldCounts = oldAdmissionCounts[key] || { m6: 0, program: 0 };
                
                // Highlight if counts differ
                const isM6Changed = oldCounts.m6 !== g.limitApplicant;
                const isProgramChanged = oldCounts.program !== g.examTotal;

                const reqNum = engineerReqData.find((item) => g.admissionMajor.includes(item.department))?.req;

                const formatVal = (v: number) => {
                  return v === 0 ? "-" : String(v);
                };

                return (
                  <tr key={i}>
                    {/* สาขาวิชา */}
                    <td
                      className="border border-black"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "2px 8px",
                        textAlign: "left",
                        backgroundColor: PEACH_CELL,
                      }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        {g.admissionMajor}
                        {reqNum && (
                          <sup style={{
                            fontSize: 10,
                            fontWeight: "bold",
                            color: "#000",
                            marginLeft: 2,
                            position: "relative",
                            top: -4,
                          }}>
                            {reqNum}
                          </sup>
                        )}
                      </div>
                    </td>
                    {/* จำนวนรับเดิม ม.6 (Inline Editable Input) */}
                    <td
                      className="border border-black"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "0px",
                        textAlign: "center",
                        backgroundColor: "#ffffff",
                      }}>
                      <input
                        type="number"
                        style={{
                          width: "100%",
                          height: "30px",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          textAlign: "center",
                          fontFamily: "inherit",
                          fontSize: "18px",
                          color: "#000",
                          padding: 0,
                          margin: 0,
                        }}
                        className="no-spinner"
                        value={oldCounts.m6 === 0 ? "" : oldCounts.m6}
                        placeholder="0"
                        onChange={(e) => {
                          const m6 = parseInt(e.target.value) || 0;
                          setOldAdmissionCount(key, m6, oldCounts.program);
                        }}
                      />
                    </td>
                    {/* จำนวนรับเดิม หลักสูตร (Inline Editable Input) */}
                    <td
                      className="border border-black"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "0px",
                        textAlign: "center",
                        backgroundColor: "#ffffff",
                      }}>
                      <input
                        type="number"
                        style={{
                          width: "100%",
                          height: "30px",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          textAlign: "center",
                          fontFamily: "inherit",
                          fontSize: "18px",
                          color: "#000",
                          padding: 0,
                          margin: 0,
                        }}
                        className="no-spinner"
                        value={oldCounts.program === 0 ? "" : oldCounts.program}
                        placeholder="0"
                        onChange={(e) => {
                          const program = parseInt(e.target.value) || 0;
                          setOldAdmissionCount(key, oldCounts.m6, program);
                        }}
                      />
                    </td>
                    {/* จำนวนรับใหม่ ม.6 */}
                    <td
                      className="border border-black"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "2px 4px",
                        textAlign: "center",
                        backgroundColor: "#ffffff",
                        fontWeight: isM6Changed ? "bold" : "normal",
                        color: "#000",
                      }}>
                      {formatVal(g.limitApplicant)}
                    </td>
                    {/* จำนวนรับใหม่ หลักสูตร */}
                    <td
                      className="border border-black"
                      style={{
                        border: "1px solid #000",
                        borderColor: "#000",
                        padding: "2px 4px",
                        textAlign: "center",
                        backgroundColor: "#ffffff",
                        fontWeight: isProgramChanged ? "bold" : "normal",
                        color: "#000",
                      }}>
                      {formatVal(g.examTotal)}
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
