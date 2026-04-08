"use client";

// ─── FacultySummaryPage ────────────────────────────────────────────────────────
// Matches Criteria.pdf page 2 exactly:
// Header → Faculty name → majors table → notes → เงื่อนไขพิเศษ → footer

import { useLayoutEffect, useRef, useState } from "react";
import type { AdmissionMajorGroup } from "@/types/infographic";
import { InfographicTopHeader } from "./InfographicTopHeader";
import { PageFooter } from "./PageFooter";
import { engineerReqData } from "@/lib/engineerReqData";

const A4_H = 1123;

interface Props {
  faculty: string;
  majors: AdmissionMajorGroup[];
  pageNumber: number;
  logoUrl?: string;
  footerLogoUrl?: string;
}

const ORANGE = "#fa4616"; // orange banner

export function FacultySummaryPage({ faculty, majors, pageNumber, logoUrl, footerLogoUrl }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const wrapper = wrapperRef.current;
    if (!content || !wrapper) return;
    const availableH = wrapper.offsetHeight;
    const contentH = content.scrollHeight;
    if (contentH > availableH) setScale(availableH / contentH);
  }, []);



  return (
    <div
      className="text-black"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'THSarabun, sans-serif',
        fontSize: 18,
        padding: '20px 30px 10px',
      }}>

      {/* Header — fixed size, never scaled */}
      <InfographicTopHeader className="mb-6" logoUrl={logoUrl} />

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

          {/* Faculty name */}
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 28,
              marginBottom: 8,
            }}>
            {faculty}
          </div>

          {/* ── Majors table ── */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 8,
              fontSize: 20,
            }}>
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "5px 8px",
                    backgroundColor: "#f4b083",
                    color: "#000",
                    textAlign: "center",
                    width: "55%",
                    fontWeight: 700,
                  }}>
                  สาขาวิชา
                </th>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "5px 8px",
                    backgroundColor: "#a6a6a6",
                    color: "#000",
                    textAlign: "center",
                    fontWeight: 700,
                  }}>
                  จำนวนเรียกสอบคัดเลือก*
                  <br />
                  (คน)
                </th>
                <th
                  style={{
                    border: "1px solid #333",
                    padding: "5px 8px",
                    backgroundColor: "#a6a6a6",
                    color: "#000",
                    textAlign: "center",
                    fontWeight: 700,
                  }}>
                  จำนวนรับเข้าศึกษา
                  <br />
                  (คน)
                </th>
              </tr>
            </thead>
            <tbody>
              {majors.map((g, i) => (
                <tr key={i}>
                  <td
                    style={{
                      border: "1px solid #333",
                      padding: "0px 8px",
                      backgroundColor: "#fbe4d5",
                    }}>
                      <p style={{
                        position: "relative",
                        width: "fit-content"
                      }}>
                        {g.admissionMajor.includes("(") ? g.admissionMajor.split(")")[0] + ")" : g.admissionMajor.split(" ")[0]}
                        <span style={{
                          position: "absolute",
                          top: 0,
                          right: -10,
                          fontSize: 12,
                        }}>
                          {engineerReqData.find((item) => g.admissionMajor.includes(item.department))?.req}
                        </span>
                      </p>
                  </td>
                  <td
                    style={{
                      border: "1px solid #333",
                      padding: "0px 8px",
                      textAlign: "center",
                      backgroundColor: "#ffffff",
                    }}>
                    {g.examTotal === 0 ? (
                      <span style={{ fontSize: 18 }}>
                        ทุกคนที่ผ่านเกณฑ์
                      </span>
                    ) : (
                      g.examTotal
                    )}
                  </td>
                  <td
                    style={{
                      border: "1px solid #333",
                      padding: "0px 8px",
                      textAlign: "center",
                      backgroundColor: "#ffffff",
                    }}>
                    {g.limitApplicant === 0 ? "-" : g.limitApplicant}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          

          {/* เงื่อนไขพิเศษ — Engineering only */}
          {faculty.includes("วิศวกรรม") && (
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  color: ORANGE,
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 4,
                  textDecoration: "underline",
                }}>
                เงื่อนไขพิเศษ หรือคุณสมบัติพิเศษอื่น ๆ
              </div>
              <ol
                style={{
                  paddingLeft: 20,
                  margin: 0,
                  color: ORANGE,
                  lineHeight: 1.7,
                  listStyleType: "decimal",
                }}>
                <li>
                  รับผู้มีภาวะตาบอดสี
                  แต่ต้องไม่มีภาวะตาบอดสีขั้นรุนแรงอันเป็นอุปสรรคต่อการศึกษา
                  ตามแนวทางการตรวจตาบอดสีของราชวิทยาลัยจักษุแพทย์แห่งประเทศไทย
                </li>
                <li>รับผู้มีภาวะตาบอดสี</li>
                <li>
                  <span style={{ textDecoration: "underline" }}>ไม่รับ</span>{" "}
                  ผู้มีภาวะตาบอดสี
                </li>
              </ol>
            </div>
          )}

        </div>
      </div>

      {/* Footer — fixed size, never scaled */}
      <PageFooter pageNumber={pageNumber} footerLogoUrl={footerLogoUrl} />
    </div>
  );
}
