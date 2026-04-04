"use client";

// ─── MajorPage ─────────────────────────────────────────────────────────────────
// Matches Criteria.pdf page 3 (individual major detail page):
// Header → "Faculty (ต่อ)" → คุณสมบัติเบื้องต้น → credits table →
// เกณฑ์การพิจารณา table → หมายเหตุ → footer

import { useLayoutEffect, useRef, useState } from "react";
import type {
  AdmissionCriteriaRow,
  AdmissionMajorGroup,
} from "@/types/infographic";
import { InfographicTopHeader } from "./InfographicTopHeader";

const A4_H = 1123;

interface Props {
  group: AdmissionMajorGroup;
  pageNumber: number;
  /** When provided (merged mode), skip individual major name */
  groups?: AdmissionMajorGroup[];
  logoUrl?: string;
}

const ORANGE = "#fa4616";
const DARK = "#1a1a1a";

function minLabel(row: AdmissionCriteriaRow): string {
  const name = row.subjectName?.trim() ?? '';
  if (
    name.includes('สอบสัมภาษณ์') ||
    name.includes('แฟ้มสะสมผลงาน') ||
    name.includes('สอบความถนัด') ||
    name.includes('สอบวัดความถนัด')
  ) return '-';
  if (row.gpaMin !== null && row.gpaMin !== undefined) {
    if (row.gpaMin === 1) return 'ไม่กำหนดขั้นต่ำ';
    return String(row.gpaMin);
  }
  if (row.lngScore !== null && row.lngScore !== undefined)
    return String(row.lngScore);
  return "ไม่กำหนดขั้นต่ำ";
}

function dedup(rows: AdmissionCriteriaRow[]): AdmissionCriteriaRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.subjectName}|${r.gpaMin}|${r.weightTest}|${r.weightAdmission}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Unique credit rows keyed by subjectName (col E)
function creditRows(criteria: AdmissionCriteriaRow[]) {
  return Array.from(
    new Map(
      criteria
        .filter((r) => r.subjectName?.trim() && r.credits != null)
        .map((r) => [r.subjectName.trim(), r]),
    ).values(),
  );
}

const thBase: React.CSSProperties = {
  border: "1px solid #999",
  padding: "4px 8px",
  textAlign: "center",
  fontWeight: 700,
  color: "#000",
  fontSize: 18,
};
const tdBase: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "3px 7px",
  fontSize: 18,
};

export function MajorPage({ group, pageNumber, groups, logoUrl }: Props) {
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

  const isMerged = groups != null && groups.length > 1;
  const criteria = dedup(group.criteria);
  const credits = creditRows(group.criteria);
  const totalTest = criteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
  const totalAdmission = criteria.reduce(
    (s, r) => s + (r.weightAdmission ?? 0),
    0,
  );

  // Conditional remark flags
  const hasGpaNoMin = criteria.some((r) => r.gpaMin === 1);
  const hasTgatTpat = criteria.some(
    (r) => r.subjectName?.includes('TGAT') || r.subjectName?.includes('TPAT'),
  );
  const isEngineering = group.faculty.includes('วิศวกรรม');
  const showRemarks = hasGpaNoMin || hasTgatTpat || isEngineering;

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

          {/* Faculty (ต่อ) */}
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 8,
              color: DARK,
            }}>
            {group.faculty} (ต่อ)
          </div>

          {/* Major name — hidden in merged mode */}
          {!isMerged && (
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                marginBottom: 6,
                color: DARK,
              }}>
              {group.admissionMajor}
            </div>
          )}

          {/* ── คุณสมบัติเบื้องต้น ── */}
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                textDecoration: "underline",
                marginBottom: 4,
              }}>
              คุณสมบัติเบื้องต้นในการสมัคร
            </div>
            <div style={{ paddingLeft: 16, lineHeight: 1.7 }}>
              <div>- ผลการเรียน 5 - 6 ภาคการศึกษา</div>
              <div>
                - กำลังศึกษา/สำเร็จการศึกษาระดับชั้นมัธยมศึกษาปีที่ 6 หรือ ปวช.
              </div>
              <div>- จำนวนหน่วยกิตขั้นต่ำของกลุ่มสาระการเรียนรู้</div>
            </div>
          </div>

          {/* ── Credits table ── */}
          {credits.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: 8,
                fontSize: 18,
              }}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...thBase,
                      backgroundColor: "#bfbfbf",
                      textAlign: "left",
                    }}>
                    หน่วยกิตรวมของกลุ่มสาระการเรียนรู้
                  </th>
                  <th style={{ ...thBase, backgroundColor: "#bfbfbf", width: 120 }}>
                    หน่วยกิตขั้นต่ำ
                  </th>
                </tr>
              </thead>
              <tbody>
                {credits.map((r, i) => (
                  <tr
                    key={i}
                    style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={tdBase}>{r.subjectName.trim()}</td>
                    <td style={{ ...tdBase, textAlign: "center" }}>
                      {r.credits === 1 ? 'ไม่กำหนดขั้นต่ำ' : r.credits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── เกณฑ์การพิจารณา heading ── */}
          <div
            style={{
              fontWeight: 700,
              fontSize: 18,
              textDecoration: "underline",
              marginBottom: 4,
            }}>
            เกณฑ์การพิจารณา
          </div>

          {/* ── Criteria table ── */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 8,
              fontSize: 18,
            }}>
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    ...thBase,
                    backgroundColor: "#bfbfbf",
                    textAlign: "left",
                    width: "30%",
                  }}>
                  รายการ
                </th>

                <th style={{ ...thBase, backgroundColor: "#bfbfbf" }}>
                  เกณฑ์การรับสมัคร
                </th>
                <th style={{ ...thBase, backgroundColor: "#bfbfbf" }}>
                  เกณฑ์การเรียกสอบคัดเลือก
                </th>
                <th style={{ ...thBase, backgroundColor: "#a8d08d" }}>
                  เกณฑ์การรับเข้าศึกษา
                </th>
              </tr>
              <tr>
                <th style={{ ...thBase, backgroundColor: "#d9d9d9" }}>
                  เกรดเฉลี่ย / คะแนนขั้นต่ำ
                </th>
                <th style={{ ...thBase, backgroundColor: "#d9d9d9" }}>
                  ค่าน้ำหนัก (%)
                </th>
                <th style={{ ...thBase, backgroundColor: "#c5e0b3" }}>
                  ค่าน้ำหนัก (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((row, i) => (
                <tr
                  key={i}
                  style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={tdBase}>{row.subjectName}</td>
                  <td style={{ ...tdBase, textAlign: "center" }}>
                    {minLabel(row)}
                  </td>
                  <td style={{ ...tdBase, textAlign: "center" }}>
                    {row.weightTest != null && row.weightTest > 0
                      ? row.weightTest
                      : "-"}
                  </td>
                  <td
                    style={{
                      ...tdBase,
                      textAlign: "center",
                      backgroundColor: "#e2efd9",
                    }}>
                    {row.weightAdmission != null && row.weightAdmission > 0
                      ? row.weightAdmission
                      : "-"}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ backgroundColor: "#f1f5f9", fontWeight: 700 }}>
                <td
                  colSpan={2}
                  style={{ ...tdBase, textAlign: "right", fontWeight: 700 }}>
                  รวม
                </td>
                <td style={{ ...tdBase, textAlign: "center", fontWeight: 700 }}>
                  {totalTest > 0 ? totalTest : "-"}
                </td>
                <td
                  style={{
                    ...tdBase,
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: "#e2efd9",
                  }}>
                  {totalAdmission > 0 ? totalAdmission : "-"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── หมายเหตุ (conditional) ── */}
          {showRemarks && (
            <div style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 4 }}>
              <div
                style={{
                  fontWeight: 700,
                  textDecoration: "underline",
                  marginBottom: 2,
                }}>
                หมายเหตุ
              </div>
              {hasGpaNoMin && (
                <div>
                  1. คะแนน GPA คณิตศาสตร์ และวิทยาศาสตร์ ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน
                  หากนักเรียนไม่กรอกคะแนนในระบบรับสมัคร{" "}
                  <span style={{ fontWeight: 700, textDecoration: "underline" }}>
                    จะถือว่าไม่ผ่านเกณฑ์การรับสมัคร
                  </span>
                </div>
              )}
              {hasTgatTpat && (
                <div>
                  2. คะแนนทดสอบวิชา TGAT/TPAT ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน มหาวิทยาลัยฯ
                  จะดึงคะแนนจากฐานข้อมูลเอง{" "}
                  <span style={{ fontWeight: 700 }}>ผู้สมัครไม่ต้องกรอกคะแนน</span>
                </div>
              )}
              {isEngineering && (
                <div>
                  4. สำหรับคณะวิศวกรรมศาสตร์ ผู้สมัครที่มีผลการทดสอบภาษาอังกฤษมาตรฐาน
                  CEFR Level B2 หรือการทดสอบอื่นในระดับที่เทียบเท่า
                  สามารถนำผลคะแนนมาใส่แฟ้มสะสมผลงาน (Portfolio)
                  เพื่อใช้ในการประกอบการพิจารณาเป็นพิเศษ
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Footer — fixed size, never scaled */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderTop: "1px solid #ccc",
          paddingTop: 10,
          fontSize: 18,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl ?? '/ICON.png'} alt="logo" style={{ width: 44, height: 30, objectFit: 'contain' }} />
          <span style={{ color: "#555" }}>
            สำนักงานคัดเลือกและสรรหานักศึกษา มจธ.
            ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#c0392b", fontWeight: 600 }}>{dateStr}</div>
          <div style={{ color: "#555" }}>{pageNumber} | Page</div>
        </div>
      </div>
    </div>
  );
}
