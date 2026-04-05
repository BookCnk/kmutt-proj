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
import { PageFooter } from "./PageFooter";

const A4_H = 1123;

interface Props {
  group: AdmissionMajorGroup;
  pageNumber: number;
  /** When provided (merged mode), skip individual major name */
  groups?: AdmissionMajorGroup[];
  logoUrl?: string;
  footerLogoUrl?: string;
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
  padding: "3px 8px",
  textAlign: "center",
  fontWeight: 700,
  color: "#000",
  fontSize: 18,
};
const tdBase: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "2px 7px",
  fontSize: 18,
};

export function MajorPage({ group, pageNumber, groups, logoUrl, footerLogoUrl }: Props) {
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



  const isMerged = groups != null && groups.length > 1;
  const criteria = dedup(group.criteria);
  const credits = creditRows(group.criteria);
  const totalTest = criteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
  const totalAdmission = criteria.reduce(
    (s, r) => s + (r.weightAdmission ?? 0),
    0,
  );

  // hasGpaNoMin: true when ANY criteria row has gpaMin === 1 (means "must have score, no minimum")
  const hasGpaNoMin = criteria.some((r) => r.gpaMin === 1);
  const hasTgatTpat = criteria.some(
    (r) => r.subjectName?.includes('TGAT') || r.subjectName?.includes('TPAT'),
  );
  const isEngineering = group.faculty.includes('วิศวกรรม');
  const showRemarks = hasGpaNoMin || hasTgatTpat || isEngineering;

  // ── Criteria row classification ───────────────────────────────────────────
  // Keywords match the RAW Excel subject names (no "GPA" prefix in the data).
  // 'GPA ' is prepended for display only via displaySubjectName().
  const MAIN_KW = ['GPAX', 'คณิต', 'วิทยา', 'ภาษา', 'TGAT', 'TPAT'];
  const SPECIAL_KW = ['สอบสัมภาษณ์', 'แฟ้มสะสมผลงาน'];
  // Rows that are GPA subjects need "GPA " prepended for display
  const GPA_DISPLAY_KW = ['คณิต', 'วิทยา', 'ภาษา'];
  function displaySubjectName(name: string): string {
    if (
      !name.includes('TGAT') && !name.includes('TPAT') && !name.includes('GPAX') &&
      GPA_DISPLAY_KW.some((kw) => name.includes(kw))
    ) {
      return `GPA ${name}`;
    }
    return name;
  }
  const mainCriteria = criteria.filter((r) =>
    MAIN_KW.some((kw) => r.subjectName?.includes(kw))
  );
  const specialCriteria = criteria.filter((r) =>
    SPECIAL_KW.some((kw) => r.subjectName?.includes(kw))
  );
  // Combined admission weight for main rows → shown as a single merged cell
  const mainAdmissionTotal = mainCriteria.reduce((s, r) => s + (r.weightAdmission ?? 0), 0);
  const mainTestTotal = mainCriteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
  const specialTestTotal = specialCriteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
  const specialAdmissionTotal = specialCriteria.reduce((s, r) => s + (r.weightAdmission ?? 0), 0);

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

          {/* Faculty (ต่อ) — always shown */}
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

          {/* Major name(s) — hidden in merged mode (already shown on summary page) */}
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
          <div style={{ marginBottom: 4 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                textDecoration: "underline",
                marginBottom: 2,
              }}>
              คุณสมบัติเบื้องต้นในการสมัคร
            </div>
            <div style={{ paddingLeft: 16, lineHeight: 1.4 }}>
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
                marginBottom: 4,
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
              marginBottom: 2,
            }}>
            เกณฑ์การพิจารณา
          </div>

          {/* ── Criteria table ── */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 4,
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
              {/* ── Main rows (6 subject groups) with merged admission cell ── */}
              {mainCriteria.map((row, i) => (
                <tr
                  key={row.subjectName}
                  style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9f9" }}>
                  <td style={tdBase}>{displaySubjectName(row.subjectName ?? '')}</td>
                  <td style={{ ...tdBase, textAlign: "center" }}>
                    {minLabel(row)}
                  </td>
                  <td style={{ ...tdBase, textAlign: "center" }}>
                    {row.weightTest != null && row.weightTest > 0 ? row.weightTest : "-"}
                  </td>
                  {/* Admission weight — merged across ALL main rows on first row only */}
                  {i === 0 && (
                    <td
                      rowSpan={mainCriteria.length}
                      style={{
                        ...tdBase,
                        textAlign: "center",
                        verticalAlign: "middle",
                        backgroundColor: "#e2efd9",
                        fontWeight: 700,
                      }}>
                      {mainAdmissionTotal > 0 ? mainAdmissionTotal : "-"}
                    </td>
                  )}
                </tr>
              ))}

              {/* ── Special rows: สอบสัมภาษณ์ / แฟ้มสะสมผลงาน (merged first 2 cols) ── */}
              {specialCriteria.map((row) => (
                <tr key={row.subjectName} style={{ backgroundColor: "#fff" }}>
                  <td
                    colSpan={2}
                    style={{ ...tdBase, textAlign: "center", color: "#374151" }}>
                    {row.subjectName}
                  </td>
                  <td style={{ ...tdBase, textAlign: "center" }}>
                    {row.weightTest != null && row.weightTest > 0 ? row.weightTest : "-"}
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
                  {(mainTestTotal + specialTestTotal) > 0 ? (mainTestTotal + specialTestTotal) : "-"}
                </td>
                <td
                  style={{
                    ...tdBase,
                    textAlign: "center",
                    fontWeight: 700,
                    backgroundColor: "#e2efd9",
                  }}>
                  {(mainAdmissionTotal + specialAdmissionTotal) > 0
                    ? (mainAdmissionTotal + specialAdmissionTotal)
                    : "-"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── หมายเหตุ (conditional) ── */}
          {showRemarks && (
            <div style={{ fontSize: 18, lineHeight: 1.4, marginBottom: 4 }}>
              <div
                style={{
                  fontWeight: 700,
                  textDecoration: "underline",
                  marginBottom: 2,
                }}>
                หมายเหตุ
              </div>
              <ol style={{ paddingLeft: 20, margin: 0, listStyleType: "decimal" }}>
                {/* Item 1: show when gpaMin === 1 */}
                {hasGpaNoMin && (
                  <li>
                    คะแนน GPA คณิตศาสตร์ และวิทยาศาสตร์ ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน
                    หากนักเรียนไม่กรอกคะแนนในระบบรับสมัคร{" "}
                    <span style={{ fontWeight: 700, textDecoration: "underline" }}>
                      จะถือว่าไม่ผ่านเกณฑ์การรับสมัคร
                    </span>
                  </li>
                )}
                {/* Item 2: show when TGAT/TPAT subjects present */}
                {hasTgatTpat && (
                  <li>
                    คะแนนทดสอบวิชา TGAT/TPAT ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน{" "}
                    <span style={{ fontWeight: 700 }}>
                      ผู้สมัครไม่ต้องกรอกคะแนน
                    </span>{" "}
                    มหาวิทยาลัยๆ จะดึงคะแนนจากฐานข้อมูลเอง
                  </li>
                )}
                {/* Item 3: always shown when remarks block is visible */}
                <li>
                  เขต* หมายถึง สถานศึกษาในชั้น ม.6 ที่สังกัดตามเขตตรวจราชการ
                  ระดับสำนักนายกรัฐมนตรี 18 เขต
                </li>
                {/* Item 4: Engineering only */}
                {isEngineering && (
                  <li>
                    สำหรับคณะวิศวกรรมศาสตร์ผู้สมัครที่มีผลการทดสอบภาษาอังกฤษมาตรฐาน
                    CEFR Level B2 หรือการทดสอบอื่นในระดับที่เทียบเท่า เช่น CU-TEP,
                    TU-GET, TOEIC, IELTS, TOEFL iBT, TOEFL ITP และ TETET
                    สามารถนำผลคะแนนมาใส่แฟ้มสะสมผลงาน (Portfolio)
                    เพื่อใช้ในการประกอบการพิจารณาเป็นพิเศษ
                  </li>
                )}
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
