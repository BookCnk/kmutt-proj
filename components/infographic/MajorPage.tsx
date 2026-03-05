'use client';

// ─── MajorPage ─────────────────────────────────────────────────────────────────
// Matches Criteria.pdf page 3 (individual major detail page):
// Header → "Faculty (ต่อ)" → คุณสมบัติเบื้องต้น → credits table →
// เกณฑ์การพิจารณา table → หมายเหตุ → footer

import type { AdmissionCriteriaRow, AdmissionMajorGroup } from '@/types/infographic';

interface Props {
    group: AdmissionMajorGroup;
    pageNumber: number;
}

const ORANGE = '#d35400';
const DARK = '#1a1a1a';

function minLabel(row: AdmissionCriteriaRow): string {
    if (row.gpaMin !== null && row.gpaMin !== undefined) return String(row.gpaMin);
    if (row.lngScore !== null && row.lngScore !== undefined) return String(row.lngScore);
    return 'ไม่กำหนดขั้นต่ำ';
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

// Unique credit rows keyed by subjectGroupMap
function creditRows(criteria: AdmissionCriteriaRow[]) {
    return Array.from(
        new Map(
            criteria
                .filter((r) => r.subjectGroupMap?.trim() && r.credits != null)
                .map((r) => [r.subjectGroupMap.trim(), r])
        ).values()
    );
}

const thBase: React.CSSProperties = {
    border: '1px solid #999', padding: '4px 8px', textAlign: 'center',
    fontWeight: 700, color: '#fff', fontSize: 10,
};
const tdBase: React.CSSProperties = {
    border: '1px solid #ccc', padding: '3px 7px', fontSize: 10,
};

export function MajorPage({ group, pageNumber }: Props) {
    const today = new Date();
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const dateStr = `ข้อมูล ณ วันที่ ${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

    const criteria = dedup(group.criteria);
    const credits = creditRows(group.criteria);
    const totalTest = criteria.reduce((s, r) => s + (r.weightTest ?? 0), 0);
    const totalAdmission = criteria.reduce((s, r) => s + (r.weightAdmission ?? 0), 0);

    return (
        <div
            className="w-full h-full flex flex-col bg-white overflow-hidden text-black"
            style={{ fontFamily: 'Sarabun, sans-serif', padding: '20px 30px 10px', fontSize: 11 }}
        >
            {/* ── Header ── */}
            <div className="flex items-stretch mb-3" style={{ border: '2px solid #c0392b', minHeight: 60 }}>
                <div className="flex items-center gap-2 px-3 py-1 bg-white" style={{ minWidth: 230 }}>
                    <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#b91c1c,#d35400)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>K</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 11 }}>เกณฑ์การรับสมัครนักศึกษา</div>
                        <div style={{ fontSize: 10 }}>รอบที่ 2 (ปีการศึกษา 2569)</div>
                    </div>
                </div>
                <div style={{ flex: 1, backgroundColor: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, padding: '0 16px' }}>
                    โครงการคัดเลือกตรงโดยใช้คะแนน TGAT/TPAT
                </div>
            </div>

            {/* Faculty (ต่อ) */}
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, marginBottom: 8, color: DARK }}>
                {group.faculty} (ต่อ)
            </div>

            {/* Major name */}
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: DARK }}>
                {group.admissionMajor}
            </div>

            {/* ── คุณสมบัติเบื้องต้น ── */}
            <div style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 11, textDecoration: 'underline', marginBottom: 4 }}>คุณสมบัติเบื้องต้นในการสมัคร</div>
                <div style={{ paddingLeft: 16, lineHeight: 1.7 }}>
                    <div>- ผลการเรียน 5 - 6 ภาคการศึกษา</div>
                    <div>- กำลังศึกษา/สำเร็จการศึกษาระดับชั้นมัธยมศึกษาปีที่ 6 หรือ ปวช.</div>
                    <div>- จำนวนหน่วยกิตขั้นต่ำของกลุ่มสาระการเรียนรู้</div>
                </div>
            </div>

            {/* ── Credits table ── */}
            {credits.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 10 }}>
                    <thead>
                        <tr>
                            <th style={{ ...thBase, backgroundColor: '#6b6b6b', textAlign: 'left' }}>หน่วยกิตรวมของกลุ่มสาระการเรียนรู้</th>
                            <th style={{ ...thBase, backgroundColor: '#6b6b6b', width: 120 }}>หน่วยกิตขั้นต่ำ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {credits.map((r, i) => (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={tdBase}>{r.subjectGroupMap.trim()}</td>
                                <td style={{ ...tdBase, textAlign: 'center' }}>{r.credits}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* ── เกณฑ์การพิจารณา heading ── */}
            <div style={{ fontWeight: 700, fontSize: 11, textDecoration: 'underline', marginBottom: 4 }}>เกณฑ์การพิจารณา</div>

            {/* ── Criteria table ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 10 }}>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{ ...thBase, backgroundColor: '#6b6b6b', textAlign: 'left', width: '30%' }}>รายการ</th>
                        <th rowSpan={2} style={{ ...thBase, backgroundColor: '#6b6b6b' }}>เกณฑ์การรับสมัคร<br />เกรดเฉลี่ย / คะแนนขั้นต่ำ</th>
                        <th style={{ ...thBase, backgroundColor: '#2c5f9e' }}>เกณฑ์การเรียกสอบคัดเลือก</th>
                        <th style={{ ...thBase, backgroundColor: '#2e7d5e' }}>เกณฑ์การรับเข้าศึกษา</th>
                    </tr>
                    <tr>
                        <th style={{ ...thBase, backgroundColor: '#2c5f9e' }}>ค่าน้ำหนัก (%)</th>
                        <th style={{ ...thBase, backgroundColor: '#2e7d5e' }}>ค่าน้ำหนัก (%)</th>
                    </tr>
                </thead>
                <tbody>
                    {criteria.map((row, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                            <td style={tdBase}>{row.subjectName}</td>
                            <td style={{ ...tdBase, textAlign: 'center' }}>{minLabel(row)}</td>
                            <td style={{ ...tdBase, textAlign: 'center' }}>{row.weightTest != null && row.weightTest > 0 ? row.weightTest : '-'}</td>
                            <td style={{ ...tdBase, textAlign: 'center' }}>{row.weightAdmission != null && row.weightAdmission > 0 ? row.weightAdmission : '-'}</td>
                        </tr>
                    ))}
                    {/* Totals row */}
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700 }}>
                        <td colSpan={2} style={{ ...tdBase, textAlign: 'right', fontWeight: 700 }}>รวม</td>
                        <td style={{ ...tdBase, textAlign: 'center', fontWeight: 700 }}>{totalTest > 0 ? totalTest : '-'}</td>
                        <td style={{ ...tdBase, textAlign: 'center', fontWeight: 700 }}>{totalAdmission > 0 ? totalAdmission : '-'}</td>
                    </tr>
                </tbody>
            </table>

            {/* ── หมายเหตุ ── */}
            <div style={{ fontSize: 9.5, lineHeight: 1.6, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 2 }}>หมายเหตุ</div>
                <div>1. คะแนน GPA คณิตศาสตร์ และวิทยาศาสตร์ ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน หากนักเรียนไม่กรอกคะแนนในระบบรับสมัคร <span style={{ fontWeight: 700, textDecoration: 'underline' }}>จะถือว่าไม่ผ่านเกณฑ์การรับสมัคร</span></div>
                <div>2. คะแนนทดสอบวิชา TGAT/TPAT ไม่กำหนดขั้นต่ำแต่ต้องมีคะแนน มหาวิทยาลัยฯ จะดึงคะแนนจากฐานข้อมูลเอง <span style={{ fontWeight: 700 }}>ผู้สมัครไม่ต้องกรอกคะแนน</span></div>
                <div>4. สำหรับคณะวิศวกรรมศาสตร์ ผู้สมัครที่มีผลการทดสอบภาษาอังกฤษมาตรฐาน CEFR Level B2 หรือการทดสอบอื่นในระดับที่เทียบเท่า สามารถนำผลคะแนนมาใส่แฟ้มสะสมผลงาน (Portfolio) เพื่อใช้ในการประกอบการพิจารณาเป็นพิเศษ</div>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* ── Footer ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #ccc', paddingTop: 6, fontSize: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                        <div style={{ width: 12, height: 12, backgroundColor: '#c0392b', borderRadius: 2 }} />
                        <div style={{ width: 12, height: 12, backgroundColor: '#e67e22', borderRadius: 2 }} />
                    </div>
                    <span style={{ color: '#555' }}>สำนักงานคัดเลือกและสรรหานักศึกษา มจธ. ข้อมูลอาจมีการเปลี่ยนแปลงตามความเหมาะสม</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#c0392b', fontWeight: 600 }}>{dateStr}</div>
                    <div style={{ color: '#555' }}>{pageNumber} | Page</div>
                </div>
            </div>
        </div>
    );
}
