"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { InfographicTopHeaderV2 } from "./InfographicTopHeaderV2";
import { PageFooter } from "./PageFooter";

const DARK = "#1a1a1a";

interface Props {
  faculty: string;
  pageNumber: number;
  logoUrl?: string;
  footerLogoUrl?: string;
}

export function FacultyAdditionalPage1V2({ faculty, pageNumber, logoUrl, footerLogoUrl }: Props) {
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

      <InfographicTopHeaderV2 className="mb-4" logoUrl={logoUrl} />

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
              marginBottom: 4,
              color: DARK,
            }}>
            {faculty} (ต่อ)
          </div>

          {/* Subtitle */}
          <div
            style={{
              textAlign: "left",
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 8,
              textDecoration: "underline",
              color: DARK,
            }}>
            โครงการ Active Recruitment รับนักศึกษาความสามารถพิเศษ
          </div>

          {/* Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 16,
              border: "1px solid #000",
              marginTop: 4,
              marginBottom: 12,
            }}>
            <thead>
              <tr style={{ backgroundColor: "#bfbfbf" }}>
                <th
                  rowSpan={2}
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                    textAlign: "center",
                    fontWeight: 700,
                    width: "40%",
                  }}>
                  ประเภทคะแนน
                </th>
                <th
                  colSpan={2}
                  style={{
                    border: "1px solid #000",
                    padding: "6px 8px",
                    textAlign: "center",
                    fontWeight: 700,
                  }}>
                  เกณฑ์การรับสมัคร (คะแนนขั้นต่ำ)
                </th>
              </tr>
              <tr style={{ backgroundColor: "#bfbfbf" }}>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontWeight: 700,
                    width: "30%",
                  }}>
                  หลักสูตรปกติ
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontWeight: 700,
                    width: "30%",
                  }}>
                  หลักสูตรนานาชาติ
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", padding: "4px 8px" }}>GPAX</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center" }}>ไม่กำหนดขั้นต่ำ</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center" }}>ไม่กำหนดขั้นต่ำ</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "4px 8px" }}>GPA คณิตศาสตร์</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>2.50</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>2.50</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "4px 8px" }}>GPA วิทยาศาสตร์</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>2.50</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>2.50</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", padding: "4px 8px" }}>GPA ภาษาต่างประเทศ</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center" }}>ไม่กำหนดขั้นต่ำ</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontWeight: "bold" }}>2.50</td>
              </tr>
            </tbody>
          </table>

          {/* 3. เกณฑ์รับสมัคร (เพิ่มเติม) */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
              }}>
              3. <span style={{ textDecoration: "underline" }}>เกณฑ์รับสมัคร (เพิ่มเติม)</span>
            </div>
            <div style={{ paddingLeft: 12, lineHeight: 1.3, fontSize: 16 }}>
              <div style={{ marginBottom: 4, textIndent: "-20px", paddingLeft: 20 }}>
                <strong>3.1</strong> นักเรียนทุกคน "ต้อง" มีแฟ้มสะสมผลงาน (ไม่เกิน 10 หน้ากระดาษ A4) และเพิ่มเติมผลงานโดดเด่นของนักเรียน 1 หน้า กระดาษ A4 โดยเน้นไปที่ โครงการวิทยาศาสตร์ พร้อมระบุหน้าที่รับผิดชอบในโครงการ รางวัลที่ได้รับจากหน่วยงานภายนอกโรงเรียน ผลงานที่คาดว่าจะพัฒนาในอนาคต
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>3.2</strong> มีคุณสมบัติอื่น ๆ (ถ้ามี) คือ
              </div>
              <div style={{ paddingLeft: 20 }}>
                <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- มีความสามารถพิเศษในเชิง Professional Skill</div>
                <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- มีผลงานโดดเด่นหรือได้รับรางวัลระดับชาติหรือระดับนานาชาติ</div>
                <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- ศึกษาอยู่ในโรงเรียนวิทยาศาสตร์ต้นแบบ / โรงเรียนต้นแบบ เช่น มหิดลวิทยานุสรณ์, เตรียมอุดมศึกษา, ดรุณสิกขาลัย ฯลฯ</div>
                <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- ผ่านค่ายโอลิมปิกวิชาการ ค่ายที่ 2 ของ สอวน.</div>
                <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- ภาควิชาพิจารณาคัดเลือกผู้มีสิทธิ์เข้าสอบสัมภาษณ์และมีสิทธิ์เข้าศึกษา</div>
                <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- มีคะแนนภาษาอังกฤษ เช่น TOEFL, IELTS, TOEIC</div>
                <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- มีรายละเอียดโครงงานด้านวิทยาศาสตร์หรือคณิตศาสตร์</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <PageFooter pageNumber={pageNumber} footerLogoUrl={footerLogoUrl} />
    </div>
  );
}

export function FacultyAdditionalPage2V2({ faculty, pageNumber, logoUrl, footerLogoUrl }: Props) {
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

      <InfographicTopHeaderV2 className="mb-4" logoUrl={logoUrl} />

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

          {/* Continuation of 3.2 */}
          <div style={{ paddingLeft: 12, lineHeight: 1.3, fontSize: 16, marginBottom: 8 }}>
            <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>
              - นักเรียนทุกคน "ต้อง" มีแฟ้มสะสมผลงาน (ไม่เกิน 10 หน้ากระดาษ A4) และตอบคำถามดังต่อไปนี้
            </div>
            <div style={{ paddingLeft: 30 }}>
              <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>
                * จงอธิบายอย่างเป็นขั้นตอน แสดงวิธีการและผลการศึกษา และสรุปผลโครงงานด้านวิศวกรรมศาสตร์ ด้านวิทยาศาสตร์ หรือสิ่งประดิษฐ์ที่เคยทำและภูมิใจมากที่สุด (จำนวน 1 ชิ้น พร้อมภาพประกอบ (ถ้ามี) จำนวน 1 หน้ากระดาษ A4)
              </div>
              <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>
                * นำเสนอโครงงานด้านวิศวกรรมศาสตร์ ด้านวิทยาศาสตร์ หรือสิ่งประดิษฐ์ ที่ท่านอยากทำในอนาคต (โปรดอธิบายแนวคิดอย่าง คร่าว ๆ จำนวน 1 หน้ากระดาษ A4)
              </div>
            </div>
            <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>
              - ต้องมีผลงานเชิงประจักษ์ที่ได้รับรางวัลระดับชาติหรือระดับนานาชาติ ในด้านวิศวกรรมศาสตร์ หรือด้านวิทยาศาสตร์และเทคโนโลยี
            </div>
            <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>
              - ต้องมีความสามารถเฉพาะด้านที่ภาควิชาเห็นสมควรรับเข้าศึกษา
            </div>
          </div>

          {/* 3.3, 3.4, 3.5 */}
          <div style={{ paddingLeft: 12, lineHeight: 1.3, fontSize: 16, marginBottom: 12 }}>
            <div style={{ textIndent: "-20px", paddingLeft: 20, marginBottom: 4 }}>
              <strong>3.3</strong> มีความสามารถเฉพาะด้านที่ภาควิชาเห็นสมควรรับเข้าศึกษา (กรณีที่ผลการศึกษาหมวดใดหมวดหนึ่งต่ำกว่าเกณฑ์ที่กำหนดให้ขึ้นอยู่กับความเห็นชอบของที่ประชุมภาควิชา และนำเข้าพิจารณาในคณะกรรมการประจำคณะวิศวกรรมศาสตร์ ถือเป็นที่สิ้นสุด)
            </div>
            <div style={{ textIndent: "-20px", paddingLeft: 20, marginBottom: 4 }}>
              <strong>3.4</strong> กรณี GPA ภาษาต่างประเทศ ให้ใช้เกณฑ์ตามที่สาขาวิชากำหนดไว้ อย่างไรก็ตามหากผู้สมัครมี GPA ต่ำกว่าเกณฑ์ที่กำหนดไว้ ให้ใช้ผลการทดสอบภาษาอังกฤษมาตรฐาน CEFR Level B2 หรือการทดสอบอื่นในระดับที่เทียบเท่า เช่น CU-TEP, TU-GET, TOEIC, IELTS, TOEFL iBT, TOEFL ITP และ TETET แทนได้
            </div>
            <div style={{ textIndent: "-20px", paddingLeft: 20, marginBottom: 4 }}>
              <strong>3.5</strong> ผ่านความเห็นชอบจากที่ประชุมคณะกรรมการประจำคณะวิศวกรรมศาสตร์
            </div>
          </div>

          {/* 4. คุณสมบัติเพิ่มเติม (สำหรับหลักสูตรนานาชาติ) */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
              }}>
              4. <span style={{ textDecoration: "underline" }}>คุณสมบัติเพิ่มเติม (สำหรับหลักสูตรนานาชาติ)</span>
            </div>
            <div style={{ paddingLeft: 12, lineHeight: 1.3, fontSize: 16 }}>
              <div style={{ marginBottom: 6 }}>
                <strong>4.1 สำหรับผู้สมัครเข้าศึกษา วศ.โยธา (หลักสูตรนานาชาติ) แนบเอกสารเพิ่มเติม ดังนี้</strong>
                <div style={{ paddingLeft: 15, marginTop: 2 }}>
                  <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- ผลการทดสอบภาษาอังกฤษมาตรฐาน เช่น IELTS, TOEFL หรือ ผลทดสอบอื่น ๆ ที่เทียบเท่า เช่น TOEIC, CU-TEP เป็นต้น</div>
                  <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- เรียงความ (Essay) เขียนด้วยภาษาอังกฤษ ในหัวข้อ “ทำไมถึงอยากเข้าศึกษาต่อวิศวกรรมโยธา หลักสูตรนานาชาติ มจธ.” ความยาว 1 หน้ากระดาษ A4</div>
                  <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- ในกรณีที่จบการศึกษาจากโรงเรียนในต่างประเทศ โรงเรียนนานาชาติ และโรงเรียนวิทยาศาสตร์ต้นแบบ สามารถแนบผลการทดสอบความรู้มาตรฐาน เช่น IGCSE, A Level หรือ SAT (ถ้ามี)</div>
                </div>
              </div>

              <div>
                <strong>4.2 สำหรับผู้สมัครเข้าศึกษา วศ.เคมี (แผนการเรียน: นานาชาติ), วศ.คอมพิวเตอร์ (หลักสูตรนานาชาติ), วศ.สิ่งแวดล้อม (แผนการเรียน: ภาษาอังกฤษ), วศ.อัตโนมัติ (หลักสูตรนานาชาติ), และ วศ.อิเล็กทรอนิกส์และสารสนเทศสื่อสาร (หลักสูตรนานาชาติ) สามารถแนบเอกสารคะแนน SAT ประกอบเพิ่มเติมได้ (ถ้ามี) ดังนี้</strong>
                <div style={{ paddingLeft: 15, marginTop: 2 }}>
                  <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- วศ.คอมพิวเตอร์ (นานาชาติ) และวศ.อัตโนมัติ (นานาชาติ) “ถ้าผู้สมัครเข้าศึกษามีคะแนน SAT Math ไม่น้อยกว่า 600 คะแนน สามารถยื่นประกอบในการสมัครได้”</div>
                  <div style={{ textIndent: "-15px", paddingLeft: 15, marginBottom: 2 }}>- วศ.สิ่งแวดล้อม (แผนการเรียน: ภาษาอังกฤษ), วศ.อิเล็กทรอนิกส์และสารสนเทศสื่อสาร (นานาชาติ) และวศ.เคมี (แผนการเรียน: นานาชาติ) “ถ้าผู้สมัครเข้าศึกษามีคะแนน SAT Math สามารถยื่นประกอบในการสมัครได้”</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <PageFooter pageNumber={pageNumber} footerLogoUrl={footerLogoUrl} />
    </div>
  );
}
