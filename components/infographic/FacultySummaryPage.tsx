"use client";

// ─── FacultySummaryPage ────────────────────────────────────────────────────────
// Matches Criteria.pdf page 2 exactly:
// Header → Faculty name → majors table → notes → เงื่อนไขพิเศษ → footer

import type { AdmissionMajorGroup } from "@/types/infographic";
import { InfographicTopHeader } from "./InfographicTopHeader";

interface Props {
  faculty: string;
  majors: AdmissionMajorGroup[];
  pageNumber: number;
}

const ORANGE = "#fa4616"; // orange banner

export function FacultySummaryPage({ faculty, majors, pageNumber }: Props) {
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

  return (
    <div
      className="w-full h-full flex flex-col bg-white overflow-hidden text-black"
      style={{
        fontFamily: "THSarabun, sans-serif",
        padding: "20px 30px 10px",
        fontSize: 16,
      }}>
      {/* Header */}
      <InfographicTopHeader className="mb-3" />

      {/* Faculty name */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 14,
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
          fontSize: 11,
        }}>
        <thead>
          <tr style={{ backgroundColor: "#a0522d" }}>
            <th
              style={{
                border: "1px solid #999",
                padding: "5px 8px",
                color: "#fff",
                textAlign: "center",
                width: "55%",
                fontWeight: 700,
              }}>
              สาขาวิชา
            </th>
            <th
              style={{
                border: "1px solid #999",
                padding: "5px 8px",
                color: "#fff",
                textAlign: "center",
                fontWeight: 700,
              }}>
              จำนวนเรียกสอบคัดเลือก*
              <br />
              (คน)
            </th>
            <th
              style={{
                border: "1px solid #999",
                padding: "5px 8px",
                color: "#fff",
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
            <tr
              key={i}
              style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ border: "1px solid #ccc", padding: "4px 8px" }}>
                {g.admissionMajor}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "4px 8px",
                  textAlign: "center",
                }}>
                {g.examTotal === 0 ? (
                  <span style={{ fontSize: 10 }}>
                    อยู่ระหว่างปรับปรุงหลักสูตร*
                  </span>
                ) : (
                  g.examTotal
                )}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "4px 8px",
                  textAlign: "center",
                }}>
                {g.limitApplicant === 0 ? "-" : g.limitApplicant}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes */}
      <p style={{ marginBottom: 4 }}>
        <strong>* สำหรับหลักสูตรปรับปรุง/ระงับการเปิดรับสมัครชั่วคราว</strong>{" "}
        สามารถติดต่อสอบถามข้อมูลเพิ่มเติมได้ที่ คณะ/สาขาวิชา โดยตรง{" "}
        <strong>โทร : 02-470-9014</strong>
      </p>
      <p style={{ marginBottom: 8 }}>
        สอบคัดเลือก* หมายถึง สอบสัมภาษณ์ และ/หรือสอบทักษะขั้นพื้นฐาน
        เพื่อประเมินความถนัดทางวิชาชีพ/ความสามารถพิเศษ
      </p>

      {/* เงื่อนไขพิเศษ */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            color: ORANGE,
            fontWeight: 700,
            fontSize: 12,
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

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* ── Footer ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderTop: "1px solid #ccc",
          paddingTop: 6,
          fontSize: 9,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 2 }}>
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: "#c0392b",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                backgroundColor: "#fa4616",
                borderRadius: 2,
              }}
            />
          </div>
          <span style={{ color: "#555" }}>
            สำนักงานคัดเลือกและสรรหานักศึกษา มจธ.
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#c0392b", fontWeight: 600 }}>
            ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม
          </div>
          <div style={{ color: "#c0392b", fontWeight: 600 }}>{dateStr}</div>
          <div style={{ color: "#555" }}>{pageNumber} | Page</div>
        </div>
      </div>
    </div>
  );
}
