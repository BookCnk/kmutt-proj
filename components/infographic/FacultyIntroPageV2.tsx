"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { InfographicTopHeaderV2 } from "./InfographicTopHeaderV2";
import { PageFooter } from "./PageFooter";

interface Props {
  faculty: string;
  pageNumber: number;
  logoUrl?: string;
  footerLogoUrl?: string;
}

const RED = "red";
const DARK = "#1a1a1a";

export function FacultyIntroPageV2({ faculty, pageNumber, logoUrl, footerLogoUrl }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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

          {/* Title */}
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 8,
              color: DARK,
            }}>
            {faculty} (ต่อ)
          </div>

          {/* 1. เงื่อนไขพิเศษ หรือคุณสมบัติเฉพาะอื่น ๆ */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                color: RED,
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
                textDecoration: "underline",
              }}>
              เงื่อนไขพิเศษ หรือคุณสมบัติเฉพาะอื่น ๆ
            </div>
            <ul style={{ listStyleType: "none", paddingLeft: 12, margin: 0, lineHeight: 1.25, fontSize: 16 }}>
              <li style={{ marginBottom: 2 }}>
                <sup style={{ color: RED, fontWeight: "bold", marginRight: 3 }}>1</sup>
                <span style={{ color: RED }}>รับผู้มีภาวะตาบอดสี แต่ต้องไม่มีภาวะตาบอดสีขั้นรุนแรงอันเป็นอุปสรรคต่อการศึกษา ตามแนวทางการตรวจตาบอดสีของราชวิทยาลัยจักษุแพทย์แห่งประเทศไทย</span>
              </li>
              <li style={{ marginBottom: 2 }}>
                <sup style={{ color: RED, fontWeight: "bold", marginRight: 3 }}>2</sup>
                <span style={{ color: RED }}>รับผู้มีภาวะตาบอดสี</span>
              </li>
              <li style={{ marginBottom: 2 }}>
                <sup style={{ color: RED, fontWeight: "bold", marginRight: 3 }}>3</sup>
                <span style={{ color: RED, textDecoration: "underline", fontWeight: "bold" }}>ไม่รับ</span> <span style={{ color: RED }}>ผู้มีภาวะตาบอดสี</span>
              </li>
            </ul>
          </div>

          {/* 2. คุณสมบัติเบื้องต้นในการสมัคร */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
              }}>
              1. <span style={{ textDecoration: "underline" }}>คุณสมบัติเบื้องต้นในการสมัคร</span>
            </div>
            <ul style={{ listStyleType: "none", paddingLeft: 12, margin: 0, lineHeight: 1.25, fontSize: 16 }}>
              <li style={{ marginBottom: 2 }}>- ผลการเรียน 5 - 6 ภาคการศึกษา</li>
              <li style={{ marginBottom: 2 }}>- <span style={{ color: RED, fontWeight: "bold" }}>*</span>กำลังศึกษา/สำเร็จการศึกษาระดับชั้นมัธยมศึกษาปีที่ 6 หรือเทียบเท่า <span style={{ color: RED }}>(ปวช./ปวส./GED)</span></li>
              <li style={{ marginBottom: 2 }}>- <span style={{ color: RED, fontWeight: "bold" }}>**</span>กำลังศึกษา/สำเร็จการศึกษาระดับชั้นมัธยมศึกษาปีที่ 6 หลักสูตรตามอัธยาศัย <span style={{ color: RED }}>(กศน.)</span></li>
              <li style={{ marginBottom: 2 }}>- <span style={{ color: RED, fontWeight: "bold" }}>**</span>กำลังศึกษา/สำเร็จการศึกษาระดับชั้นมัธยมศึกษาปีที่ 6 หลักสูตรพระปริยัติธรรมหรือพระพุทธศาสนาแห่งชาติ</li>
              <li style={{ marginBottom: 2 }}>- จำนวนหน่วยกิตขั้นต่ำของกลุ่มสาระการเรียนรู้</li>
            </ul>
          </div>

          {/* 3. Credits Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 16,
              border: "1px solid #000",
              marginTop: 8,
            }}>
            <thead>
              <tr style={{ backgroundColor: "#bfbfbf" }}>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                    textAlign: "center",
                    fontWeight: 700,
                    width: "60%",
                  }}>
                  หน่วยกิตรวมของกลุ่มสาระการเรียนรู้
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                    textAlign: "center",
                    fontWeight: 700,
                  }}>
                  หน่วยกิตขั้นต่ำ<br />(เฉพาะมัธยมศึกษาตอนปลาย)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "4px 8px" }}>คณิตศาสตร์</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>8</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "4px 8px" }}>วิทยาศาสตร์</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>20</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "4px 8px" }}>ภาษาต่างประเทศ</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>6</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

      {/* Footer */}
      <PageFooter pageNumber={pageNumber} footerLogoUrl={footerLogoUrl} />
    </div>
  );
}
